import { computed, onBeforeUnmount, onMounted, ref, toValue } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  createConsultationCheckoutSession,
  getConsultationBookingDetail
} from '@/api/consultation.api';
import { useAuthStore } from '@/stores/auth.store';
import type { ConsultationBookingDetail, ConsultationCheckoutRequest } from '@/types/consultation';

export interface ConsultationBookingPayload {
  method: 'online' | 'in_person';
  date: string;
  timeSlot: 'am' | 'pm';
  designField: string;
  designFocus: string;
  name: string;
  email: string;
  contactPhone: string;
  notes: string;
  paymentConfirmed: boolean;
}

type CheckoutStatus = 'idle' | 'loading' | 'error';
export type PaymentReturnStatus =
  | 'idle'
  | 'confirming'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'error'
  | 'missing-booking-id';

interface UseConsultationPaymentFlowReturn {
  checkoutErrorMessage: Ref<string>;
  isCheckoutSubmitting: ComputedRef<boolean>;
  paymentReturnStatus: Ref<PaymentReturnStatus>;
  handleSubmit: (payload: ConsultationBookingPayload) => Promise<void>;
  handleReset: () => void;
  restartBooking: () => Promise<void>;
}

const CHECKOUT_BOOKING_ID_KEY = 'asterism.consultation.checkoutBookingId';
const CHECKOUT_IDEMPOTENCY_KEY = 'asterism.consultation.checkoutIdempotencyKey';
const PAYMENT_POLLING_INTERVAL_MS = 2000;
const PAYMENT_POLLING_MAX_ATTEMPTS = 6;

