import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { SavedImage } from '@/types/moodboard';

const STORAGE_KEY = 'asterism:moodboard:v1';

const createSavedImage = (id: string): SavedImage => ({
  id,
  src: `/style-image/${id}.webp`
});

describe('moodboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initializes with a default folder containing no images', () => {
    const store = useMoodboardStore();

    expect(store.folders).toHaveLength(1);
    expect(store.folders[0].id).toBe('default');
    expect(store.folders[0].images).toEqual([]);
  });

  it('adds an image to a folder and persists to localStorage', () => {
    const store = useMoodboardStore();
    const image = createSavedImage('y2k-001');

    store.addImage('default', image);

    expect(store.folders[0].images).toHaveLength(1);
    expect(store.folders[0].images[0]).toEqual(image);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders[0].images[0]).toEqual(image);
  });

  it('does not add duplicate images to the same folder', () => {
    const store = useMoodboardStore();
    const image = createSavedImage('y2k-001');

    store.addImage('default', image);
    store.addImage('default', image);

    expect(store.folders[0].images).toHaveLength(1);
  });

  it('removes an image from a folder and persists to localStorage', () => {
    const store = useMoodboardStore();
    const image = createSavedImage('y2k-001');
    store.addImage('default', image);

    store.removeImage('default', image.id);

    expect(store.folders[0].images).toHaveLength(0);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders[0].images).toHaveLength(0);
  });

  it('creates a new folder and persists to localStorage', () => {
    const store = useMoodboardStore();

    store.createFolder('我的最愛');

    expect(store.folders).toHaveLength(2);
    expect(store.folders[1].name).toBe('我的最愛');
    expect(store.folders[1].images).toEqual([]);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders).toHaveLength(2);
    expect(persisted.folders[1].name).toBe('我的最愛');
  });

  it('throws when creating more than 10 folders', () => {
    const store = useMoodboardStore();

    for (let i = 0; i < 9; i++) {
      store.createFolder(`Folder ${i}`);
    }

    expect(() => store.createFolder('One too many')).toThrow('Folder limit reached');
  });

  it('hydrates folders from a valid localStorage entry', () => {
    const writer = useMoodboardStore();
    writer.addImage('default', createSavedImage('y2k-001'));

    setActivePinia(createPinia());
    const reader = useMoodboardStore();
    reader.hydrate();

    expect(reader.folders[0].images).toHaveLength(1);
    expect(reader.folders[0].images[0].id).toBe('y2k-001');
  });

  it('falls back to default state and clears the key when localStorage holds malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const store = useMoodboardStore();

    expect(() => store.hydrate()).not.toThrow();

    expect(store.folders[0].images).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('falls back to default state and clears the key when localStorage holds a malformed shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders: 'not-an-array' }));
    const store = useMoodboardStore();

    store.hydrate();

    expect(store.folders[0].images).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
