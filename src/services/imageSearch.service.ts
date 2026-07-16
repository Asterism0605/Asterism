const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '請上傳 JPG、PNG 或 WebP 格式的圖片。';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return '圖片大小請勿超過 10MB。';
  }

  return null;
}

// ponytail: 0.75 是初始估計值，需依實際使用資料校準，見設計文件「相似度門檻」
export const SIMILARITY_THRESHOLD = 0.75;

export function meetsSimilarityThreshold(similarity: number): boolean {
  return similarity >= SIMILARITY_THRESHOLD;
}
