import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/layouts/AppHeader.vue', () => ({ default: { template: '<header />' } }))
vi.mock('@/layouts/PageContainer.vue', () => ({ default: { template: '<main><slot /></main>' } }))
vi.mock('@/components/sections/TokenShowcase.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/sections/FloatingImageNetwork.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/ui/ColorPaletteSwatch.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/pages/Playground.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/overlay/SignUpOverlay.vue', () => ({ default: { template: '<aside />' } }))
vi.mock('@/components/overlay/LoginOverlay.vue', () => ({ default: { template: '<aside />' } }))

describe('App', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('renders StyleDnaResult on the style dna result path', async () => {
    window.history.pushState({}, '', '/style-dna-result')
    const { default: App } = await import('@/App.vue')

    const wrapper = mount(App)

    expect(wrapper.text()).toContain('Forming')
    expect(wrapper.text()).toContain('Your Style DNA')
  })
})
