import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

export interface ModelProgress {
  status: string;
  progress?: number;
}

type Extractor = (input: string) => Promise<{ data: ArrayLike<number> }>;

let extractor: Extractor | null = null;

// 同一個 File 物件重複拿去搜尋（例如使用者按兩次搜尋、或失敗後重試）不用重新跑一次 CLIP
// 推論。用 WeakMap 是刻意的：File 物件不再被任何地方參照時（例如使用者重選檔案），快取項目
// 會跟著被 GC 回收，不會無限累積記憶體；但也代表瀏覽器每次從檔案選擇器選出的 File 是新物件，
// 換一張圖或重新選同一張都不會命中快取，只有「同一個 File 物件重複使用」才會命中。
const embeddingCache = new WeakMap<File, number[]>();

export async function loadClipModel(onProgress?: (event: ModelProgress) => void): Promise<void> {
  const { pipeline } = await import('@huggingface/transformers');
  extractor = (await pipeline('image-feature-extraction', IMAGE_SEARCH_CONFIG.clipModelId, {
    progress_callback: onProgress
  })) as unknown as Extractor;
}

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export async function computeImageEmbedding(file: File): Promise<number[]> {
  const cached = embeddingCache.get(file);
  if (cached) {
    return cached;
  }

  if (!extractor) {
    throw new Error('CLIP model is not loaded yet.');
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const output = await extractor(imageUrl);
    const flat = Array.from(output.data);
    // transformers.js 的 image-feature-extraction pipeline（pool 選項未設）對 CLIP 回傳的是
    // 模型原始輸出 image_embeds，沒有做過 normalize —— 查過套件原始碼
    // node_modules/@huggingface/transformers/src/pipelines/image-feature-extraction.js 的
    // _call()，回傳前完全沒有 normalize 步驟。所以這裡手動 L2 normalize 是必要的，不是重複動作。
    const embedding = l2Normalize(flat);
    embeddingCache.set(file, embedding);
    return embedding;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// 測試/重置用，避免模組層級的 extractor 狀態在測試之間互相汙染。
export function resetClipModel(): void {
  extractor = null;
}
