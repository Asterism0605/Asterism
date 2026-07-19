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

  it('輸入超過 15 字時顯示錯誤樣式與文字，且 SEND 按鈕 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'This name is way too long';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(input.classList.contains('input-error-border')).toBe(true);
    expect(wrapper.find('.folder-name-error').exists()).toBe(true);
    expect(getSendButton(wrapper).disabled).toBe(true);
  });

  it('縮短到 15 字以內後錯誤消失，SEND 按鈕恢復可用', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'This name is way too long';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    input.value = 'Short name';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(input.classList.contains('input-error-border')).toBe(false);
    expect(wrapper.find('.folder-name-error').exists()).toBe(false);
    expect(getSendButton(wrapper).disabled).toBe(false);
  });

  it('超過 15 字時按 Enter 不會 emit submit', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = 'This name is way too long';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await wrapper.find('input').trigger('keydown.enter');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('打出第 16 個字時觸發錯誤樣式、錯誤文字與 SEND 按鈕 disabled', async () => {
    const wrapper = mountCreateNewFolder();
    const input = getInput(wrapper);
    input.value = '123456789012345';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(input.classList.contains('input-error-border')).toBe(false);
    expect(getSendButton(wrapper).disabled).toBe(false);

    input.value = '1234567890123456';
    input.dispatchEvent(new Event('input'));
    await flushPromises();

    expect(input.classList.contains('input-error-border')).toBe(true);
    expect(wrapper.find('.folder-name-error').exists()).toBe(true);
    expect(getSendButton(wrapper).disabled).toBe(true);
  });
});
