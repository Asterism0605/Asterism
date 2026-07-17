import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, onMounted, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { useUserTour } from '@/components/feature/guide/composables/useUserTour';
import { useUserTourPresenter } from '@/components/feature/guide/composables/useUserTourPresenter';

describe('useUserTourPresenter', () => {
  afterEach(() => {
    setLocale('en');
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('re-renders the current step when the locale changes', async () => {
    const target = document.createElement('div');
    target.dataset.tour = 'home-overview';
    target.getClientRects = () =>
      [new DOMRect(0, 0, 100, 100)] as unknown as DOMRectList;
    document.body.append(target);

    const Harness = defineComponent({
      setup() {
        const tour = useUserTour(ref('user-1'));
        const presenter = useUserTourPresenter(tour);
        onMounted(() => {
          tour.start();
          presenter.show('home-overview');
        });
        return () => null;
      }
    });

    mount(Harness);
    await nextTick();
    expect(document.querySelector('.driver-popover-title')?.textContent).toBe(
      'Explore the inspiration map'
    );

    setLocale('zh');
    await nextTick();
    expect(document.querySelector('.driver-popover-title')?.textContent).toBe('探索靈感星圖');
  });
});
