import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getConsultationAvailability } = vi.hoisted(() => ({
  getConsultationAvailability: vi.fn()
}));

vi.mock('@/api/consultation.api', () => ({
  getConsultationAvailability
}));

import {
  formatConsultationDate,
  getConsultationAvailabilityByDate,
  getFutureConsultationDatesInMonth,
  getUnavailableConsultationTimeSlots
} from '@/services/consultation-availability.service';

describe('consultation-availability.service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T00:00:00.000+08:00'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats dates and returns future dates in the requested month', () => {
    expect(formatConsultationDate(new Date(2026, 6, 10))).toBe('2026-07-10');
    expect(getFutureConsultationDatesInMonth('2026-07')).toEqual([
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31'
    ]);
    expect(getFutureConsultationDatesInMonth('bad-month')).toEqual([]);
  });

  it('collects successful availability responses by date and ignores failed hints', async () => {
    getConsultationAvailability
      .mockResolvedValueOnce({
        success: true,
        data: {
          date: '2026-07-10',
          slots: [
            { timeSlot: 'am', available: true },
            { timeSlot: 'pm', available: false }
          ]
        },
        error: null
      })
      .mockRejectedValueOnce(new Error('availability down'));

    await expect(
      getConsultationAvailabilityByDate(['2026-07-10', '2026-07-11'], 'access-token')
    ).resolves.toEqual({
      '2026-07-10': {
        date: '2026-07-10',
        slots: [
          { timeSlot: 'am', available: true },
          { timeSlot: 'pm', available: false }
        ]
      }
    });
    expect(getConsultationAvailability).toHaveBeenCalledWith('2026-07-10', 'access-token');
    expect(getConsultationAvailability).toHaveBeenCalledWith('2026-07-11', 'access-token');
  });

  it('returns unavailable time slots from a daily availability response', () => {
    expect(
      getUnavailableConsultationTimeSlots({
        date: '2026-07-10',
        slots: [
          { timeSlot: 'am', available: true },
          { timeSlot: 'pm', available: false }
        ]
      })
    ).toEqual(new Set(['pm']));
    expect(getUnavailableConsultationTimeSlots()).toEqual(new Set());
  });
});
