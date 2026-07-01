import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addItem, removeItem, createFolder, isImageSaved } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';

vi.mock('@/services/image.service', () => ({
  getImageById: (id: string) => ({ id, src: `/style-image/${id}.webp` })
}));

describe('moodboard.service', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('addItem stores the image into the specified folder', () => {
    addItem('default', 'y2k-001');

    const store = useMoodboardStore();
    const defaultFolder = store.folders.find((f) => f.id === 'default');

    expect(defaultFolder?.images).toHaveLength(1);
    expect(defaultFolder?.images[0]).toMatchObject({ id: 'y2k-001' });
  });

  it('removeItem removes the image from the specified folder', () => {
    addItem('default', 'y2k-001');
    removeItem('default', 'y2k-001');

    const store = useMoodboardStore();
    const defaultFolder = store.folders.find((f) => f.id === 'default');

    expect(defaultFolder?.images).toHaveLength(0);
  });

  it('createFolder adds a new named folder to the store', () => {
    createFolder('我的最愛');

    const store = useMoodboardStore();

    expect(store.folders).toHaveLength(2);
    expect(store.folders[1].name).toBe('我的最愛');
    expect(store.folders[1].images).toEqual([]);
  });

  it('createFolder throws when folder count reaches 10', () => {
    for (let i = 0; i < 9; i++) {
      createFolder(`Folder ${i}`);
    }

    expect(() => createFolder('One too many')).toThrow('You have reached the maximum of 10 folders.');
  });

  it('isImageSaved returns true when the image is saved', () => {
    addItem('default', 'y2k-001');

    expect(isImageSaved('y2k-001')).toBe(true);
  });

  it('isImageSaved returns false when the image is not saved', () => {
    expect(isImageSaved('not-saved-id')).toBe(false);
  });
});
