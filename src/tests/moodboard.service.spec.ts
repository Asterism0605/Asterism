import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveImage, unsaveImage, createFolder, isImageSaved } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { ImageSpreadNode } from '@/types/image';

const createSpreadNode = (id: string): ImageSpreadNode => ({
  id,
  src: `/style-image/${id}.webp`,
  alt: `Image ${id}`,
  title: `Title ${id}`,
  styleGroup: 'Y2K & Internet Aesthetics',
  style: ['Y2K'],
  colorPalette: ['#ffffff']
});

describe('moodboard.service', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('saveImage stores only the SavedImage fields into the default folder', () => {
    saveImage(createSpreadNode('y2k-001'));

    const store = useMoodboardStore();
    const defaultFolder = store.folders.find((f) => f.id === 'default');

    expect(defaultFolder?.images).toHaveLength(1);
    expect(defaultFolder?.images[0]).toEqual({
      id: 'y2k-001',
      src: '/style-image/y2k-001.webp',
      alt: 'Image y2k-001',
      styleGroup: 'Y2K & Internet Aesthetics'
    });
  });

  it('unsaveImage removes the image from the default folder', () => {
    saveImage(createSpreadNode('y2k-001'));
    unsaveImage('y2k-001');

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

  it('isImageSaved returns true when the image is saved', () => {
    saveImage(createSpreadNode('y2k-001'));

    expect(isImageSaved('y2k-001')).toBe(true);
  });

  it('isImageSaved returns false when the image is not saved', () => {
    expect(isImageSaved('not-saved-id')).toBe(false);
  });
});
