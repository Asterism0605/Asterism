import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadClipModelMock = vi.fn();
const computeImageEmbeddingMock = vi.fn();
vi.mock('@/services/clipEmbedding.service', () => ({
  loadClipModel: (...args: unknown[]) => loadClipModelMock(...args),
  computeImageEmbedding: (...args: unknown[]) => computeImageEmbeddingMock(...args)
}));

import { resetClipModelState, useClipModel } from '@/composables/useClipModel';

describe('useClipModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClipModelState();
    localStorage.clear();
  });

  it('load 成功後 status 變 ready、progress 到 100', async () => {
    loadClipModelMock.mockImplementation(async (onProgress: (e: { progress: number }) => void) => {
      onProgress({ progress: 40 });
    });
    const model = useClipModel();

    await model.load();

    expect(model.status.value).toBe('ready');
    expect(model.progress.value).toBe(100);
  });

  it('load 失敗 status 變 error 並帶錯誤訊息', async () => {
    loadClipModelMock.mockRejectedValue(new Error('network fail'));
    const model = useClipModel();

    await model.load();

    expect(model.status.value).toBe('error');
    expect(model.error.value).toBe('Model download failed. Please check your connection and try again.');
  });

  it('重複呼叫 load 在 loading/ready 狀態時不重跑', async () => {
    loadClipModelMock.mockResolvedValue(undefined);
    const model = useClipModel();

    await model.load();
    await model.load();

    expect(loadClipModelMock).toHaveBeenCalledTimes(1);
  });

  it('computeEmbedding 委派給 clipEmbedding.service', async () => {
    computeImageEmbeddingMock.mockResolvedValue([1, 2, 3]);
    const model = useClipModel();
    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });

    const result = await model.computeEmbedding(file);

    expect(computeImageEmbeddingMock).toHaveBeenCalledWith(file);
    expect(result).toEqual([1, 2, 3]);
  });

  it('load 成功前 hasDownloadedBefore 是 false，成功後變 true（供 F5 後自動載入判斷）', async () => {
    loadClipModelMock.mockResolvedValue(undefined);
    const model = useClipModel();

    expect(model.hasDownloadedBefore()).toBe(false);

    await model.load();

    expect(model.hasDownloadedBefore()).toBe(true);
  });
});
