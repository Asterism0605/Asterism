import { describe, expect, it } from 'vitest';
import { matchConsultantByDesignField } from '@/services/consultant-match.service';
import type { ConsultantRow } from '@/api/consultants.api';

const consultants: ConsultantRow[] = [
  { id: 'c-spatial', displayName: 'Spatial Consultant · Mira Chen', specialty: 'spatial' },
  { id: 'c-visual', displayName: 'Spatial Consultant · Ilya Chen', specialty: 'visual_styling' },
  { id: 'c-concept', displayName: 'Spatial Consultant · Nora Reyes', specialty: 'concept_design' },
  { id: 'c-inactive-specialty', displayName: 'Unassigned Consultant', specialty: null }
];

describe('consultant match service', () => {
  it('matches interior and architecture fields to the spatial consultant', () => {
    expect(matchConsultantByDesignField('interior', consultants)).toEqual(consultants[0]);
    expect(matchConsultantByDesignField('architecture', consultants)).toEqual(consultants[0]);
  });

  it('matches styling to the visual_styling consultant', () => {
    expect(matchConsultantByDesignField('styling', consultants)).toEqual(consultants[1]);
  });

  it('matches graphic to the concept_design consultant', () => {
    expect(matchConsultantByDesignField('graphic', consultants)).toEqual(consultants[2]);
  });

  it('returns null when no design field is selected yet', () => {
    expect(matchConsultantByDesignField('', consultants)).toBeNull();
  });

  it('returns null when no active consultant covers the matched specialty', () => {
    expect(matchConsultantByDesignField('interior', [])).toBeNull();
  });
});
