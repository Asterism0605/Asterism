<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/layouts/AppHeader.vue'
import StyleComparisonPicker from '@/components/feature/StyleComparisonPicker.vue'
import { useStyleDnaQuiz } from '@/composables/useStyleDnaQuiz'

const quiz = useStyleDnaQuiz()
const { currentQuestion, currentQuestionIndex, isCompleted, questions, resetQuiz, selectAnswer } = quiz
const selectedId = ref<string | null>(null)
const isTransitioning = ref(false)
const completedTargetPath = '/style-dna/result'

resetQuiz()

const handleSelect = (optionId: string) => {
  if (isTransitioning.value) {
    return
  }

  selectedId.value = optionId
  isTransitioning.value = true

  window.setTimeout(() => {
    selectAnswer(optionId)
    selectedId.value = null
    isTransitioning.value = false

    if (isCompleted.value) {
      // TODO: 導入 Vue Router 後改為 router.push(completedTargetPath)
      console.info(`Style DNA quiz completed. Next route: ${completedTargetPath}`)
    }
  }, 500)
}
</script>

<template>
  <main class="style-dna-page">
    <AppHeader />
    <StyleComparisonPicker
      v-if="currentQuestion"
      :left-option="currentQuestion.options[0]"
      :right-option="currentQuestion.options[1]"
      :selected-id="selectedId"
      :question-index="currentQuestionIndex"
      @select="handleSelect"
    />

    <div class="quiz-progress" aria-label="Quiz progress">
      <span class="quiz-label">Quiz</span>
      <span class="quiz-current">{{ Math.min(currentQuestionIndex + 1, questions.length) }}</span>
      <span class="quiz-slash" aria-hidden="true"></span>
      <span class="quiz-total">{{ questions.length }}</span>
    </div>
  </main>
</template>

<style scoped>
.style-dna-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--color-deep);
}

.quiz-progress {
  position: absolute;
  left: 0;
  bottom: 62px;
  z-index: 5;
  width: 17.4%;
  height: 128px;
  color: rgb(240 237 230 / 70%);
  font-size: 28px;
  font-weight: 200;
  pointer-events: none;
}

.quiz-progress::before {
  position: absolute;
  left: 0;
  top: 44px;
  width: 100%;
  height: 1px;
  content: '';
  background: rgb(240 237 230 / 78%);
}

.quiz-progress::after {
  position: absolute;
  left: 0;
  top: 39px;
  width: 10px;
  height: 10px;
  content: '';
  border-radius: 50%;
  background: var(--color-text-primary);
}

.quiz-label {
  position: absolute;
  right: 26px;
  top: 0;
}

.quiz-current {
  position: absolute;
  left: 44px;
  top: 82px;
}

.quiz-total {
  position: absolute;
  left: 82px;
  top: 112px;
}

.quiz-slash {
  position: absolute;
  left: 56px;
  top: 98px;
  width: 64px;
  height: 1px;
  background: rgb(240 237 230 / 78%);
  transform: rotate(-38deg);
  transform-origin: left center;
}

@media (max-width: 980px) {
  .quiz-progress {
    display: none;
  }
}
</style>
