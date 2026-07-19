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
        { name: 'image-search', path: '/search-by-image' },
        { name: 'picture-detail', path: '/images/:imageId' },
        { name: 'sign-up', path: '/sign-up' },
        { name: 'style-dna', path: '/style-dna' },
        { name: 'style-dna-result', path: '/style-dna/result' },
        { name: 'consultant', path: '/consultant' },
        { name: 'account-consultations', path: '/account/consultations' },
        { name: 'not-found', path: '/:pathMatch(.*)*' }
      ])
    )
  })

  it('protects account routes with the existing auth guard', () => {
    const protectedNames = [
      'moodboard',
      'account-consultations',
      'discover-dna',
      'style-dna',
      'style-dna-result',
      'consultant'
    ]

    for (const name of protectedNames) {
      const route = router.getRoutes().find((r) => r.name === name)
      expect(route?.meta.requiresAuth, `${name} should require auth`).toBe(true)
    }
  })

  it('redirects guests to login with a next param on protected routes', async () => {
    await router.push('/style-dna')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.next).toBe('/style-dna')
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
