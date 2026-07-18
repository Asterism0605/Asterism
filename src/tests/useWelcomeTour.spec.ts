import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWelcomeTour } from '@/composables/guide/useWelcomeTour';

const WelcomeTourHarness = defineComponent({
  setup() {
    return useWelcomeTour('user-1');
  },
  template: '<div />'
});

describe('useWelcomeTour', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
