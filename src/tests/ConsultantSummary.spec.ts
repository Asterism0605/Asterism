import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConsultantSummary from '@/components/feature/consultant/ConsultantSummary.vue'

describe('ConsultantSummary', () => {
  it('shows a Style DNA CTA without rendering a profile when the quiz is incomplete', () => {
    const wrapper = mount(ConsultantSummary, {
      props: {
        status: 'missing-result'
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('We need a Style DNA result')
    expect(wrapper.get('a[href="/style-dna"]').text()).toContain('Take Style DNA quiz')
    expect(wrapper.find('.consultant-summary__profile').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Matched consultant')
  })

  it('renders Style DNA rows and the matched consultant when ready', () => {
    const wrapper = mount(ConsultantSummary, {
      props: {
        status: 'ready',
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
    expect(wrapper.find('[data-testid="consultant-style-dna-fallback"]').exists()).toBe(false)
  })

  it('shows a pending placeholder instead of a consultant name when nothing is matched yet', () => {
    const wrapper = mount(ConsultantSummary, {
      props: {
        status: 'ready',
        profile: {
          styleDna: [{ label: 'Luminous Minimalism', percentage: 54 }],
          consultantLabel: null,
        },
      },
    })

    expect(wrapper.text()).toContain('Matched consultant')
    expect(wrapper.text()).not.toContain('Spatial Consultant')
  })
})
