import { describe, expect, it } from 'vitest'
import { STYLE_DNA_QUESTION_COUNT } from '@/constants/style-dna.constants'
import { createStyleDnaQuestions } from '@/composables/useStyleDnaQuiz'
import type { StyleDnaImage } from '@/types/style-dna'

const images: StyleDnaImage[] = [
  {
    id: 'top-a',
    url: '/top-a.webp',
    styleGroup: 'Group A',
    medium: 'Outfit',
    subMedium: 'Top',
    style: ['Minimalism'],
  },
  {
    id: 'top-b',
    url: '/top-b.webp',
    styleGroup: 'Group B',
    medium: 'Outfit',
    subMedium: 'Top',
    style: ['Cyberpunk'],
  },
  {
    id: 'chair-a',
    url: '/chair-a.webp',
    styleGroup: 'Group A',
    medium: 'Interior',
    subMedium: 'Chair',
    style: ['Industrial'],
  },
  {
    id: 'chair-c',
    url: '/chair-c.webp',
    styleGroup: 'Group C',
    medium: 'Interior',
    subMedium: 'Chair',
    style: ['Memphis'],
  },
  {
    id: 'missing-sub-medium',
    url: '/missing-sub-medium.webp',
    styleGroup: 'Group D',
    medium: 'Graphic Design',
    style: ['Y2K'],
  },
  {
    id: 'same-style-group-only',
    url: '/same-style-group-only.webp',
    styleGroup: 'Group A',
    medium: 'Outfit',
    subMedium: 'Accessory',
    style: ['Minimalism'],
  },
]

const getOptionImages = (questions = createStyleDnaQuestions(images, 2)) =>
  questions.map((question) => question.options.map((option) => option.image))

describe('createStyleDnaQuestions', () => {
  it('pairs images from the same subMedium but different styleGroup', () => {
    const optionImages = getOptionImages()

    expect(optionImages).toHaveLength(2)
    optionImages.forEach(([firstImage, secondImage]) => {
      expect(firstImage.subMedium).toBe(secondImage.subMedium)
      expect(firstImage.styleGroup).not.toBe(secondImage.styleGroup)
    })
  })

  it('uses only images with subMedium and never repeats an image in one quiz', () => {
    const optionImages = getOptionImages().flat()
    const ids = optionImages.map((image) => image.id)

    expect(optionImages.every((image) => image.subMedium)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('creates twelve valid questions from the default Style DNA image dataset', () => {
    const questions = createStyleDnaQuestions()

    expect(questions).toHaveLength(STYLE_DNA_QUESTION_COUNT)
    questions.forEach((question) => {
      const [firstOption, secondOption] = question.options

      expect(firstOption.image.subMedium).toBeTruthy()
      expect(firstOption.image.subMedium).toBe(secondOption.image.subMedium)
      expect(firstOption.image.styleGroup).not.toBe(secondOption.image.styleGroup)
    })
  })
})
