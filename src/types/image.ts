export interface StyleImage {
  id: string;
  url: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium?: string;
  subMedium?: string;
  colorPalette: string[];
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
}

export interface HomeInspirationImage {
  id: string;
  src: string;
  alt: string;
  styleGroup: string;
}
