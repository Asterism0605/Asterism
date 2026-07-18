import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from }) }));

import { fetchClassificationAnchors } from '@/api/classificationAnchors.api';

describe('classificationAnchors.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('依 dimension 查詢並把 embedding 字串轉成 number[]', async () => {
    eq.mockResolvedValue({
      data: [
        { label: 'Retro & Nostalgia', embedding: '[0.1,0.2,0.3]' },
        { label: 'Y2K & Internet Aesthetics', embedding: '[0.4,0.5,0.6]' }
      ],
      error: null
    });

    const anchors = await fetchClassificationAnchors('styleGroup');

    expect(from).toHaveBeenCalledWith('classification_anchors');
    expect(select).toHaveBeenCalledWith('label,embedding');
    expect(eq).toHaveBeenCalledWith('dimension', 'styleGroup');
    expect(anchors).toEqual([
      { label: 'Retro & Nostalgia', embedding: [0.1, 0.2, 0.3] },
      { label: 'Y2K & Internet Aesthetics', embedding: [0.4, 0.5, 0.6] }
    ]);
  });

  it('查詢出錯 → throw', async () => {
    eq.mockResolvedValue({ data: null, error: { message: 'rls' } });
    await expect(fetchClassificationAnchors('styleGroup')).rejects.toBeTruthy();
  });
});
