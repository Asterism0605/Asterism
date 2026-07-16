// 以圖搜圖功能的可調參數集中管理，避免同一組數字/字串散落在多個檔案裡各自為政。
export const IMAGE_SEARCH_CONFIG = {
  clipModelId: 'Xenova/clip-vit-base-patch32',
  embeddingDimension: 512,
  matchCount: 4,

  // 純檢索架構：全庫 top-1 相似度低於此值 → 「圖庫裡沒有夠像的圖」。
  // 2026-07-09 calibrateRetrievalReject.ts 定案：正樣本 top-1 median 0.848 vs 負樣本 0.650，
  // T=0.74 雙軸優於舊文字錨點法（TPR 86.1%/FPR 8% vs 85.6%/11%）。
  // 圖庫大幅成長或換 CLIP model 時重跑校準。
  retrievalRejectThreshold: 0.74,
  // top-1 介於 reject 與此值之間 → 照樣給結果，但加「相似度中等，圖庫擴充中」提示。
  // 取校準時正樣本 top-1 median。
  weakMatchThreshold: 0.85,

  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 10 * 1024 * 1024
};
