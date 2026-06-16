export interface ScoredLabel {
  label: string;
  score: number;
}

// zero-shot 分類抽象：給一張圖和一組標籤，回傳依分數由高到低排序的結果。
// 真實實作是 CLIP（clipScorer.ts）；測試用假替身。
export interface Scorer {
  classify(imageRef: string, labels: string[]): Promise<ScoredLabel[]>;
}
