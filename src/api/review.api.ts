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

export interface ReviewPayload {
  action: ReviewAction;
  medium?: string;
  subMedium?: string;
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
const CLEARED = { styleGroup: false, medium: false, subMedium: false };

function needsAny(nr: ImageRow['needs_review']): boolean {
  return Boolean(nr?.styleGroup || nr?.medium || nr?.subMedium);
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
  const items = (data as ImageRow[]).filter((r) => needsAny(r.needs_review)).map(toReviewImage);
  return { items, taxonomy: TAXONOMY };
}

export async function submitReview(id: string, payload: ReviewPayload): Promise<void> {
  let patch: Record<string, unknown>;
  if (payload.action === 'approve') {
    patch = { needs_review: CLEARED };
  } else if (payload.action === 'correct') {
    patch = { medium: payload.medium, sub_medium: payload.subMedium, needs_review: CLEARED };
  } else {
    patch = { excluded: true };
  }
  const { error } = await getSupabase().from('images').update(patch).eq('id', id);
  if (error) throw error;
}
