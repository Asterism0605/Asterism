import { afterEach, describe, expect, it, vi } from 'vitest'
import { showToast, hideToast, resetToastState, useToast } from '@/composables/useToast'

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
    resetToastState()
  })

  it('shows a toast with message, action, and type metadata', () => {
    const { toast } = useToast()
    const onAction = vi.fn()

    showToast({
      type: 'info',
      message: 'Sample result',
      actionText: 'Retake quiz',
      onAction,
      duration: 5000,
    })

    expect(toast.value).toMatchObject({
      type: 'info',
      message: 'Sample result',
      actionText: 'Retake quiz',
    })
    expect(toast.value?.onAction).toBe(onAction)
  })

  it('auto dismisses a toast after its duration', async () => {
    vi.useFakeTimers()
    const { toast } = useToast()

    showToast({
      type: 'success',
      message: 'Saved',
      duration: 1200,
    })

    expect(toast.value?.message).toBe('Saved')

    await vi.advanceTimersByTimeAsync(1200)

    expect(toast.value).toBeNull()
  })

  it('clears the current toast when hideToast is called', () => {
    const { toast } = useToast()

    showToast({
      type: 'warning',
      message: 'Heads up',
      duration: 5000,
    })

    hideToast()

    expect(toast.value).toBeNull()
  })
})
