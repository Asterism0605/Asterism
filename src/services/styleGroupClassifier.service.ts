import { classifyByCosineSimilarity } from '@/services/classifier.service';
import {
  STYLE_GROUP_ANCHOR_EMBEDDINGS,
  type StyleGroupAnchor
} from '@/data/styleGroupAnchorEmbeddings';

export function classifyStyleGroup(
  embedding: number[],
  anchors: StyleGroupAnchor[] = STYLE_GROUP_ANCHOR_EMBEDDINGS
): string {
  return classifyByCosineSimilarity(
    embedding,
    anchors.map((anchor) => ({ label: anchor.styleGroup, embedding: anchor.embedding }))
  );
}
