import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import { addItem, createFolder } from '@/services/moodboard.service';
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
  createFolder: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn()
}));

const addItemMock = vi.mocked(addItem);
const createFolderMock = vi.mocked(createFolder);
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
    store.$patch({ folders: [], status: 'success' });
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const request = createNewFolder('新資料夾', 'img-1');
    await vi.advanceTimersByTimeAsync(MOODBOARD_FEEDBACK_DISPLAY_MS);
    await request;

    expect(createFolderMock).toHaveBeenCalledWith('user-1', '新資料夾', []);
    expect(addItemMock).toHaveBeenCalledWith('folder-1', 'img-1');
    expect(store.folders[0].images).toEqual([savedImage]);
  });

  it('routes guests to sign-up before saving and never calls the Supabase service', async () => {
    useAuthStore().user = null;
    const { saveToMoodboard } = withSetup(() => useSaveToMoodboard());

    const result = await saveToMoodboard('folder-1', 'img-1');

    expect(result).toBe(false);
    expect(addItemMock).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { next: '/images/img-1' }
    });
  });

  it('routes guests to sign-up before creating a folder and never calls the Supabase service', async () => {
    useAuthStore().user = null;
    const { createNewFolder } = withSetup(() => useSaveToMoodboard());

    const result = await createNewFolder('Guest folder', 'img-1');

    expect(result).toBe(false);
    expect(createFolderMock).not.toHaveBeenCalled();
    expect(addItemMock).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { next: '/images/img-1' }
    });
  });
});
