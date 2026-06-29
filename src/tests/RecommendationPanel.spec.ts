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

async function pickDropdownOption(
  wrapper: ReturnType<typeof mountPanel>,
  dropdownIndex: number,
  optionText: string,
) {
  const trigger = wrapper.findAll('button.recommendation-panel__dropdown-trigger')[dropdownIndex]
  expect(trigger).toBeTruthy()
  await trigger.trigger('click')

  const option = wrapper
    .findAll('button.recommendation-panel__dropdown-option')
    .find((button) => button.text().includes(optionText))

  expect(option).toBeTruthy()
  await option!.trigger('click')
}

describe('RecommendationPanel', () => {
  it('renders the required booking fields', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Consultation Method')
    expect(wrapper.text()).toContain('Date')
    expect(wrapper.text()).toContain('Time Slot')
    expect(wrapper.text()).toContain('Design Field')
    expect(wrapper.text()).toContain('Contact Phone')
    expect(wrapper.text()).toContain('Additional Notes')
    expect(wrapper.text()).toContain('Consultation Fee')
    expect(wrapper.text()).toContain('NT$500 deposit')
    expect(wrapper.text()).toContain('A consultation deposit is required to submit your request.')
    expect(wrapper.text()).toContain('I understand and agree to continue to payment.')
    expect(wrapper.text()).toContain('For demo purposes only. No real payment will be charged.')
    expect(wrapper.text()).toContain('Confirm & Pay')
    expect(wrapper.text()).toContain('Reset')
    expect(wrapper.text()).not.toContain('Use my account info')
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('prefills contact fields from account info', () => {
    const wrapper = mountPanel()

    const inputs = wrapper.findAll('input.overlay-input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Ruwen Hsieh')
    expect((inputs[1].element as HTMLInputElement).value).toBe('ruwen@example.com')
    expect((inputs[2].element as HTMLInputElement).value).toBe('')
  })

  it('blocks incomplete submissions and emits valid payloads', async () => {
    const wrapper = mountPanel()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Date is required.')
    expect(wrapper.text()).toContain('Contact phone is required.')
    expect(wrapper.text()).toContain('Please confirm the consultation deposit before continuing.')

    const inputs = wrapper.findAll('input.overlay-input')
    const selectedDate = await pickFirstAvailableDate(wrapper)
    await pickDropdownOption(wrapper, 0, 'AM')
    await pickDropdownOption(wrapper, 1, 'Interior Design')
    await pickDropdownOption(wrapper, 2, 'Spatial Mood')
    await inputs[0].setValue('Ruwen Hsieh')
    await inputs[1].setValue('ruwen@example.com')
    await inputs[2].setValue('+886 912 345 678')
    await wrapper.get('input[type="checkbox"]').setValue(true)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      method: 'online',
      date: selectedDate,
      timeSlot: 'am',
      designField: 'Interior Design',
      designFocus: 'Spatial Mood',
      name: 'Ruwen Hsieh',
      email: 'ruwen@example.com',
      contactPhone: '+886 912 345 678',
      paymentConfirmed: true,
    })
  })

  it('allows design field and focus to be omitted', async () => {
    const wrapper = mountPanel()
    const inputs = wrapper.findAll('input.overlay-input')

    await pickFirstAvailableDate(wrapper)
    await pickDropdownOption(wrapper, 0, 'PM')
    await inputs[0].setValue('Ruwen Hsieh')
    await inputs[1].setValue('ruwen@example.com')
    await inputs[2].setValue('+886 912 345 678')
    await wrapper.get('input[type="checkbox"]').setValue(true)

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
    await inputs[0].setValue('Custom Name')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    const resetButton = wrapper.findAll('button').find((button) => button.text() === 'Reset')
    expect(resetButton).toBeTruthy()
    await resetButton!.trigger('click')

    expect(wrapper.get('button.recommendation-panel__date-trigger').text()).toBe('Select a date')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Ruwen Hsieh')
    expect((inputs[2].element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
