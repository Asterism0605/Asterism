export interface StyleImage {
  id: string;
  url: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium?: string;
  subMedium?: string;
  colorPalette: string[];
  attribution?: string;
  sourceUrl?: string;
}

export interface ImageSpreadNode {
  id: string;
  src: string;
  alt: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium?: string;
  subMedium?: string;
  colorPalette: string[];
  attribution?: string;
  sourceUrl?: string;
}

export interface HomeInspirationImage {
  id: string;
  src: string;
  srcset?: string;
  // 縮圖載入失敗時退回的原圖 url；只有實際套了 preview 的圖才有值。
  fallbackSrc?: string;
  width?: number;
  height?: number;
  alt: string;
  styleGroup: string;
}

export interface HomeInspirationOptions {
  preferredStyles?: string[];
}
