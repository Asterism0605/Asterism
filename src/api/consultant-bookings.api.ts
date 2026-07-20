import { getSupabase } from '@/api/supabaseClient';
import type { ConsultantBookingItem } from '@/types/account-consultation';
import type { ConsultationBookingStatus, ConsultationTimeSlot } from '@/types/consultation';

interface BookingRow {
  id: string;
  status: ConsultationBookingStatus;
  method: 'online' | 'in_person';
  consultation_date: string;
  time_slot: ConsultationTimeSlot;
  design_field: string | null;
  design_focus: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
}

// 顧問端清單：RLS(consultation_bookings_select_assigned)保證只讀得到被指派的預約，
// 但客人 policy 與其為 OR，必須帶 consultant_id 過濾，否則顧問自己身為客人的預約會混入。
export async function getAssignedBookings(consultantId: string): Promise<ConsultantBookingItem[]> {
  const { data, error } = await getSupabase()
    .from('consultation_bookings')
    .select(
      'id, status, method, consultation_date, time_slot, design_field, design_focus, notes, contact_name, contact_email, contact_phone'
    )
    .eq('consultant_id', consultantId)
    .order('consultation_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BookingRow[]).map((row) => ({
    id: row.id,
    status: row.status,
    consultationDate: row.consultation_date,
    timeSlot: row.time_slot,
    method: row.method === 'online' ? 'Online' : 'In-Person',
    designField: row.design_field ?? undefined,
    designFocus: row.design_focus ?? undefined,
    notes: row.notes ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? undefined
  }));
}
