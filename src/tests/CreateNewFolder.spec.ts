import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';

function mountCreateNewFolder(props: Record<string, unknown> = {}) {
  return mount(CreateNewFolder, {
    props: { modelValue: true, isSubmitting: false, isSuccess: false, ...props },
    attachTo: document.body
  });
}

function getInput() {
  return document.querySelector('input') as HTMLInputElement;
}

function getSendButton() {
  return Array.from(document.querySelectorAll('button[type="button"]')).find((b) =>
    b.textContent?.includes('SEND')
  ) as HTMLButtonElement;
}

describe('CreateNewFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('輸入為空時 SEND 按鈕 disabled', () => {
    mountCreateNewFolder();
    expect(getSendButton().disabled).toBe(true);
  });

  it('有輸入內容後 SEND 按鈕啟用', async () => {
    mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(getSendButton().disabled).toBe(false);
  });

  it('送出後 emit submit 並帶入輸入值', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    getSendButton().click();
    await flushPromises();
    expect(wrapper.emitted('submit')).toEqual([['My Folder']]);
  });

  it('isSubmitting 時 input 和 SEND 按鈕皆 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ isSubmitting: true });
    expect(getInput().disabled).toBe(true);
    expect(getSendButton().disabled).toBe(true);
  });

  it('isSuccess 時 input 和 SEND 按鈕皆 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ isSuccess: true });
    expect(getInput().disabled).toBe(true);
    expect(getSendButton().disabled).toBe(true);
  });

  it('modal 關閉時清空輸入框', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    expect(getInput().value).toBe('');
  });
});
