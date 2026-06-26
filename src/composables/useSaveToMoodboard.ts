import { ref } from 'vue';
import { saveImage } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import type { ImageSpreadNode } from '@/types/image';

export function useSaveToMoodboard() {
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);

  async function saveToMoodboard(image: ImageSpreadNode) {
    if (isSaving.value) return;
    isSaving.value = true;
    saveError.value = null;
    try {
      await saveImage(image);
      await new Promise((resolve) => setTimeout(resolve, 300));
      showToast({ type: 'success', message: 'Saved to moodboard' });
    } catch {
      saveError.value = 'Failed to save. Please try again.';
      showToast({ type: 'error', message: 'Failed to save. Please try again.' });
    } finally {
      isSaving.value = false;
    }
  }

  return { isSaving, saveError, saveToMoodboard };
}
