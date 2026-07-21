<script setup lang="ts">
import { computed } from 'vue'
import type { StyleDnaOption } from '@/types/style-dna'

const props = defineProps<{
  leftOption: StyleDnaOption
  rightOption: StyleDnaOption
  selectedId: string | null
  positionIndex: number
  progressCurrent: number
  totalQuestions: number
  canSkip: boolean
  isSkipping?: boolean
  suppressHover?: boolean
}>()

const emit = defineEmits<{
  select: [optionId: string]
  skip: []
}>()

// 高低版位只依有效答題數交替；跳過不增加 positionIndex，因此不會交換位置。
const isLeftHigh = computed(() => props.positionIndex % 2 === 0)
const desktopProgress = computed(() => {
  const completedCount = props.progressCurrent - 1 + (props.selectedId === null ? 0 : 1)

  return Math.min(Math.max(completedCount / props.totalQuestions, 0), 1)
})

const getChoiceClass = (side: 'left' | 'right', optionId: string) => [
  side === 'left' ? 'choice--left' : 'choice--right',
  side === 'left'
    ? isLeftHigh.value
      ? 'is-high'
      : 'is-low'
    : isLeftHigh.value
      ? 'is-low'
      : 'is-high',
  {
    'is-selected': props.selectedId === optionId,
    'is-muted': props.selectedId !== null && props.selectedId !== optionId,
  },
]
</script>

<template>
  <div
    class="comparison-stage"
    :class="{
      'is-hover-suppressed': suppressHover,
      'is-skipping': isSkipping
    }"
  >
    <div
      class="axis axis--left"
      aria-hidden="true"
    ></div>
    <div
      class="axis axis--right"
      aria-hidden="true"
    ></div>
    <div
      class="axis-dot axis-dot--left"
      :class="isLeftHigh ? 'is-high' : 'is-low'"
      aria-hidden="true"
    ></div>
    <div
      class="axis-dot axis-dot--right"
      :class="isLeftHigh ? 'is-low' : 'is-high'"
      aria-hidden="true"
    ></div>

    <div
      class="instruction"
      aria-hidden="true"
    >
      <span class="instruction-line"></span>
      <span>{{ $t('dna.pickerHint') }}</span>
      <span
        class="desktop-progress"
        :style="{ '--desktop-progress': desktopProgress }"
        aria-hidden="true"
      >
        <span class="desktop-progress__track"></span>
        <span class="desktop-progress__fill"></span>
        <span class="desktop-progress__star">✦</span>
      </span>
    </div>

    <span class="sr-only" role="status" aria-live="polite">
      {{ $t('dna.quizProgress') }}: {{ $t('dna.pickerProgress', { current: progressCurrent, total: totalQuestions }) }}
    </span>

    <span
      class="ambient-dot ambient-dot--one"
      aria-hidden="true"
    ></span>
    <span
      class="ambient-dot ambient-dot--two"
      aria-hidden="true"
    ></span>
    <span
      class="corner-orbit"
      aria-hidden="true"
    ></span>

    <div
      class="choice"
      :class="getChoiceClass('left', leftOption.id)"
    >
      <span class="orbit" aria-hidden="true"></span>
      <span class="star star--large" aria-hidden="true"></span>
      <span class="star star--medium" aria-hidden="true"></span>
      <span class="star star--small" aria-hidden="true"></span>
      <button
        class="image-card"
        type="button"
        @click="emit('select', leftOption.id)"
      >
        <img
          :src="leftOption.image.url"
          :alt="leftOption.image.title ?? leftOption.image.id"
        />
      </button>
    </div>

    <div
      class="choice"
      :class="getChoiceClass('right', rightOption.id)"
    >
      <span class="orbit" aria-hidden="true"></span>
      <span class="star star--large" aria-hidden="true"></span>
      <span class="star star--medium" aria-hidden="true"></span>
      <span class="star star--small" aria-hidden="true"></span>
      <button
        class="image-card"
        type="button"
        @click="emit('select', rightOption.id)"
      >
        <img
          :src="rightOption.image.url"
          :alt="rightOption.image.title ?? rightOption.image.id"
        />
      </button>
    </div>

    <button
      class="skip-pair"
      type="button"
      :disabled="!canSkip || selectedId !== null"
      data-testid="style-dna-skip"
      @click="emit('skip')"
    >
      {{ canSkip ? $t('dna.skipPair') : $t('dna.skipLimitReached') }}
    </button>
  </div>
</template>

<style scoped>
.comparison-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--color-deep);
}

.axis {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  width: 1px;
  background: rgb(240 237 230 / 72%);
}

.axis--left {
  left: 17.4%;
}

.axis--right {
  left: 86.2%;
}

