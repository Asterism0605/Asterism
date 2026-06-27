import { ref } from 'vue';
import { addItem } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

export function useSaveToMoodboard() {
  const saveError = ref<string | null>(null);

  async function saveToMoodboard(folderId: string, imageId: string) {
    saveError.value = null;
    try {
      await addItem(folderId, imageId);
    } catch {
      saveError.value = 'Failed to save. Please try again.';
      showToast({ type: 'error', message: 'Failed to save. Please try again.' });
    }
  }

  return { saveError, saveToMoodboard };
}
