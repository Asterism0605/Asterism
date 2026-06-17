import { describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '@/types/api';
import type { StyleImage } from '@/types/image';

const externalOnlyImages: StyleImage[] = [
  {
    id: 'ext-y2k-1',
    url: 'https://images.example.com/ext-y2k-1.jpg',
    title: 'External Y2K pull 1',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K', 'Frutiger Aero'],
    colorPalette: ['#8EC9FF']
  },
  {
    id: 'ext-y2k-2',
    url: 'https://images.example.com/ext-y2k-2.jpg',
    title: 'External Y2K pull 2',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K', 'Frutiger Aero'],
    colorPalette: ['#8EC9FF']
  }
];

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(
    async (): Promise<ApiResponse<StyleImage[]>> => ({
      data: externalOnlyImages,
      meta: { timestamp: new Date().toISOString() }
    })
  )
}));

import { fetchImagesApi } from '@/api/image.api';
import { getImageById, getRelatedImages } from '@/services/image.service';

describe('image.service local-first fallback', () => {
  it('finds a local-only image (e.g. a home concept photo) without calling the api', async () => {
    const image = await getImageById('y2k-main-001');

    expect(image?.id).toBe('y2k-main-001');
    expect(fetchImagesApi).not.toHaveBeenCalled();
  });

  it('fills remaining related image slots from the api pool once local matches run out', async () => {
    const relatedImages = await getRelatedImages('y2k-main-001', { limit: 50 });
    const ids = relatedImages.map((image) => image.id);

    expect(relatedImages.length).toBeGreaterThan(19);
    expect(ids).toEqual(expect.arrayContaining(['ext-y2k-1', 'ext-y2k-2']));
    expect(fetchImagesApi).toHaveBeenCalled();
  });
});
