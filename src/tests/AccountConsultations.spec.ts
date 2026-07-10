import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import AccountConsultations from '@/pages/AccountConsultations.vue';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';
import type { ConsultationBookingList } from '@/types/consultation';

const { getMyConsultationBookingsMock } = vi.hoisted(() => ({
  getMyConsultationBookingsMock: vi.fn()
}));

vi.mock('@/api/consultation.api', () => ({
  getMyConsultationBookings: getMyConsultationBookingsMock
}));

const memberSession: AuthSession = {
  accessToken: 'access-token',
  expiresAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
};

const bookingList: ConsultationBookingList = [
  {
    booking: {
      id: 'booking-1',
      status: 'confirmed',
      method: 'online',
      consultationDate: '2026-07-10',
      timeSlot: 'pm',
      designField: 'Interior',
      designFocus: 'Material palette',
      notes: 'Keep the room calm.',
      contactEmail: 'member@example.com',
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-05T00:00:00.000Z'
    },
    payment: {
      status: 'paid',
      amount: 50_000,
      currency: 'TWD'
    },
    consultant: {
      id: 'consultant-1',
      displayName: 'Mira Chen',
      title: 'Spatial Consultant'
    }
  },
  {
    booking: {
      id: 'booking-2',
      status: 'completed',
      method: 'in_person',
      consultationDate: '2026-07-12',
      timeSlot: 'am',
      contactEmail: 'member@example.com',
      createdAt: '2026-07-06T00:00:00.000Z',
      updatedAt: '2026-07-07T00:00:00.000Z'
    },
    payment: {
      status: 'paid',
      amount: 50_000,
      currency: 'TWD'
    },
    consultant: {
      id: 'consultant-1',
      displayName: 'Mira Chen',
      title: 'Spatial Consultant'
    }
  },
  {
    booking: {
      id: 'booking-3',
      status: 'pending_payment',
      method: 'online',
      consultationDate: '2026-07-20',
      timeSlot: 'pm',
      contactEmail: 'member@example.com',
      createdAt: '2026-07-08T00:00:00.000Z',
      updatedAt: '2026-07-08T00:00:00.000Z'
    },
    payment: {
      status: 'pending',
      amount: 50_000,
      currency: 'TWD'
    },
    consultant: null
  }
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/account/consultations', name: 'account-consultations', component: AccountConsultations },
      { path: '/consultant', name: 'consultant', component: { template: '<div />' } }
    ]
  });
}

async function mountPage() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();
  authStore.session = memberSession;
  authStore.user = memberSession.user;

  const router = createTestRouter();
  await router.push('/account/consultations');
  await router.isReady();

  const wrapper = mount(AccountConsultations, {
    global: {
      plugins: [router, pinia]
    }
  });

  return { router, wrapper };
}

describe('AccountConsultations', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while bookings are being fetched', async () => {
    getMyConsultationBookingsMock.mockReturnValue(new Promise(() => {}));

    const { wrapper } = await mountPage();

    expect(wrapper.text()).toContain('Loading your consultations');
    expect(getMyConsultationBookingsMock).toHaveBeenCalledWith('access-token');
  });

  it('renders booking cards without payment, amount, or timestamps', async () => {
    getMyConsultationBookingsMock.mockResolvedValue({
      success: true,
      data: bookingList,
      error: null
    });

    const { wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('My Consultations');
    expect(wrapper.text()).toContain('Jul 10, 2026');
    expect(wrapper.text()).toContain('PM');
    expect(wrapper.text()).toContain('Online');
    expect(wrapper.text()).toContain('Mira Chen');
    expect(wrapper.text()).toContain('Spatial Consultant');
    expect(wrapper.text()).not.toContain('Confirmed');
    expect(wrapper.text()).not.toContain('Completed');
    expect(wrapper.text()).not.toContain('Consultant not assigned yet');
    expect(wrapper.text()).not.toContain('Pending payment');
    expect(wrapper.find('[data-booking-id="booking-3"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('paid');
    expect(wrapper.text()).not.toContain('50,000');
    expect(wrapper.text()).not.toContain('50000');
    expect(wrapper.text()).not.toContain('TWD');
    expect(wrapper.text()).not.toContain('2026-07-04T00:00:00.000Z');
    expect(wrapper.text()).not.toContain('2026-07-05T00:00:00.000Z');
  });

  it('renders basic details directly in fixed cards without expand controls', async () => {
    getMyConsultationBookingsMock.mockResolvedValue({
      success: true,
      data: bookingList,
      error: null
    });

    const { wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('Design field');
    expect(wrapper.text()).toContain('Interior');
    expect(wrapper.text()).toContain('Material palette');
    expect(wrapper.text()).toContain('Keep the room calm.');
    expect(wrapper.text()).not.toContain('View details');
    expect(wrapper.text()).not.toContain('Collapse details');
    expect(wrapper.text()).not.toContain('TWD');
    expect(wrapper.text()).not.toContain('2026-07-05T00:00:00.000Z');
  });

  it('renders empty state and links to booking flow', async () => {
    getMyConsultationBookingsMock.mockResolvedValue({
      success: true,
      data: [],
      error: null
    });

    const { router, wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.get('[data-testid="consultations-empty"]').text()).toContain(
      'No consultations yet'
    );

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('consultant');
  });

  it('treats unpaid bookings as not successfully booked', async () => {
    getMyConsultationBookingsMock.mockResolvedValue({
      success: true,
      data: [bookingList[2]],
      error: null
    });

    const { wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.get('[data-testid="consultations-empty"]').text()).toContain(
      'No consultations yet'
    );
    expect(wrapper.text()).not.toContain('Pending payment');
  });

  it('renders API error state and retries', async () => {
    getMyConsultationBookingsMock
      .mockResolvedValueOnce({
        success: false,
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'backend debug text' }
      })
      .mockResolvedValueOnce({
        success: true,
        data: bookingList,
        error: null
      });

    const { wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.get('[data-testid="consultations-error"]').text()).toContain(
      'Unable to load consultations'
    );
    expect(wrapper.text()).not.toContain('backend debug text');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(getMyConsultationBookingsMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Mira Chen');
  });

  it('renders thrown request errors as error state', async () => {
    getMyConsultationBookingsMock.mockRejectedValue(new Error('network failed'));

    const { wrapper } = await mountPage();
    await flushPromises();

    expect(wrapper.get('[data-testid="consultations-error"]').text()).toContain(
      'Unable to load consultations'
    );
    expect(wrapper.text()).not.toContain('network failed');
  });
});
