import { httpClient } from '@/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { StyleImage } from '@/types/image';

export async function fetchImagesApi(): Promise<ApiResponse<StyleImage[]>> {
  const response = await httpClient.get<StyleImage[]>('/api/images');

  return {
    data: response.data,
    meta: { timestamp: new Date().toISOString() }
  };
}
