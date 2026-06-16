import { describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/api/httpClient';
import { fetchImagesApi } from '@/api/image.api';

vi.mock('@/api/httpClient', () => ({
  httpClient: { get: vi.fn() }
}));

describe('image.api', () => {
  it('fetches images from the demo API and wraps them in the ApiResponse contract', async () => {
    const mockImages = [
      {
        id: 'ext-pexels-1',
        url: 'https://images.pexels.com/photos/1.jpg',
        title: 'shiny chrome bubble',
        styleGroup: 'Y2K & Internet Aesthetics',
        style: ['Y2K'],
        colorPalette: ['#8EC9FF']
      }
    ];
    vi.mocked(httpClient.get).mockResolvedValue({ data: mockImages });

    const response = await fetchImagesApi();

    expect(httpClient.get).toHaveBeenCalledWith('/api/images');
    expect(response.data).toEqual(mockImages);
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });
});
