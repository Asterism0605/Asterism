import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@huggingface/transformers');

import {
  computeImageEmbedding,
  loadClipModel,
  resetClipModel
} from '@/services/clipEmbedding.service';
import { pipeline } from '@huggingface/transformers';

const mockExtractor = vi.fn();
const pipelineMock = vi.mocked(pipeline) as any;

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
});
