import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWelcomeTour } from '@/composables/guide/useWelcomeTour';

const WelcomeTourHarness = defineComponent({
  props: {
    userId: {
      type: String,
      default: 'user-1'
    }
  },
  setup(props) {
    return useWelcomeTour(props.userId);
  },
  template: '<div />'
});

describe('useWelcomeTour', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unhandled and persists completion', () => {
    const tour = useWelcomeTour();

    expect(tour.isHandled.value).toBe(false);

    tour.complete();

    expect(tour.isHandled.value).toBe(true);
    expect(localStorage.getItem('asterism:tour:welcome')).toBe('handled');
    expect(useWelcomeTour().isHandled.value).toBe(true);
  });

  it('resets a completed tour', () => {
    const tour = useWelcomeTour();
    tour.complete();

    tour.reset();

    expect(tour.isHandled.value).toBe(false);
    expect(localStorage.getItem('asterism:tour:welcome')).toBeNull();
  });

  it('keeps the handled state isolated between authenticated users', () => {
    const firstUser = useWelcomeTour('user-a');
    firstUser.complete();

    expect(firstUser.isHandled.value).toBe(true);
    expect(useWelcomeTour('user-b').isHandled.value).toBe(false);
    expect(localStorage.getItem('asterism:tour:welcome:user-a')).toBe('handled');
  });

  it('does not assign anonymous handled state to the next authenticated user', () => {
    localStorage.setItem('asterism:tour:welcome', 'handled');

    const authenticatedTour = useWelcomeTour('user-a');

    expect(authenticatedTour.isHandled.value).toBe(false);
    expect(localStorage.getItem('asterism:tour:welcome')).toBe('handled');
    expect(localStorage.getItem('asterism:tour:welcome:user-a')).toBeNull();
  });

  it('keeps the current session usable when storage access fails', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const tour = useWelcomeTour();
    tour.complete();
    tour.reset();

    expect(tour.isHandled.value).toBe(false);
  });

  it('updates an existing welcome overlay when another instance completes the tour', async () => {
    const activeOverlay = mount(WelcomeTourHarness);
    const headerControl = mount(WelcomeTourHarness);

    headerControl.vm.complete();
    await activeOverlay.vm.$nextTick();

    expect(activeOverlay.vm.isHandled).toBe(true);

    activeOverlay.unmount();
    headerControl.unmount();
  });

  it('keeps every same-user instance completed when persistence fails', async () => {
    const activeOverlay = mount(WelcomeTourHarness);
    const headerControl = mount(WelcomeTourHarness);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    headerControl.vm.complete();
    await activeOverlay.vm.$nextTick();

    expect(activeOverlay.vm.isHandled).toBe(true);
    expect(headerControl.vm.isHandled).toBe(true);

    activeOverlay.unmount();
    headerControl.unmount();
  });

  it('keeps every same-user instance reset when removal persistence fails', async () => {
    localStorage.setItem('asterism:tour:welcome:user-1', 'handled');
    const activeOverlay = mount(WelcomeTourHarness);
    const headerControl = mount(WelcomeTourHarness);
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    headerControl.vm.reset();
    await activeOverlay.vm.$nextTick();

    expect(activeOverlay.vm.isHandled).toBe(false);
    expect(headerControl.vm.isHandled).toBe(false);

    activeOverlay.unmount();
    headerControl.unmount();
  });

  it('does not apply a welcome state event to a different user', async () => {
    const firstUser = mount(WelcomeTourHarness);
    const secondUser = mount(WelcomeTourHarness, { props: { userId: 'user-2' } });

    firstUser.vm.complete();
    await secondUser.vm.$nextTick();

    expect(firstUser.vm.isHandled).toBe(true);
    expect(secondUser.vm.isHandled).toBe(false);

    firstUser.unmount();
    secondUser.unmount();
  });
});
