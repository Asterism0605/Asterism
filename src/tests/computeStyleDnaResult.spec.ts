import { describe, it, expect } from 'vitest'
import { computeStyleDnaResult } from '@/utils/computeStyleDnaResult'

describe('computeStyleDnaResult', () => {
  it('returns the fallback result for missing, empty, or invalid selection history', () => {
    for (const history of [undefined, [], [{ style: '   ', image: '/ignored.png' }]]) {
      const result = computeStyleDnaResult(history)

      expect(result.isFallback).toBe(true)
      expect(result.primaryStyle).toBe('Minimalism')
      expect(result.heroImage).toBe('/images/astronaut-dna.png')
      expect(result.styles).toEqual([
        { label: 'Minimalism', percentage: 70 },
        { label: 'Style B', percentage: 20 },
        { label: 'Style C', percentage: 10 },
      ])
      expect(result.annotations).toEqual([
        { label: 'Minimalism', value: '70%', position: 'top-right' },
        { label: 'Style B', value: '20%', position: 'left' },
        { label: 'Style C', value: '10%', position: 'right' },
      ])
    }
  })

  it('orders aggregated style percentages descending', () => {
    const result = computeStyleDnaResult([
      { style: 'Industrial' },
      { style: 'Organic' },
      { style: 'Industrial' },
      { style: 'Minimalism' },
    ])

    expect(result.isFallback).toBe(false)
    expect(result.primaryStyle).toBe('Industrial')
    expect(result.styles.map((style) => style.label)).toEqual([
      'Industrial',
      'Organic',
      'Minimalism',
    ])
    expect(result.styles.map((style) => style.percentage)).toEqual([50, 25, 25])
  })

  it('uses positive weights when aggregating and defaults missing weights to one', () => {
    const result = computeStyleDnaResult([
      { style: 'Eclectic', weight: 2 },
      { style: 'Minimalism' },
      { style: 'Minimalism', weight: 3 },
    ])

    expect(result.styles).toEqual([
      { label: 'Minimalism', percentage: 67 },
      { label: 'Eclectic', percentage: 33 },
    ])
  })

  it('ignores blank styles and non-positive weights', () => {
    const result = computeStyleDnaResult([
      { style: '   ', weight: 10 },
      { style: 'Classic', weight: 0 },
      { style: 'Classic', weight: -1 },
      { style: 'Classic', weight: 2 },
      { style: 'Modern', weight: 1 },
    ])

    expect(result.isFallback).toBe(false)
    expect(result.styles).toEqual([
      { label: 'Classic', percentage: 67 },
      { label: 'Modern', percentage: 33 },
    ])
  })

  it('normalizes rounded percentages to total 100 and chooses a primary-style hero image', () => {
    const result = computeStyleDnaResult([
      { style: 'A', image: '/images/a.png' },
      { style: 'B', image: '/images/b.png' },
      { style: 'C', image: '/images/c.png' },
    ])

    expect(result.styles.reduce((total, style) => total + style.percentage, 0)).toBe(100)
    expect(result.styles.map((style) => style.percentage)).toEqual([34, 33, 33])
    expect(result.primaryStyle).toBe('A')
    expect(result.heroImage).toBe('/images/a.png')
  })

  it('returns only the top three ranked styles and derives annotations from displayed styles', () => {
    const result = computeStyleDnaResult([
      { style: 'A', weight: 5 },
      { style: 'B', weight: 4 },
      { style: 'C', weight: 3 },
      { style: 'D', weight: 2 },
      { style: 'E', weight: 1 },
    ])

    expect(result.styles).toEqual([
      { label: 'A', percentage: 42 },
      { label: 'B', percentage: 33 },
      { label: 'C', percentage: 25 },
    ])
    expect(result.annotations).toEqual([
      { label: 'A', value: '42%', position: 'top-right' },
      { label: 'B', value: '33%', position: 'left' },
      { label: 'C', value: '25%', position: 'right' },
    ])
  })
})
