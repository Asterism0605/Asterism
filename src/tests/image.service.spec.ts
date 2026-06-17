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

  it('returns only local concept images (no medium) regardless of the api pool', async () => {
    const images = await getHomeInspirationImages();
    const styleGroups = images.map((image) => image.styleGroup);

    expect(images).toHaveLength(3);
    expect(new Set(styleGroups)).toEqual(
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

  it('shuffles images within equal shared-style tiers so refreshes can differ', async () => {
    const idsWithLowRandom = (
      await getRelatedImages('y2k-main-001', { random: () => 0 })
    ).map((image) => image.id);
    const idsWithHighRandom = (
      await getRelatedImages('y2k-main-001', { random: () => 0.99 })
    ).map((image) => image.id);

    expect(idsWithLowRandom).not.toEqual(idsWithHighRandom);
  });

  it('always keeps the most shared-style images regardless of random (relevance preserved)', async () => {
    const idsWithLowRandom = new Set(
      (await getRelatedImages('y2k-main-001', { random: () => 0 })).map((image) => image.id)
    );
    const idsWithHighRandom = new Set(
      (await getRelatedImages('y2k-main-001', { random: () => 0.99 })).map((image) => image.id)
    );

    // 這 3 張與基準圖共享全部 4 個 style，是相關度最高的一層；
    // limit 為 4 時不論怎麼洗牌，它們都必須佔滿前段。
    for (const mostRelatedId of [
      'y2k-graphic-001',
      'y2k-graphic-editorial-001',
      'y2k-graphic-brand-001'
    ]) {
      expect(idsWithLowRandom).toContain(mostRelatedId);
      expect(idsWithHighRandom).toContain(mostRelatedId);
    }
  });
});
