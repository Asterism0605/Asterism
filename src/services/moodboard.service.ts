import type { ImageSpreadNode } from '@/types/image';
import type { SavedImage } from '@/types/moodboard';
import { useMoodboardStore } from '@/stores/moodboard.store';

const DEFAULT_FOLDER_ID = 'default';

export function saveImage(image: ImageSpreadNode): void {
  const store = useMoodboardStore();
  const savedImage: SavedImage = {
    id: image.id,
    src: image.src
  };
  store.addImage(DEFAULT_FOLDER_ID, savedImage);
}

export function unsaveImage(imageId: string): void {
  const store = useMoodboardStore();
  store.removeImage(DEFAULT_FOLDER_ID, imageId);
}

export function createFolder(name: string): void {
  const store = useMoodboardStore();
  store.createFolder(name);
}

export function isImageSaved(imageId: string): boolean {
  const store = useMoodboardStore();
  return store.folders.some((folder) => folder.images.some((img) => img.id === imageId));
}
