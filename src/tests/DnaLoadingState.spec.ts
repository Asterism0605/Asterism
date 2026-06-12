import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue'

describe('DnaLoadingState', () => {
  it('renders the loading title', () => {
    const wrapper = mount(DnaLoadingState)

    expect(wrapper.text()).toContain('Forming')
    expect(wrapper.text()).toContain('Your Style DNA')
  })
})
