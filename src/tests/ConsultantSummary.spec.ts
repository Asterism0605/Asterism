import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConsultantSummary from '@/components/feature/consultant/ConsultantSummary.vue'

describe('ConsultantSummary', () => {
  it('renders the booking copy and consultant profile', () => {
    const wrapper = mount(ConsultantSummary, {
      props: {
        hasSourceData: true,
        profile: {
          styleDna: [
            { label: 'Luminous Minimalism', percentage: 54 },
            { label: 'Organic Modern', percentage: 28 },
            { label: 'Soft Industrial', percentage: 18 },
          ],
          consultantLabel: 'Spatial Consultant · Mira Chen',
        },
      },
    })

    expect(wrapper.text()).toContain('Consultation Booking')
    expect(wrapper.text()).toContain('Your aesthetic coordinates have been mapped.')
    expect(wrapper.text()).toContain('Style DNA')
    expect(wrapper.text()).toContain('Luminous Minimalism')
    expect(wrapper.text()).toContain('54%')
    expect(wrapper.text()).not.toContain('Design direction')
    expect(wrapper.text()).toContain('Spatial Consultant · Mira Chen')
  })

  it('shows fallback CTAs without source data', () => {
    const wrapper = mount(ConsultantSummary)

    expect(wrapper.text()).toContain('We need a Style DNA result')
    expect(wrapper.get('a[href="/style-dna"]').text()).toContain('Retake quiz')
    expect(wrapper.find('button').text()).toContain('Skip')
  })
})
