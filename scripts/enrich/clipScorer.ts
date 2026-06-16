import { pipeline } from '@huggingface/transformers';
import type { Scorer, ScoredLabel } from './scorer';

// 首次呼叫會下載模型權重（約數百 MB），之後離線可用。
export async function createClipScorer(model = 'Xenova/clip-vit-base-patch32'): Promise<Scorer> {
  const classifier = await pipeline('zero-shot-image-classification', model);

  return {
    async classify(imageRef: string, labels: string[]): Promise<ScoredLabel[]> {
      const output = (await classifier(imageRef, labels)) as Array<{
        label: string;
        score: number;
      }>;
      return [...output].sort((a, b) => b.score - a.score);
    }
  };
}
