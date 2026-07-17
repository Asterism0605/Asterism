<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TOOLTIP_GAP, VIEWPORT_MARGIN, TOOLTIP_SPACE_THRESHOLD } from '../constants/constants';
import { useI18n } from 'vue-i18n';
import { MoveDownLeft } from '@lucide/vue';

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const props = defineProps<{
  targetIndex: number | null;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const { t } = useI18n();

const targetRect = ref<TargetRect | null>(null);
const isTargetHovered = ref(false);
const isTouchDevice = ref(true);
let frameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let observedTarget: HTMLElement | null = null;

const topBackdropStyle = computed(() => ({ height: `${targetRect.value?.top ?? 0}px` }));
const bottomBackdropStyle = computed(() => ({ top: `${targetRect.value?.bottom ?? 0}px` }));
const leftBackdropStyle = computed(() => ({
  top: `${targetRect.value?.top ?? 0}px`,
  width: `${targetRect.value?.left ?? 0}px`,
  height: `${targetRect.value?.height ?? 0}px`
}));
const rightBackdropStyle = computed(() => ({
  top: `${targetRect.value?.top ?? 0}px`,
  left: `${targetRect.value?.right ?? 0}px`,
  height: `${targetRect.value?.height ?? 0}px`
}));
const guideGeometry = computed(() => {
  const rect = targetRect.value;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!rect) {
    return {
      arrow: { left: '0px', top: '0px', width: '0px', height: '0px' },
      endpoint: { left: '0px', top: '0px' },
      tooltip: { left: '0px', top: '0px' }
    };
  }

  const isCompact = viewportWidth <= 768;
  const arrowWidth = isCompact ? 72 : 104;
  const arrowHeight = isCompact ? 72 : 104;
  const endpointX = Math.max(16, rect.left - (isCompact ? 16 : 18));
  const endpointY = isCompact ? rect.top + rect.height / 2 : Math.max(16, rect.top - 18);
  const arrowLeft = endpointX - arrowWidth * (17 / 24);
  const arrowTop = endpointY - arrowHeight * (17 / 24);
  const tooltipTop =
    rect.bottom + TOOLTIP_SPACE_THRESHOLD <= viewportHeight - VIEWPORT_MARGIN
      ? rect.bottom + TOOLTIP_GAP
      : Math.max(VIEWPORT_MARGIN, rect.top - TOOLTIP_GAP);

  return {
    arrow: {
      left: `${arrowLeft}px`,
      top: `${arrowTop}px`,
      width: `${arrowWidth}px`,
      height: `${arrowHeight}px`
    },
    endpoint: {
      left: `${endpointX}px`,
      top: `${endpointY}px`
    },
    tooltip: {
      left: `${rect.left + rect.width / 2}px`,
      top: `${tooltipTop}px`
    }
  };
});

const arrowStyle = computed(() => guideGeometry.value.arrow);
const endpointStyle = computed(() => guideGeometry.value.endpoint);
const tooltipStyle = computed(() => guideGeometry.value.tooltip);
const showTooltip = computed(() => isTouchDevice.value || isTargetHovered.value);

function getTarget(): HTMLElement | null {
  if (props.targetIndex === null) {
    return null;
  }

  return document.querySelector<HTMLElement>(
    `[data-guide-target="true"][data-guide-image-index="${props.targetIndex}"]`
  );
}

function observeTarget(target: HTMLElement | null): void {
  if (target === observedTarget) {
    return;
  }

  resizeObserver?.disconnect();
  observedTarget?.removeEventListener('mouseenter', handleTargetMouseenter);
  observedTarget?.removeEventListener('mouseleave', handleTargetMouseleave);
  observedTarget = target;
  isTargetHovered.value = false;
  if (target) {
    target.addEventListener('mouseenter', handleTargetMouseenter);
    target.addEventListener('mouseleave', handleTargetMouseleave);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(target);
    }
  } else {
    resizeObserver = null;
  }
}

function handleTargetMouseenter(): void {
  isTargetHovered.value = true;
}

function handleTargetMouseleave(): void {
  isTargetHovered.value = false;
}

