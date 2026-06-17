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

async function pickFirstAvailableDate(wrapper: ReturnType<typeof mountPanel>) {
  await wrapper.get('button.recommendation-panel__date-trigger').trigger('click')

  const availableDate = wrapper
    .findAll('button.recommendation-panel__calendar-day')
    .find((button) => !(button.element as HTMLButtonElement).disabled)

  expect(availableDate).toBeTruthy()
  await availableDate!.trigger('click')

  return wrapper.get('button.recommendation-panel__date-trigger').text()
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
    expect((inputs[0].element as HTMLInputElement).value).toBe('Ruwen Hsieh')
    expect((inputs[1].element as HTMLInputElement).value).toBe('ruwen@example.com')
  })

  it('blocks incomplete submissions and emits valid payloads', async () => {
    const wrapper = mountPanel()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Date is required.')

    const inputs = wrapper.findAll('input.overlay-input')
    const selects = wrapper.findAll('select')
    const selectedDate = await pickFirstAvailableDate(wrapper)
    await selects[0].setValue('am')
    await selects[1].setValue('Interior Design')
    await selects[2].setValue('Spatial mood')
    await inputs[0].setValue('Ruwen Hsieh')
    await inputs[1].setValue('ruwen@example.com')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      method: 'online',
      date: selectedDate,
      timeSlot: 'am',
      designField: 'Interior Design',
      designFocus: 'Spatial mood',
      name: 'Ruwen Hsieh',
      email: 'ruwen@example.com',
    })
  })

  it('allows design field and focus to be omitted', async () => {
    const wrapper = mountPanel()
    const inputs = wrapper.findAll('input.overlay-input')
    const selects = wrapper.findAll('select')

    await pickFirstAvailableDate(wrapper)
    await selects[0].setValue('pm')
    await inputs[0].setValue('Ruwen Hsieh')
    await inputs[1].setValue('ruwen@example.com')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      designField: '',
      designFocus: '',
    })
  })

  it('renders date choices in a monthly date picker', async () => {
    const wrapper = mountPanel()

    expect(wrapper.get('button.recommendation-panel__date-trigger').text()).toBe('Select a date')

    await wrapper.get('button.recommendation-panel__date-trigger').trigger('click')

    expect(wrapper.text()).toMatch(/[A-Za-z]+ \d{4}/)
    expect(wrapper.findAll('.recommendation-panel__calendar-weekdays span')).toHaveLength(7)
    expect(wrapper.findAll('button.recommendation-panel__calendar-day')).toHaveLength(42)
  })

  it('resets form state', async () => {
    const wrapper = mountPanel()
    const inputs = wrapper.findAll('input.overlay-input')

    await pickFirstAvailableDate(wrapper)
    await inputs[0].setValue('Ruwen Hsieh')
    const resetButton = wrapper.findAll('button').find((button) => button.text() === 'RESET')
    expect(resetButton).toBeTruthy()
    await resetButton!.trigger('click')

    expect(wrapper.get('button.recommendation-panel__date-trigger').text()).toBe('Select a date')
    expect((inputs[0].element as HTMLInputElement).value).toBe('')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
