import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MoodboardGlassButton from '@/components/feature/moodboard/MoodboardGlassButton.vue';

describe('MoodboardGlassButton', () => {
  it('點擊時發出 click 事件', async () => {
    const wrapper = mount(MoodboardGlassButton, {
      props: { ariaLabel: '刪除模式' }
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('套用傳入的 aria-label', () => {
    const wrapper = mount(MoodboardGlassButton, {
      props: { ariaLabel: '刪除模式' }
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('刪除模式');
  });

  it('呼叫端傳入的 data-testid 會 fallthrough 到 button 根節點，方便 A/B 兩顆按鈕各自識別', () => {
    const wrapper = mount(MoodboardGlassButton, {
      props: { ariaLabel: '刪除模式' },
      attrs: { 'data-testid': 'moodboard-folder-delete-toggle' }
    });

    expect(wrapper.get('button').attributes('data-testid')).toBe(
      'moodboard-folder-delete-toggle'
    );
  });
});
