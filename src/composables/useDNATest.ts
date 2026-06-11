import { computed, reactive, ref } from 'vue'
import styleData from '@/data/style-data.json'
import { calculateDNA } from '@/utils/calculateDNA'
import type { DNAAnswer, DNAImage, DNAQuestion, DNATestOption } from '@/types/dna-test'

export const DNA_TEST_QUESTION_COUNT = 12

const OPTIONS_PER_QUESTION = 2

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

const toDNAImage = (item: (typeof styleData)[number]): DNAImage => ({
  id: item.id,
  url: item.url,
  title: item.title,
  style: [...item.style],
})

const shuffleImages = (images: DNAImage[]) => {
  const shuffled = [...images]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

const createOption = (image: DNAImage): DNATestOption => ({
  id: image.id,
  image,
  weights: createWeightsFromStyles(image.style),
})

export const createDNAQuestions = (
  images: DNAImage[] = styleData.map(toDNAImage),
  questionCount = DNA_TEST_QUESTION_COUNT,
) => {
  const requiredImageCount = questionCount * OPTIONS_PER_QUESTION
  const availableImages = shuffleImages(images).slice(0, requiredImageCount)

  return Array.from({ length: Math.floor(availableImages.length / OPTIONS_PER_QUESTION) }, (_, index) => {
    const firstImage = availableImages[index * OPTIONS_PER_QUESTION]
    const secondImage = availableImages[index * OPTIONS_PER_QUESTION + 1]

    return {
      id: `dna-question-${index + 1}`,
      question: 'Choose your preferred style.',
      options: [createOption(firstImage), createOption(secondImage)] as [DNATestOption, DNATestOption],
    }
  })
}

export const useDNATest = (initialQuestions: DNAQuestion[] = createDNAQuestions()) => {
  const currentQuestionIndex = ref(0)
  const answers = reactive<DNAAnswer[]>([])
  const questions = ref<DNAQuestion[]>(initialQuestions)

  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
  const isCompleted = computed(() => answers.length >= questions.value.length)
  const result = computed(() => (isCompleted.value ? calculateDNA(answers) : null))

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

  const resetTest = (nextQuestions: DNAQuestion[] = createDNAQuestions()) => {
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
    resetTest,
  }
}

