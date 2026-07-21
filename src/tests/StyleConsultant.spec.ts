import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import StyleConsultant from '@/pages/StyleConsultant.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { AuthSession } from '@/types/auth';
import type { ConsultationBookingDetail } from '@/types/consultation';
import type { StyleDnaAnswer } from '@/types/style-dna';

const { createCheckoutMock, getBookingMock, fetchActiveConsultantsMock } = vi.hoisted(() => ({
  createCheckoutMock: vi.fn(),
  getBookingMock: vi.fn(),
  fetchActiveConsultantsMock: vi.fn().mockResolvedValue([])
}));

vi.mock('@/api/consultation.api', () => ({
  createConsultationCheckoutSession: createCheckoutMock,
  getConsultationBookingDetail: getBookingMock
}));

vi.mock('@/api/consultants.api', () => ({
  fetchActiveConsultants: fetchActiveConsultantsMock
}));

const memberSession: AuthSession = {
  accessToken: 'token',
  expiresAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
};

const y2kAnswer: StyleDnaAnswer = {
  questionId: 'question-1',
  selectedOptionId: 'option-y2k',
  selectedImage: {
    id: 'image-y2k',
    url: '/image-y2k.webp',
    style: ['Y2K']
  },
  weights: { Y2K: 2 }
};

