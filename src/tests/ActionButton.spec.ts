import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ActionButton from '@/components/feature/image/ActionButton.vue';

const folders = [
  { id: 'folder-1', name: 'My Folder' },
  { id: 'folder-2', name: 'Another Folder' }
];

describe('ActionButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('folders 為空陣列時不渲染 SAVE TO FOLDER 區塊', async () => {
    const wrapper = mount(ActionButton, { props: { folders: [] } });

    await wrapper.find('button').trigger('click');

    expect(wrapper.text()).toContain('CREATE NEW FOLDER');
    expect(wrapper.text()).not.toContain('SAVE TO FOLDER');
  });

  it('點擊 SAVE TO FOLDER 展開第二層並列出所有資料夾名稱', async () => {
    const wrapper = mount(ActionButton, { props: { folders } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    const folderNames = wrapper.findAll('button').map((b) => b.text());
    expect(folderNames).toContain('My Folder');
    expect(folderNames).toContain('Another Folder');
  });

  it('點擊第二層資料夾名稱時 emit save-to-folder 帶正確的 folderId', async () => {
    const wrapper = mount(ActionButton, { props: { folders } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'Another Folder');
    await folderBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toEqual([['folder-2']]);
  });

  it('點擊資料夾後暫時顯示「✓ Saved」', async () => {
    const wrapper = mount(ActionButton, { props: { folders } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'My Folder');
    await folderBtn!.trigger('click');

    expect(wrapper.text()).toContain('✓ Saved');
  });

  it('儲存到資料夾後 800ms 自動關閉兩層選單', async () => {
    vi.useFakeTimers();
    const wrapper = mount(ActionButton, { props: { folders } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'My Folder');
    await folderBtn!.trigger('click');

    vi.advanceTimersByTime(800);
    await flushPromises();

    expect(wrapper.findAll('button').some((b) => b.text().includes('CREATE NEW FOLDER'))).toBe(false);
  });

  it('重新打開第一層 dropdown 時第二層資料夾清單重置為收合', async () => {
    const wrapper = mount(ActionButton, { props: { folders } });
    const toggleBtn = wrapper.find('button');

    await toggleBtn.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    expect(wrapper.findAll('button').some((b) => b.text() === 'My Folder')).toBe(true);

    await toggleBtn.trigger('click');
    await toggleBtn.trigger('click');

    expect(wrapper.findAll('button').some((b) => b.text() === 'My Folder')).toBe(false);
  });

  it('點擊選單外部時關閉 dropdown', async () => {
    const wrapper = mount(ActionButton, {
      attachTo: document.body,
      props: { folders }
    });

    try {
      await wrapper.find('button').trigger('click');
      expect(wrapper.text()).toContain('CREATE NEW FOLDER');

      document.body.click();
      await flushPromises();

      expect(wrapper.text()).not.toContain('CREATE NEW FOLDER');
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('點擊 CREATE NEW FOLDER 時 emit create-folder 並關閉 dropdown', async () => {
    const wrapper = mount(ActionButton, { props: { folders } });

    await wrapper.find('button').trigger('click');
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('CREATE NEW FOLDER'));
    await createBtn!.trigger('click');

    expect(wrapper.emitted('create-folder')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('CREATE NEW FOLDER');
  });

  it('consult variant 渲染 CONSULT STYLIST 按鈕並 emit consult', async () => {
    const wrapper = mount(ActionButton, { props: { variant: 'consult' } });

    expect(wrapper.text()).toContain('CONSULT STYLIST');
    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('consult')).toHaveLength(1);
  });

  it('disabled 為 true 時停用主按鈕', () => {
    const wrapper = mount(ActionButton, { props: { disabled: true } });

    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(true);
  });
});
