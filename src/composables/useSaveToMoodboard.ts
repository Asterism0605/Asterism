import { ref } from 'vue';
import { saveImage } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import type { ImageSpreadNode } from '@/types/image';

export function useSaveToMoodboard() {
  const saveError = ref<string | null>(null);

  async function saveToMoodboard(image: ImageSpreadNode) {
    saveError.value = null;
    try {
      await saveImage(image);
    } catch {
      saveError.value = 'Failed to save. Please try again.';
      showToast({ type: 'error', message: 'Failed to save. Please try again.' });
    }
  }

  return { saveError, saveToMoodboard };
}
