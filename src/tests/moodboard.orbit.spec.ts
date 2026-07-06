import { describe, expect, it } from 'vitest';
import { buildMoodboardOrbitImages } from '@/components/feature/moodboard/config';
import type { SavedImage } from '@/types/moodboard';

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
