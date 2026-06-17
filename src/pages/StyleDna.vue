<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/layouts/AppHeader.vue';
import StyleComparisonPicker from '@/components/feature/dna/StyleComparisonPicker.vue';
import { useStyleDnaQuiz } from '@/composables/useStyleDnaQuiz';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const router = useRouter();
const styleDnaStore = useStyleDnaStore();
const quiz = useStyleDnaQuiz();
const {
  answers,
  currentQuestion,
  currentQuestionIndex,
  isCompleted,
  questions,
  resetQuiz,
  selectAnswer
} = quiz;
const selectedId = ref<string | null>(null);
const isTransitioning = ref(false);
const isHoverSuppressed = ref(false);
const completedTargetPath = '/style-dna/result';
let hoverSuppressTimer: number | undefined;

resetQuiz();

const handleSelect = (optionId: string) => {
  if (isTransitioning.value) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  selectedId.value = optionId;
  isTransitioning.value = true;

  window.setTimeout(() => {
    selectAnswer(optionId);
    selectedId.value = null;
    isTransitioning.value = false;
    isHoverSuppressed.value = true;

    window.clearTimeout(hoverSuppressTimer);
    hoverSuppressTimer = window.setTimeout(() => {
      isHoverSuppressed.value = false;
    }, 260);

    if (isCompleted.value) {
      styleDnaStore.completeQuiz([...answers]);
      void router.push(completedTargetPath);
    }
  }, 500);
};

onBeforeUnmount(() => {
  window.clearTimeout(hoverSuppressTimer);
});
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
      :suppress-hover="isHoverSuppressed"
      @select="handleSelect"
    />

    <div class="quiz-progress">
      <span class="quiz-label" aria-label="Quiz progress">Quiz</span>
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
  font-size: 20px;
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
  right: 20px;
  top: 6px;
  font-size: 16px;
}

.quiz-current {
  position: absolute;
  left: 36px;
  top: 95px;
}

.quiz-total {
  position: absolute;
  left: 75px;
  top: 138px;
}

.quiz-slash {
  position: absolute;
  left: 37px;
  top: 154px;
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
