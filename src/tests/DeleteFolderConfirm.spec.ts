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

  it('標題會帶入傳入的資料夾名稱', () => {
    const wrapper = mountDeleteFolderConfirm({ folderName: 'Studio' });

    expect(wrapper.text()).toContain('Delete Studio and All Images');
  });

  it('資料夾名稱超過 10 個字時，標題用 ... 省略', () => {
    const wrapper = mountDeleteFolderConfirm({ folderName: '1234567890ABCDEFG' });

    expect(wrapper.text()).toContain('Delete 1234567890... and All Images');
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
