import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/review.api', () => ({
  updateImage: vi.fn(),
  fetchReviewQueue: vi.fn()
}));

import { buildPatch, submitReview } from '@/services/review.service';
import { updateImage } from '@/api/review.api';

const nr = (styleGroup: boolean, medium: boolean, subMedium: boolean) => ({
  styleGroup,
  medium,
  subMedium
});

describe('review.service buildPatch', () => {
  it('exclude → { excluded: true }', () => {
    expect(buildPatch('exclude', { needsReview: nr(false, false, true), draftMedium: '', draftSubMedium: '' })).toEqual({
      excluded: true
    });
  });

  it('approve 只清 medium/subMedium 旗標，styleGroup 保留', () => {
    expect(
      buildPatch('approve', { needsReview: nr(true, false, true), draftMedium: 'Outfit', draftSubMedium: 'Top' })
    ).toEqual({ needs_review: { styleGroup: true, medium: false, subMedium: false } });
  });

  it('correct 只有 subMedium 被 flag → 只寫 sub_medium、只清 subMedium 旗標', () => {
    expect(
      buildPatch('correct', {
        needsReview: nr(false, false, true),
        draftMedium: 'Graphic Design',
        draftSubMedium: 'Poster Design'
      })
    ).toEqual({
      sub_medium: 'Poster Design',
      needs_review: { styleGroup: false, medium: false, subMedium: false }
    });
  });

  it('correct medium+subMedium 都被 flag → 兩個都寫、兩個旗標都清', () => {
    expect(
      buildPatch('correct', {
        needsReview: nr(false, true, true),
        draftMedium: 'Outfit',
        draftSubMedium: 'Top Focus'
      })
    ).toEqual({
      medium: 'Outfit',
      sub_medium: 'Top Focus',
      needs_review: { styleGroup: false, medium: false, subMedium: false }
    });
  });

  it('correct 時 styleGroup 旗標一律保留（不謊報已審）', () => {
    const patch = buildPatch('correct', {
      needsReview: nr(true, false, true),
      draftMedium: 'Graphic Design',
      draftSubMedium: 'Poster Design'
    });
    expect((patch.needs_review as { styleGroup: boolean }).styleGroup).toBe(true);
  });

  it('subMedium 被 flag 但 draft 為空 → throw', () => {
    expect(() =>
      buildPatch('correct', { needsReview: nr(false, false, true), draftMedium: 'Outfit', draftSubMedium: '' })
    ).toThrow();
  });

  it('subMedium 不屬於目前 medium 的 taxonomy → throw', () => {
    expect(() =>
      buildPatch('correct', {
        needsReview: nr(false, false, true),
        draftMedium: 'Outfit',
        draftSubMedium: 'Poster Design'
      })
    ).toThrow();
  });

  it('medium 被 flag 但 draft 為空 → throw', () => {
    expect(() =>
      buildPatch('correct', { needsReview: nr(false, true, true), draftMedium: '', draftSubMedium: 'Top' })
    ).toThrow();
  });
});

describe('review.service submitReview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('呼叫 updateImage 帶入組好的 patch', async () => {
    await submitReview('img-1', 'exclude', { needsReview: nr(false, false, true), draftMedium: '', draftSubMedium: '' });
    expect(updateImage).toHaveBeenCalledWith('img-1', { excluded: true });
  });
});
