import rawStyleImages from '@/data/style-data.json';
import { createMockSuccess, withMockDelay } from '@/api/mockAdapter';
import type { ApiResponse } from '@/types/api';
import type { StyleImage } from '@/types/image';

const MOCK_IMAGE_DELAY_MS = 300;
const mockStyleImages = rawStyleImages as StyleImage[];

export async function fetchImagesApi(): Promise<ApiResponse<StyleImage[]>> {
  return withMockDelay(createMockSuccess(mockStyleImages), MOCK_IMAGE_DELAY_MS);
}
