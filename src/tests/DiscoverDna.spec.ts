import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DiscoverDna from '@/pages/DiscoverDna.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@/components/effects/ConstellationBackground.vue', () => ({
  default: { template: '<div data-testid="constellation" />' }
}))

describe('DiscoverDna', () => {
  it('renders the Style DNA introduction with existing visual layers', () => {
    const wrapper = mount(DiscoverDna)

    expect(wrapper.find('header').exists()).toBe(false)
    expect(wrapper.find('.dna-intro-hero__logo').exists()).toBe(false)
    expect(wrapper.find('.discover-dna-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('Discover')
    expect(wrapper.text()).toContain('Your Style DNA')
    expect(wrapper.text()).toContain('A quick visual quiz that learns your design taste')
    expect(wrapper.findAll('[data-testid="constellation"]').length).toBeGreaterThan(0)
  })

  it('routes the primary CTA to the Style DNA quiz without storing state', async () => {
    push.mockClear()
    const wrapper = mount(DiscoverDna)

    await wrapper.get('[data-testid="start-dna-cta"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/style-dna')
  })
})
