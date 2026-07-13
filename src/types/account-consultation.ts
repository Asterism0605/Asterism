export interface AccountConsultation {
  id: string;
  status: 'confirmed';
  consultationDate: string;
  timeSlot: 'am' | 'pm';
  method: string;
  designField: string;
  designFocus: string;
  notes?: string;
}
