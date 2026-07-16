// 以圖搜圖功能的可調參數集中管理，避免同一組數字/字串散落在多個檔案裡各自為政。
export const IMAGE_SEARCH_CONFIG = {
  clipModelId: 'Xenova/clip-vit-base-patch32',
  embeddingDimension: 512,
  // ponytail: 校準過一次的估計值（原本 0.75 太嚴，用真實圖庫資料測過：同 styleGroup
  // 內部圖片互相比對，第 10 名相似度就已經掉到 0.75 附近；使用者上傳的陌生照片天生比
  // 圖庫內部互相比對的分數更低，門檻留太緊會讓幾乎所有搜尋都找不到結果）。0.5 仍是
  // 估計值，後續要看實際使用狀況再調，見設計文件「相似度門檻」。
  similarityThreshold: 0.5,
  matchCount: 4,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 10 * 1024 * 1024
};
