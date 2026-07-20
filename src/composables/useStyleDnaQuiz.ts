import { computed, reactive, ref } from 'vue'
import {
  STYLE_DNA_EXPLORATION_QUESTION_COUNT,
  STYLE_DNA_IMAGES,
  STYLE_DNA_MAX_SKIP_COUNT,
  STYLE_DNA_POOL_QUESTION_COUNT,
  STYLE_DNA_QUESTION_COUNT,
} from '@/constants/style-dna.constants'
import { computeStyleDnaResult } from '@/utils/computeStyleDnaResult'
import type {
  StyleDnaAnswer,
  StyleDnaImage,
  StyleDnaOption,
  StyleDnaQuestion,
} from '@/types/style-dna'

/**
 * Style DNA 測驗流程概要：
 * 1. 從具有 styleGroup 與 subMedium 的圖片建立不重複候選題池。
 * 2. 每題維持相同 subMedium、不同 styleGroup，並平衡風格曝光與左右位置。
 * 3. 前 8 次有效選擇廣泛探索；之後優先比較分數接近的領先風格。
 * 4. 跳過不計分，下一組優先排除剛跳過的兩個 styleGroup。
 * 5. 累積 12 次有效選擇後才計算並交付既有 Style DNA 結果。
 *
 * 題池、跳過與作答進度只存在前端記憶體，不改變 Pinia、localStorage 或後端格式。
 */
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

type RandomSource = () => number
type PairableStyleDnaImage = StyleDnaImage & { styleGroup: string; subMedium: string }

interface PairCandidate {
  first: PairableStyleDnaImage
  second: PairableStyleDnaImage
  matchupKey: string
  subMedium: string
}

interface GroupPreferenceScore {
  group: string
  score: number
}

const shuffleItems = <T>(items: T[], random: RandomSource = Math.random) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

const hasPairingMetadata = (
  image: StyleDnaImage,
): image is PairableStyleDnaImage =>
  Boolean(image.styleGroup?.trim() && image.subMedium?.trim())

// 題目選項必須同類型比較，所以只有帶有 subMedium metadata 的圖片能進入題庫。
const groupImagesBySubMedium = (images: StyleDnaImage[], random: RandomSource) =>
  shuffleItems(images, random)
    .filter(hasPairingMetadata)
    .reduce<Record<string, PairableStyleDnaImage[]>>((groups, image) => {
      const subMedium = image.subMedium.trim()
      groups[subMedium] = groups[subMedium] ?? []
      groups[subMedium].push(image)
      return groups
    }, {})

const createOption = (image: StyleDnaImage): StyleDnaOption => ({
  id: image.id,
  image,
  weights: createWeightsFromStyles(image.style),
})

/**
 * 建立單次測驗可使用的候選題池。
 *
 * 預設建立 42 組，供 12 次有效作答與最多 30 次跳過使用。每輪都從尚未使用的
 * 圖片組合中挑選最低分者；分數越低代表風格曝光、重複對戰與 subMedium 曝光越少。
 * random 僅用於同分候選的洗牌，測試可注入固定亂數以重現題目順序。
 */
