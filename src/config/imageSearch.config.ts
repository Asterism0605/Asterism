// 以圖搜圖功能的可調參數集中管理，避免同一組數字/字串散落在多個檔案裡各自為政。
export const IMAGE_SEARCH_CONFIG = {
  clipModelId: 'Xenova/clip-vit-base-patch32',
  embeddingDimension: 512,
  // ponytail: 0.75 是初始估計值，需依實際使用資料校準，見設計文件「相似度門檻」
  similarityThreshold: 0.75,
  matchCount: 4,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 10 * 1024 * 1024
};
