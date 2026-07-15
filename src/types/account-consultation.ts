import type { ConsultationBookingStatus } from '@/types/consultation';

export interface AccountConsultation {
  id: string;
  status: ConsultationBookingStatus;
  consultationDate: string;
  timeSlot: 'am' | 'pm';
  method: string;
  designField?: string;
  designFocus?: string;
  notes?: string;
}
