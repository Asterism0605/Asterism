import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

const STORAGE_KEY = 'asterism:moodboard:v1';

function isSavedImage(value: unknown): value is SavedImage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.src === 'string'
  );
}

function isMoodboardFolder(value: unknown): value is MoodboardFolder {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.images) &&
    candidate.images.every(isSavedImage)
  );
}

function isPersistedMoodboard(value: unknown): value is { folders: MoodboardFolder[] } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.folders) && candidate.folders.every(isMoodboardFolder);
}

export const useMoodboardStore = defineStore('moodboard', () => {
  const folders = ref<MoodboardFolder[]>([{ id: 'default', name: '我的收藏', images: [] }]);

  function persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders: folders.value }));
  }

  function addImage(folderId: string, image: SavedImage): void {
    const folder = folders.value.find((f) => f.id === folderId);
    if (!folder) return;
    if (folder.images.some((img) => img.id === image.id)) return;
    folder.images.push(image);
    persist();
  }

  function removeImage(folderId: string, imageId: string): void {
    const folder = folders.value.find((f) => f.id === folderId);
    if (!folder) return;
    folder.images = folder.images.filter((img) => img.id !== imageId);
    persist();
  }

  function createFolder(name: string): void {
    if (folders.value.length >= 10) throw new Error('Folder limit reached');
    folders.value.push({ id: crypto.randomUUID(), name, images: [] });
    persist();
  }

  function hydrate(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isPersistedMoodboard(parsed)) {
        throw new Error('Malformed moodboard data in localStorage');
      }
      folders.value = parsed.folders;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return { folders, addImage, removeImage, createFolder, hydrate };
});
