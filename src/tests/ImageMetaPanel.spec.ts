import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImageMetaPanel from '@/components/feature/image/ImageMetaPanel.vue';
import type { ImageSpreadNode } from '@/types/image';

const defaultProps = {
  colorPalette: ['#ffffff', '#000000'],
  styleTags: ['Y2K']
};

const similarImages: ImageSpreadNode[] = [
  {
    id: 'related-001',
    src: '/related-001.webp',
    alt: 'Related image',
    title: 'Related image',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K'],
    colorPalette: ['#ffffff']
  }
];

describe('ImageMetaPanel', () => {
  it('有 photographerAvatarUrl 時 ProfileCard 顯示頭像圖片；沒有時交給 ProfileCard 顯示姓名縮寫', () => {
    // 底部一律有一顆裝飾用的 Asterism 站徽（alt 也叫 Asterism），
    // 所以用「有幾張 alt=Asterism 的圖」而非單純 find 來確認 ProfileCard 頭像有沒有真的渲染。
    const withAvatar = mount(ImageMetaPanel, {
      props: {
        ...defaultProps,
        photographerName: 'Asterism',
        photographerAvatarUrl: '/sitelogo.png'
      }
    });
    const avatarImgs = withAvatar.findAll('img[alt="Asterism"]');
    expect(avatarImgs).toHaveLength(2); // ProfileCard 頭像 + 底部裝飾站徽
    expect(avatarImgs[0].attributes('src')).toBe('/sitelogo.png');

    const withoutAvatar = mount(ImageMetaPanel, {
      props: { ...defaultProps, photographerName: 'Mikhail Nilov' }
    });
    expect(withoutAvatar.find('img[alt="Mikhail Nilov"]').exists()).toBe(false);
    expect(withoutAvatar.text()).toContain('MN');
  });

  it('點擊 CONSULT STYLIST 時觸發 consult', async () => {
    const wrapper = mount(ImageMetaPanel, { props: defaultProps });

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');

    expect(wrapper.emitted('consult')).toHaveLength(1);
  });

  it('點擊 SAVE TO FOLDER 時觸發 save-to-folder', async () => {
    const wrapper = mount(ImageMetaPanel, {
      props: {
        ...defaultProps,
        folders: [{ id: 'folder-001', name: 'test' }],
        canSave: true
      }
    });

    const buttons = wrapper.findAll('button');
    const addBtn = buttons.find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toEqual([['folder-001']]);
  });


  it('當 disabled prop 為 true 時停用 ADD TO MOODBOARD 按鈕', () => {
    const wrapper = mount(ImageMetaPanel, { props: { ...defaultProps, disabled: true } });

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('轉發選取的相似圖片 id', async () => {
    const wrapper = mount(ImageMetaPanel, {
      props: { ...defaultProps, similarImages }
    });

    await wrapper.find('div.grid button').trigger('click');

    expect(wrapper.emitted('select-image')).toEqual([['related-001']]);
  });
});
