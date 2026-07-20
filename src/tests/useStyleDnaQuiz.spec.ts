import { beforeEach, describe, expect, it } from 'vitest'
import {
  STYLE_DNA_MAX_SKIP_COUNT,
  STYLE_DNA_POOL_QUESTION_COUNT,
  STYLE_DNA_QUESTION_COUNT,
} from '@/constants/style-dna.constants'
import { createStyleDnaQuestions, useStyleDnaQuiz } from '@/composables/useStyleDnaQuiz'
import type { StyleDnaImage, StyleDnaQuestion } from '@/types/style-dna'

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

const createSeededRandom = (initialSeed: number) => {
  let seed = initialSeed

  return () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
    return seed / 2_147_483_648
  }
}

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

  it('creates a balanced pool for twelve answers and thirty possible skips', () => {
    const questions = createStyleDnaQuestions(undefined, undefined, () => 0.25)

    expect(questions).toHaveLength(STYLE_DNA_POOL_QUESTION_COUNT)
    questions.forEach((question) => {
      const [firstOption, secondOption] = question.options

      expect(firstOption.image.subMedium).toBeTruthy()
      expect(firstOption.image.subMedium).toBe(secondOption.image.subMedium)
      expect(firstOption.image.styleGroup).not.toBe(secondOption.image.styleGroup)
    })

    const optionImages = questions.flatMap((question) =>
      question.options.map((option) => option.image),
    )
    const groupExposure = optionImages.reduce<Record<string, number>>((exposure, image) => {
      const group = image.styleGroup ?? ''
      exposure[group] = (exposure[group] ?? 0) + 1
      return exposure
    }, {})
    const exposureCounts = Object.values(groupExposure)

    expect(new Set(optionImages.map((image) => image.id)).size).toBe(optionImages.length)
    expect(Math.max(...exposureCounts) - Math.min(...exposureCounts)).toBeLessThanOrEqual(1)
  })

  it('is reproducible when an injected random source is used', () => {
    const first = createStyleDnaQuestions(undefined, 12, createSeededRandom(17))
    const second = createStyleDnaQuestions(undefined, 12, createSeededRandom(17))

    expect(first.map((question) => question.options.map((option) => option.id))).toEqual(
      second.map((question) => question.options.map((option) => option.id)),
    )
  })

  it('keeps the full pool available and balanced across randomized layouts', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const questions = createStyleDnaQuestions(
        undefined,
        STYLE_DNA_POOL_QUESTION_COUNT,
        createSeededRandom(seed),
      )
      const optionImages = questions.flatMap((question) =>
        question.options.map((option) => option.image),
      )
      const exposure = optionImages.reduce<Record<string, number>>((totals, image) => {
        const group = image.styleGroup ?? ''
        totals[group] = (totals[group] ?? 0) + 1
        return totals
      }, {})
      const exposureCounts = Object.values(exposure)

      expect(questions).toHaveLength(STYLE_DNA_POOL_QUESTION_COUNT)
      expect(new Set(optionImages.map((image) => image.id)).size).toBe(optionImages.length)
      expect(Math.max(...exposureCounts) - Math.min(...exposureCounts)).toBeLessThanOrEqual(1)
    }
  })
})

