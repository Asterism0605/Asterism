<script setup lang="ts">
defineProps<{
  tags: string[];
}>();
</script>

<template>
  <section class="flex flex-col gap-4 sm:gap-5">
    <div class="flex items-baseline gap-3">
      <h2 class="text-2xl font-bold tracking-tight sm:text-h2">Theme Tags</h2>
    </div>

    <div class="glass-panel rounded-3xl px-4 py-5 sm:rounded-[32px] sm:px-10 sm:py-8">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-3 sm:gap-x-9 sm:gap-y-5">
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="min-h-10 rounded-full border border-gold-dim/70 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-gold-dim transition-all duration-200 hover:border-gold-dim hover:bg-gold-dim/10 hover:text-text-primary hover:shadow-[0_0_22px_rgba(168,137,58,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim sm:min-h-11 sm:px-7 sm:text-sm sm:tracking-[0.22em]"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </section>
</template>
