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

    expect(relatedImages).toHaveLength(23);
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });

  it('shuffles images within equal shared-style tiers so refreshes can differ', async () => {
    // limit=5：tier1 有 4 張（score=5），tier2 有 14 張（score=4），
    // 第 5 個位置從 tier2 洗牌選取，不同 random 值會選到不同的圖。
    const idsWithLowRandom = (
      await getRelatedImages('y2k-main-001', { limit: 5, random: () => 0 })
    ).map((image) => image.id);
    const idsWithHighRandom = (
      await getRelatedImages('y2k-main-001', { limit: 5, random: () => 0.99 })
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

    // 這 4 張與基準圖共享全部 5 個 style，是相關度最高的一層；
    // limit 為 4 時不論怎麼洗牌，它們都必須佔滿全部結果。
    for (const mostRelatedId of [
      'y2k-main-002',
      'y2k-main-003',
      'y2k-main-004',
      'y2k-main-005'
    ]) {
      expect(idsWithLowRandom).toContain(mostRelatedId);
      expect(idsWithHighRandom).toContain(mostRelatedId);
    }
  });
});