describe('StyleConsultant', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function createTestRouter() {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/consultant', name: 'consultant', component: StyleConsultant },
        { path: '/login', name: 'login', component: { template: '<div />' } }
      ]
    });
  }

  function mountPage(
    router: ReturnType<typeof createTestRouter>,
    pinia: ReturnType<typeof createPinia>
  ) {
    return mount(StyleConsultant, {
      global: {
        plugins: [router, pinia],
        stubs: {
          ConstellationBackground: true,
          RecommendationPanel: true
        }
      }
    });
  }

  it('reads sourceImageId from the route query', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();

    await router.push('/consultant?sourceImageId=rpl-interior-lighting-001');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBe(
      'rpl-interior-lighting-001'
    );
  });

  it('does not show mock Style DNA for unauthenticated visitors', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();

    await router.push('/consultant');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.text()).toContain('We need a Style DNA result');
    expect(wrapper.text()).toContain('Take Style DNA quiz');
    expect(wrapper.text()).not.toContain('Log In');
    expect(wrapper.text()).not.toContain('Create Account');
    expect(wrapper.text()).not.toContain('Luminous Minimalism');
    expect(wrapper.text()).not.toContain('Spatial Consultant · Mira Chen');
    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBeUndefined();
  });

  it('renders the quiz fallback for authenticated users without Style DNA result data', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();

    await router.push('/consultant?sourceImageId=not-a-real-image');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.text()).toContain('We need a Style DNA result');
    expect(wrapper.text()).toContain('Take Style DNA quiz');
    expect(wrapper.text()).not.toContain('Luminous Minimalism');
    expect(wrapper.text()).not.toContain('Matched consultant');
    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBe(
      'not-a-real-image'
    );
  });

  it('shows a pending placeholder until a design field is chosen, then matches live', async () => {
    fetchActiveConsultantsMock.mockResolvedValue([
      { id: 'consultant-1', displayName: 'Spatial Consultant · Mira Chen', specialty: 'spatial' }
    ]);
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    const styleDnaStore = useStyleDnaStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    styleDnaStore.completeQuiz([y2kAnswer], memberSession.user.id);
    const router = createTestRouter();

    await router.push('/consultant');
    await router.isReady();

    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(wrapper.text()).toContain('Style DNA');
    expect(wrapper.text()).toContain('Y2K');
    expect(wrapper.text()).toContain('100%');
    expect(wrapper.text()).toContain('Matched consultant');
    expect(wrapper.text()).not.toContain('Spatial Consultant · Mira Chen');
    expect(wrapper.find('[data-testid="consultant-style-dna-fallback"]').exists()).toBe(false);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('designFieldChange', 'interior');
    await flushPromises();

    expect(wrapper.text()).toContain('Spatial Consultant · Mira Chen');
  });

  it('redirects unauthenticated checkout attempts to login without calling the API', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/consultant?sourceImageId=image-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Guest',
      email: 'guest@example.com',
      contactPhone: '0912345678',
      notes: '',
      paymentConfirmed: true
    });
    await flushPromises();

    expect(createCheckoutMock).not.toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe(
      '/login?next=/consultant?sourceImageId=image-1'
    );
  });

  it('creates checkout with a safe body and stores the booking id', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    await router.push('/consultant?sourceImageId=image-1');
    await router.isReady();
    createCheckoutMock.mockResolvedValue({
      success: true,
      data: {
        bookingId: 'booking-1',
        paymentId: 'payment-1',
        checkoutUrl: '#stripe-checkout',
        matchedConsultant: { id: 'consultant-1', displayName: 'Mira', title: 'Consultant' }
      },
      error: null
    });
    const wrapper = mountPage(router, pinia);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Member',
      email: 'member@example.com',
      contactPhone: '0912345678',
      notes: 'Quiet room',
      paymentConfirmed: true
    });
    await flushPromises();

    expect(createCheckoutMock).toHaveBeenCalledWith(
      {
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        designField: undefined,
        designFocus: undefined,
        sourceImageId: 'image-1',
        notes: 'Quiet room',
        paymentConsentAccepted: true
      },
      'token',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    );
    expect(sessionStorage.getItem('asterism.consultation.checkoutBookingId')).toBe('booking-1');
    expect(sessionStorage.getItem('asterism.consultation.checkoutIdempotencyKey')).toBeNull();
  });

  it('uses a fresh idempotency key for each checkout submit intent', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    await router.push('/consultant');
    await router.isReady();
    createCheckoutMock
      .mockResolvedValueOnce({
        success: false,
        data: null,
        error: { code: 'SLOT_UNAVAILABLE', message: 'backend debug slot text' }
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          bookingId: 'booking-1',
          paymentId: 'payment-1',
          checkoutUrl: '#stripe-checkout',
          matchedConsultant: { id: 'consultant-1', displayName: 'Mira', title: 'Consultant' }
        },
        error: null
      });
    const wrapper = mountPage(router, pinia);
    const payload = {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Member',
      email: 'member@example.com',
      contactPhone: '0912345678',
      notes: '',
      paymentConfirmed: true
    };

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', payload);
    await flushPromises();
    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', payload);
    await flushPromises();

    expect(createCheckoutMock).toHaveBeenCalledTimes(2);
    expect(createCheckoutMock.mock.calls[0][2]).not.toBe(createCheckoutMock.mock.calls[1][2]);
    expect(sessionStorage.getItem('asterism.consultation.checkoutIdempotencyKey')).toBeNull();
  });

  it('maps checkout error codes to localized copy instead of backend messages', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    await router.push('/consultant');
    await router.isReady();
    createCheckoutMock.mockResolvedValue({
      success: false,
      data: null,
      error: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'backend debug idempotency text' }
    });
    const wrapper = mountPage(router, pinia);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Member',
      email: 'member@example.com',
      contactPhone: '0912345678',
      notes: '',
      paymentConfirmed: true
    });
    await flushPromises();

    expect(wrapper.text()).toContain('This checkout request has expired. Please try again.');
    expect(wrapper.text()).not.toContain('backend debug idempotency text');
  });

  it('maps rejected checkout error codes to localized copy instead of backend messages', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    await router.push('/consultant');
    await router.isReady();
    createCheckoutMock.mockRejectedValue({
      code: 'IDEMPOTENCY_KEY_REUSED',
      status: 409,
      message: 'backend debug idempotency text'
    });
    const wrapper = mountPage(router, pinia);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Member',
      email: 'member@example.com',
      contactPhone: '0912345678',
      notes: '',
      paymentConfirmed: true
    });
    await flushPromises();

    expect(wrapper.text()).toContain('This checkout request has expired. Please try again.');
    expect(wrapper.text()).not.toContain('backend debug idempotency text');
  });

  it('falls back to checkout status copy for rejected errors without a code', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    await router.push('/consultant');
    await router.isReady();
    createCheckoutMock.mockRejectedValue({ status: 429 });
    const wrapper = mountPage(router, pinia);

    wrapper.getComponent({ name: 'RecommendationPanel' }).vm.$emit('submit', {
      method: 'online',
      date: '2026-07-10',
      timeSlot: 'am',
      designField: '',
      designFocus: '',
      name: 'Member',
      email: 'member@example.com',
      contactPhone: '0912345678',
      notes: '',
      paymentConfirmed: true
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Too many attempts. Please try again later.');
  });

  it('uses backend state instead of a success query and polls pending payment', async () => {
    vi.useFakeTimers();
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    const pendingDetail: ConsultationBookingDetail = {
      booking: {
        id: 'booking-1',
        status: 'pending_payment',
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        contactEmail: 'member@example.com',
        createdAt: '2026-07-07T00:00:00Z',
        updatedAt: '2026-07-07T00:00:00Z'
      },
      payment: { status: 'pending', amount: 500, currency: 'TWD' }
    };
    const paidDetail: ConsultationBookingDetail = {
      ...pendingDetail,
      booking: { ...pendingDetail.booking, status: 'confirmed' },
      payment: { ...pendingDetail.payment, status: 'paid' }
    };
    getBookingMock
      .mockResolvedValueOnce({ success: true, data: pendingDetail, error: null })
      .mockResolvedValueOnce({ success: true, data: paidDetail, error: null });
    await router.push('/consultant?payment=success&bookingId=booking-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(wrapper.text()).toContain('Payment is processing');
    expect(wrapper.text()).not.toContain('Booking confirmed');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(getBookingMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Booking confirmed');
  });

  it('shows a My Bookings link and the real assigned consultant only once payment is confirmed', async () => {
    vi.useFakeTimers();
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    const styleDnaStore = useStyleDnaStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    styleDnaStore.completeQuiz([y2kAnswer], memberSession.user.id);
    const router = createTestRouter();
    router.addRoute({ path: '/account/consultations', name: 'account-consultations', component: { template: '<div />' } });
    const pendingDetail: ConsultationBookingDetail = {
      booking: {
        id: 'booking-1',
        status: 'pending_payment',
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        contactEmail: 'member@example.com',
        createdAt: '2026-07-07T00:00:00Z',
        updatedAt: '2026-07-07T00:00:00Z'
      },
      payment: { status: 'pending', amount: 500, currency: 'TWD' }
    };
    const paidDetail: ConsultationBookingDetail = {
      ...pendingDetail,
      booking: { ...pendingDetail.booking, status: 'confirmed' },
      payment: { ...pendingDetail.payment, status: 'paid' },
      consultant: { id: 'consultant-9', displayName: 'Spatial Consultant · Real Match', title: 'Consultant' }
    };
    getBookingMock
      .mockResolvedValueOnce({ success: true, data: pendingDetail, error: null })
      .mockResolvedValueOnce({ success: true, data: paidDetail, error: null });
    await router.push('/consultant?payment=success&bookingId=booking-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(wrapper.text()).toContain('Payment is processing');
    expect(wrapper.text()).not.toContain('My bookings');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(wrapper.text()).toContain('Booking confirmed');
    expect(wrapper.text()).toContain('Spatial Consultant · Real Match');

    const myBookingsButton = wrapper
      .findAllComponents({ name: 'Button' })
      .find((button) => button.text() === 'My bookings');
    expect(myBookingsButton).toBeTruthy();
    await myBookingsButton!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/account/consultations');
  });

  it('shows a timeout state when payment polling stays pending', async () => {
    vi.useFakeTimers();
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    const pendingDetail: ConsultationBookingDetail = {
      booking: {
        id: 'booking-1',
        status: 'pending_payment',
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        contactEmail: 'member@example.com',
        createdAt: '2026-07-07T00:00:00Z',
        updatedAt: '2026-07-07T00:00:00Z'
      },
      payment: { status: 'pending', amount: 500, currency: 'TWD' }
    };
    getBookingMock.mockResolvedValue({ success: true, data: pendingDetail, error: null });
    await router.push('/consultant?payment=success&bookingId=booking-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    for (let i = 0; i < 6; i += 1) {
      await vi.advanceTimersByTimeAsync(2000);
      await flushPromises();
    }

    expect(wrapper.text()).toContain('Payment is still processing');
    expect(getBookingMock).toHaveBeenCalledTimes(7);
  });

  it('writes the recovered bookingId into the URL so a later reload survives sessionStorage being cleared', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    const paidDetail: ConsultationBookingDetail = {
      booking: {
        id: 'booking-1',
        status: 'confirmed',
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        contactEmail: 'member@example.com',
        createdAt: '2026-07-07T00:00:00Z',
        updatedAt: '2026-07-07T00:00:00Z'
      },
      payment: { status: 'paid', amount: 500, currency: 'TWD' }
    };
    getBookingMock.mockResolvedValue({ success: true, data: paidDetail, error: null });

    // Stripe 導回的網址本來就不帶 bookingId，第一次靠 sessionStorage 撿回來。
    sessionStorage.setItem('asterism.consultation.checkoutBookingId', 'booking-1');
    await router.push('/consultant?payment=success');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(wrapper.text()).toContain('Booking confirmed');
    const recoveredFullPath = router.currentRoute.value.fullPath;
    expect(router.currentRoute.value.query.bookingId).toBe('booking-1');
    // 終態確認後 sessionStorage 那份會被清掉，之後只能靠網址上的 bookingId。
    expect(sessionStorage.getItem('asterism.consultation.checkoutBookingId')).toBeNull();

    // 模擬真的重新整理瀏覽器：全新的 router/app，只從網址(已經寫回 bookingId)還原狀態，
    // sessionStorage 是空的——這才是瀏覽器重新整理真正發生的事(舊的 JS 全部丟棄重來)。
    const reloadRouter = createTestRouter();
    await reloadRouter.push(recoveredFullPath);
    await reloadRouter.isReady();
    const reloadWrapper = mountPage(reloadRouter, pinia);
    await flushPromises();

    expect(reloadWrapper.text()).toContain('Booking confirmed');
    expect(reloadWrapper.text()).not.toContain('Booking not found');
  });

  it('redirects payment returns without an access token to login with the return URL', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/consultant?payment=success&bookingId=booking-1');
    await router.isReady();

    mountPage(router, pinia);
    await flushPromises();

    expect(getBookingMock).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.next).toBe(
      '/consultant?payment=success&bookingId=booking-1'
    );
  });

  it('polls a canceled return when backend payment is still pending', async () => {
    vi.useFakeTimers();
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    const pendingDetail: ConsultationBookingDetail = {
      booking: {
        id: 'booking-1',
        status: 'pending_payment',
        method: 'online',
        consultationDate: '2026-07-10',
        timeSlot: 'am',
        contactEmail: 'member@example.com',
        createdAt: '2026-07-07T00:00:00Z',
        updatedAt: '2026-07-07T00:00:00Z'
      },
      payment: { status: 'pending', amount: 500, currency: 'TWD' }
    };
    const canceledDetail: ConsultationBookingDetail = {
      ...pendingDetail,
      booking: { ...pendingDetail.booking, status: 'canceled' },
      payment: { ...pendingDetail.payment, status: 'canceled' }
    };
    getBookingMock
      .mockResolvedValueOnce({ success: true, data: pendingDetail, error: null })
      .mockResolvedValueOnce({ success: true, data: canceledDetail, error: null });
    await router.push('/consultant?payment=cancel&bookingId=booking-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(wrapper.text()).toContain('Payment is processing');

    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(getBookingMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Payment canceled');
    expect(wrapper.text()).not.toContain('Payment is processing');
  });

  it('checks a canceled return once and lets paid backend state win', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();
    getBookingMock.mockResolvedValue({
      success: true,
      data: {
        booking: {
          id: 'booking-1',
          status: 'confirmed',
          method: 'online',
          consultationDate: '2026-07-10',
          timeSlot: 'am',
          contactEmail: 'member@example.com',
          createdAt: '2026-07-07T00:00:00Z',
          updatedAt: '2026-07-07T00:00:00Z'
        },
        payment: { status: 'paid', amount: 500, currency: 'TWD' }
      },
      error: null
    });
    await router.push('/consultant?payment=cancel&bookingId=booking-1');
    await router.isReady();
    const wrapper = mountPage(router, pinia);
    await flushPromises();

    expect(getBookingMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Booking confirmed');
    expect(wrapper.text()).not.toContain('Payment canceled');
  });
});
