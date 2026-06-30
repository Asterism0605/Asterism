import {
  fetchStyleDnaProfileRow,
  updateStyleDnaProfileRow
} from '@/api/style-dna.api';
import type {
  ComputedStyleDnaResult,
  StyleDnaAnnotation,
  StyleDnaScore
} from '@/utils/computeStyleDnaResult';

export interface StyleDnaProfile {
  result: ComputedStyleDnaResult | null;
}

const isStyleDnaScore = (value: unknown): value is StyleDnaScore => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.label === 'string' && typeof candidate.percentage === 'number';
};

const isStyleDnaAnnotation = (value: unknown): value is StyleDnaAnnotation => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === 'string' &&
    typeof candidate.value === 'string' &&
    (candidate.position === 'left' ||
      candidate.position === 'right' ||
      candidate.position === 'top-right')
  );
};

function isComputedStyleDnaResult(value: unknown): value is ComputedStyleDnaResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.isFallback === 'boolean' &&
    typeof candidate.primaryStyle === 'string' &&
    typeof candidate.heroImage === 'string' &&
    Array.isArray(candidate.styles) &&
    candidate.styles.every(isStyleDnaScore) &&
    Array.isArray(candidate.annotations) &&
    candidate.annotations.every(isStyleDnaAnnotation)
  );
}

export async function fetchStyleDnaProfile(userId: string): Promise<StyleDnaProfile> {
  const row = await fetchStyleDnaProfileRow(userId);

  return {
    result: isComputedStyleDnaResult(row?.style_dna_result) ? row.style_dna_result : null
  };
}

export async function saveStyleDnaResult(
  userId: string,
  result: ComputedStyleDnaResult
): Promise<void> {
  await updateStyleDnaProfileRow(userId, result);
}
