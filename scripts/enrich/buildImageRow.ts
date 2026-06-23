import type { ClassificationResult } from './classify';
import type { GalleryMeta, ImageSource } from './galleryMeta';

export interface ImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[];
  medium: string | null;
  sub_medium: string;
  color_palette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number };
  needs_review: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

const GALLERY_LABEL: Record<ImageSource, string> = {
  pexels: 'Pexels',
  unsplash: 'Unsplash'
};

export function buildImageRow(
  classification: ClassificationResult,
  palette: string[],
  meta: GalleryMeta
): ImageRow {
  return {
    id: `ext-${meta.source}-${meta.externalId}`,
    url: meta.url,
    title: meta.description || `${classification.styleGroup} inspiration`,
    style_group: classification.styleGroup,
    style: classification.style,
    medium: classification.medium,
    sub_medium: classification.subMedium,
    color_palette: palette,
    source: meta.source,
    attribution: `Photo by ${meta.photographer} / ${GALLERY_LABEL[meta.source]}`,
    confidence: classification.confidence,
    needs_review: classification.needsReview
  };
}
