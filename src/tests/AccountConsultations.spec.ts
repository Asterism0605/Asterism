import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountConsultations from '@/pages/AccountConsultations.vue';
import { i18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';

const { getUpcomingAccountConsultations } = vi.hoisted(() => ({
  getUpcomingAccountConsultations: vi.fn()
}));

vi.mock('@/services/account-consultation.service', () => ({ getUpcomingAccountConsultations }));

const memberSession: AuthSession = {
  accessToken: 'access-token',
  expiresAt: '2027-01-01T00:00:00.000Z',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
};

const items = [
  ['reservation-01', '2026-07-28', 'am', 'online', 'Graphic Design', 'Visual Concept', 'I would like help defining the visual direction for a new brand identity.'],
  ['reservation-02', '2026-08-10', 'pm', 'in_person', 'Interior Design', 'Material Palette', 'I need advice on natural finishes and a calm material palette for my home.'],
  ['reservation-03', '2026-10-01', 'am', 'online', 'Architecture', 'Spatial Mood', 'I want to create a warm and quiet atmosphere for a small studio renovation.'],
  ['reservation-04', '2026-11-16', 'pm', 'online', 'Styling Design', 'Color Direction', 'I would like to refine the color direction for an upcoming editorial shoot.'],
  ['reservation-05', '2027-01-08', 'am', 'in_person', 'Interior Design', 'Furniture Selection', 'I need help selecting furniture that works with the scale of my living room.']
].map(([id, consultationDate, timeSlot, method, designField, designFocus, notes]) => ({
  id,
  status: 'confirmed' as const,
  consultationDate,
  timeSlot: timeSlot as 'am' | 'pm',
  method: method as 'online' | 'in_person',
  designField,
  designFocus,
  notes,
  createdAt: '2026-07-01T00:00:00.000Z'
}));

describe('AccountConsultations', () => {
  beforeEach(() => {
    getUpcomingAccountConsultations.mockResolvedValue(
      items.map((booking) => ({
        ...booking,
        method: booking.method === 'online' ? 'Online' : 'In-Person',
        designField: booking.designField ?? '—',
        designFocus: booking.designFocus ?? '—'
      }))
    );
  });

  async function mountPage() {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;

    const wrapper = mount(AccountConsultations, {
      global: { plugins: [pinia] }
    });
    await flushPromises();
    return wrapper;
  }

  it('renders all upcoming reservations from nearest to furthest in the date viewport', async () => {
    const wrapper = await mountPage();
    const dates = wrapper.findAll('.date-node__label').map((node) => node.text());

    expect(dates).toEqual([
      '2026 07 28 AM',
      '2026 08 10 PM',
      '2026 10 01 AM',
      '2026 11 16 PM',
      '2027 01 08 AM'
    ]);
    expect(wrapper.find('.date-timeline__viewport').exists()).toBe(true);
    expect(wrapper.text().replace(/\s+/g, ' ')).toContain('You have 5 upcoming consultations');
  });

  it('keeps the first reservation selected when the date viewport scrolls', async () => {
    const wrapper = await mountPage();

    await wrapper.get('.date-timeline__viewport').trigger('scroll');

    expect(wrapper.get('.date-node--active').text()).toBe('2026 07 28 AM');
    expect(wrapper.get('.details-panel').text()).toContain('Graphic Design');
  });

  it('shows the nearest reservation and every required detail by default', async () => {
    const wrapper = await mountPage();
    const panel = wrapper.get('.details-panel');

    expect(panel.text()).toContain('2026 07 28');
    expect(panel.text()).toContain('AM');
    expect(panel.text()).toContain('Consultation Method');
    expect(panel.text()).toContain('Online');
    expect(panel.text()).toContain('Design Field');
    expect(panel.text()).toContain('Graphic Design');
    expect(panel.text()).toContain('Design Focus');
    expect(panel.text()).toContain('Visual Concept');
    expect(panel.text()).toContain('Notes');
    expect(panel.text()).toContain('help defining the visual direction');
  });

  it('selects another reservation from the date timeline', async () => {
    const wrapper = await mountPage();

    await wrapper.findAll('.date-node')[1].trigger('click');

    expect(wrapper.get('.date-node--active').text()).toBe('2026 08 10 PM');
    expect(wrapper.get('.details-panel').text()).toContain('Interior Design');
    expect(wrapper.get('.details-panel').text()).toContain('Material Palette');
  });

  it('toggles the complete consultation list without rendering notes', async () => {
    const wrapper = await mountPage();

    await wrapper.get('.view-all').trigger('click');

    expect(wrapper.get('.view-all').text()).toContain('Back');
    expect(wrapper.findAll('.all-consultations__item')).toHaveLength(5);
    expect(wrapper.get('.all-consultations').text()).toContain('2027 01 08');
    expect(wrapper.get('.all-consultations__count').text()).toBe('You have5upcomingconsultations');
    expect(wrapper.get('.all-consultations').text()).toContain('Furniture Selection');
    expect(wrapper.get('.all-consultations').text()).not.toContain('Notes');
    expect(wrapper.get('.all-consultations').text()).not.toContain(
      'help defining the visual direction'
    );
    expect(wrapper.find('.date-node--active').exists()).toBe(false);

    await wrapper.get('.view-all').trigger('click');

    expect(wrapper.get('.view-all').text()).toContain('View all');
    expect(wrapper.get('.date-node--active').text()).toBe('2026 07 28 AM');
    expect(wrapper.get('.details-panel').text()).toContain('Notes');
    expect(wrapper.get('.details-panel').text()).toContain('Graphic Design');
  });

  it('opens a selected consultation from the date menu while viewing all consultations', async () => {
    const wrapper = await mountPage();

    await wrapper.get('.view-all').trigger('click');
    await wrapper.findAll('.date-node')[2].trigger('click');

    expect(wrapper.find('.all-consultations').exists()).toBe(false);
    expect(wrapper.get('.date-node--active').text()).toBe('2026 10 01 AM');
    expect(wrapper.get('.details-panel').text()).toContain('Architecture');
    expect(wrapper.get('.details-panel').text()).toContain('Spatial Mood');
  });

  it('uses the consultation form translations in both detail views', async () => {
    i18n.global.locale.value = 'zh';

    try {
      const wrapper = await mountPage();
      const detailLabels = wrapper.findAll('.consultation-details dt').map((label) => label.text());

      expect(detailLabels).toEqual(['諮詢方式', '設計領域', '設計重點', '備註']);
      expect(wrapper.get('.consultation-details').text()).toContain('線上');
      expect(wrapper.get('.consultation-details').text()).toContain('平面設計');
      expect(wrapper.get('.consultation-details').text()).toContain('視覺概念');

      await wrapper.get('.view-all').trigger('click');

      const listLabels = wrapper
        .findAll('.all-consultations__meta dt')
        .map((label) => label.text());
      expect(listLabels.slice(0, 3)).toEqual(['諮詢方式', '設計領域', '設計重點']);
    } finally {
      i18n.global.locale.value = 'en';
    }
  });
});
