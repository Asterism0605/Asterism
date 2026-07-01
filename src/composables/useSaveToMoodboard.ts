import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { addItem, createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

export function useSaveToMoodboard() {
  const { t } = useI18n();
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);
  const isCreatingFolder = ref(false);
  const isCreateFolderSuccess = ref(false);

  async function saveToMoodboard(folderId: string, imageId: string) {
    if (isSaving.value) return;
    isSaving.value = true;
    saveError.value = null;
    try {
      await addItem(folderId, imageId);
    } catch (e) {
      const message =
        e instanceof Error && e.message === 'Image not found.'
          ? t('toast.saveContactSupport')
          : t('toast.saveFailed');
      saveError.value = message;
      showToast({ type: 'error', message });
    } finally {
      isSaving.value = false;
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
      const raw = (e as Error).message;
      const message =
        raw === 'You have reached the maximum of 10 folders.'
          ? t('toast.folderLimit')
          : t('toast.saveFailed');
      showToast({ type: 'error', message });
      return false;
    } finally {
      isCreatingFolder.value = false;
    }
  }

  return { isSaving, saveError, saveToMoodboard, isCreatingFolder, isCreateFolderSuccess, createNewFolder };
}
