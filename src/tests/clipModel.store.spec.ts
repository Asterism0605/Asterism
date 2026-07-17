import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const loadClipModelMock = vi.fn();
const computeImageEmbeddingMock = vi.fn();
vi.mock('@/services/clipEmbedding.service', () => ({
  loadClipModel: (...args: unknown[]) => loadClipModelMock(...args),
  computeImageEmbedding: (...args: unknown[]) => computeImageEmbeddingMock(...args)
}));

import { useClipModelStore } from '@/stores/clipModel.store';

describe('useClipModelStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('load 成功後 status 變 ready、progress 到 100', async () => {
    loadClipModelMock.mockImplementation(async (onProgress: (e: { progress: number }) => void) => {
      onProgress({ progress: 40 });
    });
    const model = useClipModelStore();

    await model.load();

    expect(model.status).toBe('ready');
    expect(model.progress).toBe(100);
  });

  it('多檔案下載時用 loaded/total 跨檔案加總進度，不是拿單一檔案的 progress 直接覆蓋整體進度', async () => {
    const progressSnapshots: number[] = [];
    const model = useClipModelStore();

    loadClipModelMock.mockImplementation(async (onProgress: (e: Record<string, unknown>) => void) => {
      onProgress({ file: 'config.json', loaded: 100, total: 100 });
      progressSnapshots.push(model.progress);
      onProgress({ file: 'model.onnx', loaded: 0, total: 900 });
      progressSnapshots.push(model.progress);
    });

    await model.load();

    expect(progressSnapshots).toEqual([100, 10]);
  });

  it('load 失敗 status 變 error 並帶錯誤訊息', async () => {
    loadClipModelMock.mockRejectedValue(new Error('network fail'));
    const model = useClipModelStore();

    await model.load();

    expect(model.status).toBe('error');
    expect(model.error).toBe('Model download failed. Please check your connection and try again.');
  });

  it('重複呼叫 load 在 loading/ready 狀態時不重跑', async () => {
    loadClipModelMock.mockResolvedValue(undefined);
    const model = useClipModelStore();

    await model.load();
    await model.load();

    expect(loadClipModelMock).toHaveBeenCalledTimes(1);
  });

  it('computeEmbedding 委派給 clipEmbedding.service', async () => {
    computeImageEmbeddingMock.mockResolvedValue([1, 2, 3]);
    const model = useClipModelStore();
    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });

    const result = await model.computeEmbedding(file);

    expect(computeImageEmbeddingMock).toHaveBeenCalledWith(file);
    expect(result).toEqual([1, 2, 3]);
  });

  it('load 成功前 hasDownloadedBefore 是 false，成功後變 true（供 F5 後自動載入判斷）', async () => {
    loadClipModelMock.mockResolvedValue(undefined);
    const model = useClipModelStore();

    expect(model.hasDownloadedBefore()).toBe(false);

    await model.load();

    expect(model.hasDownloadedBefore()).toBe(true);
  });
});
