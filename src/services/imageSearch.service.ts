import { i18n } from '@/i18n';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import { cosineSimilarity } from '@/utils/vectorMath';
import type { ClassificationAnchor } from '@/api/classificationAnchors.api';
import type { ImageSearchResult } from '@/types/imageSearch';

export function validateImageFile(file: File): string | null {
  if (!IMAGE_SEARCH_CONFIG.allowedFileTypes.includes(file.type)) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  if (file.size > IMAGE_SEARCH_CONFIG.maxFileSizeBytes) {
    return i18n.global.t('imageSearch.fileTooLarge');
  }

  if (file.size === 0) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  return null;
}

// 跟 36 個 gate anchor（9 styleGroup × 4 medium）算最大 cosine：「這是不是一張設計參考圖」，
// 跟像圖庫裡的誰（檢索）是不同問題，故取 max 而非跟特定 styleGroup 比對。
export function domainGateScore(embedding: number[], gateAnchors: ClassificationAnchor[]): number {
  return Math.max(...gateAnchors.map((anchor) => cosineSimilarity(embedding, anchor.embedding)));
}

// gate 分數低於門檻 → 不是設計圖，直接拒絕；這個判斷跟圖庫大小、檢索相似度無關。
export function isRejected(gateScore: number): boolean {
  return gateScore < IMAGE_SEARCH_CONFIG.domainGateThreshold;
}

// Domain Gate 過了以後，top-1 檢索相似度低於 weak 門檻 → 相似度中等，UI 顯示提示但照樣給結果。
export function isWeakMatch(top1Similarity: number): boolean {
  return top1Similarity < IMAGE_SEARCH_CONFIG.weakMatchThreshold;
}

// 全庫 kNN top-K 候選內做風格軟加權重排（參數與校準/取捨紀錄見 imageSearch.config.ts）。
// 候選的 styleGroup 是人工審核過的 DB 標籤；查詢圖這邊用 9 個 styleGroup 文字錨點打分。
// 加權而非硬分類：錨點判錯時只是排序偏掉，視覺最像的仍在候選內，不會整批換成不像的圖。
export function rerankByStyle(
  embedding: number[],
  matches: ImageSearchResult[],
  styleAnchors: ClassificationAnchor[]
): ImageSearchResult[] {
  const anchorScore = new Map(
    styleAnchors.map((anchor) => [anchor.label, cosineSimilarity(embedding, anchor.embedding)])
  );
  const score = (m: ImageSearchResult) =>
    m.similarity + IMAGE_SEARCH_CONFIG.styleRerankWeight * (anchorScore.get(m.styleGroup) ?? 0);
  return [...matches].sort((a, b) => score(b) - score(a)).slice(0, IMAGE_SEARCH_CONFIG.matchCount);
}
