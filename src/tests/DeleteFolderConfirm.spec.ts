import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import DeleteFolderConfirm from '@/components/feature/moodboard/DeleteFolderConfirm.vue';

function mountDeleteFolderConfirm(props: Record<string, unknown> = {}) {
  return mount(DeleteFolderConfirm, {
    props: { modelValue: true, isDeleting: false, ...props },
    attachTo: document.body,
    global: { stubs: { Teleport: true } }
  });
}

function getConfirmButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[data-testid="delete-folder-confirm"]').element as HTMLButtonElement;
}

function getCancelButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[data-testid="delete-folder-cancel"]').element as HTMLButtonElement;
}

describe('DeleteFolderConfirm', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('點擊確認鈕 emit confirm', async () => {
    const wrapper = mountDeleteFolderConfirm();

    await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('點擊關閉鈕 emit update:modelValue(false)', async () => {
    const wrapper = mountDeleteFolderConfirm();

    await wrapper.get('[data-testid="delete-folder-cancel"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('isDeleting 為 true 時，確認與關閉按鈕皆 disabled', () => {
    const wrapper = mountDeleteFolderConfirm({ isDeleting: true });

    expect(getConfirmButton(wrapper).disabled).toBe(true);
    expect(getCancelButton(wrapper).disabled).toBe(true);
  });
});
