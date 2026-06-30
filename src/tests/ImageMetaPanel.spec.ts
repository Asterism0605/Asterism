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
  it('emits consult when CONSULT STYLIST is clicked', async () => {
    const wrapper = mount(ImageMetaPanel, { props: defaultProps });

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');

    expect(wrapper.emitted('consult')).toHaveLength(1);
  });

  it('emits save-to-folder when SAVE TO FOLDER is clicked', async () => {
    const wrapper = mount(ImageMetaPanel, { props: defaultProps });

    const buttons = wrapper.findAll('button');
    const addBtn = buttons.find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    expect(wrapper.emitted('save-to-folder')).toHaveLength(1);
  });


  it('disables ADD TO MOODBOARD button when disabled prop is true', () => {
    const wrapper = mount(ImageMetaPanel, { props: { ...defaultProps, disabled: true } });

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('forwards selected similar image ids', async () => {
    const wrapper = mount(ImageMetaPanel, {
      props: { ...defaultProps, similarImages }
    });

    await wrapper.find('div.grid button').trigger('click');

    expect(wrapper.emitted('select-image')).toEqual([['related-001']]);
  });
});
