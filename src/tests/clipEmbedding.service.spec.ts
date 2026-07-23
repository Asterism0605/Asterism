import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@huggingface/transformers');

import {
  computeImageEmbedding,
  loadClipModel,
  resetClipModel
} from '@/services/clipEmbedding.service';

type MockExtractor = (input: string) => Promise<{ data: ArrayLike<number> }>;
type PipelineMock = (
  task: string,
  model?: string,
  options?: Record<string, unknown>
) => Promise<MockExtractor>;

const { mockExtractor, pipelineMock } = vi.hoisted(() => {
  const mockExtractor = vi.fn<MockExtractor>();
  const pipelineMock = vi.fn<PipelineMock>();
  return { mockExtractor, pipelineMock };
});

vi.mock('@huggingface/transformers', () => ({ pipeline: pipelineMock }));

describe('clipEmbedding.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClipModel();
    pipelineMock.mockResolvedValue(mockExtractor);
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('loadClipModel 呼叫 pipeline 並帶入 model 名稱與 progress callback', async () => {
    const onProgress = vi.fn();
    await loadClipModel(onProgress);

    expect(pipelineMock).toHaveBeenCalledWith(
      'image-feature-extraction',
      'Xenova/clip-vit-base-patch32',
      expect.objectContaining({ progress_callback: onProgress })
    );
  });

  it('computeImageEmbedding 未載入 model 時丟錯', async () => {
    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    await expect(computeImageEmbedding(file)).rejects.toThrow('CLIP model is not loaded yet.');
  });

  it('computeImageEmbedding 回傳 L2 normalize 過的向量', async () => {
    mockExtractor.mockResolvedValue({ data: new Float32Array([3, 4]) });
    await loadClipModel();

    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    const embedding = await computeImageEmbedding(file);

    expect(embedding[0]).toBeCloseTo(0.6);
    expect(embedding[1]).toBeCloseTo(0.8);
  });

  it('同一個 File 物件重複呼叫 computeImageEmbedding 只跑一次 CLIP 推論', async () => {
    mockExtractor.mockResolvedValue({ data: new Float32Array([3, 4]) });
    await loadClipModel();

    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    const first = await computeImageEmbedding(file);
    const second = await computeImageEmbedding(file);

    expect(mockExtractor).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('不同的 File 物件即使內容相同也各自重新計算', async () => {
    mockExtractor.mockResolvedValue({ data: new Float32Array([3, 4]) });
    await loadClipModel();

    const fileA = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    const fileB = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    await computeImageEmbedding(fileA);
    await computeImageEmbedding(fileB);

    expect(mockExtractor).toHaveBeenCalledTimes(2);
  });

  it('快取命中時即使 model 沒載入也能直接回傳結果', async () => {
    mockExtractor.mockResolvedValue({ data: new Float32Array([3, 4]) });
    await loadClipModel();

    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    await computeImageEmbedding(file);
    resetClipModel();

    await expect(computeImageEmbedding(file)).resolves.toEqual([0.6, 0.8]);
  });
});