export const createStyleDnaQuestions = (
  images: StyleDnaImage[] = STYLE_DNA_IMAGES,
  questionCount = STYLE_DNA_POOL_QUESTION_COUNT,
  random: RandomSource = Math.random,
) => {
  const groupedImages = groupImagesBySubMedium(images, random)
  const candidates: PairCandidate[] = []

  Object.entries(groupedImages).forEach(([subMedium, imageGroup]) => {
    for (let firstIndex = 0; firstIndex < imageGroup.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < imageGroup.length; secondIndex += 1) {
        const first = imageGroup[firstIndex]
        const second = imageGroup[secondIndex]

        if (first.styleGroup === second.styleGroup) {
          continue
        }

        candidates.push({
          first,
          second,
          matchupKey: [first.styleGroup, second.styleGroup].sort().join('::'),
          subMedium,
        })
      }
    }
  })

  const usedImageIds = new Set<string>()
  const groupExposure = new Map<string, number>()
  const groupLeftExposure = new Map<string, number>()
  const groupRightExposure = new Map<string, number>()
  const matchupExposure = new Map<string, number>()
  const subMediumExposure = new Map<string, number>()
  const questions: StyleDnaQuestion[] = []

  while (questions.length < questionCount) {
    const availableCandidates = candidates.filter(
      ({ first, second }) => !usedImageIds.has(first.id) && !usedImageIds.has(second.id),
    )

    if (availableCandidates.length === 0) {
      break
    }

    const rankedCandidates = availableCandidates
      .map((candidate) => {
        const firstExposure = groupExposure.get(candidate.first.styleGroup) ?? 0
        const secondExposure = groupExposure.get(candidate.second.styleGroup) ?? 0

        return {
          candidate,
          // 權重依重要性排序：先平衡 styleGroup，再避免相同對戰與 subMedium 過度集中。
          score:
            Math.max(firstExposure, secondExposure) * 10_000 +
            (firstExposure + secondExposure) * 1_000 +
            (matchupExposure.get(candidate.matchupKey) ?? 0) * 100 +
            (subMediumExposure.get(candidate.subMedium) ?? 0) * 10 +
            random(),
        }
      })
      .sort((first, second) => first.score - second.score)

    const selectedCandidate = rankedCandidates[0].candidate
    const firstGroup = selectedCandidate.first.styleGroup
    const secondGroup = selectedCandidate.second.styleGroup
    // 分別計算兩種左右配置的失衡程度，選擇能讓各風格左右出現次數更接近者。
    const firstOnLeftCost =
      Math.abs((groupLeftExposure.get(firstGroup) ?? 0) + 1 - (groupRightExposure.get(firstGroup) ?? 0)) +
      Math.abs((groupLeftExposure.get(secondGroup) ?? 0) - ((groupRightExposure.get(secondGroup) ?? 0) + 1))
    const secondOnLeftCost =
      Math.abs((groupLeftExposure.get(secondGroup) ?? 0) + 1 - (groupRightExposure.get(secondGroup) ?? 0)) +
      Math.abs((groupLeftExposure.get(firstGroup) ?? 0) - ((groupRightExposure.get(firstGroup) ?? 0) + 1))
    const shouldPutFirstOnLeft =
      firstOnLeftCost < secondOnLeftCost ||
      (firstOnLeftCost === secondOnLeftCost && random() < 0.5)
    const leftImage = shouldPutFirstOnLeft ? selectedCandidate.first : selectedCandidate.second
    const rightImage = shouldPutFirstOnLeft ? selectedCandidate.second : selectedCandidate.first

    questions.push({
      id: `style-dna-question-${questions.length + 1}`,
      question: 'Click to choose your preferred style',
      options: [createOption(leftImage), createOption(rightImage)],
    })

    usedImageIds.add(leftImage.id)
    usedImageIds.add(rightImage.id)
    groupExposure.set(firstGroup, (groupExposure.get(firstGroup) ?? 0) + 1)
    groupExposure.set(secondGroup, (groupExposure.get(secondGroup) ?? 0) + 1)
    groupLeftExposure.set(leftImage.styleGroup, (groupLeftExposure.get(leftImage.styleGroup) ?? 0) + 1)
    groupRightExposure.set(
      rightImage.styleGroup,
      (groupRightExposure.get(rightImage.styleGroup) ?? 0) + 1,
    )
    matchupExposure.set(
      selectedCandidate.matchupKey,
      (matchupExposure.get(selectedCandidate.matchupKey) ?? 0) + 1,
    )
    subMediumExposure.set(
      selectedCandidate.subMedium,
      (subMediumExposure.get(selectedCandidate.subMedium) ?? 0) + 1,
    )
  }

  return questions
}

const getQuestionGroups = (question: StyleDnaQuestion) =>
  question.options.map((option) => option.image.styleGroup).filter((group): group is string => Boolean(group))

const getAnsweredGroupExposure = (
  quizQuestions: StyleDnaQuestion[],
  quizAnswers: StyleDnaAnswer[],
) => {
  const questionById = new Map(quizQuestions.map((question) => [question.id, question]))
  const exposure = new Map<string, number>()

  quizAnswers.forEach((answer) => {
    const question = questionById.get(answer.questionId)

    if (!question) {
      return
    }

    getQuestionGroups(question).forEach((group) => {
      exposure.set(group, (exposure.get(group) ?? 0) + 1)
    })
  })

  return exposure
}

// 以「被選次數／有效曝光次數」估算測驗進行中的高階風格偏好，僅供自適應出題排序。
const getGroupPreferenceScores = (
  quizQuestions: StyleDnaQuestion[],
  quizAnswers: StyleDnaAnswer[],
): GroupPreferenceScore[] => {
  const exposure = getAnsweredGroupExposure(quizQuestions, quizAnswers)
  const wins = new Map<string, number>()

  quizAnswers.forEach((answer) => {
    const group = answer.selectedImage.styleGroup?.trim()

    if (group) {
      wins.set(group, (wins.get(group) ?? 0) + 1)
    }
  })

  return Array.from(exposure.keys())
    .map((group) => ({
      group,
      // 使用 Beta(1, 1) 平滑，避免一次早期選擇就被視為確定偏好。
      score: ((wins.get(group) ?? 0) + 1) / ((exposure.get(group) ?? 0) + 2),
    }))
    .sort((first, second) => second.score - first.score || first.group.localeCompare(second.group))
}

// 測驗進行中的狀態存在這個 composable；完成後的結果才交由 Pinia store 持久化。
const currentQuestionIndex = ref(0)
const skipCount = ref(0)
const answers = reactive<StyleDnaAnswer[]>([])
const questions = ref<StyleDnaQuestion[]>(createStyleDnaQuestions())

