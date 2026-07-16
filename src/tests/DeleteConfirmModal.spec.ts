import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import DeleteConfirmModal from '@/components/feature/moodboard/DeleteConfirmModal.vue';

function mountDeleteConfirmModal(props: Record<string, unknown> = {}) {
  return mount(DeleteConfirmModal, {
    props: {
      modelValue: true,
      isDeleting: false,
      titleKey: 'moodboard.deleteImageTitle',
      confirmTestId: 'confirm-action',
      cancelTestId: 'cancel-action',
      ...props
    },
    attachTo: document.body,
    global: { stubs: { Teleport: true } }
  });
}

function getConfirmButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[data-testid="confirm-action"]').element as HTMLButtonElement;
}

function getCancelButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[data-testid="cancel-action"]').element as HTMLButtonElement;
}

describe('DeleteConfirmModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('點擊確認鈕 emit confirm', async () => {
    const wrapper = mountDeleteConfirmModal();

    await wrapper.get('[data-testid="confirm-action"]').trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('點擊關閉鈕 emit update:modelValue(false)', async () => {
    const wrapper = mountDeleteConfirmModal();

    await wrapper.get('[data-testid="cancel-action"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('isDeleting 為 true 時，確認與關閉按鈕皆 disabled', () => {
    const wrapper = mountDeleteConfirmModal({ isDeleting: true });

    expect(getConfirmButton(wrapper).disabled).toBe(true);
    expect(getCancelButton(wrapper).disabled).toBe(true);
  });
});
