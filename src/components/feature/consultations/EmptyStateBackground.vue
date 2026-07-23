<script setup lang="ts">
import OrbitBackground from './OrbitBackground.vue';
</script>

<template>
  <div class="empty-state-background" aria-hidden="true">
    <OrbitBackground />
  </div>
</template>

<style scoped>
.empty-state-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.empty-state-background :deep(.orbit) {
  top: calc(50% + 170px);
  right: -140px;
}

.empty-state-background :deep(.timeline-orbit) {
  opacity: 0.8;
}

.empty-state-background :deep(.star--one) {
  left: 30%;
  top: 24%;
}

.empty-state-background :deep(.star--two) {
  left: 70%;
  top: 28%;
}

.empty-state-background :deep(.star--four) {
  left: 20%;
  bottom: 18%;
}

@media (max-width: 768px) {
  .empty-state-background :deep(.mobile-orbits) {
    transform: translateY(190px);
    opacity: 0.8;
  }

  .empty-state-background :deep(.star--one) {
    left: 88%;
    top: 26%;
  }

  .empty-state-background :deep(.star--two) {
    left: 18%;
    top: 79%;
  }

  .empty-state-background :deep(.star--four) {
    left: 10%;
    bottom: 10%;
  }
}
</style>
