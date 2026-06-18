import { describe, expect, it } from 'vitest';
import rawStyleImages from '@/data/style-data.json';
import { fetchImagesApi } from '@/api/image.api';
import type { StyleImage } from '@/types/image';

const styleImages = rawStyleImages as StyleImage[];

describe('image.api', () => {
  it('returns the shared style image dataset through the mock API contract', async () => {
    const response = await fetchImagesApi();

    expect(response.data).toHaveLength(styleImages.length);
    expect(response.data[0]).toEqual(styleImages[0]);
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });
});
