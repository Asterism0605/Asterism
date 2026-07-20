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

/** 顧問端清單項目：在使用者端欄位外多帶客戶聯絡資訊(RLS 顧問 policy 可讀)。 */
export interface ConsultantBookingItem extends AccountConsultation {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
