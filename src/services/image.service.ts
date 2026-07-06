import rawStyleImages from '@/data/style-data.json';
import { fetchImagesApi } from '@/api/image.api';
import type {
  HomeInspirationImage,
  HomeInspirationOptions,
  ImageSpreadNode,
  StyleImage
} from '@/types/image';

interface RelatedImageOptions {
  limit?: number;
  visitedImageIds?: string[];
  rng?: () => number;
}

const DEFAULT_RELATED_LIMIT = 4;

// 可變快取，預設＝打包 JSON；啟動時由 loadImages() 換成 Supabase（已 gate）資料。
// 預設值讓未呼叫 loadImages 的情境（多數單元測試、載入前瞬間）行為與現狀一致。
let styleImages: StyleImage[] = rawStyleImages as StyleImage[];

export async function loadImages(): Promise<void> {
  styleImages = await fetchImagesApi();
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

function countPreferredStyleMatches(image: StyleImage, preferredStyles: Set<string>): number {
  return image.style.filter((style) => preferredStyles.has(style)).length;
}

function sortByPreferredStyles(images: StyleImage[], preferredStyles: string[] = []): StyleImage[] {
  const preferredStyleSet = new Set(preferredStyles.filter(Boolean));

  if (preferredStyleSet.size === 0) {
    return images;
  }

  return images
    .map((image, index) => ({
      image,
      index,
      matchCount: countPreferredStyleMatches(image, preferredStyleSet)
    }))
    .sort((first, second) => second.matchCount - first.matchCount || first.index - second.index)
    .map(({ image }) => image);
}

// 依 keyOf 把候選分組（已先排除 excludedIds），每組用 rng 隨機選一張代表。
// 先排除再分組：排除某張圖只是換該組代表，不會讓整組消失（#94）。
function pickOneImagePerGroup(
  images: StyleImage[],
  keyOf: (image: StyleImage) => string | undefined,
  excludedIds: Set<string>,
  rng: () => number,
  options: { preserveGroups?: boolean } = {}
): StyleImage[] {
  const groups = new Map<string, StyleImage[]>();

  for (const image of images) {
    const key = keyOf(image);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(image);
    else groups.set(key, [image]);
  }

  // clamp：注入的 rng 若回傳 1（floor(1*len)=len）不得越界。
  return [...groups.values()]
    .map((list) => {
      const available = list.filter((image) => !excludedIds.has(image.id));
      const candidates = available.length > 0 || !options.preserveGroups ? available : list;

      return candidates[Math.min(Math.floor(rng() * candidates.length), candidates.length - 1)];
    })
    .filter((image): image is StyleImage => Boolean(image));
}

function getRandomImagePerMedium(
  styleGroup: string,
  excludedIds: Set<string>,
  rng: () => number
): StyleImage[] {
  const groups = new Map<string, StyleImage[]>();

  for (const image of styleImages) {
    if (image.styleGroup !== styleGroup || !image.medium) continue;
    const list = groups.get(image.medium);
    if (list) list.push(image);
    else groups.set(image.medium, [image]);
  }

  return [...groups.values()].map((list) => {
    const mediumOnly = list.filter((image) => !image.subMedium);
    const unvisitedMediumOnly = mediumOnly.filter((image) => !excludedIds.has(image.id));
    const unvisited = list.filter((image) => !excludedIds.has(image.id));
    const candidates =
      unvisitedMediumOnly.length > 0
        ? unvisitedMediumOnly
        : unvisited.length > 0
          ? unvisited
          : mediumOnly.length > 0
            ? mediumOnly
            : list;

    return candidates[Math.min(Math.floor(rng() * candidates.length), candidates.length - 1)];
  });
}

function getRandomImagePerSubMedium(
  styleGroup: string,
  medium: string,
  excludedIds: Set<string>,
  rng: () => number
): StyleImage[] {
  return pickOneImagePerGroup(
    styleImages.filter(
      (image) => image.styleGroup === styleGroup && image.medium === medium && image.subMedium
    ),
    (image) => image.subMedium,
    excludedIds,
    rng,
    { preserveGroups: true }
  );
}

export function getImageById(imageId: string): ImageSpreadNode | undefined {
  const image = styleImages.find((item) => item.id === imageId);

  return image ? toSpreadNode(image) : undefined;
}

export function getStyleGroupRootImage(imageId: string): ImageSpreadNode | undefined {
  const image = styleImages.find((item) => item.id === imageId);

  if (!image) return undefined;

  const rootImage = styleImages.find(
    (item) => item.styleGroup === image.styleGroup && !item.medium
  );

  return rootImage ? toSpreadNode(rootImage) : undefined;
}

export function getMediumEntryImage(imageId: string): ImageSpreadNode | undefined {
  const image = styleImages.find((item) => item.id === imageId);

  if (!image?.medium) return undefined;
  if (!image.subMedium) return toSpreadNode(image);

  const mediumEntryImage = styleImages.find(
    (item) =>
      item.styleGroup === image.styleGroup && item.medium === image.medium && !item.subMedium
  );

  return mediumEntryImage ? toSpreadNode(mediumEntryImage) : toSpreadNode(image);
}

export function getMediumGroupImages(
  imageId: string,
  options: RelatedImageOptions = {}
): ImageSpreadNode[] {
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage) return [];

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const rng = options.rng ?? Math.random;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const mediumImages = getRandomImagePerMedium(baseImage.styleGroup, excludedIds, rng);

  return mediumImages.slice(0, limit).map(toSpreadNode);
}

