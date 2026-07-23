import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { StyleDnaAnswer } from '@/types/style-dna';
import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

const STORAGE_KEY = 'asterism:style-dna-result:v1';
const { fetchStyleDnaProfile, saveStyleDnaResult } = vi.hoisted(() => ({
  fetchStyleDnaProfile: vi.fn(),
  saveStyleDnaResult: vi.fn()
}));

vi.mock('@/services/style-dna.service', () => ({
  fetchStyleDnaProfile,
  saveStyleDnaResult
}));

const createAnswer = (id: string, style: string, weight: number): StyleDnaAnswer => ({
  questionId: `question-${id}`,
  selectedOptionId: `option-${id}`,
  selectedImage: {
    id: `image-${id}`,
    url: `/image-${id}.webp`,
    style: [style]
  },
  weights: { [style]: weight }
});

const serverResult: ComputedStyleDnaResult = {
  isFallback: false,
  primaryStyle: 'Art Deco',
  heroImage: '/images/art-deco.png',
  styles: [
    { label: 'Art Deco', percentage: 70 },
    { label: 'Baroque', percentage: 30 }
  ],
  annotations: [
    { label: 'Art Deco', value: '70%', position: 'top-right' },
    { label: 'Baroque', value: '30%', position: 'left' }
  ]
};

describe('style-dna store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('completes the quiz by storing answers, completedAt and persisting to localStorage', () => {
    const store = useStyleDnaStore();
    const answers = [createAnswer('1', 'Minimalism', 1), createAnswer('2', 'Cyberpunk', 1)];

    store.completeQuiz(answers, 'user-1');

    expect(store.answers).toEqual(answers);
    expect(store.completedAt).toEqual(expect.any(String));
    expect(store.localUserId).toBe('user-1');
    expect(store.hasCompletedQuiz).toBe(true);
    expect(store.preferredStyles).toEqual(['Minimalism', 'Cyberpunk']);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.answers).toEqual(answers);
    expect(persisted.completedAt).toBe(store.completedAt);
    expect(persisted.userId).toBe('user-1');
  });

  it('hydrates answers and completedAt from a valid localStorage entry', () => {
    const writer = useStyleDnaStore();
    writer.completeQuiz([createAnswer('1', 'Minimalism', 1)]);
    const persistedCompletedAt = writer.completedAt;

    setActivePinia(createPinia());
    const reader = useStyleDnaStore();
    reader.hydrateResult();

    expect(reader.answers).toEqual([createAnswer('1', 'Minimalism', 1)]);
    expect(reader.completedAt).toBe(persistedCompletedAt);
    expect(reader.hasCompletedQuiz).toBe(true);
  });

  it('falls back to an empty state and clears the key when localStorage holds malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const store = useStyleDnaStore();

    expect(() => store.hydrateResult()).not.toThrow();

    expect(store.answers).toEqual([]);
    expect(store.completedAt).toBeNull();
    expect(store.hasCompletedQuiz).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('falls back to an empty state and clears the key when localStorage holds a malformed shape', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ answers: 'not-an-array', completedAt: 123 })
    );
    const store = useStyleDnaStore();

    store.hydrateResult();

    expect(store.answers).toEqual([]);
    expect(store.completedAt).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears the store state and removes the persisted localStorage entry', () => {
    const store = useStyleDnaStore();
    store.completeQuiz([createAnswer('1', 'Minimalism', 1)]);

    store.clearResult();

    expect(store.answers).toEqual([]);
    expect(store.completedAt).toBeNull();
    expect(store.hasCompletedQuiz).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not write local data again when the server already has a result', async () => {
    fetchStyleDnaProfile.mockResolvedValue({ result: serverResult });
    const store = useStyleDnaStore();
    store.completeQuiz([createAnswer('1', 'Minimalism', 1)], 'user-1');

    await expect(store.reconcileWithServer('user-1')).resolves.toBe('synced');

    expect(saveStyleDnaResult).not.toHaveBeenCalled();
    expect(store.serverResult).toEqual(serverResult);
    expect(store.result.primaryStyle).toBe('Minimalism');
  });

  it('writes the current local result once when the server has no result', async () => {
    fetchStyleDnaProfile.mockResolvedValue({ result: null });
    const store = useStyleDnaStore();
    store.completeQuiz([createAnswer('1', 'Minimalism', 1)], 'user-1');

    await expect(store.reconcileWithServer('user-1')).resolves.toBe('synced');

    expect(saveStyleDnaResult).toHaveBeenCalledWith('user-1', store.result);
  });

  it('reports not-found when neither server nor local has a result', async () => {
    fetchStyleDnaProfile.mockResolvedValue({ result: null });
    const store = useStyleDnaStore();

    await expect(store.reconcileWithServer('user-1')).resolves.toBe('not-found');

    expect(saveStyleDnaResult).not.toHaveBeenCalled();
  });

  it('does not upload another user local result during reconciliation', async () => {
    fetchStyleDnaProfile.mockResolvedValue({ result: null });
    const store = useStyleDnaStore();
    store.completeQuiz([createAnswer('1', 'Minimalism', 1)], 'user-a');
    await store.saveCurrentResultToServer('user-a');

    await expect(store.reconcileWithServer('user-b')).resolves.toBe('not-found');

    expect(saveStyleDnaResult).toHaveBeenCalledTimes(1);
    expect(store.answers).toEqual([]);
    expect(store.completedAt).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('reports failed (not undefined) so callers can tell a sync error apart from "no result"', async () => {
    fetchStyleDnaProfile.mockRejectedValue(new Error('network down'));
    const store = useStyleDnaStore();
    store.completeQuiz([createAnswer('1', 'Minimalism', 1)], 'user-1');
    const persisted = localStorage.getItem(STORAGE_KEY);

    await expect(store.reconcileWithServer('user-1')).resolves.toBe('failed');

    expect(localStorage.getItem(STORAGE_KEY)).toBe(persisted);
    expect(store.hasCompletedQuiz).toBe(true);
  });
});
