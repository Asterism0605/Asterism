import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import StyleTagModal from '@/components/feature/dna/StyleTagModal.vue'
import en from '@/i18n/locales/en'
import zh from '@/i18n/locales/zh'

function mountModal(tagLabel: string | null, locale: 'en' | 'zh' = 'en') {
  const i18n = createI18n({
    legacy: false,
    locale,
    messages: { en, zh }
  })

  return mount(StyleTagModal, {
    props: {
      modelValue: tagLabel !== null,
      tagLabel
    },
    global: {
      plugins: [i18n],
      stubs: { Teleport: true }
    }
  })
}

describe('StyleTagModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows the tag name and its English description when open in English', () => {
    const wrapper = mountModal('Art Deco', 'en')

    expect(wrapper.text()).toContain('Art Deco')
    expect(wrapper.text()).toContain('Art Deco is a design style that combines modern geometry')
  })

  it('shows the Chinese tag name and description when locale is zh', () => {
    const wrapper = mountModal('Art Deco', 'zh')

    expect(wrapper.text()).toContain('裝飾藝術')
    expect(wrapper.text()).toContain('裝飾藝術是一種融合現代幾何與華麗裝飾')
  })

  it('renders nothing when tagLabel is null', () => {
    const wrapper = mountModal(null)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('emits update:modelValue false when closed', async () => {
    const wrapper = mountModal('Art Deco', 'en')

    await wrapper.get('.tag-modal-close').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('traps Tab focus inside the panel instead of letting it escape to the page behind', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en, zh }
    })

    const wrapper = mount(StyleTagModal, {
      props: {
        modelValue: true,
        tagLabel: 'Art Deco'
      },
      global: {
        plugins: [i18n],
        stubs: { Teleport: true }
      },
      attachTo: document.body
    })

    const closeButton = wrapper.get('.tag-modal-close').element as HTMLElement
    closeButton.focus()
    expect(document.activeElement).toBe(closeButton)

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    window.dispatchEvent(tabEvent)

    expect(tabEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    })
    window.dispatchEvent(shiftTabEvent)

    expect(shiftTabEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)

    wrapper.unmount()
  })
})
