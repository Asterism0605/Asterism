import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const fetchClassificationAnchorsMock = vi.fn();
vi.mock('@/api/classificationAnchors.api', () => ({
  fetchClassificationAnchors: (...args: unknown[]) => fetchClassificationAnchorsMock(...args)
}));

import { useClassificationAnchorsStore } from '@/stores/classificationAnchors.store';

describe('useClassificationAnchorsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it('load 成功後 status 變 ready、anchors 填入資料', async () => {
    fetchClassificationAnchorsMock.mockResolvedValue([{ label: 'A', embedding: [1, 0] }]);
    const store = useClassificationAnchorsStore();

    await store.load('styleGroup');

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledWith('styleGroup');
    expect(store.status).toBe('ready');
    expect(store.anchors).toEqual([{ label: 'A', embedding: [1, 0] }]);
  });

  it('load 失敗 status 變 error 並帶錯誤訊息', async () => {
    fetchClassificationAnchorsMock.mockRejectedValue(new Error('network fail'));
    const store = useClassificationAnchorsStore();

    await store.load('styleGroup');

    expect(store.status).toBe('error');
    expect(store.error).toBe('Failed to load style data. Please try again later.');
  });

  it('重複呼叫 load 在 loading/ready 狀態時不重跑', async () => {
    fetchClassificationAnchorsMock.mockResolvedValue([{ label: 'A', embedding: [1, 0] }]);
    const store = useClassificationAnchorsStore();

    await store.load('styleGroup');
    await store.load('styleGroup');

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledTimes(1);
  });

  it('load 回傳空陣列時視為錯誤，不會誤判 ready', async () => {
    fetchClassificationAnchorsMock.mockResolvedValue([]);
    const store = useClassificationAnchorsStore();

    await store.load('styleGroup');

    expect(store.status).toBe('error');
    expect(store.anchors).toEqual([]);
  });

  it('load 失敗後可以重試', async () => {
    fetchClassificationAnchorsMock.mockRejectedValueOnce(new Error('network fail'));
    fetchClassificationAnchorsMock.mockResolvedValueOnce([{ label: 'A', embedding: [1, 0] }]);
    const store = useClassificationAnchorsStore();

    await store.load('styleGroup');
    expect(store.status).toBe('error');

    await store.load('styleGroup');
    expect(store.status).toBe('ready');
    expect(fetchClassificationAnchorsMock).toHaveBeenCalledTimes(2);
  });
});
