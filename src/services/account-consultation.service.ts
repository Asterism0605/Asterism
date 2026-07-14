import { getMyConsultationBookings } from '@/api/consultation.api';
import type { AccountConsultation } from '@/types/account-consultation';
import type { MyConsultationBooking } from '@/types/consultation';

function toAccountConsultation(booking: MyConsultationBooking): AccountConsultation {
  return {
    id: booking.id,
    // `scope=upcoming` only returns confirmed bookings.
    status: 'confirmed',
    consultationDate: booking.consultationDate,
    timeSlot: booking.timeSlot,
    method: booking.method === 'online' ? 'Online' : 'In-Person',
    designField: booking.designField ?? '—',
    designFocus: booking.designFocus ?? '—',
    notes: booking.notes
  };
}

export async function getUpcomingAccountConsultations(
  accessToken: string
): Promise<AccountConsultation[]> {
  const response = await getMyConsultationBookings(accessToken);

  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data.items.map(toAccountConsultation).sort((a, b) => {
    const dateDiff = a.consultationDate.localeCompare(b.consultationDate);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return a.timeSlot.localeCompare(b.timeSlot);
  });
}
