import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';

function mountCreateNewFolder(props: Record<string, unknown> = {}) {
  return mount(CreateNewFolder, {
    props: { modelValue: true, isSubmitting: false, isSuccess: false, ...props },
    attachTo: document.body,
    global: { stubs: { Teleport: true } }
  });
}

function getInput(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('input').element as HTMLInputElement;
}

function getSendButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button').find((b) =>
    b.text().includes('SEND')
  )!.element as HTMLButtonElement;
}

describe('CreateNewFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('輸入為空時 SEND 按鈕 disabled', () => {
    const wrapper = mountCreateNewFolder();
    expect(getSendButton(wrapper).disabled).toBe(true);
  });

  it('有輸入內容後 SEND 按鈕啟用', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(getSendButton(wrapper).disabled).toBe(false);
  });

  it('送出後 emit submit 並帶入輸入值', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    getSendButton(wrapper).click();
    await flushPromises();
    expect(wrapper.emitted('submit')).toEqual([['My Folder']]);
  });

  it('isSubmitting 時 input 和 SEND 按鈕皆 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ isSubmitting: true });
    expect(getInput(wrapper).disabled).toBe(true);
    expect(getSendButton(wrapper).disabled).toBe(true);
  });

  it('isSuccess 時 input 和 SEND 按鈕皆 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ isSuccess: true });
    expect(getInput(wrapper).disabled).toBe(true);
    expect(getSendButton(wrapper).disabled).toBe(true);
  });

  it('modal 關閉時清空輸入框', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    expect(getInput(wrapper).value).toBe('');
  });
});
