export interface ImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[];
  medium: string | null;
  sub_medium: string | null;
  color_palette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needs_review: { styleGroup: boolean; medium: boolean; subMedium: boolean };
  excluded: boolean;
  created_at: string;
}

export interface DemoStyleImage {
  id: string;
  url: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium?: string;
  subMedium?: string;
  colorPalette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needsReview: { styleGroup: boolean; medium: boolean; subMedium: boolean };
  excluded: boolean;
}

export function toStyleImage(row: ImageRow): DemoStyleImage {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    styleGroup: row.style_group,
    style: row.style,
    medium: row.medium ?? undefined,
    subMedium: row.sub_medium ?? undefined,
    colorPalette: row.color_palette,
    source: row.source,
    attribution: row.attribution,
    confidence: row.confidence,
    needsReview: row.needs_review,
    excluded: row.excluded
  };
}
