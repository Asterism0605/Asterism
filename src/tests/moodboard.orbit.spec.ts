import { describe, expect, it } from 'vitest';
import { buildMoodboardOrbitImages, isFolderDimmed } from '@/components/feature/moodboard/config';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

const createSavedImages = (count: number): SavedImage[] =>
  Array.from({ length: count }, (_, index) => ({
    itemId: `item-${index}`,
    id: `image-${index}`,
    src: `/saved-${index}.webp`,
    title: `Saved ${index}`,
    styleGroup: 'minimal',
    style: [],
    createdAt: '2026-07-05T00:00:00.000Z'
  }));

describe('buildMoodboardOrbitImages', () => {
  it('returns no orbit images for an empty moodboard', () => {
    expect(buildMoodboardOrbitImages([])).toEqual([]);
  });

  it('fills 1-19 saved images to 20 with grayscale placeholder candidates', () => {
    const images = buildMoodboardOrbitImages(createSavedImages(3));

    expect(images).toHaveLength(20);
    expect(images.slice(0, 3).every((image) => image.isPlaceholder === false)).toBe(true);
    expect(images.slice(3).every((image) => image.isPlaceholder === true)).toBe(true);
  });

  it('uses only real saved images from 20 onward', () => {
    const images = buildMoodboardOrbitImages(createSavedImages(21));

    expect(images).toHaveLength(21);
    expect(images.every((image) => image.isPlaceholder === false)).toBe(true);
  });
});

describe('isFolderDimmed', () => {
  const makeFolder = (images: SavedImage[]): MoodboardFolder => ({
    id: 'folder-1',
    name: 'Studio',
    createdAt: '2026-07-05T00:00:00.000Z',
    images
  });

  it('is dimmed when there is no folder at the position', () => {
    expect(isFolderDimmed(undefined)).toBe(true);
  });

  it('is dimmed when the folder has no saved images', () => {
    expect(isFolderDimmed(makeFolder([]))).toBe(true);
  });

  it('is not dimmed when the folder has at least one saved image', () => {
    expect(isFolderDimmed(makeFolder(createSavedImages(1)))).toBe(false);
  });
});
