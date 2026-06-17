import { fetchImagesApi } from '@/api/image.api';
import rawStyleImages from '@/data/style-data.json';
import type { HomeInspirationImage, ImageSpreadNode, StyleImage } from '@/types/image';

interface RelatedImageOptions {
  limit?: number;
  visitedImageIds?: string[];
  random?: () => number;
}

const DEFAULT_RELATED_LIMIT = 4;

const localStyleImages = rawStyleImages as StyleImage[];

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

function findById(styleImages: StyleImage[], imageId: string): StyleImage | undefined {
  return styleImages.find((item) => item.id === imageId);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// 同 styleGroup 候選依「共享 style 數」分層（多到少），同分層內洗牌，
// 這樣相關度高的永遠優先，但同樣相關的圖每次延展（含 F5 重整）順序都不同。
function sortBySameGroupSharedStyles(
  baseImage: StyleImage,
  candidates: StyleImage[],
  random: () => number = Math.random
): StyleImage[] {
  const tiers = new Map<number, StyleImage[]>();

  for (const image of candidates) {
    if (image.styleGroup !== baseImage.styleGroup) {
      continue;
    }

    const shared = countSharedStyles(baseImage, image);
    const tier = tiers.get(shared) ?? [];
    tier.push(image);
    tiers.set(shared, tier);
  }

  return [...tiers.keys()]
    .sort((first, second) => second - first)
    .flatMap((shared) => shuffle(tiers.get(shared) as StyleImage[], random));
}

// 本地 61 張（含概念照與素材照）優先查找，本地查不到才打 API 找外部延展圖池，
// 避免首頁概念照（只在本地）點進去因為不在 API 圖池而找不到。
export async function getImageById(imageId: string): Promise<ImageSpreadNode | undefined> {
  const localImage = findById(localStyleImages, imageId);

  if (localImage) {
    return toSpreadNode(localImage);
  }

  const apiImage = findById(await loadImages(), imageId);

  return apiImage ? toSpreadNode(apiImage) : undefined;
}

export async function getRelatedImages(
  imageId: string,
  options: RelatedImageOptions = {}
): Promise<ImageSpreadNode[]> {
  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const random = options.random ?? Math.random;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);

  const baseImage = findById(localStyleImages, imageId) ?? findById(await loadImages(), imageId);

  if (!baseImage) {
    return [];
  }

  const localMatches = sortBySameGroupSharedStyles(
    baseImage,
    localStyleImages.filter((image) => !excludedIds.has(image.id)),
    random
  );
  const selectedImages = localMatches.slice(0, limit);

  if (selectedImages.length < limit) {
    const selectedIds = new Set([...excludedIds, ...selectedImages.map((image) => image.id)]);
    const apiImages = await loadImages();
    const apiMatches = sortBySameGroupSharedStyles(
      baseImage,
      apiImages.filter((image) => !selectedIds.has(image.id)),
      random
    );

    selectedImages.push(...apiMatches.slice(0, limit - selectedImages.length));
  }

  return selectedImages.map(toSpreadNode);
}

// 首頁只放團體概念照（沒有 medium 的圖），資料源固定為本地 style-data.json，
// 不走 loadImages()/外部 API，避免跟 getRelatedImages 共用延展圖池。
export async function getHomeInspirationImages(): Promise<HomeInspirationImage[]> {
  // 隨機打散
  // const concepts = localStyleImages.filter((image) => !image.medium);
  // return shuffle(concepts, Math.random).map(toHomeInspirationImage);

  // 照風格排列
  return localStyleImages.filter((image) => !image.medium).map(toHomeInspirationImage);
}
