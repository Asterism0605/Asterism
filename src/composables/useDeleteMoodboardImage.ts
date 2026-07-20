import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { deleteItems } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { MoodboardFolder } from '@/types/moodboard';

interface UseDeleteMoodboardImageOptions {
  getFolder: () => MoodboardFolder | undefined;
  onDeleted: (itemIds: string[]) => void;
}

export function useDeleteMoodboardImage(options: UseDeleteMoodboardImageOptions) {
  const { t } = useI18n();
  const authStore = useAuthStore();
  const moodboardStore = useMoodboardStore();

  const deleteImageTarget = ref<{ folderId: string; itemIds: string[] } | null>(null);
  const isDeleteImageModalOpen = ref(false);
  const isDeletingImage = ref(false);

  function requestDeleteImage(itemIds: string[]) {
    const folder = options.getFolder();
    if (!folder) return;

    const validIds = itemIds.filter((itemId) =>
      folder.images.some((image) => image.itemId === itemId)
    );
    if (validIds.length === 0) return;

    deleteImageTarget.value = { folderId: folder.id, itemIds: validIds };
    isDeleteImageModalOpen.value = true;
  }

  async function confirmDeleteImage() {
    if (!deleteImageTarget.value || isDeletingImage.value || !authStore.user) return;

    const { folderId, itemIds } = deleteImageTarget.value;
    isDeletingImage.value = true;
    try {
      await deleteItems({ folderId, itemIds });
      itemIds.forEach((itemId) => moodboardStore.removeImage(folderId, itemId));
      isDeleteImageModalOpen.value = false;
      deleteImageTarget.value = null;
      options.onDeleted(itemIds);
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
