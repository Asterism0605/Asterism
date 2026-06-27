import type { SavedImage } from '@/types/moodboard';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { getImageById } from '@/services/image.service';

const DEFAULT_FOLDER_ID = 'default';

export function addItem(folderId: string, imageId: string): void {
  const store = useMoodboardStore();
  const image = getImageById(imageId);
  if (!image) return;
  const savedImage: SavedImage = { id: imageId, src: image.src };
  store.addImage(folderId, savedImage);
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
