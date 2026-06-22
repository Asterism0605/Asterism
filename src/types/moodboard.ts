export interface MoodboardPhoto {
  src: string;
  w: number;
  h: number;
  faded?: boolean;
}

export interface MoodboardHomePhoto extends MoodboardPhoto {
  id: string;
  cx: number;
  cy: number;
}

export interface MoodboardPositionedPhoto extends MoodboardPhoto {
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
  id: string;
  src: string;
  alt: string;
  styleGroup: string;
}

export interface MoodboardFolder {
  id: string;
  name: string;
  images: SavedImage[];
}

export type MoodboardItem = SavedImage;
