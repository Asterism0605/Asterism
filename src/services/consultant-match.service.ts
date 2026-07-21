import type { ConsultantRow, ConsultantSpecialty } from '@/api/consultants.api';

// 跟後端 asterism-backend/src/modules/consultation/repository.ts 的
// DESIGN_FIELD_SPECIALTY 保持一致——這裡只做前端即時預覽用，實際指派在使用者送出
// 預約、後端 checkout 當下才會決定，兩邊各自維護一份（不同 repo 沒有共用型別的管道）。
const DESIGN_FIELD_SPECIALTY: Record<string, ConsultantSpecialty> = {
  styling: 'visual_styling',
  graphic: 'concept_design',
  interior: 'spatial',
  architecture: 'spatial'
};

export function matchConsultantByDesignField(
  designField: string,
  consultants: ConsultantRow[]
): ConsultantRow | null {
  const specialty = DESIGN_FIELD_SPECIALTY[designField];

  if (!specialty) {
    return null;
  }

  return consultants.find((consultant) => consultant.specialty === specialty) ?? null;
}
