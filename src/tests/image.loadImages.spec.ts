import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => [
    { id: 'sb-1', url: 'u', title: 't', styleGroup: 'doa', style: [], colorPalette: [] }
  ])
}));

import { getImageById, loadImages } from '@/services/image.service';

describe('image.service loadImages', () => {
  it('預設快取為打包 JSON（loadImages 前讀得到本地 id）', () => {
    expect(getImageById('y2k-main-001')?.id).toBe('y2k-main-001');
  });

  it('loadImages 後快取換成 fetchImagesApi 的結果', async () => {
    await loadImages();
    expect(getImageById('sb-1')?.id).toBe('sb-1');
    expect(getImageById('y2k-main-001')).toBeUndefined();
  });
});
