import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsultantBookings from '@/pages/ConsultantBookings.vue';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';
import type { ConsultantBookingItem } from '@/types/account-consultation';

const { getAssignedBookings, setConsultationLocation } = vi.hoisted(() => ({
  getAssignedBookings: vi.fn(),
  setConsultationLocation: vi.fn()
}));
vi.mock('@/api/consultant-bookings.api', () => ({ getAssignedBookings, setConsultationLocation }));

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
    setConsultationLocation.mockReset();
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

  it('儲存地點成功時呼叫 setConsultationLocation 並帶入正確參數', async () => {
    setConsultationLocation.mockResolvedValue(undefined);
    const wrapper = await mountPage();

    await wrapper.get('[data-testid="location-input"]').setValue('https://example.com');
    await wrapper.get('[data-testid="location-save"]').trigger('click');
    await flushPromises();

    expect(setConsultationLocation).toHaveBeenCalledWith('b1', 'https://example.com');
  });

  it('儲存地點失敗時不拋出未處理的 rejection,並顯示錯誤訊息', async () => {
    setConsultationLocation.mockRejectedValue(new Error('boom'));
    const wrapper = await mountPage();

    await wrapper.get('[data-testid="location-input"]').setValue('https://example.com');
    await wrapper.get('[data-testid="location-save"]').trigger('click');
    await flushPromises();

    expect(setConsultationLocation).toHaveBeenCalledWith('b1', 'https://example.com');
    expect(wrapper.text()).toMatch(/儲存失敗|Failed to save/);
  });

  it('切換預約後,舊預約延遲返回的儲存失敗結果不應顯示在目前選取的預約上', async () => {
    const twoConfirmedBookings: ConsultantBookingItem[] = [
      { ...bookings[0]! },
      { ...bookings[1]!, status: 'confirmed' }
    ];
    getAssignedBookings.mockResolvedValue(twoConfirmedBookings);

    let rejectFirstSave: (reason?: unknown) => void = () => {};
    setConsultationLocation.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirstSave = reject;
        })
    );

    const wrapper = await mountPage();

    await wrapper.get('[data-testid="location-input"]').setValue('https://example.com');
    await wrapper.get('[data-testid="location-save"]').trigger('click');
    await flushPromises();

    expect(setConsultationLocation).toHaveBeenCalledWith('b1', 'https://example.com');

    const dateNodes = wrapper.findAll('.date-node');
    await dateNodes[1]!.trigger('click');
    await flushPromises();

    rejectFirstSave(new Error('boom'));
    await flushPromises();

    expect(wrapper.text()).not.toMatch(/儲存失敗|Failed to save/);
  });

  it('地點儲存中停用按鈕並顯示儲存中,避免連續點擊送出多個請求', async () => {
    let resolveSave: () => void = () => {};
    setConsultationLocation.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveSave = resolve; })
    );
    const wrapper = await mountPage();

    await wrapper.get('[data-testid="location-input"]').setValue('https://example.com');
    const saveButton = wrapper.get('[data-testid="location-save"]');
    await saveButton.trigger('click');
    await flushPromises();

    // 儲存中:按鈕停用、文案變「儲存中」,再點也不會送出第二個請求。
    expect((saveButton.element as HTMLButtonElement).disabled).toBe(true);
    expect(saveButton.text()).toMatch(/儲存中|Saving/);
    await saveButton.trigger('click');
    expect(setConsultationLocation).toHaveBeenCalledTimes(1);

    resolveSave();
    await flushPromises();

    expect((saveButton.element as HTMLButtonElement).disabled).toBe(false);
  });
});
