import { describe, expect, it } from 'vitest';
import {
  getHomeInspirationImages,
  getImageById,
  getRelatedImages
} from '@/services/image.service';

describe('image.service', () => {
  it('finds an image by id and returns undefined for unknown ids', () => {
    expect(getImageById('y2k-main-001')?.id).toBe('y2k-main-001');
    expect(getImageById('missing-image')).toBeUndefined();
  });

  it('returns five home inspiration images led by every style group', () => {
    const images = getHomeInspirationImages({ random: () => 0 });
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

  it('returns related images from the same style group without current or visited images', () => {
    const relatedImages = getRelatedImages('y2k-main-001', {
      visitedImageIds: ['y2k-graphic-001']
    });

    expect(relatedImages).toHaveLength(4);
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-main-001');
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-graphic-001');
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });

  it('does not fill related images from another style group', () => {
    const relatedImages = getRelatedImages('y2k-main-001', {
      limit: 50
    });

    expect(relatedImages).toHaveLength(19);
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });
});
