import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';

const { getMyConsultationBookings } = vi.hoisted(() => ({
  getMyConsultationBookings: vi.fn()
}));

vi.mock('@/api/consultation.api', () => ({ getMyConsultationBookings }));

const { default: AccountConsultations } = await import('@/pages/AccountConsultations.vue');

const memberSession: AuthSession = {
  accessToken: 'access-token',
  expiresAt: '2026-08-01T00:00:00.000Z',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
};

describe('AccountConsultations API mode', () => {
  beforeEach(() => vi.clearAllMocks());

  function mountPage(authenticated = true) {
    const pinia = createPinia();
    setActivePinia(pinia);

    if (authenticated) {
      const authStore = useAuthStore();
      authStore.session = memberSession;
      authStore.user = memberSession.user;
    }

    return mount(AccountConsultations, { global: { plugins: [pinia] } });
  }

  it('shows a loading state then renders the upcoming API bookings', async () => {
    let resolveRequest!: (value: unknown) => void;
    getMyConsultationBookings.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const wrapper = mountPage();
    expect(wrapper.get('[role="status"]').text()).toContain('Loading your consultations');
    expect(getMyConsultationBookings).toHaveBeenCalledWith('access-token');

    resolveRequest({
      success: true,
      data: {
        items: [
          {
            id: 'booking-1',
            status: 'confirmed',
            method: 'online',
            consultationDate: '2026-08-10',
            timeSlot: 'am',
            designField: 'Interior Design',
            designFocus: 'Living room planning',
            createdAt: '2026-07-13T00:00:00.000Z'
          }
        ]
      },
      error: null
    });
    await flushPromises();

    expect(wrapper.get('.details-panel').text()).toContain('Interior Design');
    expect(wrapper.get('.consultation-details').text()).toContain('—');
  });

  it('shows the empty state when the API returns no upcoming bookings', async () => {
    getMyConsultationBookings.mockResolvedValue({
      success: true,
      data: { items: [] },
      error: null
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.consultations-empty-state').exists()).toBe(true);
  });

  it('shows an error and retries the request', async () => {
    getMyConsultationBookings.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
      success: true,
      data: { items: [] },
      error: null
    });

    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("couldn't load your consultations");

    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(getMyConsultationBookings).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.consultations-empty-state').exists()).toBe(true);
  });

  it('does not request or render bookings without a valid session', async () => {
    const wrapper = mountPage(false);
    await flushPromises();

    expect(getMyConsultationBookings).not.toHaveBeenCalled();
    expect(wrapper.find('.consultations-empty-state').exists()).toBe(true);
  });
});
