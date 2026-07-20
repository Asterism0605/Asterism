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

function mountPicker(progressCurrent = 1, totalQuestions = 12, canSkip = true) {
  return mount(StyleComparisonPicker, {
    props: {
      leftOption,
      rightOption,
      selectedId: null,
      questionIndex: progressCurrent - 1,
      progressCurrent,
      totalQuestions,
      canSkip
    }
  })
}

describe('StyleComparisonPicker progress indicator', () => {
  it('shows the current question number and total on the same line as the hint', () => {
    const wrapper = mountPicker(1, 12)

    const instruction = wrapper.get('.instruction')
    expect(instruction.text()).toContain('Click one image to continue')
    expect(wrapper.get('.instruction-progress__current').text()).toBe('1')
    expect(wrapper.get('.instruction-progress__total').text()).toBe('12')
  })

  it('displays progress from the effective answer count', () => {
    const wrapper = mountPicker(5, 12)

    expect(wrapper.get('.instruction-progress__current').text()).toBe('5')
    expect(wrapper.get('.instruction-progress__total').text()).toBe('12')
  })

  it('emits skip while the skip action is available', async () => {
    const wrapper = mountPicker()

    const skipButton = wrapper.get('[data-testid="style-dna-skip"]')
    expect(skipButton.text()).toBe('Neither — show me another pair')
    expect(skipButton.attributes('disabled')).toBeUndefined()

    await skipButton.trigger('click')
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('disables the skip action and explains when the limit is reached', () => {
    const wrapper = mountPicker(1, 12, false)
    const skipButton = wrapper.get('[data-testid="style-dna-skip"]')

    expect(skipButton.text()).toBe('Skip limit reached')
    expect(skipButton.attributes('disabled')).toBeDefined()
  })
})
