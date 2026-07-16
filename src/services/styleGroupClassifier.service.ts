import { classifyByCosineSimilarity } from '@/services/classifier.service';
import type { ClassificationAnchor } from '@/api/classificationAnchors.api';

export function classifyStyleGroup(embedding: number[], anchors: ClassificationAnchor[]): string {
  return classifyByCosineSimilarity(embedding, anchors);
}
