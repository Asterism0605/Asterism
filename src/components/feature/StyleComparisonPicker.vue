<script setup lang="ts">
import { computed } from 'vue'
import type { StyleDnaOption } from '@/types/style-dna'

const props = defineProps<{
  leftOption: StyleDnaOption
  rightOption: StyleDnaOption
  selectedId: string | null
  questionIndex: number
}>()

const emit = defineEmits<{
  select: [optionId: string]
}>()

const isLeftHigh = computed(() => props.questionIndex % 2 === 0)

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
  <div class="comparison-stage">
    <div class="axis axis--left" aria-hidden="true"></div>
    <div class="axis axis--right" aria-hidden="true"></div>
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

    <div class="instruction" aria-hidden="true">
      <span class="instruction-line"></span>
      <span class="instruction-dot"></span>
      <span>Click to choose your preferred style</span>
    </div>

    <span class="ambient-dot ambient-dot--one" aria-hidden="true"></span>
    <span class="ambient-dot ambient-dot--two" aria-hidden="true"></span>
    <span class="corner-orbit" aria-hidden="true"></span>

    <button
      class="choice"
      :class="getChoiceClass('left', leftOption.id)"
      type="button"
      @click="emit('select', leftOption.id)"
    >
      <span class="orbit" aria-hidden="true"></span>
      <span class="star star--large" aria-hidden="true"></span>
      <span class="star star--medium" aria-hidden="true"></span>
      <span class="star star--small" aria-hidden="true"></span>
      <span class="image-card">
        <img :src="leftOption.image.url" :alt="leftOption.image.title ?? leftOption.image.id" />
      </span>
    </button>

    <button
      class="choice"
      :class="getChoiceClass('right', rightOption.id)"
      type="button"
      @click="emit('select', rightOption.id)"
    >
      <span class="orbit" aria-hidden="true"></span>
      <span class="star star--large" aria-hidden="true"></span>
      <span class="star star--medium" aria-hidden="true"></span>
      <span class="star star--small" aria-hidden="true"></span>
      <span class="image-card">
        <img :src="rightOption.image.url" :alt="rightOption.image.title ?? rightOption.image.id" />
      </span>
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
  top: 12.6%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 28px;
  color: rgb(240 237 230 / 80%);
  font-size: 14px;
  transform: translateX(0);
}

.instruction-line {
  position: relative;
  width: 210px;
  height: 1px;
  background: rgb(240 237 230 / 78%);
}

.instruction-line::before {
  position: absolute;
  right: 100%;
  top: 0;
  width: 96px;
  height: 1px;
  content: '';
  background: rgb(240 237 230 / 78%);
  transform: rotate(24deg);
  transform-origin: right center;
}

.instruction-dot {
  width: 10px;
  height: 10px;
  margin-left: -33px;
  border-radius: 50%;
  background: var(--color-text-primary);
}

.choice {
  position: absolute;
  z-index: 4;
  width: 520px;
  height: 520px;
  cursor: pointer;
  isolation: isolate;
  transition:
    top 500ms ease,
    opacity 240ms ease,
    filter 240ms ease;
}

.choice:focus-visible {
  outline: 1px solid rgb(240 237 230 / 68%);
  outline-offset: 8px;
}

.choice.is-selected {
  filter: drop-shadow(0 0 44px rgb(240 237 230 / 34%));
}

.choice.is-muted {
  opacity: 0.34;
}

.choice--left {
  left: 23.8%;
}

.choice--right {
  left: calc(63.2% - 30px);
}

.choice--left.is-high {
  top: 19.6%;
}

.choice--left.is-low {
  top: calc(100vh - 502px);
}

.choice--right.is-high {
  top: 18%;
}

.choice--right.is-low {
  top: calc(100vh - 476px);
}

.image-card {
  position: absolute;
  z-index: 5;
  overflow: hidden;
  background: #111;
  box-shadow: 0 18px 60px rgb(0 0 0 / 22%);
  transition:
    transform 220ms ease,
    filter 220ms ease,
    box-shadow 220ms ease;
}

.choice:hover .image-card,
.choice:focus-visible .image-card {
  box-shadow: 0 24px 80px rgb(0 0 0 / 36%);
  filter: brightness(1.08) contrast(1.04);
  transform: translateY(-4px) scale(1.025);
}

.choice--left .image-card {
  left: 176px;
  top: 94px;
  width: 230px;
  height: 330px;
}

.choice--right .image-card {
  left: 128px;
  top: 88px;
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
  left: -160px;
  top: -28px;
  width: 620px;
  height: 260px;
  transform: rotate(15deg);
}

.choice--right .orbit {
  left: -92px;
  top: -6px;
  width: 660px;
  height: 390px;
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
  top: 26px;
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
  width: 18px;
  height: 18px;
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
  border: 1px solid rgb(240 237 230 / 32%);
  border-radius: 50%;
  transform: rotate(-16deg);
  pointer-events: none;
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

@media (max-width: 980px) {
  .axis,
  .axis-dot,
  .instruction,
  .corner-orbit {
    display: none;
  }

  .choice {
    left: 50%;
    width: 520px;
    max-width: calc(100% - 24px);
    transform: translateX(-50%);
  }

  .choice--left.is-high,
  .choice--right.is-high {
    top: 120px;
  }

  .choice--left.is-low,
  .choice--right.is-low {
    top: 560px;
  }
}
</style>
