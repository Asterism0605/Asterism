export interface MoodboardPhoto {
  src: string;
  w: number;
  h: number;
  faded?: boolean;
  placeholder?: boolean;
  itemId?: string;
  imageId?: string;
}

// 已收藏圖片轉成排版用的 photo，itemId 必填——跟純視覺 placeholder 明確區分，
// 讓 toPhotos／scatter／mDetailPhotos 漏傳 itemId 時型別檢查抓得到，而不是刪除按鈕悄悄消失。
export interface MoodboardSavedPhoto extends MoodboardPhoto {
  itemId: string;
}

export interface MoodboardHomePhoto extends MoodboardPhoto {
  id: string;
  cx: number;
  cy: number;
}

export interface MoodboardPositionedPhoto extends MoodboardSavedPhoto {
  id: string;
  delay: string;
  x: number;
  y: number;
}

export interface MoodboardMobilePhoto extends MoodboardPhoto {
  id: string;
  delay: string;
  cx: number;
  cy: number;
}

export interface MoodboardMobileSavedPhoto extends MoodboardSavedPhoto {
  id: string;
  delay: string;
  cx: number;
  cy: number;
}

export interface MoodboardObstacle {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface MoodboardOrbitParams {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  node: {
    x: number;
    y: number;
  };
}

export interface MoodboardPackOptions {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gap?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  obstacles?: MoodboardObstacle[];
  fillRatio?: number;
  idPrefix?: string;
}

export interface SavedImage {
  itemId: string;
  id: string;
  src: string;
  title: string;
  styleGroup: string | null;
  style: string[];
  medium: string | null;
  createdAt: string;
}

export interface MoodboardFolder {
  id: string;
  name: string;
  createdAt: string;
  images: SavedImage[];
}

export type MoodboardItem = SavedImage;

export interface MoodboardViewModel {
  folders: MoodboardFolder[];
  allItems: MoodboardItem[];
  totalFolderCount: number;
  totalSavedItemCount: number;
}

export type MoodboardStatus = 'idle' | 'loading' | 'success' | 'error';
