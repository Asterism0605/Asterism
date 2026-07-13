<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { CircleX } from '@lucide/vue';

defineProps<{
  style?: CSSProperties;
}>();

const emit = defineEmits<{
  delete: [];
}>();
</script>

<template>
  <button
    type="button"
    class="delete-icon-button"
    :style="style"
    :aria-label="$t('moodboard.deleteFolderAria')"
    @click.stop="emit('delete')"
  >
    <CircleX :size="18" aria-hidden="true" />
  </button>
</template>

<style scoped>
.delete-icon-button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
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
