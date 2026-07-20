import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import DetailPanel from '@/components/feature/consultations/DetailPanel.vue';
import zh from '@/i18n/locales/zh';

const i18n = createI18n({ legacy: false, locale: 'zh', messages: { zh } });

function makeReservation(overrides = {}) {
  return {
    id: 'b1',
    status: 'confirmed',
    consultationDate: '2026-07-21',
    timeSlot: 'pm',
    method: 'Online',
    ...overrides
  };
}

function mountPanel(reservation) {
  return mount(DetailPanel, {
    props: { reservation, reservations: [reservation], showAll: false },
    global: { plugins: [i18n], stubs: { ScrambleText: true, ConsultationList: true } }
  });
}

describe('DetailPanel 客人端地點', () => {
  it('online 有地點時渲染成新分頁連結', () => {
    const wrapper = mountPanel(
      makeReservation({ method: 'Online', location: 'https://meet.example.com/abc' })
    );
    const link = wrapper.get('a[href="https://meet.example.com/abc"]');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.attributes('target')).toBe('_blank');
  });

  it('in_person 有地點時渲染純文字(非連結)', () => {
    const wrapper = mountPanel(
      makeReservation({ method: 'In-Person', location: '台北市信義區松高路 1 號' })
    );
    expect(wrapper.text()).toContain('台北市信義區松高路 1 號');
    expect(wrapper.find('a[href="台北市信義區松高路 1 號"]').exists()).toBe(false);
  });

  it('沒地點時顯示待提供文案', () => {
    const wrapper = mountPanel(makeReservation({ location: undefined }));
    expect(wrapper.text()).toContain('地點待諮詢師提供');
  });
});
