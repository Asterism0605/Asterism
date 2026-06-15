import { mount } from '@vue/test-utils'
import { afterEach, describe, it, vi, expect } from 'vitest'
import router from '@/router'

vi.mock('@/layouts/AppHeader.vue', () => ({ default: { template: '<header />' } }))
vi.mock('@/layouts/PageContainer.vue', () => ({ default: { template: '<main><slot /></main>' } }))
vi.mock('@/components/sections/TokenShowcase.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/sections/FloatingImageNetwork.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/ui/ColorPaletteSwatch.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/pages/Playground.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/components/overlay/SignUpOverlay.vue', () => ({ default: { template: '<aside />' } }))
vi.mock('@/components/overlay/LoginOverlay.vue', () => ({ default: { template: '<aside />' } }))

describe('App', () => {
  afterEach(async () => {
    await router.push('/')
  })

  it('does not render the global header on the discover dna entry page', async () => {
    const { default: App } = await import('@/App.vue')

    await router.push('/discover-dna')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('header').exists()).toBe(false)
  })

  it('renders StyleDnaResult on the style dna result path', async () => {
    const { default: App } = await import('@/App.vue')

    await router.push('/style-dna/result')
    await router.isReady()

    mount(App, {
      global: {
        plugins: [router],
      },
    })
  })
})
