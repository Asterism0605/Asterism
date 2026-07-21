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
  isCompleted,
  resetQuiz,
  selectAnswer,
  skipQuestion
} = quiz;
const selectedId = ref<string | null>(null);
const isTransitioning = ref(false);
const isSkipping = ref(false);
const isHoverSuppressed = ref(false);
const completedTargetPath = '/style-dna/result';
let hoverSuppressTimer: number | undefined;
let transitionTimer: number | undefined;

// 跳過不算有效答案，因此進度只依實際選擇數推進。
const progressCurrent = computed(() =>
  Math.min(answeredCount.value + 1, STYLE_DNA_QUESTION_COUNT)
);
// 手機版星點在選擇動畫開始時先移動，最後一題可在導向結果頁前抵達底端。
const mobileAnsweredCount = computed(() =>
  Math.min(
    answeredCount.value + (selectedId.value === null ? 0 : 1),
    STYLE_DNA_QUESTION_COUNT
  )
);
const mobileProgress = computed(() => mobileAnsweredCount.value / STYLE_DNA_QUESTION_COUNT);

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
  isSkipping.value = true;
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    skipQuestion();
    isSkipping.value = false;
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
      :position-index="answeredCount"
      :progress-current="progressCurrent"
      :total-questions="STYLE_DNA_QUESTION_COUNT"
      :can-skip="canSkip"
      :is-skipping="isSkipping"
      :suppress-hover="isHoverSuppressed"
      @select="handleSelect"
      @skip="handleSkip"
    />

    <!-- 手機版（≤768px）：有效答案越多，星點越靠近畫面底部；跳過不改變進度。 -->
    <div
      class="quiz-progress-mobile"
      role="progressbar"
      :aria-label="$t('dna.quizProgress')"
      aria-valuemin="0"
      :aria-valuemax="STYLE_DNA_QUESTION_COUNT"
      :aria-valuenow="mobileAnsweredCount"
      :aria-valuetext="$t('dna.pickerProgress', {
        current: mobileAnsweredCount,
        total: STYLE_DNA_QUESTION_COUNT
      })"
      :style="{ '--quiz-progress': mobileProgress }"
    >
      <span class="qpm-track" aria-hidden="true"></span>
      <span class="qpm-fill" aria-hidden="true"></span>
      <span class="qpm-star" aria-hidden="true">✦</span>
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

@media (max-width: 768px) {
  .quiz-progress {
    display: none;
  }

  /* 星點完整保留在畫面內，並沿同一段有效軌道等距移動 12 次。 */
  .quiz-progress-mobile {
    position: fixed;
    top: 64px;
    right: 18px;
    bottom: 0;
    z-index: 61;
    display: block;
    width: 20px;
    pointer-events: none;
  }

  .qpm-track,
  .qpm-fill {
    position: absolute;
    left: 50%;
    top: 7px;
    bottom: 7px;
    width: 1px;
    transform: translateX(-50%);
  }

  .qpm-track {
    background: rgb(240 237 230 / 28%);
  }

  .qpm-fill {
    bottom: auto;
    height: calc(var(--quiz-progress) * (100% - 14px));
    background: rgb(240 237 230 / 74%);
    transition: height 480ms ease;
  }

  .qpm-star {
    position: absolute;
    left: 50%;
    top: calc(7px + var(--quiz-progress) * (100% - 14px));
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1;
    text-shadow:
      0 0 8px rgb(240 237 230 / 76%),
      0 0 18px rgb(240 237 230 / 38%);
    transform: translate(-50%, -50%);
    transition: top 480ms ease;
  }
}
</style>
