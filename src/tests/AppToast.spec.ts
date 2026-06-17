import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppToast from '@/components/ui/AppToast.vue'
import { resetToastState, showToast } from '@/composables/useToast'

describe('AppToast', () => {
  afterEach(() => {
    vi.useRealTimers()
    resetToastState()
  })

  it('renders the active toast message and action button', () => {
    const onAction = vi.fn()
    showToast({
      type: 'info',
      message: 'Sample result',
      actionText: 'Retake quiz',
      onAction,
      duration: 5000,
    })

    const wrapper = mount(AppToast)

    expect(wrapper.text()).toContain('Sample result')
    expect(wrapper.get('button[data-testid="toast-action"]').text()).toContain('Retake quiz')
  })

  it('runs the action callback and closes when the action button is clicked', async () => {
    const onAction = vi.fn()
    showToast({
      type: 'info',
      message: 'Sample result',
      actionText: 'Retake quiz',
      onAction,
      duration: 5000,
    })

    const wrapper = mount(AppToast)

    await wrapper.get('button[data-testid="toast-action"]').trigger('click')

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain('Sample result')
  })

  it('closes when the dismiss button is clicked', async () => {
    showToast({
      type: 'error',
      message: 'Something went wrong',
      duration: 5000,
    })

    const wrapper = mount(AppToast)

    await wrapper.get('button[data-testid="toast-dismiss"]').trigger('click')

    expect(wrapper.text()).not.toContain('Something went wrong')
  })
})
