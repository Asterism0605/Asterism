<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';
import { CircleX } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    style?: CSSProperties;
    ariaLabel?: string;
    size?: number;
    iconSize?: number;
  }>(),
  { ariaLabel: undefined, size: 20, iconSize: 16 }
);

const emit = defineEmits<{
  delete: [];
}>();

const buttonStyle = computed<CSSProperties>(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  ...props.style
}));
</script>

<template>
  <button
    type="button"
    class="delete-icon-button"
    :style="buttonStyle"
    :aria-label="props.ariaLabel ?? $t('moodboard.deleteFolderAria')"
    @pointerdown.stop
    @click.stop="emit('delete')"
  >
    <CircleX :size="iconSize" aria-hidden="true" />
  </button>
</template>

<style scoped>
.delete-icon-button {
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: none;
  background: rgba(9, 9, 11, 0.78);
  color: #f0ede6;
  backdrop-filter: blur(6px);
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.delete-icon-button:hover {
  background: var(--color-stellar-red);
  color: #ffffff;
}
</style>
