import { describe, expect, it, vi } from 'vitest';
import { formatConsultationDisplayValue } from '@/utils/consultation-display';

describe('consultation-display', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  it('formats known raw values through translations', () => {
    expect(formatConsultationDisplayValue('styling', t)).toBe('translated:consult.fieldStyling');
    expect(formatConsultationDisplayValue('material', t)).toBe('translated:consult.focusMaterial');
  });

  it('falls back for missing and unknown values', () => {
    expect(formatConsultationDisplayValue(undefined, t)).toBe('—');
    expect(formatConsultationDisplayValue('custom brief', t)).toBe('custom brief');
  });
});
