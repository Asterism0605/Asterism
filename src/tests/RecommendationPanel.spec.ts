import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RecommendationPanel from '@/components/feature/consultant/RecommendationPanel.vue'

function mountPanel() {
  return mount(RecommendationPanel, {
    props: {
      accountName: 'Ruwen Hsieh',
      accountEmail: 'ruwen@example.com',
    },
  })
}

describe('RecommendationPanel', () => {
  it('renders the required booking fields', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Consultation Method')
    expect(wrapper.text()).toContain('Date')
    expect(wrapper.text()).toContain('Time Slot')
    expect(wrapper.text()).toContain('Design Field')
    expect(wrapper.text()).toContain('Additional Notes')
    expect(wrapper.text()).toContain('SEND')
    expect(wrapper.text()).toContain('RESET')
  })

  it('fills contact fields from account info', async () => {
    const wrapper = mountPanel()

    await wrapper.get('button.recommendation-panel__account').trigger('click')

    const inputs = wrapper.findAll('input.overlay-input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('Ruwen Hsieh')
    expect((inputs[2].element as HTMLInputElement).value).toBe('ruwen@example.com')
  })

  it('blocks incomplete submissions and emits valid payloads', async () => {
    const wrapper = mountPanel()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Date is required.')

    const inputs = wrapper.findAll('input.overlay-input')
    await inputs[0].setValue('06 / 30 / 2026')
    await wrapper.findAll('select')[0].setValue('am')
    await wrapper.findAll('select')[1].setValue('Interior Design')
    await wrapper.findAll('select')[2].setValue('Spatial mood')
    await inputs[1].setValue('Ruwen Hsieh')
    await inputs[2].setValue('ruwen@example.com')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      method: 'online',
      date: '06 / 30 / 2026',
      timeSlot: 'am',
      designField: 'Interior Design',
      designFocus: 'Spatial mood',
      name: 'Ruwen Hsieh',
      email: 'ruwen@example.com',
    })
  })

  it('resets form state', async () => {
    const wrapper = mountPanel()
    const inputs = wrapper.findAll('input.overlay-input')

    await inputs[0].setValue('06 / 30 / 2026')
    await inputs[1].setValue('Ruwen Hsieh')
    const resetButton = wrapper.findAll('button').find((button) => button.text() === 'RESET')
    expect(resetButton).toBeTruthy()
    await resetButton!.trigger('click')

    expect((inputs[0].element as HTMLInputElement).value).toBe('')
    expect((inputs[1].element as HTMLInputElement).value).toBe('')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
