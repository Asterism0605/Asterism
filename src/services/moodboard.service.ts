import type { SavedImage } from '@/types/moodboard';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { getImageById } from '@/services/image.service';

export function addItem(folderId: string, imageId: string): void {
  const store = useMoodboardStore();
  const image = getImageById(imageId);
  if (!image) throw new Error('Image not found.');
  const savedImage: SavedImage = { id: imageId, src: image.src };
  store.addImage(folderId, savedImage);
}

export function removeItem(folderId: string, imageId: string): void {
  const store = useMoodboardStore();
  store.removeImage(folderId, imageId);
}

export function createFolder(name: string): string {
  const store = useMoodboardStore();
  if (store.folders.length >= 10) {
    throw new Error('You have reached the maximum of 10 folders.');
  }
  if (store.folders.some((f) => f.name.trim() === name.trim())) {
    throw new Error('A folder with this name already exists.');
  }
  return store.createFolder(name.trim());
}

export function isImageSaved(imageId: string): boolean {
  const store = useMoodboardStore();
  return store.folders.some((folder) => folder.images.some((img) => img.id === imageId));
}
