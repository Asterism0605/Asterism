import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsultantBookings from '@/pages/ConsultantBookings.vue';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';
import type { ConsultantBookingItem } from '@/types/account-consultation';

const { getAssignedBookings } = vi.hoisted(() => ({ getAssignedBookings: vi.fn() }));
vi.mock('@/api/consultant-bookings.api', () => ({ getAssignedBookings }));

const consultantSession: AuthSession = {
  accessToken: 'access-token',
  expiresAt: '2027-01-01T00:00:00.000Z',
  user: {
    id: 'user-1',
    email: 'consultant@example.com',
    displayName: 'Consultant',
    isAdmin: false,
    consultantId: 'consultant-1',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
};

const bookings: ConsultantBookingItem[] = [
  {
    id: 'b1',
    status: 'confirmed',
    consultationDate: '2026-07-28',
    timeSlot: 'am',
    method: 'Online',
    designField: 'Interior Design',
    contactName: '王小明',
    contactEmail: 'ming@example.com',
    contactPhone: '0912345678'
  },
  {
    id: 'b2',
    status: 'completed',
    consultationDate: '2026-08-02',
    timeSlot: 'pm',
    method: 'In-Person',
    contactEmail: 'guest@example.com'
  }
];

async function mountPage() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();
  authStore.session = consultantSession;
  authStore.user = consultantSession.user;

  const wrapper = mount(ConsultantBookings, { global: { plugins: [pinia] } });
  await flushPromises();
  return wrapper;
}

describe('ConsultantBookings', () => {
  beforeEach(() => {
    getAssignedBookings.mockResolvedValue(bookings);
  });

  it('以自己的 consultantId 查詢並渲染清單與客戶聯絡資訊', async () => {
    const wrapper = await mountPage();

    expect(getAssignedBookings).toHaveBeenCalledWith('consultant-1');
    expect(wrapper.findAll('.date-node')).toHaveLength(2);
    expect(wrapper.text()).toContain('王小明');
    expect(wrapper.text()).toContain('ming@example.com');
    expect(wrapper.text()).toContain('0912345678');
  });

  it('顯示狀態標籤', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('.consultation-details').text()).toMatch(/已確認|Confirmed/);
  });

  it('無預約時顯示空狀態、不顯示前往預約 CTA', async () => {
    getAssignedBookings.mockResolvedValue([]);
    const wrapper = await mountPage();

    expect(wrapper.find('.consultations-empty-state').exists()).toBe(true);
    expect(wrapper.find('.consultations-empty-state button').exists()).toBe(false);
  });

  it('查詢失敗顯示錯誤與重試,重試成功後渲染清單', async () => {
    getAssignedBookings.mockRejectedValueOnce(new Error('boom'));
    const wrapper = await mountPage();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);

    getAssignedBookings.mockResolvedValue(bookings);
    await wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.date-node')).toHaveLength(2);
  });
});
