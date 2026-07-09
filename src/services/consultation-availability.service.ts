import { getConsultationAvailability } from '@/api/consultation.api';
import type { ConsultationAvailabilityResult, ConsultationTimeSlot } from '@/types/consultation';

export type ConsultationAvailabilityByDate = Record<string, ConsultationAvailabilityResult>;

function getDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatConsultationDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getFutureConsultationDatesInMonth(month: string) {
  const [yearValue, monthValue] = month.split('-').map(Number);

  if (!yearValue || !monthValue) {
    return [];
  }

  const today = getDayStart(new Date());
  const date = new Date(yearValue, monthValue - 1, 1);
  const dates: string[] = [];

  while (date.getMonth() === monthValue - 1) {
    if (getDayStart(date) >= today) {
      dates.push(formatConsultationDate(date));
    }

    date.setDate(date.getDate() + 1);
  }

  return dates;
}

export async function getConsultationAvailabilityByDate(
  dates: string[],
  accessToken: string
): Promise<ConsultationAvailabilityByDate> {
  const results = await Promise.allSettled(
    dates.map((date) => getConsultationAvailability(date, accessToken))
  );
  const availabilityByDate: ConsultationAvailabilityByDate = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      availabilityByDate[result.value.data.date] = result.value.data;
    }
  });

  return availabilityByDate;
}

export function getUnavailableConsultationTimeSlots(
  availability?: ConsultationAvailabilityResult
): Set<ConsultationTimeSlot> {
  return new Set(
    availability?.slots.filter((slot) => !slot.available).map((slot) => slot.timeSlot) ?? []
  );
}
