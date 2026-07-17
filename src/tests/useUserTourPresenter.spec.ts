import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, onMounted, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { useUserTour } from '@/composables/guide/useUserTour';
import { useUserTourPresenter } from '@/composables/guide/useUserTourPresenter';

type UserTourController = ReturnType<typeof useUserTour>;
type UserTourPresenter = ReturnType<typeof useUserTourPresenter>;

function mountPresenterHarness(
  onReady: (tour: UserTourController, presenter: UserTourPresenter) => void
) {
  const Harness = defineComponent({
    setup() {
      const tour = useUserTour(ref('user-1'));
      const presenter = useUserTourPresenter(tour);
      onMounted(() => onReady(tour, presenter));
      return () => null;
    }
  });

  return mount(Harness);
}

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

    mountPresenterHarness((tour, presenter) => {
      tour.start();
      void presenter.show('home-overview');
    });
    await nextTick();
    expect(document.querySelector('.driver-popover-title')?.textContent).toBe(
      'Explore the inspiration map'
    );

    setLocale('zh');
    await nextTick();
    expect(document.querySelector('.driver-popover-title')?.textContent).toBe('探索靈感星圖');
  });

  it('keeps the tour active when the target mounts on the next frame', async () => {
    let tour: UserTourController | undefined;
    let showResult: Promise<boolean> | boolean = false;

    mountPresenterHarness((mountedTour, presenter) => {
      tour = mountedTour;
      tour.start();
      showResult = presenter.show('home-overview');
      requestAnimationFrame(() => {
        const target = document.createElement('div');
        target.dataset.tour = 'home-overview';
        target.getClientRects = () =>
          [new DOMRect(0, 0, 100, 100)] as unknown as DOMRectList;
        document.body.append(target);
      });
    });
    await nextTick();

    expect(await showResult).toBe(true);
    expect(tour?.state.value.status).toBe('active');
    expect(document.querySelector('.driver-popover-title')?.textContent).toBe(
      'Explore the inspiration map'
    );
  });
});
