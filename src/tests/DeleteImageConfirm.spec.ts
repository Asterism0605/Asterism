import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import DeleteImageConfirm from '@/components/feature/moodboard/DeleteImageConfirm.vue';

function mountDeleteImageConfirm(props: Record<string, unknown> = {}) {
  return mount(DeleteImageConfirm, {
    props: { modelValue: true, isDeleting: false, ...props },
    attachTo: document.body,
    global: { stubs: { Teleport: true } }
  });
}

describe('DeleteImageConfirm', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('把正確的 titleKey 與 testid 傳給 DeleteConfirmModal', () => {
    const wrapper = mountDeleteImageConfirm();

    expect(wrapper.text()).toContain('Delete Image from Folder');
    expect(wrapper.find('[data-testid="delete-image-confirm"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-image-cancel"]').exists()).toBe(true);
  });

  it('點擊確認鈕會轉發 DeleteConfirmModal 的 confirm emit', async () => {
    const wrapper = mountDeleteImageConfirm();

    await wrapper.get('[data-testid="delete-image-confirm"]').trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('點擊取消鈕會轉發 DeleteConfirmModal 的 update:modelValue emit', async () => {
    const wrapper = mountDeleteImageConfirm();

    await wrapper.get('[data-testid="delete-image-cancel"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });
});
