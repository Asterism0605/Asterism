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

  it('maps and sorts upcoming consultations by date, then AM before PM', async () => {
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
            createdAt: '2026-07-01T00:00:00.000Z'
          },
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
        designField: '—',
        designFocus: '—'
      },
      {
        id: 'later-booking',
        status: 'confirmed',
        consultationDate: '2026-08-11',
        timeSlot: 'am',
        method: 'Online',
        designField: '—',
        designFocus: '—'
      }
    ]);
    expect(getMyConsultationBookings).toHaveBeenCalledWith('access-token');
  });

  it('throws the API error when upcoming consultations cannot be loaded', async () => {
    getMyConsultationBookings.mockResolvedValueOnce({
      success: false,
      data: null,
      error: { code: 'UNAVAILABLE', message: 'Service unavailable' }
    });

    await expect(getUpcomingAccountConsultations('access-token')).rejects.toThrow(
      'Service unavailable'
    );
  });
});
