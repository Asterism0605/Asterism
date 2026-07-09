import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.fn();
const selectEq = vi.fn();
const select = vi.fn(() => ({ eq: selectEq }));
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select, update }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from }) }));

import { fetchReviewQueue, updateImage } from '@/api/review.api';

const reviewed = {
  id: 'a',
  url: 'u',
  style_group: 'doa',
  medium: 'Outfit',
  sub_medium: 'Top Focus',
  confidence: { styleGroup: 1, medium: 1, subMedium: 1 },
  needs_review: { styleGroup: false, medium: false, subMedium: false }
};
const pending = {
  ...reviewed,
  id: 'b',
  needs_review: { styleGroup: false, medium: true, subMedium: false }
};
// 只有 styleGroup 需審（medium/subMedium 都已審）→ 本工具不該撈進 queue
const styleGroupOnly = {
  ...reviewed,
  id: 'c',
  needs_review: { styleGroup: true, medium: false, subMedium: false }
};

describe('review.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchReviewQueue 只回 medium/subMedium 需審且 excluded=false（styleGroup-only 排除），映射 camelCase + 靜態 taxonomy', async () => {
    selectEq.mockResolvedValue({ data: [reviewed, pending, styleGroupOnly], error: null });

    const res = await fetchReviewQueue();

    expect(from).toHaveBeenCalledWith('images');
    expect(selectEq).toHaveBeenCalledWith('excluded', false);
    expect(res.items.map((i) => i.id)).toEqual(['b']);
    expect(res.items[0].styleGroup).toBe('doa');
    expect(res.taxonomy.mediums).toContain('Outfit');
    expect(res.taxonomy.subMediumsByMedium['Graphic Design']).toContain('Poster Design');
  });

  it('updateImage 把傳入的 patch 直接送出', async () => {
    eq.mockResolvedValue({ error: null });
    await updateImage('b', { excluded: true });
    expect(update).toHaveBeenCalledWith({ excluded: true });
    expect(eq).toHaveBeenCalledWith('id', 'b');
  });

  it('updateImage 出錯 → throw', async () => {
    eq.mockResolvedValue({ error: { message: 'rls' } });
    await expect(updateImage('b', { excluded: true })).rejects.toBeTruthy();
  });
});
