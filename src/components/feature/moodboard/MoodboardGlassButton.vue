<script setup lang="ts">
const trashIcon = '/images/image-trash-icon.webp';

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
    class="moodboard-glass-button fixed right-6 bottom-6 sm:right-8 sm:bottom-8 z-40 w-14 h-14 sm:w-[52px] sm:h-[52px] border-0 rounded-full p-0 overflow-hidden cursor-pointer transition duration-200 ease-[ease] hover:scale-[1.08]"
    :aria-label="ariaLabel"
    @click="emit('click')"
  >
    <img :src="trashIcon" alt="" class="size-full" />
  </button>
</template>

<style scoped>
.moodboard-glass-button {
  box-shadow: 0 4px 20px rgb(0 0 0 / 0.4);
}

.moodboard-glass-button:hover {
  box-shadow: 0 6px 26px rgb(0 0 0 / 0.5);
}
</style>
