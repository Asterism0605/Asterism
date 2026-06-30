<script setup lang="ts">
withDefaults(
  defineProps<{
    tags: string[];
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);
</script>

<template>
  <template v-if="compact">
    <section class="flex flex-col gap-4">
      <h2 class="text-h3 text-text-primary">Theme Tags</h2>
      <div class="flex flex-wrap gap-2 md:gap-3">
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="min-h-8 rounded-full border border-gold-dim/70 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-gold-dim transition-all duration-200 hover:border-gold-dim hover:bg-gold-dim/10 hover:text-text-primary hover:shadow-[0_0_22px_rgba(168,137,58,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim"
        >
          {{ tag }}
        </button>
      </div>
    </section>
  </template>
  <template v-else>
    <section class="flex flex-col gap-4 sm:gap-5">
      <h2 class="text-h3 text-text-primary">Theme Tags</h2>

      <div class="w-full glass-panel rounded-3xl px-4 py-5 sm:rounded-[32px] sm:px-10 sm:py-8">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-3 sm:gap-y-5">
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="min-h-10 rounded-full border border-gold-dim/70 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-gold-dim transition-all duration-200 hover:border-gold-dim hover:bg-gold-dim/10 hover:text-text-primary hover:shadow-[0_0_22px_rgba(168,137,58,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim sm:px-7 sm:tracking-[0.22em]"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </section>
  </template>
</template>
