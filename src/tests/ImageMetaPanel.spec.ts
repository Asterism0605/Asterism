import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImageMetaPanel from '@/components/feature/image/ImageMetaPanel.vue';

const defaultProps = {
  title: 'Y2K Aesthetic',
  colorPalette: ['#ffffff', '#000000'],
  styleTags: ['Y2K']
};

describe('ImageMetaPanel', () => {
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

  it('shows a spinner when loading is true', () => {
    const wrapper = mount(ImageMetaPanel, {
      props: { ...defaultProps, loading: true }
    });

    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('shows an error message when error prop is set', () => {
    const errorMsg = '儲存失敗，請再試一次';
    const wrapper = mount(ImageMetaPanel, {
      props: { ...defaultProps, error: errorMsg }
    });

    expect(wrapper.text()).toContain(errorMsg);
  });
});
