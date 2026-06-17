import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StyleDnaResult from '@/pages/StyleDnaResult.vue'

const { showToast } = vi.hoisted(() => ({
  showToast: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  showToast,
}))

describe('StyleDnaResult', () => {
  afterEach(() => {
    vi.useRealTimers()
    showToast.mockReset()
  })

  it('shows the loading state before rendering the fallback result', async () => {
    vi.useFakeTimers()

    const wrapper = mount(StyleDnaResult)

    expect(wrapper.text()).toContain('Forming')
    expect(wrapper.text()).toContain('Your')
    expect(wrapper.text()).toContain('Style DNA')

    await vi.advanceTimersByTimeAsync(1600)

    expect(wrapper.text()).toContain('Your')
    expect(wrapper.text()).toContain('Style DNA')
    expect(wrapper.text()).toContain('Minimalism')
    expect(wrapper.text()).not.toContain('Retake quiz')
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        message: 'We do not have quiz result yet, so this is a sample Style DNA result.',
        actionText: 'Retake quiz',
      }),
    )
  })

  it('renders computed quiz data when selection history is provided', async () => {
    vi.useFakeTimers()

    const wrapper = mount(StyleDnaResult, {
      props: {
        selectionHistory: [
          { style: 'Y2K', weight: 2, image: '/images/y2k.png' },
          { style: 'Minimalism', weight: 1 },
        ],
      },
    })

    await vi.advanceTimersByTimeAsync(1600)

    expect(wrapper.text()).toContain('Y2K')
    expect(wrapper.text()).toContain('67%')
    expect(wrapper.find('img[alt*="Y2K"]').attributes('src')).toBe('/images/y2k.png')
    expect(wrapper.text()).not.toContain('No quiz data found')
    expect(showToast).not.toHaveBeenCalled()
  })
})
