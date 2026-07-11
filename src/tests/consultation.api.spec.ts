import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post, get } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn()
}));

vi.mock('@/api/httpClient', () => ({
  httpClient: { post, get }
}));

import {
  createConsultationCheckoutSession,
  getConsultationAvailability,
  getConsultationBookingDetail,
  getMyConsultationBookings
} from '@/api/consultation.api';
import type { ConsultationCheckoutRequest } from '@/types/consultation';

describe('consultation.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates checkout with in_person method', async () => {
    const payload: ConsultationCheckoutRequest = {
      method: 'in_person',
      consultationDate: '2026-07-10',
      timeSlot: 'pm',
      paymentConsentAccepted: true
    };
    const response = {
      success: true as const,
      data: {
        bookingId: 'booking-id',
        paymentId: 'payment-id',
        checkoutUrl: 'https://checkout.stripe.com/test',
        matchedConsultant: {
          id: 'consultant-id',
          displayName: 'Asterism Consultant',
          title: 'Design Consultant'
        }
      },
      error: null
    };
    post.mockResolvedValue({ data: response });

    await expect(
      createConsultationCheckoutSession(payload, 'access-token', 'idempotency-key')
    ).resolves.toEqual(response);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/consultations/checkout',
      {
        method: 'in_person',
        consultationDate: '2026-07-10',
        timeSlot: 'pm',
        paymentConsentAccepted: true
      },
      {
        headers: {
          Authorization: 'Bearer access-token',
          'Idempotency-Key': 'idempotency-key'
        }
      }
    );
  });

  it('passes through explicit payment consent instead of assuming true', async () => {
    const payload: ConsultationCheckoutRequest = {
      method: 'online',
      consultationDate: '2026-07-10',
      timeSlot: 'am',
      paymentConsentAccepted: false
    };
    const response = {
      success: false as const,
      data: null,
      error: {
        code: 'PAYMENT_CONSENT_REQUIRED',
        message: 'Payment consent is required.'
      }
    };
    post.mockResolvedValue({ data: response });

    await expect(
      createConsultationCheckoutSession(payload, 'access-token', 'idempotency-key')
    ).resolves.toEqual(response);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/consultations/checkout',
      {
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        paymentConsentAccepted: false
      },
      {
        headers: {
          Authorization: 'Bearer access-token',
          'Idempotency-Key': 'idempotency-key'
        }
      }
    );
  });

  it('creates checkout with auth, idempotency, and only allowed body fields', async () => {
    const payload: ConsultationCheckoutRequest & {
      amount: number;
      currency: string;
      paymentStatus: string;
      consultantId: string;
      paymentConfirmed: boolean;
    } = {
      method: 'online',
      consultationDate: '2026-07-10',
      timeSlot: 'pm',
      designField: 'Styling design',
      designFocus: 'Material palette',
      sourceImageId: 'image-id',
      notes: 'Keep the room calm.',
      paymentConsentAccepted: true,
      amount: 50_000,
      currency: 'TWD',
      paymentStatus: 'paid',
      consultantId: 'consultant-id',
      paymentConfirmed: true
    };
    const response = {
      success: true as const,
      data: {
        bookingId: 'booking-id',
        paymentId: 'payment-id',
        checkoutUrl: 'https://checkout.stripe.com/test',
        matchedConsultant: {
          id: 'consultant-id',
          displayName: 'Asterism Consultant',
          title: 'Design Consultant'
        }
      },
      error: null
    };
    post.mockResolvedValue({ data: response });

    await expect(
      createConsultationCheckoutSession(payload, 'access-token', 'idempotency-key')
    ).resolves.toEqual(response);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/consultations/checkout',
      {
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'pm',
        designField: 'Styling design',
        designFocus: 'Material palette',
        sourceImageId: 'image-id',
        notes: 'Keep the room calm.',
        paymentConsentAccepted: true
      },
      {
        headers: {
          Authorization: 'Bearer access-token',
          'Idempotency-Key': 'idempotency-key'
        }
      }
    );
  });

  it('gets booking detail with auth and accepts a null consultant', async () => {
    const response = {
      success: true as const,
      data: {
        booking: {
          id: 'booking-id',
          status: 'confirmed' as const,
          method: 'online' as const,
          consultationDate: '2026-07-10',
          timeSlot: 'pm' as const,
          contactEmail: 'user@example.com',
          createdAt: '2026-07-04T00:00:00.000Z',
          updatedAt: '2026-07-04T00:00:00.000Z'
        },
        payment: {
          status: 'paid' as const,
          amount: 50_000,
          currency: 'TWD' as const
        },
        consultant: null
      },
      error: null
    };
    get.mockResolvedValue({ data: response });

    await expect(getConsultationBookingDetail('booking-id', 'access-token')).resolves.toEqual(
      response
    );
    expect(get).toHaveBeenCalledWith('/api/v1/consultations/booking-id', {
      headers: { Authorization: 'Bearer access-token' }
    });
  });

  it('returns mock booking list while the real list API is not enabled', async () => {
    const response = await getMyConsultationBookings('access-token');

    expect(response.success).toBe(true);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          booking: expect.objectContaining({
            id: 'mock-consultation-1',
            status: 'confirmed',
            method: 'online'
          }),
          consultant: expect.objectContaining({
            displayName: 'Mira Chen'
          })
        }),
        expect.objectContaining({
          booking: expect.objectContaining({
            id: 'mock-consultation-2',
            status: 'completed',
            method: 'in_person'
          }),
          consultant: expect.objectContaining({
            id: 'mock-consultant-1',
            displayName: 'Mira Chen'
          })
        })
      ])
    );
    expect(get).not.toHaveBeenCalledWith('/api/v1/consultations', expect.anything());
  });

  it('gets consultation availability for a month with auth', async () => {
    const response = {
      success: true as const,
      data: {
        month: '2026-07',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        days: [
          {
            date: '2026-07-10',
            slots: [
              { timeSlot: 'am' as const, available: true },
              { timeSlot: 'pm' as const, available: false }
            ]
          }
        ]
      },
      error: null
    };
    get.mockResolvedValue({ data: response });

    await expect(getConsultationAvailability('2026-07', 'access-token')).resolves.toEqual(response);
    expect(get).toHaveBeenCalledWith('/api/v1/consultations/availability', {
      params: { month: '2026-07' },
      headers: { Authorization: 'Bearer access-token' }
    });
  });
});
