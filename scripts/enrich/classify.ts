import type { Scorer } from './scorer';
import {
  STYLE_GROUP_ANCHORS,
  STYLE_VOCAB_BY_GROUP,
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  THRESHOLDS,
  STYLE_TOP_K
} from './taxonomy';

export interface ClassificationResult {
  styleGroup: string;
  medium: string;
  subMedium: string | null;
  style: string[];
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needsReview: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

export async function classifyImage(scorer: Scorer, imageRef: string): Promise<ClassificationResult> {
  // 第1層：styleGroup（用錨點文字比，再把文字對回群組名）
  const sgLabels = Object.keys(STYLE_GROUP_ANCHORS);
  const sgPrompts = sgLabels.map((label) => STYLE_GROUP_ANCHORS[label]);
  const sgScores = await scorer.classify(imageRef, sgPrompts);
  const topSg = sgScores[0];
  const matchedLabel = sgLabels.find((label) => STYLE_GROUP_ANCHORS[label] === topSg.label);
  const styleGroup = matchedLabel ?? sgLabels[0];
  const sgConfidence = topSg.score;

  // 第2層：medium
  const mdScores = await scorer.classify(imageRef, MEDIUM_LABELS);
  const medium = mdScores[0].label;
  const mdConfidence = mdScores[0].score;

  // 第3層：subMedium —— 只在所選 medium 底下的子類裡比；無子類則 null
  const subLabels = SUBMEDIUM_BY_MEDIUM[medium] ?? [];
  let subMedium: string | null = null;
  let subConfidence: number | null = null;
  if (subLabels.length > 0) {
    const subScores = await scorer.classify(imageRef, subLabels);
    subMedium = subScores[0].label;
    subConfidence = subScores[0].score;
  }

  // style[]：多標籤分類，候選池限定在所選 styleGroup 的詞庫
  const styleVocab = STYLE_VOCAB_BY_GROUP[styleGroup] ?? [];
  const styleScores = await scorer.classify(imageRef, styleVocab);
  const style = styleScores.slice(0, STYLE_TOP_K).map((entry) => entry.label);

  return {
    styleGroup,
    medium,
    subMedium,
    style,
    confidence: { styleGroup: sgConfidence, medium: mdConfidence, subMedium: subConfidence },
    needsReview: {
      styleGroup: sgConfidence < THRESHOLDS.styleGroup,
      medium: mdConfidence < THRESHOLDS.medium,
      subMedium: subConfidence !== null && subConfidence < THRESHOLDS.subMedium
    }
  };
}
