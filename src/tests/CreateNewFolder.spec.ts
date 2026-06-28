import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';
import { createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

vi.mock('@/services/moodboard.service', () => ({
  createFolder: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ toast: { value: null } })
}));

function mountCreateNewFolder(modelValue = true) {
  return mount(CreateNewFolder, {
    props: { modelValue },
    attachTo: document.body
  });
}

function getInput() {
  return document.querySelector('input') as HTMLInputElement;
}

function getSendButton() {
  return Array.from(document.querySelectorAll('button[type="button"]')).find(
    (b) => b.textContent?.includes('SEND')
  ) as HTMLButtonElement;
}

describe('CreateNewFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('輸入框 placeholder 為 Folder name', () => {
    mountCreateNewFolder();
    expect(getInput().placeholder).toBe('Folder name');
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

  it('送出後呼叫 createFolder 並帶入輸入值', async () => {
    vi.useFakeTimers();
    mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    getSendButton().click();
    await flushPromises();
    expect(createFolder).toHaveBeenCalledWith('My Folder');
    vi.useRealTimers();
  });

  it('成功後 emit update:modelValue false', async () => {
    vi.useFakeTimers();
    const wrapper = mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    getSendButton().click();
    await flushPromises();
    await vi.runAllTimersAsync();
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    vi.useRealTimers();
  });

  it('失敗時呼叫 showToast 顯示錯誤訊息', async () => {
    vi.mocked(createFolder).mockImplementationOnce(() => { throw new Error('fail') });
    mountCreateNewFolder();
    const input = getInput();
    input.value = 'My Folder';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    getSendButton().click();
    await flushPromises();
    expect(showToast).toHaveBeenCalledWith({ type: 'error', message: 'fail' });
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
