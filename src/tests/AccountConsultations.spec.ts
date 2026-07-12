import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AccountConsultations from '@/pages/AccountConsultations.vue';

describe('AccountConsultations', () => {
  function mountPage() {
    return mount(AccountConsultations);
  }

  it('renders all upcoming reservations from nearest to furthest in the date viewport', () => {
    const wrapper = mountPage();
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
    const wrapper = mountPage();

    await wrapper.get('.date-timeline__viewport').trigger('scroll');

    expect(wrapper.get('.date-node--active').text()).toBe('2026 07 28 AM');
    expect(wrapper.get('.details-panel').text()).toContain('Graphic Design');
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

  it('toggles the complete consultation list without rendering notes', async () => {
    const wrapper = mountPage();

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
    const wrapper = mountPage();

    await wrapper.get('.view-all').trigger('click');
    await wrapper.findAll('.date-node')[2].trigger('click');

    expect(wrapper.find('.all-consultations').exists()).toBe(false);
    expect(wrapper.get('.date-node--active').text()).toBe('2026 10 01 AM');
    expect(wrapper.get('.details-panel').text()).toContain('Architecture');
    expect(wrapper.get('.details-panel').text()).toContain('Spatial Mood');
  });
});