export function useConsultationPaymentFlow(
  sourceImageId: MaybeRefOrGetter<string>
): UseConsultationPaymentFlowReturn {
  const authStore = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const checkoutStatus = ref<CheckoutStatus>('idle');
  const checkoutErrorMessage = ref('');
  const currentIdempotencyKey = ref<string | null>(null);
  const paymentReturnStatus = ref<PaymentReturnStatus>('idle');
  const paymentPollingAttempts = ref(0);
  let paymentPollingTimer: ReturnType<typeof window.setTimeout> | null = null;

  const accessToken = computed(() => authStore.session?.accessToken ?? '');
  const isCheckoutSubmitting = computed(() => checkoutStatus.value === 'loading');

  function toCheckoutRequest(
    payload: ConsultationBookingPayload
  ): ConsultationCheckoutRequest {
    return {
      method: payload.method,
      consultationDate: payload.date,
      timeSlot: payload.timeSlot,
      designField: payload.designField || undefined,
      designFocus: payload.designFocus || undefined,
      sourceImageId: toValue(sourceImageId) || undefined,
      notes: payload.notes || undefined,
      paymentConsentAccepted: true
    };
  }

  function getOrCreateCheckoutIdempotencyKey(): string {
    if (currentIdempotencyKey.value) {
      return currentIdempotencyKey.value;
    }

    const storedKey = sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY);
    if (storedKey) {
      currentIdempotencyKey.value = storedKey;
      return storedKey;
    }

    const newKey = crypto.randomUUID();
    currentIdempotencyKey.value = newKey;
    sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY, newKey);
    return newKey;
  }

  function clearCheckoutSessionState(): void {
    currentIdempotencyKey.value = null;
    sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
    sessionStorage.removeItem(CHECKOUT_BOOKING_ID_KEY);
  }

  function checkoutErrorFor(error: unknown): string {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: unknown }).status
        : undefined;

    switch (status) {
      case 400:
        return t('consult.checkoutError400');
      case 401:
        return t('consult.checkoutError401');
      case 409:
        return t('consult.checkoutError409');
      case 429:
        return t('consult.checkoutError429');
      default:
        return t('consult.checkoutErrorGeneric');
    }
  }

  async function handleSubmit(payload: ConsultationBookingPayload): Promise<void> {
    if (isCheckoutSubmitting.value || !payload.paymentConfirmed) {
      return;
    }

    checkoutErrorMessage.value = '';

    if (!authStore.isAuthenticated || !accessToken.value) {
      await router.push({
        path: '/login',
        query: { next: route.fullPath }
      });
      return;
    }

    checkoutStatus.value = 'loading';

    try {
      const response = await createConsultationCheckoutSession(
        toCheckoutRequest(payload),
        accessToken.value,
        getOrCreateCheckoutIdempotencyKey()
      );

      if (!response.success) {
        checkoutStatus.value = 'error';
        checkoutErrorMessage.value = response.error.message;
        return;
      }

      sessionStorage.setItem(CHECKOUT_BOOKING_ID_KEY, response.data.bookingId);
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      checkoutStatus.value = 'error';
      checkoutErrorMessage.value = checkoutErrorFor(error);
    }
  }

  function handleReset(): void {
    checkoutStatus.value = 'idle';
    checkoutErrorMessage.value = '';
    clearCheckoutSessionState();
  }

  function resolvePaymentReturnStatus(
    detail: ConsultationBookingDetail
  ): PaymentReturnStatus {
    if (detail.booking.status === 'confirmed' && detail.payment.status === 'paid') {
      return 'paid';
    }

    if (detail.booking.status === 'pending_payment' && detail.payment.status === 'pending') {
      return 'processing';
    }

    if (detail.booking.status === 'payment_failed' || detail.payment.status === 'failed') {
      return 'failed';
    }

    if (detail.booking.status === 'canceled' || detail.payment.status === 'canceled') {
      return 'canceled';
    }

    if (detail.payment.status === 'refunded') {
      return 'failed';
    }

    return 'error';
  }

  function isTerminalPaymentStatus(status: PaymentReturnStatus): boolean {
    return ['paid', 'failed', 'canceled', 'error', 'missing-booking-id'].includes(status);
  }

  function clearPaymentPolling(): void {
    if (paymentPollingTimer !== null) {
      window.clearTimeout(paymentPollingTimer);
      paymentPollingTimer = null;
    }
  }

  async function fetchBookingPaymentStatus(bookingId: string): Promise<PaymentReturnStatus> {
    if (!accessToken.value) {
      paymentReturnStatus.value = 'error';
      return 'error';
    }

    try {
      const response = await getConsultationBookingDetail(bookingId, accessToken.value);
      if (!response.success) {
        paymentReturnStatus.value = 'error';
        return 'error';
      }

      const status = resolvePaymentReturnStatus(response.data);
      paymentReturnStatus.value = status;

      if (isTerminalPaymentStatus(status)) {
        clearPaymentPolling();
        clearCheckoutSessionState();
      }

      return status;
    } catch {
      paymentReturnStatus.value = 'error';
      clearPaymentPolling();
      return 'error';
    }
  }

  function schedulePaymentPolling(bookingId: string): void {
    clearPaymentPolling();
    paymentPollingAttempts.value = 0;

    const poll = async () => {
      paymentPollingAttempts.value += 1;
      const status = await fetchBookingPaymentStatus(bookingId);

      if (isTerminalPaymentStatus(status)) {
        return;
      }

      if (paymentPollingAttempts.value >= PAYMENT_POLLING_MAX_ATTEMPTS) {
        clearPaymentPolling();
        return;
      }

      paymentPollingTimer = window.setTimeout(poll, PAYMENT_POLLING_INTERVAL_MS);
    };

    paymentPollingTimer = window.setTimeout(poll, PAYMENT_POLLING_INTERVAL_MS);
  }

  async function handlePaymentReturn(): Promise<void> {
    const paymentQuery = route.query.payment;
    if (paymentQuery !== 'success' && paymentQuery !== 'cancel') {
      return;
    }

    const queryBookingId =
      typeof route.query.bookingId === 'string' ? route.query.bookingId : '';
    const bookingId =
      queryBookingId || sessionStorage.getItem(CHECKOUT_BOOKING_ID_KEY) || '';

    if (!bookingId) {
      paymentReturnStatus.value = 'missing-booking-id';
      return;
    }

    paymentReturnStatus.value = paymentQuery === 'success' ? 'confirming' : 'canceled';
    const status = await fetchBookingPaymentStatus(bookingId);

    if (paymentQuery === 'success' && status === 'processing') {
      schedulePaymentPolling(bookingId);
    }
  }

  async function restartBooking(): Promise<void> {
    clearPaymentPolling();
    clearCheckoutSessionState();
    paymentPollingAttempts.value = 0;
    paymentReturnStatus.value = 'idle';
    await router.replace({ path: '/consultant' });
  }

  onMounted(handlePaymentReturn);
  onBeforeUnmount(clearPaymentPolling);

  return {
    checkoutErrorMessage,
    isCheckoutSubmitting,
    paymentReturnStatus,
    handleSubmit,
    handleReset,
    restartBooking
  };
}
