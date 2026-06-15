import styleData from '@/data/style-data.json';

export type ImageItem = (typeof styleData)[number];

export function getImageById(id: string): ImageItem | undefined {
  return styleData.find((img) => img.id === id);
}

export function getRelatedImages(excludeId: string): ImageItem[] {
  return [...styleData.filter((img) => img.id !== excludeId)].sort(() => Math.random() - 0.5);
}
