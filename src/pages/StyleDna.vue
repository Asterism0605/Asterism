<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import StyleComparisonPicker from '@/components/feature/dna/StyleComparisonPicker.vue';
import { useStyleDnaQuiz } from '@/composables/useStyleDnaQuiz';
import { STYLE_DNA_QUESTION_COUNT } from '@/constants/style-dna.constants';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const router = useRouter();
const styleDnaStore = useStyleDnaStore();
const authStore = useAuthStore();
const quiz = useStyleDnaQuiz();
const {
  answers,
  answeredCount,
  canSkip,
  currentQuestion,
  currentQuestionIndex,
  isCompleted,
  resetQuiz,
  selectAnswer,
  skipQuestion
} = quiz;
const selectedId = ref<string | null>(null);
const isTransitioning = ref(false);
const isHoverSuppressed = ref(false);
const completedTargetPath = '/style-dna/result';
let hoverSuppressTimer: number | undefined;
let transitionTimer: number | undefined;

// 跳過不算有效答案，因此進度只依實際選擇數推進。
const progressCurrent = computed(() =>
  Math.min(answeredCount.value + 1, STYLE_DNA_QUESTION_COUNT)
);

resetQuiz();

const suppressHoverTemporarily = () => {
  isHoverSuppressed.value = true;

  window.clearTimeout(hoverSuppressTimer);
  hoverSuppressTimer = window.setTimeout(() => {
    isHoverSuppressed.value = false;
  }, 260);
};

const handleSelect = (optionId: string) => {
  if (isTransitioning.value) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  selectedId.value = optionId;
  isTransitioning.value = true;

  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    selectAnswer(optionId);
    selectedId.value = null;
    isTransitioning.value = false;
    suppressHoverTemporarily();

    if (isCompleted.value) {
      styleDnaStore.completeQuiz([...answers], authStore.user?.id ?? null);
      if (authStore.user?.id) {
        void styleDnaStore.saveCurrentResultToServer(authStore.user.id).catch((error: unknown) => {
          console.warn('[style-dna] sync after quiz failed:', error);
        });
      }
      void router.push(completedTargetPath);
    }
  }, 500);
};

const handleSkip = () => {
  if (isTransitioning.value || !canSkip.value) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  isTransitioning.value = true;
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    skipQuestion();
    isTransitioning.value = false;
    suppressHoverTemporarily();
  }, 240);
};

onBeforeUnmount(() => {
  window.clearTimeout(hoverSuppressTimer);
  window.clearTimeout(transitionTimer);
});
</script>

<template>
  <main class="style-dna-page">
    <StyleComparisonPicker
      v-if="currentQuestion"
      :left-option="currentQuestion.options[0]"
      :right-option="currentQuestion.options[1]"
      :selected-id="selectedId"
      :question-index="currentQuestionIndex"
      :progress-current="progressCurrent"
      :total-questions="STYLE_DNA_QUESTION_COUNT"
      :can-skip="canSkip"
      :suppress-hover="isHoverSuppressed"
      @select="handleSelect"
      @skip="handleSkip"
    />

    <!-- 手機版（≤980px）：沿用桌機的對角斜線分數樣式（current 左上 / total 右下），改放右下角。 -->
    <div class="quiz-progress-mobile" :aria-label="$t('dna.quizProgress')">
      <span class="qpm-current">{{ progressCurrent }}</span>
      <span class="qpm-slash" aria-hidden="true"></span>
      <span class="qpm-total">{{ STYLE_DNA_QUESTION_COUNT }}</span>
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

.quiz-progress-mobile {
  display: none;
}

@media (max-width: 980px) {
  .quiz-progress {
    display: none;
  }

  /* 對角斜線分數，放右下角（桌機是左下，手機改右下）。 */
  .quiz-progress-mobile {
    position: fixed;
    right: 28px;
    bottom: 30px;
    z-index: 61;
    display: block;
    width: 52px;
    height: 48px;
    color: rgb(240 237 230 / 70%);
    font-size: 18px;
    font-weight: 200;
    pointer-events: none;
  }

  .qpm-current {
    position: absolute;
    left: 0;
    top: 0;
  }

  .qpm-total {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .qpm-slash {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52px;
    height: 1px;
    background: rgb(240 237 230 / 78%);
    transform: translate(-50%, -50%) rotate(-38deg);
  }
}
</style>
