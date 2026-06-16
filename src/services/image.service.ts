import { fetchImagesApi } from '@/api/image.api';
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

let cachedImagesPromise: Promise<StyleImage[]> | null = null;

function loadImages(): Promise<StyleImage[]> {
  if (!cachedImagesPromise) {
    cachedImagesPromise = fetchImagesApi().then((response) => response.data);
  }

  return cachedImagesPromise;
}

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

function getFirstImagesByStyleGroup(styleImages: StyleImage[]): StyleImage[] {
  const groups = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (!groups.has(image.styleGroup)) {
      groups.set(image.styleGroup, image);
    }
  }

  return [...groups.values()];
}

function getFirstImagesByStyle(styleImages: StyleImage[], excludedImageIds: Set<string>): StyleImage[] {
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

export async function getImageById(imageId: string): Promise<ImageSpreadNode | undefined> {
  const styleImages = await loadImages();
  const image = styleImages.find((item) => item.id === imageId);

  return image ? toSpreadNode(image) : undefined;
}

export async function getRelatedImages(
  imageId: string,
  options: RelatedImageOptions = {}
): Promise<ImageSpreadNode[]> {
  const styleImages = await loadImages();
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

export async function getHomeInspirationImages(
  options: HomeInspirationOptions = {}
): Promise<HomeInspirationImage[]> {
  const styleImages = await loadImages();
  const random = options.random ?? Math.random;
  const groupLeadImages = getFirstImagesByStyleGroup(styleImages);

  if (groupLeadImages.length >= HOME_INSPIRATION_LIMIT) {
    return groupLeadImages.slice(0, HOME_INSPIRATION_LIMIT).map(toHomeInspirationImage);
  }

  const selectedIds = new Set(groupLeadImages.map((image) => image.id));
  const fillerImages = pickRandomImages(
    getFirstImagesByStyle(styleImages, selectedIds),
    HOME_INSPIRATION_LIMIT - groupLeadImages.length,
    random
  );

  return [...groupLeadImages, ...fillerImages]
    .slice(0, HOME_INSPIRATION_LIMIT)
    .map(toHomeInspirationImage);
}
