import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import { addItem, createFolder, deleteFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { MOODBOARD_FEEDBACK_DISPLAY_MS } from '@/constants/moodboard.constants';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/images/img-1' }),
  useRouter: () => ({ push: routerPush })
}));

vi.mock('@/services/moodboard.service', () => ({
  addItem: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn()
}));

const addItemMock = vi.mocked(addItem);
const createFolderMock = vi.mocked(createFolder);
const deleteFolderMock = vi.mocked(deleteFolder);
const savedImage: SavedImage = {
  itemId: 'item-1',
  id: 'img-1',
  src: '/img-1.webp',
  title: 'Image 1',
  styleGroup: 'minimal',
  style: [],
  createdAt: '2026-07-05T00:00:00.000Z'
};
const folder: MoodboardFolder = {
  id: 'folder-1',
  name: '新資料夾',
  createdAt: '2026-07-05T00:00:00.000Z',
  images: []
};

// useSaveToMoodboard 內部呼叫 useI18n()，只能在元件 setup() 裡執行，
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

describe('useSaveToMoodboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    authStore.user = {
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Member',
      isAdmin: false,
      createdAt: '2026-07-05T00:00:00.000Z'
    };
    addItemMock.mockReset();
    createFolderMock.mockReset();
    deleteFolderMock.mockReset();
    routerPush.mockReset();
    vi.mocked(showToast).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('存圖進行中時重複呼叫 saveToMoodboard 會直接回傳 false（防重送 guard）', async () => {
    let resolveAddItem!: (image: SavedImage) => void;
    addItemMock.mockImplementation(
      () =>
        new Promise<SavedImage>((resolve) => {
          resolveAddItem = resolve;
        })
    );
    const { saveToMoodboard, isSaving } = withSetup(() => useSaveToMoodboard());

    const firstCall = saveToMoodboard('folder-1', 'img-1');
    expect(isSaving.value).toBe(true);

    const secondResult = await saveToMoodboard('folder-1', 'img-1');

    expect(secondResult).toBe(false);
    expect(addItemMock).toHaveBeenCalledTimes(1);

    resolveAddItem(savedImage);
    await firstCall;
  });

  it('建立資料夾進行中時重複呼叫 createNewFolder 會直接回傳 false（防重送 guard）', async () => {
    createFolderMock.mockResolvedValue(folder);
    useMoodboardStore().$patch({ status: 'success', loadedProfileId: 'user-1' });
    let resolveAddItem!: (image: SavedImage) => void;
    addItemMock.mockImplementation(
      () =>
        new Promise<SavedImage>((resolve) => {
          resolveAddItem = resolve;
        })
    );
    const { createNewFolder, isCreatingFolder } = withSetup(() => useSaveToMoodboard());

    const firstCall = createNewFolder('新資料夾', 'img-1');
    expect(isCreatingFolder.value).toBe(true);

    const secondResult = await createNewFolder('新資料夾', 'img-1');

    expect(secondResult).toBe(false);
    expect(createFolderMock).toHaveBeenCalledTimes(1);

    resolveAddItem(savedImage);
    await vi.advanceTimersByTimeAsync(MOODBOARD_FEEDBACK_DISPLAY_MS);
    await firstCall;
  });

  it('stores a successful Data API save in Pinia', async () => {
    addItemMock.mockResolvedValue(savedImage);
    const store = useMoodboardStore();
    store.$patch({ folders: [folder], status: 'success' });
    const { saveToMoodboard } = withSetup(() => useSaveToMoodboard());

    await saveToMoodboard('folder-1', 'img-1');

    expect(store.folders[0].images).toEqual([savedImage]);
  });

  it('creates a folder for the authenticated profile and saves the current image', async () => {
    createFolderMock.mockResolvedValue(folder);
    addItemMock.mockResolvedValue(savedImage);
    const store = useMoodboardStore();
    store.$patch({ folders: [], status: 'success', loadedProfileId: 'user-1' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const request = createNewFolder('新資料夾', 'img-1');
    await vi.advanceTimersByTimeAsync(MOODBOARD_FEEDBACK_DISPLAY_MS);
    await request;

    expect(createFolderMock).toHaveBeenCalledWith('user-1', '新資料夾', []);
    expect(addItemMock).toHaveBeenCalledWith('folder-1', 'img-1');
    expect(store.folders[0].images).toEqual([savedImage]);
  });

  it('rolls back the folder when addItem fails but folder cleanup succeeds', async () => {
    createFolderMock.mockResolvedValue(folder);
    addItemMock.mockRejectedValue(new Error('boom'));
    deleteFolderMock.mockResolvedValue(undefined);
    const store = useMoodboardStore();
    store.$patch({ folders: [], status: 'success', loadedProfileId: 'user-1' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const result = await createNewFolder('新資料夾', 'img-1');

    expect(result).toBe(false);
    expect(deleteFolderMock).toHaveBeenCalledWith('folder-1', 'user-1');
    expect(store.folders).toEqual([]);
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Failed to save. Please try again.'
    });
  });

  it('keeps the folder and shows a manual-cleanup toast when rollback also fails', async () => {
    createFolderMock.mockResolvedValue(folder);
    addItemMock.mockRejectedValue(new Error('boom'));
    deleteFolderMock.mockRejectedValue(new Error('delete failed'));
    const store = useMoodboardStore();
    store.$patch({ folders: [], status: 'success', loadedProfileId: 'user-1' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const result = await createNewFolder('新資料夾', 'img-1');

    expect(result).toBe(false);
    expect(store.folders).toEqual([folder]);
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message:
        'Image failed to save and folder cleanup failed. Please delete the folder manually from your moodboard.',
      actionText: 'Go to Moodboard',
      onAction: expect.any(Function)
    });
  });

  it('routes to the moodboard when the manual-cleanup toast action is triggered', async () => {
    createFolderMock.mockResolvedValue(folder);
    addItemMock.mockRejectedValue(new Error('boom'));
    deleteFolderMock.mockRejectedValue(new Error('delete failed'));
    useMoodboardStore().$patch({ folders: [], status: 'success', loadedProfileId: 'user-1' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    await createNewFolder('新資料夾', 'img-1');

    const call = vi.mocked(showToast).mock.calls[0][0];
    call.onAction?.();

    expect(routerPush).toHaveBeenCalledWith({ name: 'moodboard' });
  });

  it('blocks folder creation when the moodboard snapshot failed to load', async () => {
    useMoodboardStore().$patch({ folders: [], status: 'error', error: 'network down' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const result = await createNewFolder('Studio', 'img-1');

    expect(result).toBe(false);
    expect(createFolderMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      message: "We couldn't load your moodboard."
    });
  });

  it('stores the save intent and routes guests to login before saving', async () => {
    useAuthStore().user = null;
    const { saveToMoodboard } = withSetup(() => useSaveToMoodboard());

    const result = await saveToMoodboard('folder-1', 'img-1');

    expect(result).toBe(false);
    expect(addItemMock).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({
      name: 'login',
      query: { next: '/images/img-1' }
    });
    expect(localStorage.getItem('asterism:pending-moodboard-action')).toContain(
      '"imageId":"img-1"'
    );
  });

  it('stores the save intent and routes guests to login before creating a folder', async () => {
    useAuthStore().user = null;
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const result = await createNewFolder('Guest folder', 'img-1');

    expect(result).toBe(false);
    expect(createFolderMock).not.toHaveBeenCalled();
    expect(addItemMock).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({
      name: 'login',
      query: { next: '/images/img-1' }
    });
    expect(localStorage.getItem('asterism:pending-moodboard-action')).toContain(
      '"imageId":"img-1"'
    );
  });
});
