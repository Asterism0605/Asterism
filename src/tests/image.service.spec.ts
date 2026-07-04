import { describe, expect, it } from 'vitest';
import {
  getHomeInspirationImages,
  getImageById,
  getMediumGroupImages,
  getRelatedImages,
  getSubMediumGroupImages
} from '@/services/image.service';

describe('image.service', () => {
  it('finds an image by id and returns undefined for unknown ids', () => {
    expect(getImageById('y2k-main-001')?.id).toBe('y2k-main-001');
    expect(getImageById('missing-image')).toBeUndefined();
  });

  it('returns local concept images (no medium) across every style group for the home page', async () => {
    const images = await getHomeInspirationImages();
    const styleGroups = images.map((image) => image.styleGroup);

    expect(images).toHaveLength(45);
    expect(new Set(styleGroups).size).toBe(9);
    expect(images[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        src: expect.stringContaining('/style-image/'),
        alt: expect.any(String),
        styleGroup: expect.any(String)
      })
    );
  });

  it('preserves the default home inspiration order without preferred styles', async () => {
    const defaultImages = await getHomeInspirationImages();
    const emptyPreferenceImages = await getHomeInspirationImages({ preferredStyles: [] });

    expect(emptyPreferenceImages.map((image) => image.id)).toEqual(
      defaultImages.map((image) => image.id)
    );
  });

  it('prioritizes concept images that match preferred styles', async () => {
    const images = await getHomeInspirationImages({
      preferredStyles: ['Art Deco', 'Baroque']
    });

    expect(images).toHaveLength(45);
    expect(images[0]).toEqual(
      expect.objectContaining({
        id: 'doa-main-001',
        styleGroup: 'Decorative & Opulent Art'
      })
    );
  });

  describe('getMediumGroupImages', () => {
    it('returns one image per medium in the same style group', () => {
      const images = getMediumGroupImages('y2k-main-001');

      expect(images).toHaveLength(4);
      expect(images.map((image) => image.medium).sort()).toEqual([
        'Architecture',
        'Graphic Design',
        'Interior Design',
        'Outfit'
      ]);
    });

    it('excludes current and visited images, keeping the medium via another image', () => {
      // y2k-graphic-001 是 Graphic Design 的入口圖；排除它後該 medium 仍有其他圖，
      // 應換一張代表、而非讓整個 Graphic Design 消失。
      const images = getMediumGroupImages('y2k-main-001', {
        visitedImageIds: ['y2k-graphic-001']
      });

      expect(images).toHaveLength(4);
      expect(images.map((image) => image.medium).sort()).toEqual([
        'Architecture',
        'Graphic Design',
        'Interior Design',
        'Outfit'
      ]);
      expect(images.map((image) => image.id)).not.toContain('y2k-graphic-001');
      expect(images.find((image) => image.medium === 'Graphic Design')?.subMedium).toBeTruthy();
    });

    it('prefers medium-only representatives even when rng would otherwise pick subMedium images', () => {
      const lowest = getMediumGroupImages('y2k-main-001', { rng: () => 0 });
      expect(lowest.find((image) => image.medium === 'Graphic Design')?.id).toBe('y2k-graphic-001');

      const highest = getMediumGroupImages('y2k-main-001', { rng: () => 0.999 });
      expect(highest.find((image) => image.medium === 'Graphic Design')?.id).toBe('y2k-graphic-001');
      expect(highest.every((image) => !image.subMedium)).toBe(true);
    });

    it('clamps to the last candidate when rng returns 1', () => {
      // 防呆：注入的 rng 回傳 1（floor(1*len)=len）不得越界成 undefined。
      const images = getMediumGroupImages('y2k-main-001', { rng: () => 1 });

      expect(images).toHaveLength(4);
      expect(images.find((image) => image.medium === 'Graphic Design')?.id).toBe('y2k-graphic-001');
      expect(images.every((image) => !image.subMedium)).toBe(true);
    });
  });

  describe('getSubMediumGroupImages', () => {
    it('returns one image per subMedium within the same medium', () => {
      const images = getSubMediumGroupImages('y2k-graphic-001');

      expect(images).toHaveLength(4);
      expect(images.every((image) => image.medium === 'Graphic Design')).toBe(true);
      expect(images.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(true);
    });

    it('returns empty array when image has no medium', () => {
      const images = getSubMediumGroupImages('y2k-main-001');

      expect(images).toHaveLength(0);
    });

    it('keeps the current subMedium group when the center image is its only representative', () => {
      const images = getSubMediumGroupImages('ftdp-graphic-brand-001', {
        visitedImageIds: ['ftdp-graphic-001'],
        rng: () => 0
      });

      expect(images.map((image) => image.subMedium).sort()).toEqual([
        'Brand Identity',
        'Editorial Design',
        'Poster Design'
      ]);
      expect(images.find((image) => image.subMedium === 'Brand Identity')?.id).toBe(
        'ftdp-graphic-brand-001'
      );
    });
  });

  describe('getRelatedImages', () => {
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
      expect(relatedImages.every((image) => image.subMedium)).toBe(true);
    });

    it('does not fill related images from another style group', () => {
      const relatedImages = getRelatedImages('y2k-main-001', {
        limit: 50
      });

      expect(relatedImages).toHaveLength(15);
      expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
        true
      );
      expect(relatedImages.every((image) => image.subMedium)).toBe(true);
    });

    it('uses the same style group as the primary recommendation signal', () => {
      const images = getRelatedImages('ftdp-graphic-001');

      expect(images.length).toBeGreaterThan(0);
      expect(
        images.every((image) => image.styleGroup === 'Future Tech & Digital Psychedelia')
      ).toBe(true);
      expect(images.every((image) => image.subMedium)).toBe(true);
      expect(images.some((image) => image.medium !== 'Graphic Design')).toBe(true);
    });
  });
});
