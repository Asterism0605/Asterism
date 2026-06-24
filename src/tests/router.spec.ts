import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'

describe('router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('registers every page in src/pages', () => {
    const routes = router.getRoutes().map((route) => ({
      name: route.name,
      path: route.path
    }))

    expect(routes).toEqual(
      expect.arrayContaining([
        { name: 'home', path: '/' },
        { name: 'discover-dna', path: '/discover-dna' },
        { name: 'login', path: '/login' },
        { name: 'moodboard', path: '/moodboard/:slug?' },
        { name: 'playground', path: '/playground' },
        { name: 'image-spread', path: '/images/:imageId/spread' },
        { name: 'picture-detail', path: '/images/:imageId' },
        { name: 'sign-up', path: '/sign-up' },
        { name: 'style-dna', path: '/style-dna' },
        { name: 'style-dna-result', path: '/style-dna/result' },
        { name: 'consultant', path: '/consultant' },
        { name: 'not-found', path: '/:pathMatch(.*)*' }
      ])
    )
  })

  it('keeps one image detail path and falls back only when the image id is missing', async () => {
    const imageDetailRoutes = router
      .getRoutes()
      .filter((route) => route.path === '/images/:imageId')

    expect(imageDetailRoutes).toHaveLength(1)

    await router.push('/images/y2k-main-001')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('picture-detail')

    await router.push('/images/missing-image')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(router.currentRoute.value.meta.errorType).toBe('404')
  })
})
