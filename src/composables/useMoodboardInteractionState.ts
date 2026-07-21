import { computed, ref } from 'vue';

// 資料夾詳情頁的圖片多選跟資料夾列表頁的刪除模式，兩套各自獨立、不共用同一個狀態。
export function useMoodboardInteractionState(getSelectableImageIds: () => string[]) {
  const isFolderDeleteMode = ref(false);
  const isImageSelectMode = ref(false);
  const selectedImageIds = ref<Set<string>>(new Set());

  function toggleFolderDeleteMode() {
    isFolderDeleteMode.value = !isFolderDeleteMode.value;
  }

  function toggleImageSelectMode() {
    isImageSelectMode.value = !isImageSelectMode.value;
    selectedImageIds.value = new Set();
  }

  function toggleImageSelection(itemId: string) {
    const next = new Set(selectedImageIds.value);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    selectedImageIds.value = next;
  }

  const isAllImagesSelected = computed(() => {
    const itemIds = getSelectableImageIds();
    return itemIds.length > 0 && itemIds.every((itemId) => selectedImageIds.value.has(itemId));
  });

  function toggleSelectAllImages() {
    selectedImageIds.value = isAllImagesSelected.value
      ? new Set()
      : new Set(getSelectableImageIds());
  }

  function resetImageSelection() {
    isImageSelectMode.value = false;
    selectedImageIds.value = new Set();
  }

  function resetInteractionState() {
    isFolderDeleteMode.value = false;
    resetImageSelection();
  }

  return {
    isFolderDeleteMode,
    isImageSelectMode,
    selectedImageIds,
    toggleFolderDeleteMode,
    toggleImageSelectMode,
    toggleImageSelection,
    isAllImagesSelected,
    toggleSelectAllImages,
    resetImageSelection,
    resetInteractionState
  };
}
