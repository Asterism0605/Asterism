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

describe('DetailPanel 顧問端編輯地點', () => {
  function mountConsultant(reservation) {
    return mount(DetailPanel, {
      props: {
        reservation,
        reservations: [reservation],
        showAll: false,
        variant: 'consultant'
      },
      global: { plugins: [i18n], stubs: { ScrambleText: true, ConsultationList: true } }
    });
  }

  it('confirmed 才顯示編輯區', () => {
    const editable = mountConsultant(makeReservation({ status: 'confirmed' }));
    expect(editable.find('[data-testid="location-input"]').exists()).toBe(true);

    const notEditable = mountConsultant(makeReservation({ status: 'pending_payment' }));
    expect(notEditable.find('[data-testid="location-input"]').exists()).toBe(false);
  });

  it('online 網址非法時不 emit、顯示錯誤', async () => {
    const wrapper = mountConsultant(makeReservation({ method: 'Online', status: 'confirmed' }));
    await wrapper.get('[data-testid="location-input"]').setValue('not-a-url');
    await wrapper.get('[data-testid="location-save"]').trigger('click');
    expect(wrapper.emitted('updateLocation')).toBeFalsy();
    expect(wrapper.text()).toContain('請輸入有效的 http/https 連結');
  });

  it('合法輸入時 emit updateLocation', async () => {
    const wrapper = mountConsultant(makeReservation({ method: 'Online', status: 'confirmed' }));
    await wrapper.get('[data-testid="location-input"]').setValue('https://meet.example.com/z');
    await wrapper.get('[data-testid="location-save"]').trigger('click');
    expect(wrapper.emitted('updateLocation')?.[0]).toEqual(['https://meet.example.com/z']);
  });
});
