import { describe, expect, it } from 'vitest'
import { createDNAQuestions, DNA_TEST_QUESTION_COUNT, useDNATest } from '@/composables/useDNATest'
import type { DNAImage } from '@/types/dna-test'

const images: DNAImage[] = Array.from({ length: 24 }, (_, index) => ({
  id: `image-${index + 1}`,
  url: `/image-${index + 1}.webp`,
  style: index % 2 === 0 ? ['Y2K', 'Chrome Design', 'Frutiger Aero'] : ['Cyberpunk', 'Neo Tokyo'],
}))

const sumWeights = (weights: Record<string, number>) =>
  Object.values(weights).reduce((sum, weight) => sum + weight, 0)

describe('createDNAQuestions', () => {
  it('creates twelve questions with two image options each', () => {
    const questions = createDNAQuestions(images)

    expect(questions).toHaveLength(DNA_TEST_QUESTION_COUNT)
    expect(questions[0].options).toHaveLength(2)
  })

  it('normalizes each image option weights to a total score of one', () => {
    const questions = createDNAQuestions(images)

    questions.forEach((question) => {
      question.options.forEach((option) => {
        expect(sumWeights(option.weights)).toBeCloseTo(1)
      })
    })
  })
})

describe('useDNATest', () => {
  it('records selected answers and advances the current question index', () => {
    const questions = createDNAQuestions(images)
    const test = useDNATest(questions)

    const firstOptionId = test.currentQuestion.value!.options[0].id
    test.selectAnswer(firstOptionId)

    expect(test.answers).toHaveLength(1)
    expect(test.answers[0].selectedOptionId).toBe(firstOptionId)
    expect(test.currentQuestionIndex.value).toBe(1)
  })

  it('marks the test as completed after all twelve questions are answered', () => {
    const questions = createDNAQuestions(images)
    const test = useDNATest(questions)

    questions.forEach(() => {
      test.selectAnswer(test.currentQuestion.value!.options[0].id)
    })

    expect(test.answers).toHaveLength(DNA_TEST_QUESTION_COUNT)
    expect(test.isCompleted.value).toBe(true)
    expect(test.result.value?.totalScore).toBeCloseTo(DNA_TEST_QUESTION_COUNT)
  })

  it('ignores selections after the test has completed', () => {
    const questions = createDNAQuestions(images)
    const test = useDNATest(questions)

    questions.forEach(() => {
      test.selectAnswer(test.currentQuestion.value!.options[0].id)
    })

    test.selectAnswer(questions[0].options[1].id)

    expect(test.answers).toHaveLength(DNA_TEST_QUESTION_COUNT)
  })

  it('resets answers, completion state, and current question index', () => {
    const questions = createDNAQuestions(images)
    const test = useDNATest(questions)

    test.selectAnswer(test.currentQuestion.value!.options[0].id)
    test.resetTest(questions)

    expect(test.answers).toHaveLength(0)
    expect(test.currentQuestionIndex.value).toBe(0)
    expect(test.isCompleted.value).toBe(false)
  })
})

