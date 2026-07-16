import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

export function validateImageFile(file: File): string | null {
  if (!IMAGE_SEARCH_CONFIG.allowedFileTypes.includes(file.type)) {
    return '請上傳 JPG、PNG 或 WebP 格式的圖片。';
  }

  if (file.size > IMAGE_SEARCH_CONFIG.maxFileSizeBytes) {
    return '圖片大小請勿超過 10MB。';
  }

  return null;
}

export function meetsSimilarityThreshold(similarity: number): boolean {
  return similarity >= IMAGE_SEARCH_CONFIG.similarityThreshold;
}
