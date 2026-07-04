import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import { addItem, createFolder } from '@/services/moodboard.service';
import { MOODBOARD_FEEDBACK_DISPLAY_MS } from '@/constants/moodboard.constants';

vi.mock('@/services/moodboard.service', () => ({
  addItem: vi.fn(),
  createFolder: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn()
}));

const addItemMock = vi.mocked(addItem);
const createFolderMock = vi.mocked(createFolder);

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
    addItemMock.mockReset();
    createFolderMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('存圖進行中時重複呼叫 saveToMoodboard 會直接回傳 false（防重送 guard）', async () => {
    let resolveAddItem!: () => void;
    addItemMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAddItem = resolve;
        })
    );
    const { saveToMoodboard, isSaving } = withSetup(() => useSaveToMoodboard());

    const firstCall = saveToMoodboard('folder-1', 'img-1');
    expect(isSaving.value).toBe(true);

    const secondResult = await saveToMoodboard('folder-1', 'img-1');

    expect(secondResult).toBe(false);
    expect(addItemMock).toHaveBeenCalledTimes(1);

    resolveAddItem();
    await firstCall;
  });

  it('建立資料夾進行中時重複呼叫 createNewFolder 會直接回傳 false（防重送 guard）', async () => {
    createFolderMock.mockReturnValue('folder-1');
    let resolveAddItem!: () => void;
    addItemMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAddItem = resolve;
        })
    );
    const { createNewFolder, isCreatingFolder } = withSetup(() => useSaveToMoodboard());

    const firstCall = createNewFolder('新資料夾', 'img-1');
    expect(isCreatingFolder.value).toBe(true);

    const secondResult = await createNewFolder('新資料夾', 'img-1');

    expect(secondResult).toBe(false);
    expect(createFolderMock).toHaveBeenCalledTimes(1);

    resolveAddItem();
    await vi.advanceTimersByTimeAsync(MOODBOARD_FEEDBACK_DISPLAY_MS);
    await firstCall;
  });
});
