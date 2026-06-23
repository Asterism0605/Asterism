<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  }>(),
  { variant: 'primary' }
);
</script>

<template>
  <button
    class="cursor-pointer text-sm font-semibold rounded-full transition-all duration-200 px-4 sm:px-5 py-1.5 sm:py-2"
    :class="[
      variant === 'primary'
        ? 'bg-stellar-red text-text-primary hover:opacity-90 active:scale-[0.985]'
        : variant === 'secondary'
          ? 'border border-white/20 text-text-primary hover:bg-white/5'
          : variant === 'light'
            ? 'bg-text-primary text-deep shadow-[0_14px_34px_rgba(255,255,255,0.12)] hover:opacity-90 active:scale-[0.985]'
            : 'text-text-secondary hover:text-text-primary'
    ]"
  >
    <slot />
  </button>
</template>