function updateInputMode(): void {
  isTouchDevice.value =
    typeof window.matchMedia !== 'function' ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function updateTargetRect(): void {
  const target = getTarget();
  observeTarget(target);

  if (!target) {
    targetRect.value = null;
    return;
  }

  const rect = target.getBoundingClientRect();
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(window.innerWidth, rect.right);
  const bottom = Math.min(window.innerHeight, rect.bottom);

  targetRect.value = {
    top,
    right,
    bottom,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
}

function scheduleUpdate(): void {
  if (frameId !== null) {
    return;
  }

  frameId = window.requestAnimationFrame(() => {
    frameId = null;
    updateTargetRect();
  });
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('dismiss');
  }
}

onMounted(() => {
  updateInputMode();
  scheduleUpdate();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
  }
  resizeObserver?.disconnect();
  observedTarget?.removeEventListener('mouseenter', handleTargetMouseenter);
  observedTarget?.removeEventListener('mouseleave', handleTargetMouseleave);
  window.removeEventListener('scroll', scheduleUpdate);
  window.removeEventListener('resize', scheduleUpdate);
  window.removeEventListener('keydown', handleKeydown);
});

watch(() => props.targetIndex, scheduleUpdate);
</script>

<template>
  <div v-if="targetRect" class="guide-layer" aria-hidden="true">
    <div
      class="guide-backdrop guide-backdrop--top"
      data-testid="guide-backdrop"
      :style="topBackdropStyle"
    />
    <div
      class="guide-backdrop guide-backdrop--bottom"
      data-testid="guide-backdrop"
      :style="bottomBackdropStyle"
    />
    <div
      class="guide-backdrop guide-backdrop--left"
      data-testid="guide-backdrop"
      :style="leftBackdropStyle"
    />
    <div
      class="guide-backdrop guide-backdrop--right"
      data-testid="guide-backdrop"
      :style="rightBackdropStyle"
    />

    <MoveDownLeft
      data-testid="guide-arrow"
      class="guide-arrow"
      :style="arrowStyle"
      aria-hidden="true"
    />
    <span
      data-testid="guide-arrow-endpoint"
      class="guide-arrow-endpoint guide-arrow-endpoint--pulse"
      :style="endpointStyle"
      aria-hidden="true"
    />

    <Transition name="guide-tooltip">
      <p v-if="showTooltip" data-testid="guide-tooltip" class="guide-tooltip" :style="tooltipStyle">
        {{ t('home.guide.imageClick') }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.guide-layer,
.guide-backdrop,
.guide-arrow,
.guide-tooltip {
  position: fixed;
  pointer-events: none;
}

.guide-layer {
  z-index: 40;
  inset: 0;
}

.guide-backdrop {
  background: rgb(5 5 8 / 0.7);
  backdrop-filter: blur(1px);
}

.guide-backdrop--top,
.guide-backdrop--bottom {
  right: 0;
  left: 0;
}

.guide-backdrop--top {
  top: 0;
}

.guide-backdrop--bottom {
  right: 0;
  bottom: 0;
  left: 0;
}

.guide-backdrop--left,
.guide-backdrop--right {
  bottom: auto;
}

.guide-backdrop--left {
  left: 0;
}

.guide-backdrop--right {
  right: 0;
}

.guide-arrow {
  z-index: 50;
  overflow: visible;
  fill: none;
  filter: drop-shadow(0 0 3px rgb(240 237 230 / 0.2));
  stroke: rgb(240 237 230 / 0.52);
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-width: 0.75;
  transform: scaleX(-1);
  animation: guideMeteorArrow 2.4s ease-in-out infinite;
}

.guide-arrow-endpoint {
  z-index: 51;
  width: 4.4px;
  height: 4.4px;
  border-radius: 50%;
  background: rgb(240 237 230 / 0.78);
  box-shadow: 0 0 5px rgb(240 237 230 / 0.28);
  transform: translate(-50%, -50%);
}

.guide-arrow-endpoint--pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: guideEndpointPulse 1.6s ease-out infinite;
}

.guide-tooltip {
  z-index: 60;
  margin: 0;
  transform: translate(-50%, -50%);
  color: rgb(240 237 230 / 0.96);
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

@keyframes guideMeteorArrow {
  0% {
    opacity: 0;
    translate: -28px -28px;
  }

  34% {
    opacity: 0.72;
  }

  100% {
    opacity: 0;
    translate: 18px 18px;
  }
}

@keyframes guideEndpointPulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }

  50% {
    opacity: 0.08;
    transform: scale(6.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-arrow,
  .guide-arrow-endpoint--pulse {
    animation: none;
  }
}

.guide-tooltip-enter-active,
.guide-tooltip-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.guide-tooltip-enter-from,
.guide-tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) translateY(8px);
}

.guide-tooltip-enter-to,
.guide-tooltip-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%);
}
</style>
