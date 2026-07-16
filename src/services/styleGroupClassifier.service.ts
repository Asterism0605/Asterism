import { cosineSimilarity } from '@/utils/vectorMath';
import {
  STYLE_GROUP_ANCHOR_EMBEDDINGS,
  type StyleGroupAnchor
} from '@/data/styleGroupAnchorEmbeddings';

export function classifyStyleGroup(
  embedding: number[],
  anchors: StyleGroupAnchor[] = STYLE_GROUP_ANCHOR_EMBEDDINGS
): string {
  if (anchors.length === 0) {
    throw new Error('No style group anchors available.');
  }

  let bestStyleGroup = anchors[0].styleGroup;
  let bestScore = -Infinity;

  for (const anchor of anchors) {
    const score = cosineSimilarity(embedding, anchor.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestStyleGroup = anchor.styleGroup;
    }
  }

  return bestStyleGroup;
}
