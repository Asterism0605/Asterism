import rawStyleImages from '@/data/style-data.json';
import type { HomeInspirationImage, ImageSpreadNode, StyleImage } from '@/types/image';

interface RelatedImageOptions {
  limit?: number;
  visitedImageIds?: string[];
}

const DEFAULT_RELATED_LIMIT = 4;

const styleImages = rawStyleImages as StyleImage[];

function toSpreadNode(image: StyleImage): ImageSpreadNode {
  return {
    id: image.id,
    src: image.url,
    alt: image.title || image.style.join(', '),
    title: image.title,
    styleGroup: image.styleGroup,
    style: image.style,
    medium: image.medium,
    subMedium: image.subMedium,
    colorPalette: image.colorPalette
  };
}

function countSharedStyles(baseImage: StyleImage, candidate: StyleImage): number {
  const baseStyles = new Set(baseImage.style);

  return candidate.style.filter((style) => baseStyles.has(style)).length;
}

function toHomeInspirationImage(image: StyleImage): HomeInspirationImage {
  return {
    id: image.id,
    src: image.url,
    alt: image.title || image.style.join(', '),
    styleGroup: image.styleGroup
  };
}

function getFirstImagesByStyleGroup(): StyleImage[] {
  const groups = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (!image.id.includes('main')) continue;
    if (!groups.has(image.styleGroup)) {
      groups.set(image.styleGroup, image);
    }
  }

  return [...groups.values()];
}

function getFirstImagePerMedium(styleGroup: string): StyleImage[] {
  const mediums = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (image.styleGroup !== styleGroup) continue;
    if (!image.medium) continue;
    if (mediums.has(image.medium)) continue;
    mediums.set(image.medium, image);
  }

  return [...mediums.values()];
}

function getFirstImagePerSubMedium(
  styleGroup: string,
  medium: string
): StyleImage[] {
  const subMediums = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (image.styleGroup !== styleGroup) continue;
    if (image.medium !== medium) continue;
    const key = image.subMedium ?? '';
    if (subMediums.has(key)) continue;
    subMediums.set(key, image);
  }

  return [...subMediums.values()];
}

export function getImageById(imageId: string): ImageSpreadNode | undefined {
  const image = styleImages.find((item) => item.id === imageId);

  return image ? toSpreadNode(image) : undefined;
}

export function getMediumGroupImages(
  imageId: string,
  options: RelatedImageOptions = {}
): ImageSpreadNode[] {
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage) return [];

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const mediumImages = getFirstImagePerMedium(baseImage.styleGroup).filter(
    (image) => !excludedIds.has(image.id)
  );

  return mediumImages.slice(0, limit).map(toSpreadNode);
}

export function getSubMediumGroupImages(
  imageId: string,
  options: RelatedImageOptions = {}
): ImageSpreadNode[] {
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage || !baseImage.medium) return [];

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const subMediumImages = getFirstImagePerSubMedium(
    baseImage.styleGroup,
    baseImage.medium
  ).filter((image) => !excludedIds.has(image.id));

  return subMediumImages.slice(0, limit).map(toSpreadNode);
}

function pickRelatedCandidates(
  candidates: StyleImage[],
  baseImage: StyleImage,
  limit: number
): StyleImage[] {
  const selectedIds = new Set<string>();

  function takeFrom(predicate: (image: StyleImage) => boolean): StyleImage[] {
    const picked: StyleImage[] = [];

    for (const image of candidates) {
      if (picked.length >= limit) break;
      if (selectedIds.has(image.id)) continue;
      if (predicate(image)) {
        selectedIds.add(image.id);
        picked.push(image);
      }
    }

    return picked;
  }

  const result: StyleImage[] = [];

  if (baseImage.subMedium) {
    result.push(...takeFrom((image) => image.subMedium === baseImage.subMedium));
  }

  if (baseImage.medium && result.length < limit) {
    result.push(...takeFrom((image) => image.medium === baseImage.medium));
  }

  if (result.length < limit) {
    result.push(
      ...takeFrom((image) => image.styleGroup === baseImage.styleGroup)
        .sort(
          (first, second) => countSharedStyles(baseImage, second) - countSharedStyles(baseImage, first)
        )
    );
  }

  return result;
}

export function getRelatedImages(
  imageId: string,
  options: RelatedImageOptions = {}
): ImageSpreadNode[] {
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage) {
    return [];
  }

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const candidates = styleImages.filter((image) => !excludedIds.has(image.id));

  return pickRelatedCandidates(candidates, baseImage, limit).map(toSpreadNode);
}

export function getHomeInspirationImages(): HomeInspirationImage[] {
  return getFirstImagesByStyleGroup().map(toHomeInspirationImage);
}
