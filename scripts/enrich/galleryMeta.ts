export type ImageSource = 'pexels' | 'unsplash';

export interface GalleryMeta {
  source: ImageSource;
  externalId: string;
  url: string;
  description: string; // → title（可能是空字串）
  photographer: string; // → attribution
}
