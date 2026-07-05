import { httpClient } from '@/api/httpClient';
import type {
  ConsultationApiResponse,
  ConsultationBookingDetail,
  ConsultationCheckoutRequest,
  ConsultationCheckoutResult
} from '@/types/consultation';

export async function createConsultationCheckoutSession(
  payload: ConsultationCheckoutRequest,
  accessToken: string,
  idempotencyKey: string
): Promise<ConsultationApiResponse<ConsultationCheckoutResult>> {
  const {
    method,
    consultationDate,
    timeSlot,
    designField,
    designFocus,
    sourceImageId,
    notes,
    paymentConsentAccepted
  } = payload;
  const response = await httpClient.post<ConsultationApiResponse<ConsultationCheckoutResult>>(
    '/api/v1/consultations/checkout',
    {
      method,
      consultationDate,
      timeSlot,
      designField,
      designFocus,
      sourceImageId,
      notes,
      paymentConsentAccepted
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey
      }
    }
  );

  return response.data;
}

export async function getConsultationBookingDetail(
  bookingId: string,
  accessToken: string
): Promise<ConsultationApiResponse<ConsultationBookingDetail>> {
  const response = await httpClient.get<ConsultationApiResponse<ConsultationBookingDetail>>(
    `/api/v1/consultations/${bookingId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  return response.data;
}
