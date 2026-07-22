import {
  getAssignedBookings,
  setConsultationLocation
} from '@/api/consultant-bookings.api';
import type { ConsultantBookingItem } from '@/types/account-consultation';

// 顧問預約的 service 層：page 只跟這裡打交道，不直接 import src/api（分層規則）。
// 錯誤原樣往上拋，由呼叫端（ConsultantBookings）管理 loading / error 狀態。

export function loadAssignedBookings(consultantId: string): Promise<ConsultantBookingItem[]> {
  return getAssignedBookings(consultantId);
}

export function saveConsultationLocation(bookingId: string, location: string): Promise<void> {
  return setConsultationLocation(bookingId, location);
}
