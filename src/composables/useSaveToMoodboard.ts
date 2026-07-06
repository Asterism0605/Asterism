import { computed, onScopeDispose, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { addItem, createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { MOODBOARD_FEEDBACK_DISPLAY_MS } from '@/constants/moodboard.constants';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';
import {
  consumePendingMoodboardAction,
  savePendingMoodboardAction
} from '@/services/pendingMoodboardAction.service';

export function useSaveToMoodboard() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const moodboardStore = useMoodboardStore();
  const canSave = computed(() => Boolean(authStore.user?.id));
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

  function redirectGuestToLogin(imageId: string): false {
    savePendingMoodboardAction(imageId, route.fullPath);
    void router.push({
      name: 'login',
      query: { next: route.fullPath }
    });
    return false;
  }

  function consumePendingSaveMenu(imageId: string, imageExists = true): boolean {
    if (!authStore.user?.id) return false;

    const result = consumePendingMoodboardAction(imageId);
    if (result === 'discarded' || (result === 'ready' && !imageExists)) {
      showToast({ type: 'warning', message: t('toast.saveFailed') });
    }
    return result === 'ready' && imageExists;
  }

  async function saveToMoodboard(folderId: string, imageId: string): Promise<boolean> {
    if (!authStore.user?.id) return redirectGuestToLogin(imageId);
    if (isSaving.value) return false;
    isSaving.value = true;
    saveError.value = null;
    try {
      const savedImage = await addItem(folderId, imageId);
      moodboardStore.addImage(folderId, savedImage);
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
    if (!authStore.user?.id) return redirectGuestToLogin(imageId);
    if (isCreatingFolder.value) return false;
    const profileId = authStore.user.id;
    if (
      moodboardStore.status !== 'success' ||
      moodboardStore.loadedProfileId !== profileId
    ) {
      showToast({ type: 'error', message: t('moodboard.loadError') });
      return false;
    }
    isCreatingFolder.value = true;
    isCreateFolderSuccess.value = false;
    try {
      const folder = await createFolder(profileId, name, [...moodboardStore.folders]);
      moodboardStore.addFolder(folder);
      try {
        const savedImage = await addItem(folder.id, imageId);
        moodboardStore.addImage(folder.id, savedImage);
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
    canSave,
    redirectGuestToLogin,
    consumePendingSaveMenu,
    saveError,
    saveToMoodboard,
    isCreatingFolder,
    isCreateFolderSuccess,
    createNewFolder,
    justSavedFolderId
  };
}
