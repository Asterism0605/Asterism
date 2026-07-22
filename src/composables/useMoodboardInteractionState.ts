import { computed, ref } from 'vue';

// 資料夾詳情頁的圖片多選跟資料夾列表頁的刪除模式，兩套各自獨立、不共用同一個狀態，
// 用 discriminated union 讓兩者在型別層級就互斥，所有切換都經過同一個 mode ref。
type InteractionMode =
  | { type: 'idle' }
  | { type: 'folder-delete' }
  | { type: 'image-select'; selectedImageIds: Set<string> };

interface MoodboardFolderActivationOptions {
  isFolderDeleteMode: () => boolean;
  consumeDidDrag: () => boolean;
  getFolderId: (index: number) => string | undefined;
  findFolderIndex: (folderId: string) => number;
  getArmedFolderId: () => string | null;
  setArmedFolderId: (folderId: string) => void;
  requestDeleteFolder: (index: number) => void;
  previewFolder: (index: number) => void;
  openFolder: (index: number) => void;
}

export function useMoodboardFolderActivation(options: MoodboardFolderActivationOptions) {
  function activate(index: number, armFirst: boolean, deleteWhenActive: boolean) {
    if (options.consumeDidDrag()) return;

    const folderId = options.getFolderId(index);
    if (!folderId) return;

    if (options.isFolderDeleteMode()) {
      if (deleteWhenActive) options.requestDeleteFolder(index);
      return;
    }

    if (!armFirst || options.getArmedFolderId() === folderId) {
      options.openFolder(index);
      return;
    }

    options.setArmedFolderId(folderId);
    options.previewFolder(index);
  }

  function activateFolder(index: number) {
    activate(index, false, true);
  }

  function activateMobileFolder(index: number) {
    activate(index, true, true);
  }

  function activateFolderById(folderId: string, settings = { deleteWhenActive: true }) {
    const index = options.findFolderIndex(folderId);
    if (index !== -1) activate(index, false, settings.deleteWhenActive);
  }

  function activateMobileFolderById(folderId: string) {
    const index = options.findFolderIndex(folderId);
    if (index !== -1) activate(index, true, true);
  }

  return {
    activateFolder,
    activateMobileFolder,
    activateFolderById,
    activateMobileFolderById
  };
}

export function useMoodboardInteractionState(getSelectableImageIds: () => string[]) {
  const mode = ref<InteractionMode>({ type: 'idle' });

  const isFolderDeleteMode = computed(() => mode.value.type === 'folder-delete');
  const isImageSelectMode = computed(() => mode.value.type === 'image-select');
  const selectedImageIds = computed(() => {
    const current = mode.value;
    return current.type === 'image-select' ? current.selectedImageIds : new Set<string>();
  });

  function toggleFolderDeleteMode() {
    mode.value = mode.value.type === 'folder-delete' ? { type: 'idle' } : { type: 'folder-delete' };
  }

  function toggleImageSelectMode() {
    mode.value =
      mode.value.type === 'image-select'
        ? { type: 'idle' }
        : { type: 'image-select', selectedImageIds: new Set() };
  }

  function toggleImageSelection(itemId: string) {
    const current = mode.value;
    if (current.type !== 'image-select') return;
    const next = new Set(current.selectedImageIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    mode.value = { type: 'image-select', selectedImageIds: next };
  }

  const isAllImagesSelected = computed(() => {
    const current = mode.value;
    if (current.type !== 'image-select') return false;
    const itemIds = getSelectableImageIds();
    return itemIds.length > 0 && itemIds.every((itemId) => current.selectedImageIds.has(itemId));
  });

  function toggleSelectAllImages() {
    const current = mode.value;
    if (current.type !== 'image-select') return;
    mode.value = {
      type: 'image-select',
      selectedImageIds: isAllImagesSelected.value ? new Set() : new Set(getSelectableImageIds())
    };
  }

  function resetImageSelection() {
    if (mode.value.type === 'image-select') mode.value = { type: 'idle' };
  }

  function resetInteractionState() {
    mode.value = { type: 'idle' };
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
