import { onScopeDispose, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { addItem, createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { MOODBOARD_FEEDBACK_DISPLAY_MS } from '@/constants/moodboard.constants';

export function useSaveToMoodboard() {
  const { t } = useI18n();
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);
  const isCreatingFolder = ref(false);
  const isCreateFolderSuccess = ref(false);
  const justSavedFolderId = ref<string | null>(null);

  let justSavedTimer: ReturnType<typeof setTimeout> | null = null;

  function clearJustSavedTimer() {
    if (justSavedTimer !== null) {
      clearTimeout(justSavedTimer);
      justSavedTimer = null;
    }
  }

  onScopeDispose(clearJustSavedTimer);

  function mapSaveImageError(e: unknown, t: ReturnType<typeof useI18n>['t']): string {
    return e instanceof Error && e.message === 'Image not found.'
      ? t('toast.saveContactSupport')
      : t('toast.saveFailed');
  }

  async function saveToMoodboard(folderId: string, imageId: string): Promise<boolean> {
    if (isSaving.value) return false;
    isSaving.value = true;
    saveError.value = null;
    try {
      await addItem(folderId, imageId);
      justSavedFolderId.value = folderId;
      clearJustSavedTimer();
      justSavedTimer = setTimeout(() => {
        justSavedFolderId.value = null;
        justSavedTimer = null;
      }, MOODBOARD_FEEDBACK_DISPLAY_MS);
      return true;
    } catch (e) {
      const message = mapSaveImageError(e, t);
      saveError.value = message;
      showToast({ type: 'error', message });
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function createNewFolder(name: string, imageId: string): Promise<boolean> {
    if (isCreatingFolder.value) return false;
    isCreatingFolder.value = true;
    isCreateFolderSuccess.value = false;
    try {
      const folderId = createFolder(name);
      try {
        await addItem(folderId, imageId);
      } catch (e) {
        const message = mapSaveImageError(e, t);
        showToast({
          type: 'error',
          message: `Folder created, but ${message.charAt(0).toLowerCase()}${message.slice(1)}`
        });
        return false;
      }
      isCreateFolderSuccess.value = true;
      showToast({ type: 'success', message: 'Folder created and image saved.' });
      await new Promise((resolve) => setTimeout(resolve, MOODBOARD_FEEDBACK_DISPLAY_MS));
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

  return {
    isSaving,
    saveError,
    saveToMoodboard,
    isCreatingFolder,
    isCreateFolderSuccess,
    createNewFolder,
    justSavedFolderId
  };
}
