import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
  it('shows the tag name and its English description when open in English', () => {
    const wrapper = mountModal('Art Deco', 'en')

    expect(wrapper.text()).toContain('Art Deco')
    expect(wrapper.text()).toContain('Geometric symmetry meets luxe materials')
  })

  it('shows the Chinese tag name and description when locale is zh', () => {
    const wrapper = mountModal('Art Deco', 'zh')

    expect(wrapper.text()).toContain('裝飾藝術')
    expect(wrapper.text()).toContain('幾何線條與奢華材質的對話')
  })

  it('renders nothing when tagLabel is null', () => {
    const wrapper = mountModal(null)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('emits update:modelValue false when closed', async () => {
    const wrapper = mountModal('Art Deco', 'en')

    await wrapper.get('.overlay-close').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
