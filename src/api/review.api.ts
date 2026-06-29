import { getSupabase } from '@/api/supabaseClient';
import { MEDIUMS, SUB_MEDIUMS_BY_MEDIUM } from '@/data/styleLabels';

export type ReviewAction = 'approve' | 'correct' | 'exclude';

export interface ReviewImage {
  id: string;
  url: string;
  styleGroup: string;
  medium?: string;
  subMedium?: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needsReview: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

export interface ReviewTaxonomy {
  mediums: string[];
  subMediumsByMedium: Record<string, string[]>;
}

export interface ReviewQueueResponse {
  items: ReviewImage[];
  taxonomy: ReviewTaxonomy;
}

interface ImageRow {
  id: string;
  url: string;
  style_group: string;
  medium: string | null;
  sub_medium: string | null;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needs_review: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

const TAXONOMY: ReviewTaxonomy = { mediums: MEDIUMS, subMediumsByMedium: SUB_MEDIUMS_BY_MEDIUM };

// 只撈 medium / subMedium 需審的圖（本工具只審這兩項）。
// styleGroup 需審但 medium/subMedium 都已審的圖不留在 queue，避免清不掉而卡住。
function isQueueable(nr: ImageRow['needs_review']): boolean {
  return Boolean(nr?.medium || nr?.subMedium);
}

function toReviewImage(row: ImageRow): ReviewImage {
  return {
    id: row.id,
    url: row.url,
    styleGroup: row.style_group,
    medium: row.medium ?? undefined,
    subMedium: row.sub_medium ?? undefined,
    confidence: row.confidence,
    needsReview: row.needs_review
  };
}

export async function fetchReviewQueue(): Promise<ReviewQueueResponse> {
  const { data, error } = await getSupabase()
    .from('images')
    .select('id,url,style_group,medium,sub_medium,confidence,needs_review')
    .eq('excluded', false);
  if (error) throw error;
  const items = (data as ImageRow[]).filter((r) => isQueueable(r.needs_review)).map(toReviewImage);
  return { items, taxonomy: TAXONOMY };
}

// 低階更新：patch 由 service 層依 needsReview + draft 組好後傳進來，這裡只負責執行。
export async function updateImage(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabase().from('images').update(patch).eq('id', id);
  if (error) throw error;
}
