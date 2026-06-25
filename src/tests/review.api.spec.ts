import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.fn();
const selectEq = vi.fn();
const select = vi.fn(() => ({ eq: selectEq }));
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select, update }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from }) }));

import { fetchReviewQueue, submitReview } from '@/api/review.api';

const reviewed = {
  id: 'a',
  url: 'u',
  style_group: 'doa',
  medium: 'Outfit',
  sub_medium: 'Top',
  confidence: { styleGroup: 1, medium: 1, subMedium: 1 },
  needs_review: { styleGroup: false, medium: false, subMedium: false }
};
const pending = {
  ...reviewed,
  id: 'b',
  needs_review: { styleGroup: false, medium: true, subMedium: false }
};

describe('review.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchReviewQueue 只回 needs_review 有 true 且 excluded=false，映射 camelCase + 靜態 taxonomy', async () => {
    selectEq.mockResolvedValue({ data: [reviewed, pending], error: null });

    const res = await fetchReviewQueue();

    expect(from).toHaveBeenCalledWith('images');
    expect(selectEq).toHaveBeenCalledWith('excluded', false);
    expect(res.items.map((i) => i.id)).toEqual(['b']);
    expect(res.items[0].styleGroup).toBe('doa');
    expect(res.taxonomy.mediums).toContain('Outfit');
    expect(res.taxonomy.subMediumsByMedium['Graphic Design']).toContain('Poster Design');
  });

  it('approve 寫 needs_review 全 false', async () => {
    eq.mockResolvedValue({ error: null });
    await submitReview('b', { action: 'approve' });
    expect(update).toHaveBeenCalledWith({
      needs_review: { styleGroup: false, medium: false, subMedium: false }
    });
    expect(eq).toHaveBeenCalledWith('id', 'b');
  });

  it('correct 寫 medium/sub_medium + needs_review 全 false', async () => {
    eq.mockResolvedValue({ error: null });
    await submitReview('b', { action: 'correct', medium: 'Outfit', subMedium: 'Top' });
    expect(update).toHaveBeenCalledWith({
      medium: 'Outfit',
      sub_medium: 'Top',
      needs_review: { styleGroup: false, medium: false, subMedium: false }
    });
  });

  it('exclude 寫 excluded=true', async () => {
    eq.mockResolvedValue({ error: null });
    await submitReview('b', { action: 'exclude' });
    expect(update).toHaveBeenCalledWith({ excluded: true });
  });

  it('update 出錯 → throw', async () => {
    eq.mockResolvedValue({ error: { message: 'rls' } });
    await expect(submitReview('b', { action: 'approve' })).rejects.toBeTruthy();
  });
});
