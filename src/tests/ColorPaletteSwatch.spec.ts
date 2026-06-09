import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ColorPaletteSwatch from '@/components/ui/ColorPaletteSwatch.vue'

describe('ColorPaletteSwatch', () => {
  it('renders the "color palette" label', () => {
    const wrapper = mount(ColorPaletteSwatch, { props: { colors: [] } })
    expect(wrapper.text()).toContain('color palette')
  })

  it('renders no color blocks when colors is empty', () => {
    const wrapper = mount(ColorPaletteSwatch, { props: { colors: [] } })
    expect(wrapper.findAll('[data-testid="color-block"]').length).toBe(0)
  })

  it('renders correct number of color blocks', () => {
    const wrapper = mount(ColorPaletteSwatch, {
      props: { colors: ['#FFF', '#CCC', '#000'] },
    })
    expect(wrapper.findAll('[data-testid="color-block"]').length).toBe(3)
  })

  it('applies correct background-color to each block', () => {
    const wrapper = mount(ColorPaletteSwatch, {
      props: { colors: ['#FF0000', '#00FF00'] },
    })
    const blocks = wrapper.findAll('[data-testid="color-block"]')
    expect(blocks[0].attributes('style')).toContain('background-color: rgb(255, 0, 0)')
    expect(blocks[1].attributes('style')).toContain('background-color: rgb(0, 255, 0)')
  })
})
