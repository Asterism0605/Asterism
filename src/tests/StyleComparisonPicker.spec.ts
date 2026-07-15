import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StyleComparisonPicker from '@/components/feature/dna/StyleComparisonPicker.vue'
import type { StyleDnaOption } from '@/types/style-dna'

const leftOption: StyleDnaOption = {
  id: 'opt-a',
  image: { id: 'img-a', url: '/a.webp', style: ['Minimalism'] },
  weights: { Minimalism: 1 }
}

const rightOption: StyleDnaOption = {
  id: 'opt-b',
  image: { id: 'img-b', url: '/b.webp', style: ['Cyberpunk'] },
  weights: { Cyberpunk: 1 }
}

function mountPicker(questionIndex = 0, totalQuestions = 12) {
  return mount(StyleComparisonPicker, {
    props: {
      leftOption,
      rightOption,
      selectedId: null,
      questionIndex,
      totalQuestions
    }
  })
}

describe('StyleComparisonPicker progress indicator', () => {
  it('shows the current question number and total on the same line as the hint', () => {
    const wrapper = mountPicker(0, 12)

    const instruction = wrapper.get('.instruction')
    expect(instruction.text()).toContain('Click one image to continue')
    expect(wrapper.get('.instruction-progress__current').text()).toBe('1')
    expect(wrapper.get('.instruction-progress__total').text()).toBe('12')
  })

  it('increments the displayed progress as questionIndex advances', () => {
    const wrapper = mountPicker(4, 12)

    expect(wrapper.get('.instruction-progress__current').text()).toBe('5')
    expect(wrapper.get('.instruction-progress__total').text()).toBe('12')
  })
})
