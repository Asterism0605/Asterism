import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import StyleConsultant from '@/pages/StyleConsultant.vue';

describe('StyleConsultant', () => {
  it('reads sourceImageId from the route query', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/consultant', name: 'consultant', component: StyleConsultant }]
    });

    await router.push('/consultant?sourceImageId=rpl-interior-lighting-001');
    await router.isReady();

    const wrapper = mount(StyleConsultant, {
      global: {
        plugins: [router, pinia],
        stubs: {
          ConstellationBackground: true,
          ConsultantSummary: true,
          RecommendationPanel: true
        }
      }
    });

    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBe(
      'rpl-interior-lighting-001'
    );
  });
});
