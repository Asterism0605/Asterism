import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { MoodboardFolder } from '@/types/moodboard';

const { getMoodboardViewModel } = vi.hoisted(() => ({
  getMoodboardViewModel: vi.fn()
}));

vi.mock('@/services/moodboard.service', () => ({
  getMoodboardViewModel
}));

const folder: MoodboardFolder = {
  id: 'folder-1',
  name: 'Studio',
  createdAt: '2026-07-05T00:00:00.000Z',
  images: [
    {
      itemId: 'item-1',
      id: 'image-1',
      src: '/image-1.webp',
      title: 'Image 1',
      styleGroup: 'minimal',
      style: ['Minimalism'],
      createdAt: '2026-07-05T00:00:00.000Z'
    }
  ]
};

describe('moodboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads Supabase view model and derives counts from one source of truth', async () => {
    getMoodboardViewModel.mockResolvedValue({
      folders: [folder],
      allItems: folder.images,
      totalFolderCount: 1,
      totalSavedItemCount: 1
    });
    const store = useMoodboardStore();

    await store.fetchMoodboard('user-1');

    expect(getMoodboardViewModel).toHaveBeenCalledWith('user-1');
    expect(store.status).toBe('success');
    expect(store.folders).toEqual([folder]);
    expect(store.totalSavedItemCount).toBe(1);
    expect(store.isLowCount).toBe(true);
    expect(store.isEmpty).toBe(false);
  });

  it('exposes loading state while the Data API request is pending', async () => {
    let resolveRequest!: (value: {
      folders: MoodboardFolder[];
      allItems: [];
      totalFolderCount: number;
      totalSavedItemCount: number;
    }) => void;
    getMoodboardViewModel.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );
    const store = useMoodboardStore();

    const request = store.fetchMoodboard('user-1');

    expect(store.status).toBe('loading');
    resolveRequest({
      folders: [],
      allItems: [],
      totalFolderCount: 0,
      totalSavedItemCount: 0
    });
    await request;
    expect(store.status).toBe('success');
  });

  it('reuses the in-flight request for the same profile', async () => {
    let resolveRequest!: (value: {
      folders: MoodboardFolder[];
      allItems: MoodboardFolder['images'];
      totalFolderCount: number;
      totalSavedItemCount: number;
    }) => void;
    getMoodboardViewModel.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );
    const store = useMoodboardStore();

    const first = store.fetchMoodboard('user-1');
    const second = store.fetchMoodboard('user-1');
    let secondSettled = false;
    void second.then(() => {
      secondSettled = true;
    });
    await Promise.resolve();

    expect(getMoodboardViewModel).toHaveBeenCalledTimes(1);
    expect(secondSettled).toBe(false);

    resolveRequest({
      folders: [folder],
      allItems: folder.images,
      totalFolderCount: 1,
      totalSavedItemCount: 1
    });
    await Promise.all([first, second]);

    expect(secondSettled).toBe(true);
    expect(store.status).toBe('success');
    expect(store.folders).toEqual([folder]);
  });

  it('keeps Data API failures distinct from the empty state', async () => {
    getMoodboardViewModel.mockRejectedValue(new Error('network down'));
    const store = useMoodboardStore();

    await store.fetchMoodboard('user-1');

    expect(store.status).toBe('error');
    expect(store.error).toBe('network down');
    expect(store.isEmpty).toBe(false);
  });

  it('treats zero saved items as empty even when an empty folder exists', async () => {
    getMoodboardViewModel.mockResolvedValue({
      folders: [{ ...folder, images: [] }],
      allItems: [],
      totalFolderCount: 1,
      totalSavedItemCount: 0
    });
    const store = useMoodboardStore();

    await store.fetchMoodboard('user-1');

    expect(store.isEmpty).toBe(true);
    expect(store.isLowCount).toBe(false);
    expect(store.isNormal).toBe(false);
  });

  it('uses placeholders through 19 items and switches to real-only orbit at 20', async () => {
    const images = Array.from({ length: 20 }, (_, index) => ({
      ...folder.images[0],
      itemId: `item-${index}`,
      id: `image-${index}`
    }));
    getMoodboardViewModel.mockResolvedValue({
      folders: [{ ...folder, images: images.slice(0, 19) }],
      allItems: images.slice(0, 19),
      totalFolderCount: 1,
      totalSavedItemCount: 19
    });
    const store = useMoodboardStore();

    await store.fetchMoodboard('user-1');

    expect(store.isLowCount).toBe(true);
    expect(store.isNormal).toBe(false);

    store.folders[0].images.push(images[19]);

    expect(store.isLowCount).toBe(false);
    expect(store.isNormal).toBe(true);
  });

  it('removes a folder locally without calling the Data API', async () => {
    getMoodboardViewModel.mockResolvedValue({
      folders: [folder],
      allItems: folder.images,
      totalFolderCount: 1,
      totalSavedItemCount: 1
    });
    const store = useMoodboardStore();
    await store.fetchMoodboard('user-1');

    store.removeFolder('folder-1');

    expect(store.folders).toEqual([]);
    expect(getMoodboardViewModel).toHaveBeenCalledTimes(1);
  });

  it('clears user-owned state on logout or account change', async () => {
    getMoodboardViewModel.mockResolvedValue({
      folders: [folder],
      allItems: folder.images,
      totalFolderCount: 1,
      totalSavedItemCount: 1
    });
    const store = useMoodboardStore();
    await store.fetchMoodboard('user-1');

    store.clear();

    expect(store.status).toBe('idle');
    expect(store.folders).toEqual([]);
    expect(store.loadedProfileId).toBeNull();
  });
});