.axis-dot {
  position: absolute;
  z-index: 4;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(240 237 230 / 92%);
  transform: translate(-50%, -50%);
  transition: top 500ms ease;
}

.axis-dot--left {
  left: 17.4%;
}

.axis-dot--right {
  left: 86.2%;
}

.axis-dot.is-high {
  top: 34.5%;
}

.axis-dot.is-low {
  top: 56.5%;
}

.instruction {
  position: absolute;
  left: 17.4%;
  right: 13.8%;
  top: 17%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 28px;
  color: rgb(240 237 230 / 80%);
  font-size: 14px;
  transform: translateX(0);
}

.desktop-progress {
  position: relative;
  flex: 1;
  min-width: 80px;
  height: 20px;
  pointer-events: none;
}

.desktop-progress__track,
.desktop-progress__fill {
  position: absolute;
  left: 0;
  top: 50%;
  height: 1px;
  transform: translateY(-50%);
}

.desktop-progress__track {
  right: 0;
  background: rgb(240 237 230 / 78%);
}

.desktop-progress__fill {
  width: calc(var(--desktop-progress) * 100%);
  background: rgb(240 237 230 / 92%);
  box-shadow:
    0 0 6px rgb(240 237 230 / 72%),
    0 0 14px rgb(240 237 230 / 34%);
  transition: width 480ms ease;
}

.desktop-progress__star {
  position: absolute;
  left: calc(7px + var(--desktop-progress) * (100% - 14px));
  top: 50%;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1;
  text-shadow:
    0 0 8px rgb(240 237 230 / 76%),
    0 0 18px rgb(240 237 230 / 38%);
  transform: translate(-50%, -50%);
  transition: left 480ms ease;
}

.instruction-line {
  position: relative;
  width: 230px;
  height: 1px;
  margin-left: 55px;
  background: rgb(240 237 230 / 78%);
}

.instruction-line::before {
  position: absolute;
  right: calc(100% - 1px);
  top: 0;
  width: 60px;
  height: 1px;
  content: '';
  background: rgb(240 237 230 / 78%);
  transform: rotate(24deg);
  transform-origin: right center;
}

.choice {
  position: absolute;
  z-index: 4;
  width: 520px;
  height: 520px;
  isolation: isolate;
  transition:
    top 500ms ease,
    opacity 240ms ease,
    filter 240ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .comparison-stage:not(.is-hover-suppressed) .choice:has(.image-card:hover) {
    filter: drop-shadow(0 0 44px rgb(240 237 230 / 34%));
  }
}

.comparison-stage.is-hover-suppressed .choice {
  filter: none;
}

.image-card:focus-visible {
  outline: 1px solid rgb(240 237 230 / 68%);
  outline-offset: 8px;
}

.choice.is-muted {
  opacity: 0.34;
}

.choice--left {
  left: 13.8%;
}

.choice--right {
  left: calc(63.2% - 30px);
}

.choice--left.is-high {
  top: 15%;
}

.choice--left.is-low {
  top: calc(100vh - 502px);
}

.choice--right.is-high {
  top: 20%;
}

.choice--right.is-low {
  top: calc(100vh - 476px);
}

.image-card {
  position: absolute;
  z-index: 5;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #111;
  box-shadow: 0 18px 60px rgb(0 0 0 / 22%);
  cursor: pointer;
  transition:
    opacity 240ms ease,
    transform 220ms ease,
    filter 220ms ease,
    box-shadow 220ms ease;
}

.comparison-stage.is-skipping .image-card {
  opacity: 0;
}

.choice.is-selected .image-card {
  box-shadow:
    0 0 42px rgb(240 237 230 / 26%),
    0 0 118px rgb(240 237 230 / 16%),
    0 0 190px rgb(240 237 230 / 8%),
    0 24px 80px rgb(0 0 0 / 34%);
  filter: brightness(1.14) contrast(1.03);
  transform: translateY(-3px) scale(1.018);
}

.choice--left .image-card {
  left: 176px;
  top: 94px;
  width: 230px;
  height: 330px;
}

.choice--right .image-card {
  left: 100px;
  top: 40px;
  width: 232px;
  height: 310px;
}

.image-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.orbit {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  animation: orbitFloat 6.4s ease-in-out infinite;
}

.orbit::before,
.orbit::after {
  position: absolute;
  inset: 0;
  content: '';
  border: 1px solid rgb(240 237 230 / 46%);
  border-radius: 50%;
}

.orbit::after {
  opacity: 0.68;
  transform: rotate(-12deg) scale(0.92);
}

.choice--left .orbit {
  left: 0;
  top: 100px;
  width: 550px;
  height: 360px;
  transform: rotate(25deg);
}

.choice--right .orbit {
  left: -92px;
  top: 20px;
  width: 600px;
  height: 360px;
  transform: rotate(-28deg);
  animation-delay: -1.8s;
}

