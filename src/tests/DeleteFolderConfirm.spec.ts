import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import DeleteFolderConfirm from '@/components/feature/moodboard/DeleteFolderConfirm.vue';

function mountDeleteFolderConfirm(props: Record<string, unknown> = {}) {
  return mount(DeleteFolderConfirm, {
    props: { modelValue: true, isDeleting: false, folderName: 'Studio', ...props },
    attachTo: document.body,
    global: { stubs: { Teleport: true } }
  });
}

describe('DeleteFolderConfirm', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('標題會帶入傳入的資料夾名稱', () => {
    const wrapper = mountDeleteFolderConfirm({ folderName: 'Studio' });

    expect(wrapper.text()).toContain('Delete Studio and All Images');
  });

  it('資料夾名稱超過 10 個字時，標題用 ... 省略', () => {
    const wrapper = mountDeleteFolderConfirm({ folderName: '1234567890ABCDEFG' });

    expect(wrapper.text()).toContain('Delete 1234567890... and All Images');
  });

  it('把正確的 testid 傳給 DeleteConfirmModal', () => {
    const wrapper = mountDeleteFolderConfirm();

    expect(wrapper.find('[data-testid="delete-folder-confirm"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-folder-cancel"]').exists()).toBe(true);
  });

  it('點擊確認鈕會轉發 DeleteConfirmModal 的 confirm emit', async () => {
    const wrapper = mountDeleteFolderConfirm();

    await wrapper.get('[data-testid="delete-folder-confirm"]').trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('點擊取消鈕會轉發 DeleteConfirmModal 的 update:modelValue emit', async () => {
    const wrapper = mountDeleteFolderConfirm();

    await wrapper.get('[data-testid="delete-folder-cancel"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });
});
