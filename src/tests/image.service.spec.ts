import { describe, expect, it, vi } from 'vitest';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));

import {
  getHomeInspirationImages,
  getImageById,
  getRelatedImages
} from '@/services/image.service';

describe('image.service', () => {
  it('finds an image by id and returns undefined for unknown ids', async () => {
    expect((await getImageById('y2k-main-001'))?.id).toBe('y2k-main-001');
    expect(await getImageById('missing-image')).toBeUndefined();
  });

  it('returns five home inspiration images led by every style group', async () => {
    const images = await getHomeInspirationImages({ random: () => 0 });
    const styleGroups = images.map((image) => image.styleGroup);

    expect(images).toHaveLength(5);
    expect(new Set(styleGroups.slice(0, 3))).toEqual(
      new Set([
        'Y2K & Internet Aesthetics',
        'Future Tech & Digital Psychedelia',
        'Decorative & Opulent Art'
      ])
    );
    expect(images[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        src: expect.stringContaining('/style-image/'),
        alt: expect.any(String),
        styleGroup: expect.any(String)
      })
    );
  });

  it('returns related images from the same style group without current or visited images', async () => {
    const relatedImages = await getRelatedImages('y2k-main-001', {
      visitedImageIds: ['y2k-graphic-001']
    });

    expect(relatedImages).toHaveLength(4);
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-main-001');
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-graphic-001');
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });

  it('does not fill related images from another style group', async () => {
    const relatedImages = await getRelatedImages('y2k-main-001', {
      limit: 50
    });

    expect(relatedImages).toHaveLength(19);
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });
});
