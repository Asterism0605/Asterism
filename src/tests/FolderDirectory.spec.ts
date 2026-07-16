import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FolderDirectory from '@/components/feature/moodboard/FolderDirectory.vue';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

function buildImage(overrides: Partial<SavedImage> = {}): SavedImage {
  return {
    itemId: 'item-1',
    id: 'image-1',
    src: '/style-image/image-1.webp',
    title: 'Image 1',
    styleGroup: 'minimal',
    style: [],
    createdAt: '2026-07-05T00:00:00.000Z',
    ...overrides
  };
}

function buildFolder(overrides: Partial<MoodboardFolder> = {}): MoodboardFolder {
  return {
    id: 'folder-1',
    name: 'Studio',
    createdAt: '2026-07-05T00:00:00.000Z',
    images: [buildImage()],
    ...overrides
  };
}

function mountFolderDirectory(props: Record<string, unknown> = {}) {
  return mount(FolderDirectory, {
    props: { folders: [buildFolder()], activeFolderId: null, ...props }
  });
}

describe('FolderDirectory', () => {
  it('依 createdAt 由舊到新排序顯示資料夾名稱', () => {
    const folders = [
      buildFolder({ id: 'folder-new', name: 'Newest', createdAt: '2026-07-10T00:00:00.000Z' }),
      buildFolder({ id: 'folder-old', name: 'Oldest', createdAt: '2026-07-01T00:00:00.000Z' }),
      buildFolder({ id: 'folder-mid', name: 'Middle', createdAt: '2026-07-05T00:00:00.000Z' })
    ];
    const wrapper = mountFolderDirectory({ folders });

    const labels = wrapper
      .findAll('[data-testid^="folder-directory-item-"] .folder-node__label')
      .map((label) => label.text());

    expect(labels).toEqual(['Oldest', 'Middle', 'Newest']);
  });

  it('folders 少於上限時就顯示實際數量，不補空位', () => {
    const folders = [
      buildFolder({ id: 'folder-1' }),
      buildFolder({ id: 'folder-2', name: 'Archive' })
    ];
    const wrapper = mountFolderDirectory({ folders });

    expect(wrapper.findAll('[data-testid^="folder-directory-item-"]')).toHaveLength(2);
  });

  it('空資料夾名字後面加上「(Empty)」', () => {
    const folders = [buildFolder({ id: 'folder-1', name: 'Empty Folder', images: [] })];
    const wrapper = mountFolderDirectory({ folders });

    expect(wrapper.get('[data-testid="folder-directory-item-folder-1"]').text()).toContain(
      'Empty Folder (Empty)'
    );
  });

  it('空資料夾項目有 folder-node--empty 樣式（不可點的游標提示）', () => {
    const folders = [buildFolder({ id: 'folder-1', images: [] })];
    const wrapper = mountFolderDirectory({ folders });

    expect(
      wrapper.get('[data-testid="folder-directory-item-folder-1"]').classes()
    ).toContain('folder-node--empty');
  });

  it('空資料夾項目是 disabled，點擊不會 emit select', async () => {
    const folders = [buildFolder({ id: 'folder-1', images: [] })];
    const wrapper = mountFolderDirectory({ folders });
    const button = wrapper.get('[data-testid="folder-directory-item-folder-1"]');

    expect((button.element as HTMLButtonElement).disabled).toBe(true);

    await button.trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('空資料夾即使 activeFolderId 對應也不會加上 active 樣式', () => {
    const folders = [buildFolder({ id: 'folder-1', images: [] })];
    const wrapper = mountFolderDirectory({ folders, activeFolderId: 'folder-1' });

    expect(
      wrapper.get('[data-testid="folder-directory-item-folder-1"]').classes()
    ).not.toContain('folder-node--active');
  });

  it('有圖片的資料夾不會加上「(Empty)」', () => {
    const folders = [buildFolder({ id: 'folder-1', name: 'Studio' })];
    const wrapper = mountFolderDirectory({ folders });

    const label = wrapper.get('[data-testid="folder-directory-item-folder-1"]').text();
    expect(label).toContain('Studio');
    expect(label).not.toContain('Empty');
  });

  it('點擊清單項目 emit select 並帶入 folderId', async () => {
    const folders = [
      buildFolder({ id: 'folder-1', name: 'Studio' }),
      buildFolder({ id: 'folder-2', name: 'Archive' })
    ];
    const wrapper = mountFolderDirectory({ folders });

    await wrapper.get('[data-testid="folder-directory-item-folder-2"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([['folder-2']]);
  });

  it('activeFolderId 對應的項目有 active 樣式', () => {
    const folders = [
      buildFolder({ id: 'folder-1', name: 'Studio' }),
      buildFolder({ id: 'folder-2', name: 'Archive' })
    ];
    const wrapper = mountFolderDirectory({ folders, activeFolderId: 'folder-2' });

    expect(
      wrapper.get('[data-testid="folder-directory-item-folder-2"]').classes()
    ).toContain('folder-node--active');
    expect(
      wrapper.get('[data-testid="folder-directory-item-folder-1"]').classes()
    ).not.toContain('folder-node--active');
  });

  it('標題項是 disabled 按鈕，不會觸發 select', async () => {
    const wrapper = mountFolderDirectory();

    const heading = wrapper.get('.folder-node--heading');
    expect((heading.element as HTMLButtonElement).disabled).toBe(true);

    await heading.trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });
});
