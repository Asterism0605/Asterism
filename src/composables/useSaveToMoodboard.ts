import { ref } from 'vue';
import { addItem, createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

export function useSaveToMoodboard() {
  const saveError = ref<string | null>(null);
  const isCreatingFolder = ref(false);
  const isCreateFolderSuccess = ref(false);

  async function saveToMoodboard(folderId: string, imageId: string) {
    saveError.value = null;
    try {
      await addItem(folderId, imageId);
    } catch {
      saveError.value = 'Failed to save. Please try again.';
      showToast({ type: 'error', message: 'Failed to save. Please try again.' });
    }
  }

  async function createNewFolder(name: string): Promise<boolean> {
    isCreatingFolder.value = true;
    isCreateFolderSuccess.value = false;
    try {
      await createFolder(name);
      isCreateFolderSuccess.value = true;
      await new Promise((resolve) => setTimeout(resolve, 800));
      return true;
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message });
      return false;
    } finally {
      isCreatingFolder.value = false;
    }
  }

  return { saveError, saveToMoodboard, isCreatingFolder, isCreateFolderSuccess, createNewFolder };
}