describe('useStyleDnaQuiz', () => {
  const quiz = useStyleDnaQuiz()

  beforeEach(() => {
    quiz.resetQuiz(createStyleDnaQuestions(undefined, undefined, () => 0.25))
  })

  it('skips without recording an answer or advancing answer progress', () => {
    const firstQuestionId = quiz.currentQuestion.value?.id
    const skippedGroups = new Set(
      quiz.currentQuestion.value?.options.map(({ image }) => image.styleGroup) ?? [],
    )

    quiz.skipQuestion()

    expect(quiz.skipCount.value).toBe(1)
    expect(quiz.answeredCount.value).toBe(0)
    expect(quiz.answers).toHaveLength(0)
    expect(quiz.currentQuestion.value?.id).not.toBe(firstQuestionId)
    expect(
      quiz.currentQuestion.value?.options.every(
        ({ image }) => !skippedGroups.has(image.styleGroup),
      ),
    ).toBe(true)
  })

  it('falls back to an available pair when every remaining pair shares a skipped group', () => {
    const fallbackQuestions: StyleDnaQuestion[] = Array.from({ length: 13 }, (_, index) => ({
      id: `fallback-${index}`,
      question: 'Choose',
      options: [
        {
          id: `shared-${index}`,
          image: {
            id: `shared-image-${index}`,
            url: `/shared-${index}.webp`,
            styleGroup: 'Shared Group',
            subMedium: 'Chair',
            style: ['Shared'],
          },
          weights: { Shared: 1 },
        },
        {
          id: `other-${index}`,
          image: {
            id: `other-image-${index}`,
            url: `/other-${index}.webp`,
            styleGroup: index % 2 === 0 ? 'Other A' : 'Other B',
            subMedium: 'Chair',
            style: ['Other'],
          },
          weights: { Other: 1 },
        },
      ],
    }))
    quiz.resetQuiz(fallbackQuestions)

    quiz.skipQuestion()

    expect(quiz.skipCount.value).toBe(1)
    expect(quiz.currentQuestion.value).not.toBeNull()
    expect(
      quiz.currentQuestion.value?.options.some(
        ({ image }) => image.styleGroup === 'Shared Group',
      ),
    ).toBe(true)
  })

  it('allows at most thirty skips while reserving twelve answerable questions', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      quiz.resetQuiz(createStyleDnaQuestions(undefined, undefined, createSeededRandom(seed)))

      for (let index = 0; index < STYLE_DNA_MAX_SKIP_COUNT; index += 1) {
        const skippedGroups = new Set(
          quiz.currentQuestion.value?.options.map(({ image }) => image.styleGroup) ?? [],
        )
        expect(quiz.canSkip.value).toBe(true)
        quiz.skipQuestion()
        expect(
          quiz.currentQuestion.value?.options.every(
            ({ image }) => !skippedGroups.has(image.styleGroup),
          ),
        ).toBe(true)
      }

      expect(quiz.skipCount.value).toBe(STYLE_DNA_MAX_SKIP_COUNT)
      expect(quiz.canSkip.value).toBe(false)
    }

    quiz.skipQuestion()
    expect(quiz.skipCount.value).toBe(STYLE_DNA_MAX_SKIP_COUNT)
  })

  it('completes after twelve selected answers even when questions were skipped', () => {
    quiz.skipQuestion()
    quiz.skipQuestion()

    for (let index = 0; index < STYLE_DNA_QUESTION_COUNT; index += 1) {
      const optionId = quiz.currentQuestion.value?.options[0].id
      expect(optionId).toBeTruthy()
      quiz.selectAnswer(optionId as string)
    }

    expect(quiz.answers).toHaveLength(STYLE_DNA_QUESTION_COUNT)
    expect(quiz.isCompleted.value).toBe(true)
    expect(quiz.result.value).not.toBeNull()
  })

  it('prioritizes a comparison between leading groups after eight answers', () => {
    for (let index = 0; index < 8; index += 1) {
      const currentQuestion = quiz.currentQuestion.value
      expect(currentQuestion).not.toBeNull()

      const preferredOption = currentQuestion?.options.find(({ image }) =>
        ['Y2K & Internet Aesthetics', 'Experimental & Avant-Garde'].includes(
          image.styleGroup ?? '',
        ),
      )
      quiz.selectAnswer((preferredOption ?? currentQuestion?.options[0])?.id ?? '')
    }

    const wins = quiz.answers.reduce<Record<string, number>>((totals, answer) => {
      const group = answer.selectedImage.styleGroup ?? ''
      totals[group] = (totals[group] ?? 0) + 1
      return totals
    }, {})
    const leadingGroups = new Set(
      Object.entries(wins)
        .sort((first, second) => second[1] - first[1])
        .slice(0, 3)
        .map(([group]) => group),
    )
    const currentGroups = quiz.currentQuestion.value?.options.map(
      ({ image }) => image.styleGroup ?? '',
    ) ?? []

    expect(currentGroups.some((group) => leadingGroups.has(group))).toBe(true)
  })

  it('reduces the effective skip limit for a smaller question pool', () => {
    const smallerPool = createStyleDnaQuestions(undefined, STYLE_DNA_QUESTION_COUNT + 2, () => 0.25)
    quiz.resetQuiz(smallerPool)

    expect(quiz.effectiveMaxSkipCount.value).toBe(2)
    quiz.skipQuestion()
    quiz.skipQuestion()
    expect(quiz.canSkip.value).toBe(false)
  })
})
