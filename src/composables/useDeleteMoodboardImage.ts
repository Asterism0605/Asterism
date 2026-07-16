import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { deleteItem } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { MoodboardFolder } from '@/types/moodboard';

interface UseDeleteMoodboardImageOptions {
  getFolder: () => MoodboardFolder | undefined;
  onDeleted: (itemId: string) => void;
}

export function useDeleteMoodboardImage(options: UseDeleteMoodboardImageOptions) {
  const { t } = useI18n();
  const authStore = useAuthStore();
  const moodboardStore = useMoodboardStore();

  const deleteImageTarget = ref<{ folderId: string; itemId: string } | null>(null);
  const isDeleteImageModalOpen = ref(false);
  const isDeletingImage = ref(false);

  function requestDeleteImage(itemId: string) {
    const folder = options.getFolder();
    if (!folder || !folder.images.some((image) => image.itemId === itemId)) return;

    deleteImageTarget.value = { folderId: folder.id, itemId };
    isDeleteImageModalOpen.value = true;
  }

  async function confirmDeleteImage() {
    const profileId = authStore.user?.id;
    if (!deleteImageTarget.value || isDeletingImage.value || !profileId) return;

    const { folderId, itemId } = deleteImageTarget.value;
    isDeletingImage.value = true;
    try {
      await deleteItem(folderId, itemId);
      moodboardStore.removeImage(folderId, itemId);
      isDeleteImageModalOpen.value = false;
      deleteImageTarget.value = null;
      options.onDeleted(itemId);
    } catch {
      showToast({ type: 'error', message: t('toast.deleteImageFailed') });
    } finally {
      isDeletingImage.value = false;
    }
  }

  return {
    isDeleteImageModalOpen,
    isDeletingImage,
    requestDeleteImage,
    confirmDeleteImage
  };
}
