import { describe, expect, it } from 'vitest';
import { matchConsultantByStyleTag } from '@/services/consultant-match.service';
import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

function createResult(primaryStyle: string): ComputedStyleDnaResult {
  return {
    isFallback: false,
    primaryStyle,
    heroImage: '/images/style.webp',
    styles: [{ label: primaryStyle, percentage: 100 }],
    annotations: [{ label: primaryStyle, value: '100%', position: 'top-right' }]
  };
}

describe('consultant match service', () => {
  it('matches consultants directly from normalized style tags', () => {
    expect(matchConsultantByStyleTag(createResult('  Y2K  '))).toBe(
      'Spatial Consultant · Ilya Chen'
    );
    expect(matchConsultantByStyleTag(createResult('McBling'))).toBe(
      'Spatial Consultant · Ilya Chen'
    );
    expect(matchConsultantByStyleTag(createResult('Art Deco'))).toBe(
      'Spatial Consultant · Nora Reyes'
    );
  });

  it('can point multiple related style tags to the same consultant without a group lookup', () => {
    expect(matchConsultantByStyleTag(createResult('Baroque'))).toBe(
      'Spatial Consultant · Nora Reyes'
    );
    expect(matchConsultantByStyleTag(createResult('Maximalism'))).toBe(
      'Spatial Consultant · Nora Reyes'
    );
  });

  it('falls back to the studio consultant when the style is not mapped', () => {
    expect(matchConsultantByStyleTag(createResult('Luminous Minimalism'))).toBe(
      'Spatial Consultant · Asterism Studio'
    );
  });
});
