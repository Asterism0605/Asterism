import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConsultationPaymentResult from '@/components/feature/consultant/ConsultationPaymentResult.vue';
import Button from '@/components/ui/Button.vue';

describe('ConsultationPaymentResult', () => {
  it('renders payment copy and emits restart from a secondary button', async () => {
    const wrapper = mount(ConsultationPaymentResult, {
      props: {
        title: 'Booking confirmed',
        description: 'Your consultation booking and payment are confirmed.'
      }
    });

    expect(wrapper.get('h2').text()).toBe('Booking confirmed');
    expect(wrapper.get('p').text()).toBe(
      'Your consultation booking and payment are confirmed.'
    );

    const button = wrapper.getComponent(Button);
    expect(button.props('variant')).toBe('secondary');

    await button.trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
  });
});
