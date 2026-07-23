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
    class="comparison-stage absolute inset-0 overflow-hidden bg-[var(--color-deep)]"
    :class="{
      'is-hover-suppressed': suppressHover,
      'is-skipping': isSkipping
    }"
  >
    <div
      class="axis axis--left absolute top-0 bottom-0 left-[17.4%] z-[1] w-px bg-[rgb(240_237_230_/_72%)]"
      aria-hidden="true"
    ></div>
    <div
      class="axis axis--right absolute top-0 bottom-0 left-[86.2%] z-[1] w-px bg-[rgb(240_237_230_/_72%)]"
      aria-hidden="true"
    ></div>
    <div
      class="axis-dot axis-dot--left absolute left-[17.4%] z-[4] h-[20px] w-[20px] rounded-[50%] bg-[rgb(240_237_230_/_92%)]"
      :class="isLeftHigh ? 'is-high' : 'is-low'"
      aria-hidden="true"
    ></div>
    <div
      class="axis-dot axis-dot--right absolute left-[86.2%] z-[4] h-[20px] w-[20px] rounded-[50%] bg-[rgb(240_237_230_/_92%)]"
      :class="isLeftHigh ? 'is-low' : 'is-high'"
      aria-hidden="true"
    ></div>

    <div
      class="instruction absolute top-[17%] right-[13.8%] left-[17.4%] z-[5] flex items-center gap-[28px] text-[14px] text-[rgb(240_237_230_/_80%)]"
      aria-hidden="true"
    >
      <span class="instruction-line relative ml-[55px] h-px w-[230px] bg-[rgb(240_237_230_/_78%)]"></span>
      <span>{{ $t('dna.pickerHint') }}</span>
      <span
        class="desktop-progress pointer-events-none relative h-[20px] min-w-[80px] flex-1"
        :style="{ '--desktop-progress': desktopProgress }"
        aria-hidden="true"
      >
        <span class="desktop-progress__track absolute top-1/2 right-0 left-0 h-px bg-[rgb(240_237_230_/_78%)]"></span>
        <span class="desktop-progress__fill absolute top-1/2 left-0 h-px bg-[rgb(240_237_230_/_92%)]"></span>
        <span class="desktop-progress__star absolute top-1/2 text-[14px] leading-[1] text-[var(--color-text-primary)]">✦</span>
      </span>
    </div>

    <span class="sr-only" role="status" aria-live="polite">
      {{ $t('dna.quizProgress') }}: {{ $t('dna.pickerProgress', { current: progressCurrent, total: totalQuestions }) }}
    </span>

    <span
      class="ambient-dot ambient-dot--one pointer-events-none absolute z-[2] h-[6px] w-[6px] rounded-[50%] bg-[var(--color-text-primary)]"
      aria-hidden="true"
    ></span>
    <span
      class="ambient-dot ambient-dot--two pointer-events-none absolute z-[2] h-[10px] w-[10px] rounded-[50%] bg-[var(--color-text-primary)]"
      aria-hidden="true"
    ></span>
    <span
      class="corner-orbit"
      aria-hidden="true"
    ></span>

    <div
      class="choice absolute z-[4] h-[520px] w-[520px] isolate"
      :class="getChoiceClass('left', leftOption.id)"
    >
      <span class="orbit pointer-events-none absolute z-[1]" aria-hidden="true"></span>
      <span class="star star--large pointer-events-none absolute z-[3] h-[10px] w-[10px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <span class="star star--medium pointer-events-none absolute z-[3] h-[8px] w-[8px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <span class="star star--small pointer-events-none absolute z-[3] h-[5px] w-[5px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <button
        class="image-card absolute top-[94px] left-[176px] z-[5] h-[330px] w-[230px] cursor-pointer overflow-hidden border-0 bg-[#111] p-0 [box-shadow:0_18px_60px_rgb(0_0_0_/_22%)]"
        type="button"
        @click="emit('select', leftOption.id)"
      >
        <img
          class="block h-full w-full object-cover"
          :src="leftOption.image.url"
          :alt="leftOption.image.title ?? leftOption.image.id"
        />
      </button>
    </div>

    <div
      class="choice absolute z-[4] h-[520px] w-[520px] isolate"
      :class="getChoiceClass('right', rightOption.id)"
    >
      <span class="orbit pointer-events-none absolute z-[1]" aria-hidden="true"></span>
      <span class="star star--large pointer-events-none absolute z-[3] h-[10px] w-[10px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <span class="star star--medium pointer-events-none absolute z-[3] h-[8px] w-[8px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <span class="star star--small pointer-events-none absolute z-[3] h-[5px] w-[5px] rounded-[50%] bg-[var(--color-text-primary)]" aria-hidden="true"></span>
      <button
        class="image-card absolute top-[40px] left-[100px] z-[5] h-[310px] w-[232px] cursor-pointer overflow-hidden border-0 bg-[#111] p-0 [box-shadow:0_18px_60px_rgb(0_0_0_/_22%)]"
        type="button"
        @click="emit('select', rightOption.id)"
      >
        <img
          class="block h-full w-full object-cover"
          :src="rightOption.image.url"
          :alt="rightOption.image.title ?? rightOption.image.id"
        />
      </button>
    </div>

    <button
      class="skip-pair absolute z-[7] cursor-pointer rounded-[999px] border border-solid border-[rgb(240_237_230_/_32%)] bg-[rgb(6_6_8_/_38%)] px-[18px] py-[10px] text-[12px] tracking-[0.08em] text-[rgb(240_237_230_/_72%)]"
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
.axis-dot {
  transform: translate(-50%, -50%);
  transition: top 500ms ease;
}

.axis-dot.is-high {
  top: 34.5%;
}

.axis-dot.is-low {
  top: 56.5%;
}

.instruction {
  transform: translateX(0);
}

.desktop-progress__track,
.desktop-progress__fill {
  transform: translateY(-50%);
}

.desktop-progress__fill {
  width: calc(var(--desktop-progress) * 100%);
  box-shadow:
    0 0 6px rgb(240 237 230 / 72%),
    0 0 14px rgb(240 237 230 / 34%);
  transition: width 480ms ease;
}

.desktop-progress__star {
  left: calc(7px + var(--desktop-progress) * (100% - 14px));
  text-shadow:
    0 0 8px rgb(240 237 230 / 76%),
    0 0 18px rgb(240 237 230 / 38%);
  transform: translate(-50%, -50%);
  transition: left 480ms ease;
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

.orbit {
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
  animation: starFloat 4.4s ease-in-out infinite;
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
  animation: starFloat 5.2s ease-in-out infinite;
}

.ambient-dot--one {
  left: 47%;
  top: 28.5%;
}

.ambient-dot--two {
  right: 6%;
  top: 32%;
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
  left: 32px;
  bottom: 32px;
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
