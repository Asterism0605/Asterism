import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addItem, removeItem, createFolder, isImageSaved } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';

vi.mock('@/services/image.service', () => ({
  getImageById: (id: string) => ({ id, src: `/style-image/${id}.webp` })
}));

describe('moodboard.service', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('addItem 將圖片儲存到指定的資料夾', () => {
    createFolder('test');
    const store = useMoodboardStore();
    const folderId = store.folders[0].id;

    addItem(folderId, 'y2k-001');

    const folder = store.folders.find((f) => f.id === folderId);

    expect(folder?.images).toHaveLength(1);
    expect(folder?.images[0]).toMatchObject({ id: 'y2k-001' });
  });

  it('removeItem 從指定的資料夾中移除圖片', () => {
    createFolder('test');
    const store = useMoodboardStore();
    const folderId = store.folders[0].id;

    addItem(folderId, 'y2k-001');
    removeItem(folderId, 'y2k-001');

    const folder = store.folders.find((f) => f.id === folderId);

    expect(folder?.images).toHaveLength(0);
  });

  it('createFolder 在 store 中新增一個具名的資料夾', () => {
    createFolder('我的最愛');

    const store = useMoodboardStore();

    expect(store.folders).toHaveLength(1);
    expect(store.folders[0].name).toBe('我的最愛');
    expect(store.folders[0].images).toEqual([]);
  });

  it('當資料夾數量達到 10 個時 createFolder 會拋出錯誤', () => {
    for (let i = 0; i < 10; i++) {
      createFolder(`Folder ${i}`);
    }

    expect(() => createFolder('One too many')).toThrow('You have reached the maximum of 10 folders.');
  });

  it('當圖片已儲存時 isImageSaved 回傳 true', () => {
    createFolder('test');
    const store = useMoodboardStore();
    const folderId = store.folders[0].id;

    addItem(folderId, 'y2k-001');

    expect(isImageSaved('y2k-001')).toBe(true);
  });

  it('當圖片未儲存時 isImageSaved 回傳 false', () => {
    expect(isImageSaved('not-saved-id')).toBe(false);
  });
});
