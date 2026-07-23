import { computed, reactive, ref } from 'vue'
import {
  STYLE_DNA_IMAGES,
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

  // 每張被選中的圖片總分為 1，平均分配到它擁有的所有 style tag。
  const weightPerTag = 1 / styles.length

  return styles.reduce<Record<string, number>>((weights, style) => {
    weights[style] = (weights[style] ?? 0) + weightPerTag
    return weights
  }, {})
}

const shuffleItems = <T>(items: T[]) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

const hasPairingMetadata = (
  image: StyleDnaImage,
): image is StyleDnaImage & { styleGroup: string; subMedium: string } =>
  Boolean(image.styleGroup?.trim() && image.subMedium?.trim())

// 題目選項必須同類型比較，所以只有帶有 subMedium metadata 的圖片能進入題庫。
const groupImagesBySubMedium = (images: StyleDnaImage[]) =>
  shuffleItems(images)
    .filter(hasPairingMetadata)
    .reduce<Record<string, StyleDnaImage[]>>((groups, image) => {
      const subMedium = image.subMedium.trim()
      groups[subMedium] = groups[subMedium] ?? []
      groups[subMedium].push(image)
      return groups
    }, {})

// 從同一個 subMedium 中取出不同 styleGroup 的兩張圖，並移除它們以避免重複出題。
const takeStyleGroupPair = (images: StyleDnaImage[]): [StyleDnaImage, StyleDnaImage] | null => {
  for (let firstIndex = 0; firstIndex < images.length; firstIndex += 1) {
    const firstImage = images[firstIndex]
    const secondIndex = images.findIndex(
      (image, index) => index > firstIndex && image.styleGroup !== firstImage.styleGroup,
    )

    if (secondIndex === -1) {
      continue
    }

    const [secondImage] = images.splice(secondIndex, 1)
    const [selectedFirstImage] = images.splice(firstIndex, 1)

    return [selectedFirstImage, secondImage]
  }

  return null
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
  // 依 subMedium 分組產題，確保每題都是 Top vs Top、Chair vs Chair 這類同型比較。
  const groupedImages = groupImagesBySubMedium(images)
  const imageGroups = shuffleItems(Object.values(groupedImages))
  const questions: StyleDnaQuestion[] = []

  while (questions.length < questionCount) {
    let didCreateQuestion = false

    for (const imageGroup of imageGroups) {
      if (questions.length >= questionCount) {
        break
      }

      const pair = takeStyleGroupPair(imageGroup)

      if (!pair) {
        continue
      }

      questions.push({
        id: `style-dna-question-${questions.length + 1}`,
        question: 'Click to choose your preferred style',
        options: [createOption(pair[0]), createOption(pair[1])] as [StyleDnaOption, StyleDnaOption],
      })
      didCreateQuestion = true
    }

    if (!didCreateQuestion) {
      break
    }
  }

  return questions
}

// 測驗進行中的狀態存在這個 composable；完成後的結果才交由 Pinia store 持久化。
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
