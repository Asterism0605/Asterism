import { describe, expect, it } from 'vitest'
import { calculateDNA } from '@/utils/calculateDNA'
import type { DNAAnswer } from '@/types/dna-test'

const createWeightedAnswer = (id: string, styles: string[]): DNAAnswer => {
  const weightPerTag = styles.length === 0 ? 0 : 1 / styles.length

  return {
    questionId: `question-${id}`,
    selectedOptionId: `option-${id}`,
    selectedImage: {
      id: `image-${id}`,
      url: `/image-${id}.webp`,
      style: styles,
    },
    weights: styles.reduce<Record<string, number>>((weights, style) => {
      weights[style] = (weights[style] ?? 0) + weightPerTag
      return weights
    }, {}),
  }
}

describe('calculateDNA', () => {
  it('returns top three style tags sorted by weighted score', () => {
    const result = calculateDNA([
      createWeightedAnswer('1', ['Y2K', 'Chrome Design', 'Frutiger Aero', 'Bubblegum Futurism']),
      createWeightedAnswer('2', ['Y2K', 'Chrome Design', 'Frutiger Aero']),
      createWeightedAnswer('3', ['Cyberpunk', 'Y2K']),
      createWeightedAnswer('4', ['Cyberpunk', 'Neo Tokyo']),
    ])

    expect(result.topStyles).toEqual([
      { tag: 'Y2K', score: 1.0833, percentage: 27.1 },
      { tag: 'Cyberpunk', score: 1, percentage: 25 },
      { tag: 'Chrome Design', score: 0.5833, percentage: 14.6 },
    ])
  })

  it('uses all weighted tag scores as the percentage denominator', () => {
    const result = calculateDNA([
      createWeightedAnswer('1', ['Y2K', 'Chrome Design', 'Frutiger Aero', 'Bubblegum Futurism']),
      createWeightedAnswer('2', ['Y2K', 'Chrome Design', 'Frutiger Aero']),
    ])

    expect(result.totalScore).toBe(2)
    expect(result.topStyles).toEqual([
      { tag: 'Chrome Design', score: 0.5833, percentage: 29.2 },
      { tag: 'Frutiger Aero', score: 0.5833, percentage: 29.2 },
      { tag: 'Y2K', score: 0.5833, percentage: 29.2 },
    ])
  })

  it('returns an empty result for empty answers', () => {
    expect(calculateDNA([])).toEqual({
      topStyles: [],
      totalScore: 0,
    })
  })
})
