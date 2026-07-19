<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost';
  }>(),
  { variant: 'primary' }
);
</script>

<template>
  <button
    class="app-button cursor-pointer text-sm rounded-full transition-all duration-200 px-4 sm:px-5 py-1.5 sm:py-2"
    :class="[
      variant === 'primary'
        ? 'bg-stellar-red text-text-primary hover:opacity-90 active:scale-[0.985]'
        : variant === 'secondary'
          ? 'border border-white/20 text-text-primary hover:bg-white/5'
          : 'text-text-secondary hover:text-text-primary'
    ]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  font-weight: 400;
}
</style>
