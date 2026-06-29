import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

const single = vi.fn();
const selectEq = vi.fn(() => ({ single }));
const updateEq = vi.fn();
const select = vi.fn(() => ({ eq: selectEq }));
const update = vi.fn(() => ({ eq: updateEq }));
const from = vi.fn(() => ({ select, update }));

vi.mock('@/api/supabaseClient', () => ({
  getSupabase: () => ({ from })
}));

import { fetchStyleDnaProfile, saveStyleDnaResult } from '@/services/style-dna.service';

const serverResult: ComputedStyleDnaResult = {
  isFallback: false,
  primaryStyle: 'Art Deco',
  heroImage: '/images/art-deco.png',
  styles: [
    { label: 'Art Deco', percentage: 70 },
    { label: 'Baroque', percentage: 30 }
  ],
  annotations: [
    { label: 'Art Deco', value: '70%', position: 'top-right' },
    { label: 'Baroque', value: '30%', position: 'left' }
  ]
};

describe('style-dna service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches only the Style DNA profile fields and returns a valid result snapshot', async () => {
    single.mockResolvedValue({
      data: { style_dna_result: serverResult },
      error: null
    });

    const profile = await fetchStyleDnaProfile('user-1');

    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('style_dna_result');
    expect(selectEq).toHaveBeenCalledWith('id', 'user-1');
    expect(profile).toEqual({
      result: serverResult
    });
  });

  it('treats malformed server result JSON as empty instead of returning an unsafe shape', async () => {
    single.mockResolvedValue({
      data: { style_dna_result: { primaryStyle: 'missing fields' } },
      error: null
    });

    const profile = await fetchStyleDnaProfile('user-1');

    expect(profile).toEqual({
      result: null
    });
  });

  it('updates only Style DNA result and onboarding_status when saving', async () => {
    updateEq.mockResolvedValue({ error: null });

    await saveStyleDnaResult('user-1', serverResult);

    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({
      style_dna_result: serverResult,
      onboarding_status: 'completed'
    });
    expect(updateEq).toHaveBeenCalledWith('id', 'user-1');
  });
});
