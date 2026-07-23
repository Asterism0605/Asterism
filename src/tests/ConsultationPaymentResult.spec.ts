import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import ConsultationPaymentResult from '@/components/feature/consultant/ConsultationPaymentResult.vue';
import Button from '@/components/ui/Button.vue';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/consultant', name: 'consultant', component: { template: '<div />' } },
      {
        path: '/account/consultations',
        name: 'account-consultations',
        component: { template: '<div />' }
      }
    ]
  });
}

describe('ConsultationPaymentResult', () => {
  it('renders payment copy and emits restart from a secondary button', async () => {
    const router = createTestRouter();
    await router.push('/consultant');
    const wrapper = mount(ConsultationPaymentResult, {
      props: {
        title: 'Booking confirmed',
        description: 'Your consultation booking and payment are confirmed.'
      },
      global: { plugins: [router] }
    });

    expect(wrapper.get('h2').text()).toBe('Booking confirmed');
    expect(wrapper.get('p').text()).toBe(
      'Your consultation booking and payment are confirmed.'
    );
    expect(wrapper.findComponent(Button).props('variant')).toBe('secondary');
    expect(wrapper.text()).not.toContain('My bookings');

    const button = wrapper.getComponent(Button);
    await button.trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
  });

  it('shows a My Bookings button that navigates when showMyBookingsLink is set', async () => {
    const router = createTestRouter();
    await router.push('/consultant');
    const wrapper = mount(ConsultationPaymentResult, {
      props: {
        title: 'Booking confirmed',
        description: 'Your consultation booking and payment are confirmed.',
        showMyBookingsLink: true
      },
      global: { plugins: [router] }
    });

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(2);

    const myBookingsButton = buttons.find((button) => button.text() === 'My bookings');
    expect(myBookingsButton).toBeTruthy();
    await myBookingsButton!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/account/consultations');
  });
});
