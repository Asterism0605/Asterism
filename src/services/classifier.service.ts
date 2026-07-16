import { cosineSimilarity } from '@/utils/vectorMath';

export interface EmbeddingAnchor {
  label: string;
  embedding: number[];
}

// 通用的「embedding 對一組錨點做 cosine similarity、取分數最高者」分類邏輯。
// styleGroup/medium/subMedium 之類的分類本質上都是同一套演算法，差別只在錨點資料，
// 共用這裡避免以後每加一層分類就複製貼上一次同樣的迴圈。
export function classifyByCosineSimilarity(embedding: number[], anchors: EmbeddingAnchor[]): string {
  if (anchors.length === 0) {
    throw new Error('No anchors available.');
  }

  let bestLabel = anchors[0].label;
  let bestScore = -Infinity;

  for (const anchor of anchors) {
    const score = cosineSimilarity(embedding, anchor.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = anchor.label;
    }
  }

  return bestLabel;
}
