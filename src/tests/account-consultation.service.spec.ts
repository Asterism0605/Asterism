import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMyConsultationBookings } = vi.hoisted(() => ({
  getMyConsultationBookings: vi.fn()
}));

vi.mock('@/api/consultation.api', () => ({ getMyConsultationBookings }));

import { getUpcomingAccountConsultations } from '@/services/account-consultation.service';

describe('account-consultation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads all cursor pages, maps bookings, and sorts by date then AM before PM', async () => {
    getMyConsultationBookings.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'pm-booking',
            status: 'confirmed',
            consultationDate: '2026-08-10',
            timeSlot: 'pm',
            method: 'in_person',
            designField: 'interior',
            createdAt: '2026-07-01T00:00:00.000Z'
          }
        ],
        nextCursor: 'cursor-2'
      },
      error: null
    });
    getMyConsultationBookings.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'later-booking',
            status: 'confirmed',
            consultationDate: '2026-08-11',
            timeSlot: 'am',
            method: 'online',
            createdAt: '2026-07-01T00:00:00.000Z'
          },
          {
            id: 'am-booking',
            status: 'confirmed',
            consultationDate: '2026-08-10',
            timeSlot: 'am',
            method: 'online',
            designField: 'Graphic Design',
            designFocus: 'Visual Concept',
            notes: 'Notes',
            createdAt: '2026-07-01T00:00:00.000Z'
          }
        ]
      },
      error: null
    });

    await expect(getUpcomingAccountConsultations('access-token')).resolves.toEqual([
      {
        id: 'am-booking',
        status: 'confirmed',
        consultationDate: '2026-08-10',
        timeSlot: 'am',
        method: 'Online',
        designField: 'Graphic Design',
        designFocus: 'Visual Concept',
        notes: 'Notes'
      },
      {
        id: 'pm-booking',
        status: 'confirmed',
        consultationDate: '2026-08-10',
        timeSlot: 'pm',
        method: 'In-Person',
        designField: 'interior',
        designFocus: undefined
      },
      {
        id: 'later-booking',
        status: 'confirmed',
        consultationDate: '2026-08-11',
        timeSlot: 'am',
        method: 'Online',
        designField: undefined,
        designFocus: undefined
      }
    ]);
    expect(getMyConsultationBookings).toHaveBeenNthCalledWith(1, 'access-token', undefined);
    expect(getMyConsultationBookings).toHaveBeenNthCalledWith(2, 'access-token', 'cursor-2');
  });

  it('throws the API error when upcoming consultations cannot be loaded', async () => {
    getMyConsultationBookings.mockResolvedValueOnce({
      success: false,
      data: null,
      error: { code: 'UNAVAILABLE', message: 'Service unavailable' }
    });

    await expect(getUpcomingAccountConsultations('access-token')).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'Service unavailable'
    });
  });

  it('preserves a non-confirmed booking status returned by the API', async () => {
    getMyConsultationBookings.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'pending-booking',
            status: 'pending_payment',
            consultationDate: '2026-08-10',
            timeSlot: 'am',
            method: 'online',
            createdAt: '2026-07-01T00:00:00.000Z'
          }
        ]
      },
      error: null
    });

    await expect(getUpcomingAccountConsultations('access-token')).resolves.toMatchObject([
      { id: 'pending-booking', status: 'pending_payment' }
    ]);
  });
});