.star {
  position: absolute;
  z-index: 3;
  border-radius: 50%;
  background: var(--color-text-primary);
  pointer-events: none;
  animation: starFloat 4.4s ease-in-out infinite;
}

.star--large {
  width: 10px;
  height: 10px;
}

.star--medium {
  width: 8px;
  height: 8px;
}

.star--small {
  width: 5px;
  height: 5px;
}

.choice--left .star--large {
  left: -36px;
  top: 74px;
}

.choice--left .star--medium {
  left: 96px;
  top: 226px;
  animation-delay: -1.4s;
}

.choice--left .star--small {
  left: 406px;
  top: 33px;
  animation-delay: -2.1s;
}

.choice--right .star--large {
  left: -68px;
  top: 360px;
  animation-delay: -0.7s;
}

.choice--right .star--medium {
  left: 410px;
  top: 382px;
  animation-delay: -1.8s;
}

.choice--right .star--small {
  left: 486px;
  top: -48px;
  animation-delay: -2.5s;
}

.ambient-dot {
  position: absolute;
  z-index: 2;
  border-radius: 50%;
  background: var(--color-text-primary);
  pointer-events: none;
  animation: starFloat 5.2s ease-in-out infinite;
}

.ambient-dot--one {
  left: 47%;
  top: 28.5%;
  width: 6px;
  height: 6px;
}

.ambient-dot--two {
  right: 6%;
  top: 32%;
  width: 10px;
  height: 10px;
  animation-delay: -1.7s;
}

.corner-orbit {
  position: absolute;
  right: -145px;
  bottom: -92px;
  z-index: 1;
  width: 480px;
  height: 210px;
  border: 0.5px solid #c9c9c9;
  border-radius: 50%;
  transform: rotate(-16deg);
  pointer-events: none;
}

.skip-pair {
  position: absolute;
  left: 32px;
  bottom: 32px;
  z-index: 7;
  padding: 10px 18px;
  border: 1px solid rgb(240 237 230 / 32%);
  border-radius: 999px;
  color: rgb(240 237 230 / 72%);
  font-size: 12px;
  letter-spacing: 0.08em;
  background: rgb(6 6 8 / 38%);
  cursor: pointer;
  transform: none;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    opacity 180ms ease;
}

.skip-pair:focus-visible {
  border-color: rgb(240 237 230 / 62%);
  color: var(--color-text-primary);
  background: rgb(240 237 230 / 8%);
  outline: 1px solid rgb(240 237 230 / 68%);
  outline-offset: 4px;
}

@media (hover: hover) and (pointer: fine) {
  .skip-pair:hover:not(:disabled) {
    border-color: rgb(240 237 230 / 62%);
    color: var(--color-text-primary);
    background: rgb(240 237 230 / 8%);
  }
}

.skip-pair:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@keyframes orbitFloat {
  0%,
  100% {
    translate: 0 -20px;
  }
  50% {
    translate: 0 10px;
  }
}

@keyframes starFloat {
  0%,
  100% {
    translate: 0 -7px;
  }
  50% {
    translate: 0 9px;
  }
}

@media (max-width: 768px) {
  .axis,
  .axis-dot,
  .instruction,
  .corner-orbit {
    display: none;
  }

  .choice {
    --mobile-choice-scale: 0.72;

    left: 50%;
    max-width: none;
    transform: translateX(-50%) scale(var(--mobile-choice-scale));
    transform-origin: top center;
  }

  /* Mobile positions are separated by side so each alternating layout can be tuned independently. */
  .choice--left.is-high {
    top: clamp(76px, 11svh, 120px);
  }

  .choice--right.is-high {
    top: clamp(126px, 17svh, 175px);
  }

  .choice--left.is-low {
    top: calc(100svh - 429px);
  }

  .choice--right.is-low {
    top: calc(100svh - 379px);
  }

  .choice--left .orbit {
    transform: rotate(15deg) scale(0.85);
    transform-origin: center;
  }

  .choice--right .orbit {
    transform: rotate(-28deg) scale(0.85);
    transform-origin: center;
  }

  .ambient-dot--one,
  .ambient-dot--two,
  .choice--right .star--small {
    display: none;
  }

  .skip-pair {
    left: 50%;
    bottom: 40px;
    max-width: calc(100vw - 160px);
    white-space: nowrap;
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) and (max-height: 740px) {
  .choice {
    --mobile-choice-scale: 0.56;
  }

  .choice--left.is-high {
    top: 60px;
  }

  .choice--right.is-high {
    top: 96px;
  }

  .choice--left.is-low {
    top: calc(100svh - 342px);
  }

  .choice--right.is-low {
    top: calc(100svh - 306px);
  }
}
</style>
