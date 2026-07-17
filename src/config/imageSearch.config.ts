// 以圖搜圖功能的可調參數集中管理，避免同一組數字/字串散落在多個檔案裡各自為政。
export const IMAGE_SEARCH_CONFIG = {
  clipModelId: 'Xenova/clip-vit-base-patch32',
  embeddingDimension: 512,
  matchCount: 4,

  // 風格軟加權重排：全庫 kNN 先拉 rerankCandidateCount 名候選，前端以
  // score = sim + styleRerankWeight × cos(查詢圖, 候選圖 styleGroup 的文字錨點) 重排取 matchCount。
  // 權重只做「近距離平手時的裁決」，不推翻視覺相似度——CLIP 文字錨點對單張查詢圖很吵
  // （實測黑襯衫穿搭照：正解 Experimental 的錨點分數排 9 組中第 7），w=3 會把 sim 0.82 的
  // 絕配擠掉換成 0.72 的錯風格圖；w=0.6 時該查詢 top-4 與純檢索一致、綠建築查詢同風格圖
  // 仍升到第 1。labeled-test-set-270 leave-one-out：同風格率 63.1%(w=0) → 73.2%(w=0.6)，
  // 平均相似度 0.796 → 0.794。
  // ⚠️ 同日試過「風格優先」硬架構（錨點分類→只在該風格內檢索，離線同風格率 83.7% 更高）：
  // 實際上線更差——分類判錯/邊界案例會把全庫最像(0.84)的結果整批換成風格小組內 0.6x 的圖，
  // 使用者直接看得出來「不像」。視覺相似度必須是骨幹，風格只能當加權，別再走回頭路。
  rerankCandidateCount: 20,
  styleRerankWeight: 0.6,

  // Domain Gate：跟 36 個 gate anchor（9 styleGroup × 4 medium，backend
  // classification_anchors dimension='gate'）算最大 cosine，判斷「是不是設計參考圖」——
  // 跟檢索（圖庫裡最像的是誰）是兩個獨立問題，不共用同一個門檻。
  // 2026-07-15 evalDomainGate.ts 重新校準（1018 正樣本＝圖庫全量 938 + 圖庫外域內 80，
  // 180 負樣本，全自動收集）：Youden 最佳點是 T=0.25（TPR 90.8% / FPR 7.8%），但 Youden
  // 把兩種錯誤等權看待，產品上成本不對稱——誤擋合法設計圖是死路（no-match），誤放離題圖
  // 只是帶 weak-match 提示的結果。取誤擋成本 2x 的加權選點 T=0.24（TPR 95.3% / FPR 12.8%），
  // 實測救回 gate=0.246 被誤擋的學院風穿搭照。抓圖 pipeline 用的 RELEVANCE_THRESHOLD=0.22
  // 母體不同（候選圖 vs 使用者上傳圖），不能沿用。
  // gate prompt 或圖庫大幅變動時重跑 backend 的 npm run eval:domain。
  // 2026-07-16：0.24→0.22。實測商品去背照（無場景/無人物的電商鞋類照）gate=0.225，
  // 只差 0.24 一點點被誤擋；使用者實測放寬到 0.22 後接受度較好。
  // ⚠️ 沒有重跑 evalDomainGate.ts 全套校準——上面 2026-07-15 那次校準測過 0.23 時
  // FPR 已經到 22.8%，0.22 大概率更寬鬆，之後有時間要補跑校準腳本驗證離題誤放率。
  domainGateThreshold: 0.22,
  // Domain Gate 過了以後，top-1 檢索相似度低於此值 → 照樣給「最像的」結果，
  // 但加「相似度中等，圖庫擴充中」提示，誠實管理期望而不是硬擋。
  weakMatchThreshold: 0.85,

  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 10 * 1024 * 1024
};
