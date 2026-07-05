import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getMoodboardViewModel } from '@/services/moodboard.service';
import type {
  MoodboardFolder,
  MoodboardStatus,
  SavedImage
} from '@/types/moodboard';

export const useMoodboardStore = defineStore('moodboard', () => {
  const status = ref<MoodboardStatus>('idle');
  const folders = ref<MoodboardFolder[]>([]);
  const error = ref<string | null>(null);
  const loadedProfileId = ref<string | null>(null);
  let requestId = 0;

  const totalSavedItemCount = computed(() =>
    folders.value.reduce((count, folder) => count + folder.images.length, 0)
  );
  const isEmpty = computed(
    () => status.value === 'success' && totalSavedItemCount.value === 0
  );
  const isLowCount = computed(
    () =>
      status.value === 'success' &&
      totalSavedItemCount.value > 0 &&
      totalSavedItemCount.value < 20
  );
  const isNormal = computed(
    () => status.value === 'success' && totalSavedItemCount.value >= 20
  );

  async function fetchMoodboard(profileId: string): Promise<void> {
    const currentRequestId = ++requestId;
    status.value = 'loading';
    error.value = null;

    try {
      const viewModel = await getMoodboardViewModel(profileId);

      if (currentRequestId !== requestId) {
        return;
      }

      folders.value = viewModel.folders;
      loadedProfileId.value = profileId;
      status.value = 'success';
    } catch (cause) {
      if (currentRequestId !== requestId) {
        return;
      }

      folders.value = [];
      loadedProfileId.value = profileId;
      error.value = cause instanceof Error ? cause.message : 'Unable to load moodboard.';
      status.value = 'error';
    }
  }

  function addFolder(folder: MoodboardFolder): void {
    folders.value.unshift(folder);
  }

  function addImage(folderId: string, image: SavedImage): void {
    const folder = folders.value.find((candidate) => candidate.id === folderId);

    if (!folder || folder.images.some((candidate) => candidate.id === image.id)) {
      return;
    }

    folder.images.unshift(image);
  }

  function clear(): void {
    requestId += 1;
    status.value = 'idle';
    folders.value = [];
    error.value = null;
    loadedProfileId.value = null;
  }

  return {
    status,
    folders,
    error,
    loadedProfileId,
    totalSavedItemCount,
    isEmpty,
    isLowCount,
    isNormal,
    fetchMoodboard,
    addFolder,
    addImage,
    clear
  };
});
