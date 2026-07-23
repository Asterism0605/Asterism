import { beforeEach, describe, expect, it, vi } from 'vitest';

const rows = [
  { id: 'c1', display_name: 'Spatial · Mira', specialty: 'spatial' },
  { id: 'c2', display_name: 'Styling · Neo', specialty: 'visual_styling' }
];

const order = vi.fn().mockResolvedValue({ data: rows, error: null });
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from }) }));

import { fetchActiveConsultants } from '@/api/consultants.api';

describe('consultants.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    order.mockResolvedValue({ data: rows, error: null });
  });

  it('只讀 is_active,並以 created_at 升冪排序對齊後端指派規則', async () => {
    const result = await fetchActiveConsultants();

    expect(from).toHaveBeenCalledWith('consultants');
    expect(eq).toHaveBeenCalledWith('is_active', true);
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(result[0]).toEqual({ id: 'c1', displayName: 'Spatial · Mira', specialty: 'spatial' });
  });

  it('查詢錯誤時 throw', async () => {
    order.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(fetchActiveConsultants()).rejects.toEqual({ message: 'boom' });
  });
});
