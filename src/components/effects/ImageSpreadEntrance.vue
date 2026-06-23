<script setup lang="ts">
interface Props {
  as?: string;
  kind?: 'page' | 'wash' | 'center' | 'centerFrame' | 'actions' | 'relatedCard';
  delay?: number;
  direction?: 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | 'bottom';
  spreadIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  kind: 'page',
  delay: 0,
  direction: undefined,
  spreadIndex: undefined
});

const directionOffsets = {
  leftTop: { x: '32vw', y: '24vh' },
  leftBottom: { x: '30vw', y: '-24vh' },
  rightTop: { x: '-32vw', y: '24vh' },
  rightBottom: { x: '-30vw', y: '-24vh' },
  bottom: { x: '0', y: '18px' }
};

const relatedCardDirections = ['leftTop', 'leftBottom', 'rightTop', 'rightBottom'] as const;
const relatedCardDelay = 220;

const resolvedDirection =
  props.direction ??
  (props.kind === 'relatedCard' && props.spreadIndex !== undefined
    ? relatedCardDirections[props.spreadIndex] ?? 'bottom'
    : 'bottom');
const resolvedDelay = props.kind === 'relatedCard' ? relatedCardDelay : props.delay;
const offset = directionOffsets[resolvedDirection];
const animationStyle = {
  animationDelay: `${resolvedDelay}ms`,
  '--spread-enter-x': offset.x,
  '--spread-enter-y': offset.y
};
</script>

<template>
  <component
    :is="as"
    class="image-spread-entrance"
    :class="`image-spread-entrance--${kind}`"
    :style="animationStyle"
  >
    <slot />
  </component>
</template>

<style scoped>
.image-spread-entrance {
  --spread-enter-x: 0;
  --spread-enter-y: 18px;
}

.image-spread-entrance--page {
  animation: image-spread-page-enter 520ms ease-out both;
}

.image-spread-entrance--wash {
  animation: image-spread-wash-enter 900ms ease-out both;
}

.image-spread-entrance--center {
  animation: spread-overlay-enter 1000ms cubic-bezier(0.2, 0.78, 0.22, 1) both;
}

.image-spread-entrance--centerFrame {
  transform-origin: center;
  animation: spread-frame-enter 1060ms cubic-bezier(0.2, 0.78, 0.22, 1) both;
}

.image-spread-entrance--actions {
  animation: spread-actions-enter 920ms cubic-bezier(0.2, 0.78, 0.22, 1) both;
}

.image-spread-entrance--relatedCard {
  opacity: 0;
  transform: translate3d(var(--spread-enter-x), var(--spread-enter-y), 0) scale(0.42);
  transform-origin: center;
  animation: related-card-spread-enter 1160ms cubic-bezier(0.16, 0.86, 0.28, 1) forwards;
}

@keyframes image-spread-page-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes image-spread-wash-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes spread-overlay-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes spread-frame-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.9);
    filter: blur(8px);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }
}

@keyframes spread-actions-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 10px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes related-card-spread-enter {
  from {
    opacity: 0;
    transform: translate3d(var(--spread-enter-x), var(--spread-enter-y), 0) scale(0.42);
    filter: blur(10px);
  }

  58% {
    opacity: 1;
    filter: blur(2px);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-spread-entrance,
  .image-spread-entrance--relatedCard {
    opacity: 1;
    transform: none;
    filter: none;
    animation: none;
  }
}
</style>