export function getSubMediumGroupImages(
  imageId: string,
  options: RelatedImageOptions = {}
): ImageSpreadNode[] {
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage || !baseImage.medium) return [];

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const rng = options.rng ?? Math.random;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const subMediumImages = getRandomImagePerSubMedium(
    baseImage.styleGroup,
    baseImage.medium,
    excludedIds,
    rng
  );

  return subMediumImages
    .filter((image) => image.id !== imageId)
    .slice(0, limit)
    .map(toSpreadNode);
}

function pickRelatedCandidates(
  candidates: StyleImage[],
  baseImage: StyleImage,
  limit: number
): StyleImage[] {
  return candidates
    .filter((image) => image.styleGroup === baseImage.styleGroup)
    .map((image, index) => ({
      image,
      index,
      sharedStyleCount: countSharedStyles(baseImage, image)
    }))
    .sort(
      (first, second) =>
        second.sharedStyleCount - first.sharedStyleCount || first.index - second.index
    )
    .slice(0, limit)
    .map(({ image }) => image);
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
  const candidates = styleImages.filter(
    (image) => Boolean(image.subMedium) && !excludedIds.has(image.id)
  );

  return pickRelatedCandidates(candidates, baseImage, limit).map(toSpreadNode);
}

// 首頁：把不同風格（styleGroup）的圖片穿插排在一起。
function interleaveImagesByStyleGroup(images: StyleImage[], maxConsecutive = 2): StyleImage[] {
  const groups = new Map<string, StyleImage[]>();

  for (const image of images) {
    const list = groups.get(image.styleGroup);
    if (list) list.push(image);
    else groups.set(image.styleGroup, [image]);
  }

  const groupQueues = [...groups.values()];
  const orderedImages: StyleImage[] = [];
  let previousStyleGroup: string | undefined;
  let consecutiveCount = 0;
  let cursor = 0;

  while (orderedImages.length < images.length) {
    const nextIndex = groupQueues.findIndex((_, offset) => {
      const group = groupQueues[(cursor + offset) % groupQueues.length];
      const nextStyleGroup = group[0]?.styleGroup;
      const canUseSameGroup =
        nextStyleGroup !== previousStyleGroup || consecutiveCount < maxConsecutive;

      return group.length > 0 && canUseSameGroup;
    });
    const fallbackIndex = groupQueues.findIndex((group) => group.length > 0);
    const queueIndex =
      nextIndex >= 0 ? (cursor + nextIndex) % groupQueues.length : fallbackIndex;
    const nextGroup = queueIndex >= 0 ? groupQueues[queueIndex] : undefined;

    if (!nextGroup) break;

    const nextImage = nextGroup.shift();
    if (!nextImage) continue;

    orderedImages.push(nextImage);
    consecutiveCount =
      nextImage.styleGroup === previousStyleGroup ? consecutiveCount + 1 : 1;
    previousStyleGroup = nextImage.styleGroup;
    cursor =
      nextGroup.length > 0 && consecutiveCount < maxConsecutive
        ? queueIndex
        : (queueIndex + 1) % groupQueues.length;
  }

  return orderedImages;
}

// 首頁：放團體概念照（沒有 medium 的圖），資料源為本地 style-data.json。
export async function getHomeInspirationImages(
  options: HomeInspirationOptions = {}
): Promise<HomeInspirationImage[]> {
  const conceptImages = styleImages.filter((image) => !image.medium);
  const preferredImages = sortByPreferredStyles(conceptImages, options.preferredStyles);

  return interleaveImagesByStyleGroup(preferredImages).map(toHomeInspirationImage);
}
