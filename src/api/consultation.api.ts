import { httpClient } from '@/api/httpClient';
import type {
  ConsultationApiResponse,
  ConsultationBookingDetail,
  ConsultationCheckoutRequest,
  ConsultationCheckoutResult,
  ConsultationMonthAvailabilityResult,
  MyConsultationListResult
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

export async function getConsultationAvailability(
  month: string,
  accessToken: string
): Promise<ConsultationApiResponse<ConsultationMonthAvailabilityResult>> {
  const response = await httpClient.get<
    ConsultationApiResponse<ConsultationMonthAvailabilityResult>
  >('/api/v1/consultations/availability', {
    params: { month },
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return response.data;
}

export async function getMyConsultationBookings(
  accessToken: string
): Promise<ConsultationApiResponse<MyConsultationListResult>> {
  const response = await httpClient.get<ConsultationApiResponse<MyConsultationListResult>>(
    '/api/v1/consultations/me',
    {
      params: { scope: 'upcoming' },
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  return response.data;
}
