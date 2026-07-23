import { getMyConsultationBookings } from '@/api/consultation.api';
import type { AccountConsultation } from '@/types/account-consultation';
import type { MyConsultationBooking } from '@/types/consultation';

function toAccountConsultation(booking: MyConsultationBooking): AccountConsultation {
  return {
    id: booking.id,
    status: booking.status,
    consultationDate: booking.consultationDate,
    timeSlot: booking.timeSlot,
    method: booking.method === 'online' ? 'Online' : 'In-Person',
    designField: booking.designField,
    designFocus: booking.designFocus,
    notes: booking.notes,
    location: booking.location
  };
}

export async function getUpcomingAccountConsultations(
  accessToken: string
): Promise<AccountConsultation[]> {
  const consultations: AccountConsultation[] = [];
  let cursor: string | undefined;

  do {
    const response = await getMyConsultationBookings(accessToken, cursor);

    if (!response.success) {
      throw response.error;
    }

    consultations.push(...response.data.items.map(toAccountConsultation));
    cursor = response.data.nextCursor;
  } while (cursor);

  return consultations.sort((a, b) => {
    const dateDiff = a.consultationDate.localeCompare(b.consultationDate);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return a.timeSlot.localeCompare(b.timeSlot);
  });
}
