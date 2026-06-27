import {
  fetchReviewQueue as fetchReviewQueueApi,
  updateImage,
  type ReviewAction,
  type ReviewImage,
  type ReviewQueueResponse
} from '@/api/review.api';
import { SUB_MEDIUMS_BY_MEDIUM } from '@/data/styleLabels';

export type { ReviewAction, ReviewImage, ReviewQueueResponse, ReviewTaxonomy } from '@/api/review.api';

export interface ReviewDraft {
  needsReview: ReviewImage['needsReview'];
  draftMedium: string;
  draftSubMedium: string;
}

export function fetchReviewQueue(): Promise<ReviewQueueResponse> {
  return fetchReviewQueueApi();
}

// 依 card.needsReview + draft 組出實際 update patch。
// 只動「有 flag（需審）」的欄位，styleGroup 旗標一律保留（本工具不審它，不謊報已審）。
export function buildPatch(action: ReviewAction, draft: ReviewDraft): Record<string, unknown> {
  if (action === 'exclude') {
    return { excluded: true };
  }

  const nr = draft.needsReview;

  if (action === 'approve') {
    // 接受 AI 標的：清掉需審的 medium/subMedium 旗標，styleGroup 不動。
    return { needs_review: { ...nr, medium: false, subMedium: false } };
  }

  // correct：只對有 flag 的欄位寫 draft 值 + 清該旗標，並驗證。
  const patch: Record<string, unknown> = {};
  const nextReview = { ...nr };

  if (nr.medium) {
    if (!draft.draftMedium) throw new Error('請選擇 medium 後再送出');
    patch.medium = draft.draftMedium;
    nextReview.medium = false;
  }

  if (nr.subMedium) {
    if (!draft.draftSubMedium) throw new Error('請選擇 subMedium 後再送出');
    const allowed = SUB_MEDIUMS_BY_MEDIUM[draft.draftMedium] ?? [];
    if (!allowed.includes(draft.draftSubMedium)) {
      throw new Error('subMedium 不符合目前 medium 的分類');
    }
    patch.sub_medium = draft.draftSubMedium;
    nextReview.subMedium = false;
  }

  patch.needs_review = nextReview;
  return patch;
}

export async function submitReview(id: string, action: ReviewAction, draft: ReviewDraft): Promise<void> {
  await updateImage(id, buildPatch(action, draft));
}
