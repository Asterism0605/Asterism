import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ActionButton from '@/components/feature/image/ActionButton.vue';

const folders = [
  { id: 'folder-1', name: 'My Folder' },
  { id: 'folder-2', name: 'Another Folder' }
];

describe('ActionButton', () => {
  it('opens the save menu when an authenticated return requests it', async () => {
    const wrapper = mount(ActionButton, {
      props: { canSave: true, openRequest: 1 }
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Create New Folder');
  });

  it('未登入點擊收藏時 emit auth-required 且不開啟選單', async () => {
    const wrapper = mount(ActionButton, {
      props: { canSave: false }
    });

    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ADD TO MOODBOARD'));
    await addButton!.trigger('click');

    expect(wrapper.emitted('auth-required')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Create New Folder');
  });

  it('folders 為空陣列時不渲染 Save to Folder 區塊', async () => {
    const wrapper = mount(ActionButton, { props: { folders: [], canSave: true } });

    await wrapper.find('button').trigger('click');

    expect(wrapper.text()).toContain('Create New Folder');
    expect(wrapper.text()).not.toContain('Save to Folder');
  });

  it('點擊 Save to Folder 展開第二層並列出所有資料夾名稱', async () => {
    const wrapper = mount(ActionButton, { props: { folders, canSave: true } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');

    const folderNames = wrapper.findAll('button').map((b) => b.text());
    expect(folderNames).toContain('My Folder');
    expect(folderNames).toContain('Another Folder');
  });

  it('資料夾清單以書籤 icon 與 aria-pressed 標示圖片是否已儲存', async () => {
    const wrapper = mount(ActionButton, {
      props: {
        canSave: true,
        folders: [
          { id: 'folder-1', name: 'My Folder', saved: true },
          { id: 'folder-2', name: 'Another Folder', saved: false }
        ]
      }
    });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');

    const savedFolderBtn = wrapper.findAll('button').find((b) => b.text() === 'My Folder');
    const unsavedFolderBtn = wrapper.findAll('button').find((b) => b.text() === 'Another Folder');

    expect(savedFolderBtn!.attributes('aria-pressed')).toBe('true');
    expect(unsavedFolderBtn!.attributes('aria-pressed')).toBe('false');
    expect(savedFolderBtn!.find('svg').attributes('fill')).toBe('currentColor');
    expect(unsavedFolderBtn!.find('svg').attributes('fill')).toBe('none');
  });

  it('點擊第二層資料夾名稱時 emit save-to-folder 帶正確的 folderId', async () => {
    const wrapper = mount(ActionButton, { props: { folders, canSave: true } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'Another Folder');
    await folderBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toEqual([['folder-2']]);
  });

  it('點擊資料夾當下尚未收到 parent 儲存成功前，不顯示「✓ Saved」', async () => {
    const wrapper = mount(ActionButton, { props: { folders, canSave: true } });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'My Folder');
    await folderBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toEqual([['folder-1']]);
    expect(wrapper.text()).not.toContain('✓ Saved');
  });

  it('parent 透過 justSavedFolderId prop 回報成功後顯示「✓ Saved」', async () => {
    const wrapper = mount(ActionButton, {
      props: { folders, justSavedFolderId: 'folder-1', canSave: true }
    });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');

    expect(wrapper.text()).toContain('✓ Saved');
  });

  it('parent 回報儲存失敗（justSavedFolderId 維持 null）時不顯示「✓ Saved」', async () => {
    const wrapper = mount(ActionButton, {
      props: { folders, justSavedFolderId: null, canSave: true }
    });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'My Folder');
    await folderBtn!.trigger('click');

    expect(wrapper.text()).not.toContain('✓ Saved');
  });

  it('justSavedFolderId 有值（顯示 ✓ Saved 期間）時資料夾按鈕停用，避免點擊觸發第二次儲存', async () => {
    const wrapper = mount(ActionButton, {
      props: { folders, justSavedFolderId: 'folder-1', canSave: true }
    });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    const anotherFolderBtn = wrapper.findAll('button').find((b) => b.text() === 'Another Folder');

    expect((anotherFolderBtn!.element as HTMLButtonElement).disabled).toBe(true);

    await anotherFolderBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toBeUndefined();
  });

  it('justSavedFolderId 從有值變回 null 時自動關閉兩層選單', async () => {
    const wrapper = mount(ActionButton, {
      props: { folders, justSavedFolderId: 'folder-1' as string | null, canSave: true }
    });

    await wrapper.find('button').trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    expect(wrapper.text()).toContain('✓ Saved');

    await wrapper.setProps({ justSavedFolderId: null });

    expect(wrapper.findAll('button').some((b) => b.text().includes('Create New Folder'))).toBe(false);
  });

  it('重新打開第一層 dropdown 時第二層資料夾清單重置為收合', async () => {
    const wrapper = mount(ActionButton, { props: { folders, canSave: true } });
    const toggleBtn = wrapper.find('button');

    await toggleBtn.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save to Folder'));
    await saveBtn!.trigger('click');
    expect(wrapper.findAll('button').some((b) => b.text() === 'My Folder')).toBe(true);

    await toggleBtn.trigger('click');
    await toggleBtn.trigger('click');

    expect(wrapper.findAll('button').some((b) => b.text() === 'My Folder')).toBe(false);
  });

  it('點擊選單外部時關閉 dropdown', async () => {
    const wrapper = mount(ActionButton, {
      attachTo: document.body,
      props: { folders, canSave: true }
    });

    try {
      await wrapper.find('button').trigger('click');
      expect(wrapper.text()).toContain('Create New Folder');

      document.body.click();
      await flushPromises();

      expect(wrapper.text()).not.toContain('Create New Folder');
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('點擊 Create New Folder 時 emit create-folder 並關閉 dropdown', async () => {
    const wrapper = mount(ActionButton, { props: { folders, canSave: true } });

    await wrapper.find('button').trigger('click');
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create New Folder'));
    await createBtn!.trigger('click');

    expect(wrapper.emitted('create-folder')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Create New Folder');
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

  it('disabled 為 true 時顯示 LoaderCircle 轉圈動畫，不顯示書籤', () => {
    const wrapper = mount(ActionButton, { props: { disabled: true } });

    expect(wrapper.find('svg.animate-spin').exists()).toBe(true);
    expect(wrapper.find('svg').attributes('fill')).not.toBe('currentColor');
  });

  it('儲存完成（disabled 恢復 false）後顯示實心書籤，不再顯示 loading', () => {
    const wrapper = mount(ActionButton, { props: { disabled: false, saved: true } });

    expect(wrapper.find('svg.animate-spin').exists()).toBe(false);
    expect(wrapper.find('svg').attributes('fill')).toBe('currentColor');
  });
});
