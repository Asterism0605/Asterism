import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import ThemeTag from '@/components/ui/ThemeTag.vue';
import { i18n } from '@/i18n';

describe('ThemeTag', () => {
  afterEach(() => {
    i18n.global.locale.value = 'en';
  });

  it('renders original theme tags in English', () => {
    i18n.global.locale.value = 'en';
    const wrapper = mount(ThemeTag, {
      props: {
        tags: ['Frutiger Aero', 'Chrome Design', 'Y2K']
      }
    });

    expect(wrapper.text()).toContain('Frutiger Aero');
    expect(wrapper.text()).toContain('Chrome Design');
    expect(wrapper.text()).toContain('Y2K');
  });

  it('renders translated theme tags in Traditional Chinese', () => {
    i18n.global.locale.value = 'zh';
    const wrapper = mount(ThemeTag, {
      props: {
        tags: ['Frutiger Aero', 'Chrome Design', 'Y2K']
      }
    });

    expect(wrapper.text()).toContain('清透科技風');
    expect(wrapper.text()).toContain('鉻金屬設計');
    expect(wrapper.text()).toContain('千禧風');
    expect(wrapper.text()).not.toContain('Frutiger Aero');
    expect(wrapper.text()).not.toContain('Chrome Design');
  });

  it('falls back to the original tag when no translation exists', () => {
    i18n.global.locale.value = 'zh';
    const wrapper = mount(ThemeTag, {
      props: {
        tags: ['Unmapped Style']
      }
    });

    expect(wrapper.text()).toContain('Unmapped Style');
  });
});
