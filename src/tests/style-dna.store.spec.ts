import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { StyleDnaAnswer } from '@/types/style-dna';

const STORAGE_KEY = 'asterism:style-dna-result:v1';

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

describe('style-dna store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('completes the quiz by storing answers, completedAt and persisting to localStorage', () => {
    const store = useStyleDnaStore();
    const answers = [createAnswer('1', 'Minimalism', 1), createAnswer('2', 'Cyberpunk', 1)];

    store.completeQuiz(answers);

    expect(store.answers).toEqual(answers);
    expect(store.completedAt).toEqual(expect.any(String));
    expect(store.hasCompletedQuiz).toBe(true);
    expect(store.preferredStyles).toEqual(['Minimalism', 'Cyberpunk']);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.answers).toEqual(answers);
    expect(persisted.completedAt).toBe(store.completedAt);
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
});
