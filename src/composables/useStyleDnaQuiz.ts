import { computed, reactive, ref } from 'vue'
import {
  STYLE_DNA_IMAGES,
  STYLE_DNA_OPTIONS_PER_QUESTION,
  STYLE_DNA_QUESTION_COUNT,
} from '@/constants/style-dna.constants'
import { computeStyleDnaResult } from '@/utils/computeStyleDnaResult'
import type {
  StyleDnaAnswer,
  StyleDnaImage,
  StyleDnaOption,
  StyleDnaQuestion,
} from '@/types/style-dna'

const createWeightsFromStyles = (styles: string[]) => {
  if (styles.length === 0) {
    return {}
  }

  const weightPerTag = 1 / styles.length

  return styles.reduce<Record<string, number>>((weights, style) => {
    weights[style] = (weights[style] ?? 0) + weightPerTag
    return weights
  }, {})
}

const shuffleImages = (images: StyleDnaImage[]) => {
  const shuffled = [...images]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

const createOption = (image: StyleDnaImage): StyleDnaOption => ({
  id: image.id,
  image,
  weights: createWeightsFromStyles(image.style),
})

export const createStyleDnaQuestions = (
  images: StyleDnaImage[] = STYLE_DNA_IMAGES,
  questionCount = STYLE_DNA_QUESTION_COUNT,
) => {
  const requiredImageCount = questionCount * STYLE_DNA_OPTIONS_PER_QUESTION
  const availableImages = shuffleImages(images).slice(0, requiredImageCount)

  return Array.from(
    { length: Math.floor(availableImages.length / STYLE_DNA_OPTIONS_PER_QUESTION) },
    (_, index) => {
      const firstImage = availableImages[index * STYLE_DNA_OPTIONS_PER_QUESTION]
      const secondImage = availableImages[index * STYLE_DNA_OPTIONS_PER_QUESTION + 1]

      return {
        id: `style-dna-question-${index + 1}`,
        question: 'Click to choose your preferred style',
        options: [createOption(firstImage), createOption(secondImage)] as [StyleDnaOption, StyleDnaOption],
      }
    },
  )
}

const currentQuestionIndex = ref(0)
const answers = reactive<StyleDnaAnswer[]>([])
const questions = ref<StyleDnaQuestion[]>(createStyleDnaQuestions())

export const useStyleDnaQuiz = () => {
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
  const isCompleted = computed(() => answers.length >= questions.value.length)
  const result = computed(() => (isCompleted.value ? computeStyleDnaResult(answers) : null))

  const selectAnswer = (selectedOptionId: string) => {
    if (isCompleted.value || !currentQuestion.value) {
      return
    }

    const selectedOption = currentQuestion.value.options.find((option) => option.id === selectedOptionId)

    if (!selectedOption) {
      return
    }

    answers.push({
      questionId: currentQuestion.value.id,
      selectedOptionId: selectedOption.id,
      selectedImage: selectedOption.image,
      weights: selectedOption.weights,
    })

    currentQuestionIndex.value += 1
  }

  const resetQuiz = (nextQuestions: StyleDnaQuestion[] = createStyleDnaQuestions()) => {
    currentQuestionIndex.value = 0
    answers.splice(0, answers.length)
    questions.value = nextQuestions
  }

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    isCompleted,
    result,
    selectAnswer,
    resetQuiz,
  }
}

