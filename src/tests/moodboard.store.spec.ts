import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMoodboardStore } from '@/stores/moodboard.store';
import type { SavedImage } from '@/types/moodboard';

const STORAGE_KEY = 'asterism:moodboard:v1';

const createSavedImage = (id: string): SavedImage => ({
  id,
  src: `/style-image/${id}.webp`
});

describe('moodboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('初始化時沒有任何資料夾', () => {
    const store = useMoodboardStore();

    expect(store.folders).toHaveLength(0);
  });

  it('新增圖片到資料夾並持久化到 localStorage', () => {
    const store = useMoodboardStore();
    store.createFolder('我的最愛');
    const folderId = store.folders[0].id;
    const image = createSavedImage('y2k-001');

    store.addImage(folderId, image);

    expect(store.folders[0].images).toHaveLength(1);
    expect(store.folders[0].images[0]).toEqual(image);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders[0].images[0]).toEqual(image);
  });

  it('不會在同一個資料夾中新增重複的圖片', () => {
    const store = useMoodboardStore();
    store.createFolder('我的最愛');
    const folderId = store.folders[0].id;
    const image = createSavedImage('y2k-001');

    store.addImage(folderId, image);
    store.addImage(folderId, image);

    expect(store.folders[0].images).toHaveLength(1);
  });

  it('從資料夾中移除圖片並持久化到 localStorage', () => {
    const store = useMoodboardStore();
    store.createFolder('我的最愛');
    const folderId = store.folders[0].id;
    const image = createSavedImage('y2k-001');
    store.addImage(folderId, image);

    store.removeImage(folderId, image.id);

    expect(store.folders[0].images).toHaveLength(0);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders[0].images).toHaveLength(0);
  });

  it('建立新資料夾並持久化到 localStorage', () => {
    const store = useMoodboardStore();

    store.createFolder('我的最愛');

    expect(store.folders).toHaveLength(1);
    expect(store.folders[0].name).toBe('我的最愛');
    expect(store.folders[0].images).toEqual([]);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(persisted.folders).toHaveLength(1);
    expect(persisted.folders[0].name).toBe('我的最愛');
  });

  it('從有效的 localStorage 資料還原資料夾', () => {
    const writer = useMoodboardStore();
    writer.createFolder('我的最愛');
    const folderId = writer.folders[0].id;
    writer.addImage(folderId, createSavedImage('y2k-001'));

    setActivePinia(createPinia());
    const reader = useMoodboardStore();
    reader.hydrate();

    expect(reader.folders[0].images).toHaveLength(1);
    expect(reader.folders[0].images[0].id).toBe('y2k-001');
  });

  it('當 localStorage 內容為格式錯誤的 JSON 時，回退為預設狀態並清除該 key', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const store = useMoodboardStore();

    expect(() => store.hydrate()).not.toThrow();

    expect(store.folders).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('當 localStorage 內容格式不正確時，回退為預設狀態並清除該 key', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders: 'not-an-array' }));
    const store = useMoodboardStore();

    store.hydrate();

    expect(store.folders).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
