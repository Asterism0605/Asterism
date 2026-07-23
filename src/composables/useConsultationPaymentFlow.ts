import { computed, onBeforeUnmount, onMounted, ref, toValue } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  createConsultationCheckoutSession,
  getConsultationBookingDetail
} from '@/api/consultation.api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  ConsultationBookingDetail,
  ConsultationCheckoutRequest,
  ConsultationSummary
} from '@/types/consultation';

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
  | 'processing-timeout'
  | 'unauthenticated'
  | 'missing-booking-id';

interface UseConsultationPaymentFlowReturn {
  checkoutErrorMessage: Ref<string>;
  isCheckoutSubmitting: ComputedRef<boolean>;
  paymentReturnStatus: Ref<PaymentReturnStatus>;
  // 付款確認回來時後端實際指派到的顧問(真實資料，不是表單即時預覽那份)。
  confirmedConsultant: Ref<ConsultationSummary | null>;
  handleSubmit: (payload: ConsultationBookingPayload) => Promise<void>;
  handleReset: () => void;
  restartBooking: () => Promise<void>;
}

const CHECKOUT_BOOKING_ID_KEY = 'asterism.consultation.checkoutBookingId';
const PAYMENT_POLLING_INTERVAL_MS = 2000;
const PAYMENT_POLLING_MAX_ATTEMPTS = 6;

const checkoutErrorMessageKeyMap: Record<string, string> = {
  SLOT_UNAVAILABLE: 'consult.checkoutErrorSlotUnavailable',
  PROFILE_EMAIL_REQUIRED: 'consult.checkoutErrorProfileEmailRequired',
  PROFILE_NOT_FOUND: 'consult.checkoutErrorProfileNotFound',
  SOURCE_IMAGE_NOT_FOUND: 'consult.checkoutErrorSourceImageNotFound',
  IDEMPOTENCY_KEY_REUSED: 'consult.checkoutErrorIdempotencyKeyReused',
  CHECKOUT_ALREADY_COMPLETED: 'consult.checkoutErrorAlreadyCompleted',
  CHECKOUT_EXPIRED: 'consult.checkoutErrorExpired',
  CHECKOUT_PROVIDER_ERROR: 'consult.checkoutErrorProvider',
  CHECKOUT_CONFIGURATION_ERROR: 'consult.checkoutErrorConfiguration',
  INTERNAL_SERVER_ERROR: 'consult.checkoutErrorGeneric'
};

export function useConsultationPaymentFlow(
  sourceImageId: MaybeRefOrGetter<string>
): UseConsultationPaymentFlowReturn {
  const authStore = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const checkoutStatus = ref<CheckoutStatus>('idle');
  const checkoutErrorMessage = ref('');
  const paymentReturnStatus = ref<PaymentReturnStatus>('idle');
  const confirmedConsultant = ref<ConsultationSummary | null>(null);
  const paymentPollingAttempts = ref(0);
  let paymentPollingTimer: ReturnType<typeof window.setTimeout> | null = null;

  const accessToken = computed(() => authStore.session?.accessToken ?? '');
  const isCheckoutSubmitting = computed(() => checkoutStatus.value === 'loading');

  function toCheckoutRequest(payload: ConsultationBookingPayload): ConsultationCheckoutRequest {
    return {
      method: payload.method,
      consultationDate: payload.date,
      timeSlot: payload.timeSlot,
      designField: payload.designField || undefined,
      designFocus: payload.designFocus || undefined,
      sourceImageId: toValue(sourceImageId) || undefined,
      notes: payload.notes || undefined,
      paymentConsentAccepted: payload.paymentConfirmed
    };
  }

  function clearCheckoutSessionState(): void {
    sessionStorage.removeItem(CHECKOUT_BOOKING_ID_KEY);
  }

  function checkoutErrorMessageForCode(code?: string): string {
    const key = code ? checkoutErrorMessageKeyMap[code] : undefined;

    return t(key || 'consult.checkoutErrorGeneric');
  }

  function checkoutErrorFor(error: unknown): string {
    const normalizedCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (typeof normalizedCode === 'string') {
      return checkoutErrorMessageForCode(normalizedCode);
    }

    const code =
      typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { error?: { code?: unknown } } } }).response?.data?.error
            ?.code
        : undefined;
    if (typeof code === 'string') {
      return checkoutErrorMessageForCode(code);
    }

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
        return checkoutErrorMessageForCode();
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
        crypto.randomUUID()
      );

      if (!response.success) {
        checkoutStatus.value = 'error';
        checkoutErrorMessage.value = checkoutErrorMessageForCode(response.error.code);
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

  function resolvePaymentReturnStatus(detail: ConsultationBookingDetail): PaymentReturnStatus {
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
    return [
      'paid',
      'failed',
      'canceled',
      'error',
      'processing-timeout',
      'unauthenticated',
      'missing-booking-id'
    ].includes(status);
  }

  function clearPaymentPolling(): void {
    if (paymentPollingTimer !== null) {
      window.clearTimeout(paymentPollingTimer);
      paymentPollingTimer = null;
    }
  }

  async function fetchBookingPaymentStatus(bookingId: string): Promise<PaymentReturnStatus> {
    if (!accessToken.value) {
      paymentReturnStatus.value = 'unauthenticated';
      await router.push({
        path: '/login',
        query: { next: route.fullPath }
      });
      return 'unauthenticated';
    }

    try {
      const response = await getConsultationBookingDetail(bookingId, accessToken.value);
      if (!response.success) {
        paymentReturnStatus.value = 'error';
        return 'error';
      }

      const status = resolvePaymentReturnStatus(response.data);
      paymentReturnStatus.value = status;
      confirmedConsultant.value = response.data.consultant ?? null;

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
        paymentReturnStatus.value = 'processing-timeout';
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

    const queryBookingId = typeof route.query.bookingId === 'string' ? route.query.bookingId : '';
    const bookingId = queryBookingId || sessionStorage.getItem(CHECKOUT_BOOKING_ID_KEY) || '';

    if (!bookingId) {
      paymentReturnStatus.value = 'missing-booking-id';
      return;
    }

    if (!queryBookingId) {
      const returnUrl = router.resolve({
        path: route.path,
        query: { ...route.query, bookingId },
        hash: route.hash
      }).fullPath;
      window.history.replaceState(window.history.state, '', returnUrl);
    }

    paymentReturnStatus.value = paymentQuery === 'success' ? 'confirming' : 'canceled';
    const status = await fetchBookingPaymentStatus(bookingId);

    if (status === 'processing') {
      schedulePaymentPolling(bookingId);
    }
  }

  async function restartBooking(): Promise<void> {
    clearPaymentPolling();
    clearCheckoutSessionState();
    paymentPollingAttempts.value = 0;
    paymentReturnStatus.value = 'idle';
    confirmedConsultant.value = null;
    await router.replace({ path: '/consultant' });
  }

  onMounted(handlePaymentReturn);
  onBeforeUnmount(clearPaymentPolling);

  return {
    checkoutErrorMessage,
    isCheckoutSubmitting,
    paymentReturnStatus,
    confirmedConsultant,
    handleSubmit,
    handleReset,
    restartBooking
  };
}
