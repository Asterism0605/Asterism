import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import UserTourPauseModal from '@/components/feature/guide/UserTourPauseModal.vue';
import {
  cancelUserTourPause,
  confirmUserTourPause,
  isUserTourPauseOpen,
  requestUserTourPause
} from '@/services/guide/userTourPause';

describe('user tour pause confirmation', () => {
  afterEach(() => {
    cancelUserTourPause();
    document.body.innerHTML = '';
  });

  it('keeps the tour active until pause is confirmed', () => {
    const onConfirm = vi.fn();

    requestUserTourPause(onConfirm);
    expect(isUserTourPauseOpen.value).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();

    confirmUserTourPause();
    expect(isUserTourPauseOpen.value).toBe(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses ModalOverlay and shared buttons for the warning', async () => {
    const wrapper = mount(UserTourPauseModal);
    requestUserTourPause(vi.fn());
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(ModalOverlay).props('modelValue')).toBe(true);
    expect(document.body.textContent).toContain('Pause the website tour?');
    expect(document.querySelector('[data-testid="user-tour-continue"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="user-tour-confirm-pause"]')).not.toBeNull();
  });
});
