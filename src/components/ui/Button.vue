<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'bracket';
  }>(),
  { variant: 'primary' }
);
</script>

<template>
  <button
    class="cursor-pointer font-normal transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50 disabled:active:scale-100"
    :class="[
      variant === 'primary'
        ? 'rounded-full bg-stellar-red px-4 py-1.5 text-sm text-text-primary hover:opacity-90 active:scale-[0.985] sm:px-5 sm:py-2'
        : variant === 'secondary'
          ? 'rounded-full border border-white/20 px-4 py-1.5 text-sm text-text-primary hover:bg-white/5 sm:px-5 sm:py-2'
          : variant === 'ghost'
            ? 'rounded-full px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary sm:px-5 sm:py-2'
            : 'relative inline-flex h-10 min-w-20 items-center justify-center bg-transparent font-title text-sm text-text-primary [--bracket-left-bottom:1px] [--bracket-left-side:0.5px] [--bracket-left-top:1px] [--bracket-right-bottom:1px] [--bracket-right-side:0.5px] [--bracket-right-top:1px] hover:[--bracket-left-bottom:1px] hover:[--bracket-left-side:1.5px] hover:[--bracket-left-top:1.5px] hover:[--bracket-right-bottom:1.5px] hover:[--bracket-right-side:1px] hover:[--bracket-right-top:1.5px] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70'
    ]"
  >
    <template v-if="variant === 'bracket'">
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 w-2.5 border-white/80 [border-bottom-width:var(--bracket-left-bottom)] [border-left-width:var(--bracket-left-side)] [border-top-width:var(--bracket-left-top)] transition-[border-width] duration-200"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 w-2.5 border-white/80 [border-bottom-width:var(--bracket-right-bottom)] [border-right-width:var(--bracket-right-side)] [border-top-width:var(--bracket-right-top)] transition-[border-width] duration-200"
      />
      <slot />
    </template>
    <slot v-else />
  </button>
</template>
