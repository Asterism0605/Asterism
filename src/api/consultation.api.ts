import { httpClient } from '@/api/httpClient';
import { withMockDelay } from '@/api/mockAdapter';
import type {
  ConsultationApiResponse,
  ConsultationBookingDetail,
  ConsultationBookingList,
  ConsultationCheckoutRequest,
  ConsultationCheckoutResult
} from '@/types/consultation';

const MOCK_MY_CONSULTATION_BOOKINGS: ConsultationBookingList = [
  {
    booking: {
      id: 'mock-consultation-1',
      status: 'confirmed',
      method: 'online',
      consultationDate: '2026-07-18',
      timeSlot: 'pm',
      designField: 'interior',
      designFocus: 'material',
      notes: '想討論客廳材質與光線配置。',
      contactEmail: 'member@example.com',
      createdAt: '2026-07-09T02:10:00.000Z',
      updatedAt: '2026-07-09T02:20:00.000Z'
    },
    payment: {
      status: 'paid',
      amount: 50_000,
      currency: 'TWD'
    },
    consultant: {
      id: 'mock-consultant-1',
      displayName: 'Mira Chen',
      title: 'Spatial Consultant'
    }
  },
  {
    booking: {
      id: 'mock-consultation-2',
      status: 'completed',
      method: 'in_person',
      consultationDate: '2026-07-24',
      timeSlot: 'am',
      designField: 'styling',
      designFocus: 'color',
      contactEmail: 'member@example.com',
      createdAt: '2026-07-09T03:10:00.000Z',
      updatedAt: '2026-07-09T03:10:00.000Z'
    },
    payment: {
      status: 'paid',
      amount: 50_000,
      currency: 'TWD'
    },
    consultant: {
      id: 'mock-consultant-1',
      displayName: 'Mira Chen',
      title: 'Spatial Consultant'
    }
  }
];

function shouldUseRealConsultationListApi(): boolean {
  return import.meta.env.VITE_USE_REAL_CONSULTATION_LIST === 'true';
}

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

export async function getMyConsultationBookings(
  accessToken: string
): Promise<ConsultationApiResponse<ConsultationBookingList>> {
  if (!shouldUseRealConsultationListApi()) {
    return withMockDelay({
      success: true,
      data: MOCK_MY_CONSULTATION_BOOKINGS,
      error: null
    });
  }

  const response = await httpClient.get<ConsultationApiResponse<ConsultationBookingList>>(
    '/api/v1/consultations',
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  return response.data;
}
