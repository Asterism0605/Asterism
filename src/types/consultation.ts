export interface ConsultationApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ConsultationApiResponse<T> =
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: ConsultationApiError;
    };

export type ConsultationTimeSlot = 'am' | 'pm';
export type ConsultationCheckoutMethod = 'online' | 'in-person';
export type ConsultationBookingMethod = 'online' | 'in_person';

export type ConsultationBookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'payment_failed'
  | 'canceled'
  | 'completed';

export type ConsultationPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'refunded';

export interface ConsultationCheckoutRequest {
  method: ConsultationCheckoutMethod;
  consultationDate: string;
  timeSlot: ConsultationTimeSlot;
  designField?: string;
  designFocus?: string;
  sourceImageId?: string;
  notes?: string;
  paymentConsentAccepted: true;
}

export interface ConsultationSummary {
  id: string;
  displayName: string;
  title: string;
  avatarUrl?: string;
}

export interface ConsultationCheckoutResult {
  bookingId: string;
  paymentId: string;
  checkoutUrl: string;
  matchedConsultant: ConsultationSummary;
}

export interface ConsultationBooking {
  id: string;
  status: ConsultationBookingStatus;
  method: ConsultationBookingMethod;
  consultationDate: string;
  timeSlot: ConsultationTimeSlot;
  designField?: string;
  designFocus?: string;
  notes?: string;
  contactName?: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationPayment {
  status: ConsultationPaymentStatus;
  amount: number;
  currency: 'TWD';
  paidAt?: string;
}

export interface ConsultationBookingDetail {
  booking: ConsultationBooking;
  payment: ConsultationPayment;
  consultant?: ConsultationSummary | null;
}