export const useStyleDnaQuiz = () => {
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
  const answeredCount = computed(() => answers.length)
  // 小型或不完整圖池會自動降低跳過上限，永遠優先保留 12 組可作答題目。
  const effectiveMaxSkipCount = computed(() =>
    Math.min(
      STYLE_DNA_MAX_SKIP_COUNT,
      Math.max(0, questions.value.length - STYLE_DNA_QUESTION_COUNT),
    ),
  )
  const isCompleted = computed(() => answers.length >= STYLE_DNA_QUESTION_COUNT)
  const canSkip = computed(() => {
    const remainingQuestions = questions.value.length - currentQuestionIndex.value
    const remainingAnswers = STYLE_DNA_QUESTION_COUNT - answers.length

    return (
      !isCompleted.value &&
      Boolean(currentQuestion.value) &&
      skipCount.value < effectiveMaxSkipCount.value &&
      remainingQuestions > remainingAnswers
    )
  })
  const result = computed(() => (isCompleted.value ? computeStyleDnaResult(answers) : null))

  /**
   * 從尚未顯示的題目中挑選下一組，排序優先級如下：
   * 1. 避開剛被跳過的 styleGroup；無其他候選時才允許安全回退。
   * 2. 第 8 次有效選擇後，優先比較目前排名前三且分數接近的風格。
   * 3. 優先補足有效答案中曝光較少的風格。
   *
   * 只交換尚未顯示題目的順序，不修改圖片資料或既有答案。
   */
  const prioritizeCurrentQuestion = (excludedGroups: ReadonlySet<string> = new Set()) => {
    if (currentQuestionIndex.value >= questions.value.length) {
      return
    }

    const remainingQuestions = questions.value.slice(currentQuestionIndex.value)
    const answeredExposure = getAnsweredGroupExposure(questions.value, answers)
    const preferenceScores = getGroupPreferenceScores(questions.value, answers)
    const topGroups = new Set(preferenceScores.slice(0, 3).map(({ group }) => group))
    const scoreByGroup = new Map(preferenceScores.map(({ group, score }) => [group, score]))
    const isAdaptive = answers.length >= STYLE_DNA_EXPLORATION_QUESTION_COUNT

    const rankedQuestions = remainingQuestions
      .map((question, index) => {
        const groups = getQuestionGroups(question)
        const [firstGroup, secondGroup] = groups
        const excludedGroupCount = groups.filter((group) => excludedGroups.has(group)).length
        const adaptiveTier = isAdaptive
          ? groups.filter((group) => topGroups.has(group)).length === 2
            ? 0
            : groups.some((group) => topGroups.has(group))
              ? 1
              : 2
          : 0
        const preferenceGap = isAdaptive && firstGroup && secondGroup
          ? Math.abs((scoreByGroup.get(firstGroup) ?? 0) - (scoreByGroup.get(secondGroup) ?? 0))
          : 0
        const exposureScore = groups.reduce(
          (total, group) => total + (answeredExposure.get(group) ?? 0),
          0,
        )

        return {
          index,
          // 大級距確保排除條件優先於自適應與曝光平衡；index 只作穩定的最終同分排序。
          score:
            excludedGroupCount * 1_000_000 +
            adaptiveTier * 10_000 +
            preferenceGap * 1_000 +
            exposureScore * 10 +
            index / 1_000,
        }
      })
      .sort((first, second) => first.score - second.score)

    const selectedOffset = rankedQuestions[0]?.index ?? 0

    if (selectedOffset > 0) {
      const selectedIndex = currentQuestionIndex.value + selectedOffset
      ;[questions.value[currentQuestionIndex.value], questions.value[selectedIndex]] = [
        questions.value[selectedIndex],
        questions.value[currentQuestionIndex.value],
      ]
    }
  }

  const advanceQuestion = (excludedGroups?: ReadonlySet<string>) => {
    currentQuestionIndex.value += 1

    if (!isCompleted.value) {
      prioritizeCurrentQuestion(excludedGroups)
    }
  }

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

    advanceQuestion()
  }

  // 跳過不寫入 answers；被跳過的兩個風格只排除下一組，不會永久退出本次測驗。
  const skipQuestion = () => {
    const skippedQuestion = currentQuestion.value

    if (!canSkip.value || !skippedQuestion) {
      return
    }

    const skippedGroups = new Set(getQuestionGroups(skippedQuestion))
    skipCount.value += 1
    advanceQuestion(skippedGroups)
  }

  const resetQuiz = (nextQuestions: StyleDnaQuestion[] = createStyleDnaQuestions()) => {
    currentQuestionIndex.value = 0
    skipCount.value = 0
    answers.splice(0, answers.length)
    questions.value = nextQuestions
    prioritizeCurrentQuestion()
  }

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    answeredCount,
    skipCount,
    effectiveMaxSkipCount,
    answers,
    canSkip,
    isCompleted,
    result,
    selectAnswer,
    skipQuestion,
    resetQuiz,
  }
}
