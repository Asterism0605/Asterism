import { beforeEach, describe, expect, it, vi } from 'vitest';

const rows = [
  {
    id: 'b1',
    status: 'confirmed',
    method: 'online',
    consultation_date: '2026-07-28',
    time_slot: 'am',
    design_field: 'Interior Design',
    design_focus: null,
    notes: null,
    contact_name: '王小明',
    contact_email: 'ming@example.com',
    contact_phone: '0912345678',
    location: 'https://meet.example.com/b1'
  },
  {
    id: 'b2',
    status: 'completed',
    method: 'in_person',
    consultation_date: '2026-07-20',
    time_slot: 'pm',
    design_field: null,
    design_focus: 'Spatial Mood',
    notes: 'note',
    contact_name: null,
    contact_email: 'guest@example.com',
    contact_phone: null,
    location: null
  }
];

const order2 = vi.fn().mockResolvedValue({ data: rows, error: null });
const order1 = vi.fn(() => ({ order: order2 }));
const eq = vi.fn(() => ({ order: order1 }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const rpc = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from, rpc }) }));

import { getAssignedBookings, setConsultationLocation } from '@/api/consultant-bookings.api';

describe('consultant-bookings.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    order2.mockResolvedValue({ data: rows, error: null });
  });

  it('以 consultant_id 過濾並映射 snake_case → camelCase', async () => {
    const result = await getAssignedBookings('consultant-1');

    expect(from).toHaveBeenCalledWith('consultation_bookings');
    expect(eq).toHaveBeenCalledWith('consultant_id', 'consultant-1');
    expect(result[0]).toEqual({
      id: 'b1',
      status: 'confirmed',
      consultationDate: '2026-07-28',
      timeSlot: 'am',
      method: 'Online',
      designField: 'Interior Design',
      designFocus: undefined,
      notes: undefined,
      contactName: '王小明',
      contactEmail: 'ming@example.com',
      contactPhone: '0912345678',
      location: 'https://meet.example.com/b1'
    });
    expect(result[1].method).toBe('In-Person');
    expect(result[1].contactName).toBeUndefined();
  });

  it('依日期與時段升冪排序(交給 supabase order)', async () => {
    await getAssignedBookings('consultant-1');

    expect(order1).toHaveBeenCalledWith('consultation_date', { ascending: true });
    expect(order2).toHaveBeenCalledWith('time_slot', { ascending: true });
  });

  it('查詢錯誤時 throw', async () => {
    order2.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(getAssignedBookings('consultant-1')).rejects.toEqual({ message: 'boom' });
  });
});

describe('setConsultationLocation', () => {
  beforeEach(() => {
    rpc.mockResolvedValue({ error: null });
  });

  it('以正確參數呼叫 RPC', async () => {
    await setConsultationLocation('b1', 'https://meet.example.com/new');
    expect(rpc).toHaveBeenCalledWith('set_consultation_location', {
      p_booking_id: 'b1',
      p_location: 'https://meet.example.com/new'
    });
  });

  it('RPC 回 error 時 throw', async () => {
    rpc.mockResolvedValue({ error: { message: 'denied' } });
    await expect(setConsultationLocation('b1', 'x')).rejects.toBeTruthy();
  });
});
