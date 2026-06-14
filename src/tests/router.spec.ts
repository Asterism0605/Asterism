import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('router', () => {
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
        { name: 'moodboard', path: '/moodboard' },
        { name: 'playground', path: '/playground' },
        { name: 'image-spread', path: '/images/:imageId/spread' },
        { name: 'sign-up', path: '/sign-up' },
        { name: 'style-dna-result', path: '/style-dna/result' }
      ])
    )
  })
})
