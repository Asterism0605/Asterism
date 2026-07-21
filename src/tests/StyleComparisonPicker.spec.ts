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
      positionIndex: progressCurrent - 1,
      progressCurrent,
      totalQuestions,
      canSkip
    }
  })
}

describe('StyleComparisonPicker', () => {
  it('shows the picker hint without a visible numeric progress indicator', () => {
    const wrapper = mountPicker(1, 12)

    const instruction = wrapper.get('.instruction')
    expect(instruction.text()).toContain('Click one image to continue')
    expect(wrapper.find('.instruction-progress').exists()).toBe(false)
    expect(wrapper.get('.desktop-progress').attributes('style')).toContain('--desktop-progress: 0')
    expect(wrapper.get('[role="status"]').text()).toContain('Quiz progress: 1 / 12')
  })

  it('emits skip while the skip action is available', async () => {
    const wrapper = mountPicker()

    const skipButton = wrapper.get('[data-testid="style-dna-skip"]')
    expect(skipButton.text()).toBe('show me another pair')
    expect(skipButton.attributes('disabled')).toBeUndefined()

    await skipButton.trigger('click')
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('selects an option only when its image is clicked', async () => {
    const wrapper = mountPicker()
    const leftChoice = wrapper.get('.choice--left')

    expect(leftChoice.element.tagName).toBe('DIV')
    await leftChoice.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()

    const imageButton = leftChoice.get('.image-card')
    expect(imageButton.element.tagName).toBe('BUTTON')
    await imageButton.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['opt-a']])
  })

  it('disables the skip action and explains when the limit is reached', () => {
    const wrapper = mountPicker(1, 12, false)
    const skipButton = wrapper.get('[data-testid="style-dna-skip"]')

    expect(skipButton.text()).toBe('Skip limit reached')
    expect(skipButton.attributes('disabled')).toBeDefined()
  })
})
