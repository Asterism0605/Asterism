import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AccountConsultations from '@/pages/AccountConsultations.vue';

describe('AccountConsultations', () => {
  function mountPage() {
    return mount(AccountConsultations);
  }

  it('renders the nearest three upcoming reservations from nearest to furthest', () => {
    const wrapper = mountPage();
    const dates = wrapper.findAll('.date-node__label').map((node) => node.text());

    expect(dates).toEqual(['2026 07 28 AM', '2026 08 10 PM', '2026 10 01 AM']);
    expect(wrapper.text()).toContain('You have 5 upcoming consultations');
  });

  it('shows the nearest reservation and every required detail by default', () => {
    const wrapper = mountPage();
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
    const wrapper = mountPage();

    await wrapper.findAll('.date-node')[1].trigger('click');

    expect(wrapper.get('.date-node--active').text()).toBe('2026 08 10 PM');
    expect(wrapper.get('.details-panel').text()).toContain('Interior Design');
    expect(wrapper.get('.details-panel').text()).toContain('Material Palette');
  });

  it('renders View all without changing the current consultation', async () => {
    const wrapper = mountPage();
    const before = wrapper.get('.details-panel').text();

    await wrapper.get('.view-all').trigger('click');

    expect(wrapper.get('.view-all').text()).toContain('View all');
    expect(wrapper.get('.details-panel').text()).toBe(before);
  });
});
