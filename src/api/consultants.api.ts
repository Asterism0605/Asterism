import { getSupabase } from '@/api/supabaseClient';

export type ConsultantSpecialty = 'spatial' | 'visual_styling' | 'concept_design';

export interface ConsultantRow {
  id: string;
  displayName: string;
  specialty: ConsultantSpecialty | null;
}

interface ConsultantTableRow {
  id: string;
  display_name: string;
  specialty: ConsultantSpecialty | null;
}

// RLS "consultants_public_read_active" 開放 anon/authenticated 讀 is_active 的顧問，
// 用來讓預約表單即時預覽會配對到誰（實際指派仍由後端 checkout 當下決定，見
// consultant-match.service.ts 的註解）。
// created_at 升冪排序：對齊後端指派時的 createdAt ASC 取第一位，讓同一 specialty 有多位
// active 顧問時，前端預覽與付款後實際指派選到同一人，不會出現預覽/指派不一致。
export async function fetchActiveConsultants(): Promise<ConsultantRow[]> {
  const { data, error } = await getSupabase()
    .from('consultants')
    .select('id,display_name,specialty')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as ConsultantTableRow[]).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    specialty: row.specialty
  }));
}
