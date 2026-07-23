<script setup lang="ts">
import { Circle } from '@lucide/vue';

withDefaults(
  defineProps<{
    selected: boolean;
    ariaLabel: string;
    size?: number;
    iconSize?: number;
  }>(),
  { size: 19, iconSize: 15 }
);

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <button
    type="button"
    class="image-select-toggle"
    :class="{ 'image-select-toggle--selected': selected }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    @pointerdown.stop
    @click.stop="emit('toggle')"
  >
    <Circle :size="iconSize" :fill="selected ? 'currentColor' : 'none'" aria-hidden="true" />
  </button>
</template>

<style scoped>
.image-select-toggle {
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(9, 9, 11, 0.78);
  color: #f0ede6d1;
  backdrop-filter: blur(6px);
  transition:
    color 180ms ease,
    box-shadow 180ms ease;
}

.image-select-toggle--selected {
  color: var(--color-text-primary);
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede657;
}
</style>
