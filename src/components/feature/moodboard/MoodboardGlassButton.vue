<script setup lang="ts">
const trashIcon = '/images/image-trash-icon.png';

defineProps<{
  ariaLabel: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="moodboard-glass-button"
    :aria-label="ariaLabel"
    @click="emit('click')"
  >
    <img :src="trashIcon" alt="" class="size-full" />
  </button>
</template>

<style scoped>
.moodboard-glass-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 9999px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgb(0 0 0 / 0.4);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease;
}

.moodboard-glass-button:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 26px rgb(0 0 0 / 0.5);
}

@media (min-width: 640px) {
  .moodboard-glass-button {
    right: 32px;
    bottom: 32px;
    width: 52px;
    height: 52px;
  }
}
</style>
