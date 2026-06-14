import rawStyleImages from '@/data/style-data.json';
import type { HomeInspirationImage, ImageSpreadNode, StyleImage } from '@/types/image';

interface RelatedImageOptions {
  limit?: number;
  visitedImageIds?: string[];
}

interface HomeInspirationOptions {
  random?: () => number;
}

const DEFAULT_RELATED_LIMIT = 4;
const HOME_INSPIRATION_LIMIT = 5;

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
    if (!groups.has(image.styleGroup)) {
      groups.set(image.styleGroup, image);
    }
  }

  return [...groups.values()];
}

function getFirstImagesByStyle(excludedImageIds: Set<string>): StyleImage[] {
  const styles = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (excludedImageIds.has(image.id)) {
      continue;
    }

    for (const style of image.style) {
      if (!styles.has(style)) {
        styles.set(style, image);
      }
    }
  }

  return [...new Map([...styles.values()].map((image) => [image.id, image])).values()];
}

function pickRandomImages(
  candidates: StyleImage[],
  count: number,
  random: () => number
): StyleImage[] {
  const pool = [...candidates];
  const selectedImages: StyleImage[] = [];

  while (pool.length > 0 && selectedImages.length < count) {
    const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
    const [image] = pool.splice(index, 1);
    selectedImages.push(image);
  }

  return selectedImages;
}

export function getImageById(imageId: string): ImageSpreadNode | undefined {
  const image = styleImages.find((item) => item.id === imageId);

  return image ? toSpreadNode(image) : undefined;
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
  const sameGroupImages = candidates
    .filter((image) => image.styleGroup === baseImage.styleGroup)
    .sort(
      (first, second) => countSharedStyles(baseImage, second) - countSharedStyles(baseImage, first)
    );

  return sameGroupImages.slice(0, limit).map(toSpreadNode);
}

export function getHomeInspirationImages(
  options: HomeInspirationOptions = {}
): HomeInspirationImage[] {
  const random = options.random ?? Math.random;
  const groupLeadImages = getFirstImagesByStyleGroup();

  if (groupLeadImages.length >= HOME_INSPIRATION_LIMIT) {
    return groupLeadImages.slice(0, HOME_INSPIRATION_LIMIT).map(toHomeInspirationImage);
  }

  const selectedIds = new Set(groupLeadImages.map((image) => image.id));
  const fillerImages = pickRandomImages(
    getFirstImagesByStyle(selectedIds),
    HOME_INSPIRATION_LIMIT - groupLeadImages.length,
    random
  );

  return [...groupLeadImages, ...fillerImages]
    .slice(0, HOME_INSPIRATION_LIMIT)
    .map(toHomeInspirationImage);
}
