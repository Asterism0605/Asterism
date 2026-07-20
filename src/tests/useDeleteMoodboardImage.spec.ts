import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteMoodboardImage } from '@/composables/useDeleteMoodboardImage';
import { deleteItems } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

vi.mock('@/services/moodboard.service', () => ({
  deleteItems: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn()
}));

const deleteItemsMock = vi.mocked(deleteItems);
const showToastMock = vi.mocked(showToast);

const savedImage: SavedImage = {
  itemId: 'item-1',
  id: 'img-1',
  src: '/img-1.webp',
  title: 'Image 1',
  styleGroup: 'minimal',
  style: [],
  createdAt: '2026-07-05T00:00:00.000Z'
};
const secondSavedImage: SavedImage = {
  itemId: 'item-2',
  id: 'img-2',
  src: '/img-2.webp',
  title: 'Image 2',
  styleGroup: 'minimal',
  style: [],
  createdAt: '2026-07-05T00:00:00.000Z'
};

function buildFolder(overrides: Partial<MoodboardFolder> = {}): MoodboardFolder {
  return {
    id: 'folder-1',
    name: 'Studio',
    createdAt: '2026-07-05T00:00:00.000Z',
    images: [savedImage, secondSavedImage],
    ...overrides
  };
}

// useDeleteMoodboardImage 內部呼叫 useI18n()，只能在元件 setup() 裡執行，
// 掛一個空元件讓 composable 在真正的 setup context 下初始化。
function withSetup<T>(composable: () => T): T {
  let result!: T;
  mount({
    setup() {
      result = composable();
      return () => null;
    }
  });
  return result;
}

describe('useDeleteMoodboardImage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useAuthStore().user = {
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Member',
      isAdmin: false,
      createdAt: '2026-07-05T00:00:00.000Z'
    };
    deleteItemsMock.mockReset();
    showToastMock.mockReset();
  });

  it('找不到任何目標圖片時不開 modal', () => {
    const folder = buildFolder();
    const { requestDeleteImage, isDeleteImageModalOpen } = withSetup(() =>
      useDeleteMoodboardImage({ getFolder: () => folder, onDeleted: vi.fn() })
    );

    requestDeleteImage(['missing-item']);

    expect(isDeleteImageModalOpen.value).toBe(false);
  });

  it('找到目標圖片時開啟 modal', () => {
    const folder = buildFolder();
    const { requestDeleteImage, isDeleteImageModalOpen } = withSetup(() =>
      useDeleteMoodboardImage({ getFolder: () => folder, onDeleted: vi.fn() })
    );

    requestDeleteImage(['item-1']);

    expect(isDeleteImageModalOpen.value).toBe(true);
  });

  it('只保留folder中實際存在的itemId，忽略不存在的id', () => {
    const folder = buildFolder();
    const { requestDeleteImage, isDeleteImageModalOpen } = withSetup(() =>
      useDeleteMoodboardImage({ getFolder: () => folder, onDeleted: vi.fn() })
    );

    requestDeleteImage(['item-1', 'missing-item']);

    expect(isDeleteImageModalOpen.value).toBe(true);
  });

  it('成功批次刪除會呼叫 API、更新 store、觸發 onDeleted，並關閉 modal', async () => {
    const moodboardStore = useMoodboardStore();
    const folder = buildFolder();
    moodboardStore.addFolder(folder);
    deleteItemsMock.mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    const { requestDeleteImage, confirmDeleteImage, isDeleteImageModalOpen, isDeletingImage } =
      withSetup(() => useDeleteMoodboardImage({ getFolder: () => folder, onDeleted }));

    requestDeleteImage(['item-1', 'item-2']);
    await confirmDeleteImage();

    expect(deleteItemsMock).toHaveBeenCalledWith({
      folderId: 'folder-1',
      itemIds: ['item-1', 'item-2']
    });
    expect(moodboardStore.folders[0].images).toHaveLength(0);
    expect(onDeleted).toHaveBeenCalledWith(['item-1', 'item-2']);
    expect(isDeleteImageModalOpen.value).toBe(false);
    expect(isDeletingImage.value).toBe(false);
  });

  it('刪除失敗時顯示 error toast，並保留 modal 開啟以便重試', async () => {
    const folder = buildFolder();
    deleteItemsMock.mockRejectedValue(new Error('delete failed'));
    const onDeleted = vi.fn();
    const { requestDeleteImage, confirmDeleteImage, isDeleteImageModalOpen, isDeletingImage } =
      withSetup(() => useDeleteMoodboardImage({ getFolder: () => folder, onDeleted }));

    requestDeleteImage(['item-1']);
    await confirmDeleteImage();

    expect(showToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(onDeleted).not.toHaveBeenCalled();
    expect(isDeleteImageModalOpen.value).toBe(true);
    expect(isDeletingImage.value).toBe(false);
  });

  it('isDeletingImage 為 true 時防止重複呼叫', async () => {
    const folder = buildFolder();
    let resolveDelete: () => void = () => {};
    deleteItemsMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDelete = resolve;
      })
    );
    const { requestDeleteImage, confirmDeleteImage } = withSetup(() =>
      useDeleteMoodboardImage({ getFolder: () => folder, onDeleted: vi.fn() })
    );

    requestDeleteImage(['item-1']);
    const firstCall = confirmDeleteImage();
    await confirmDeleteImage();

    expect(deleteItemsMock).toHaveBeenCalledTimes(1);

    resolveDelete();
    await firstCall;
  });
});
