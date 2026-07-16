const MODEL_ID = 'Xenova/clip-vit-base-patch32';

export interface ModelProgress {
  status: string;
  progress?: number;
}

type Extractor = (input: string) => Promise<{ data: ArrayLike<number> }>;

let extractor: Extractor | null = null;

export async function loadClipModel(onProgress?: (event: ModelProgress) => void): Promise<void> {
  const { pipeline } = await import('@huggingface/transformers');
  extractor = (await pipeline('image-feature-extraction', MODEL_ID, {
    progress_callback: onProgress
  })) as unknown as Extractor;
}

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export async function computeImageEmbedding(file: File): Promise<number[]> {
  if (!extractor) {
    throw new Error('CLIP model is not loaded yet.');
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const output = await extractor(imageUrl);
    const flat = Array.from(output.data);
    return l2Normalize(flat);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// 測試/重置用，避免模組層級的 extractor 狀態在測試之間互相汙染。
export function resetClipModel(): void {
  extractor = null;
}
