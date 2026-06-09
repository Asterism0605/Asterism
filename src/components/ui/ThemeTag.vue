<script setup lang="ts">
type ThemeTagItem = {
  label: string;
};

const themeTags: ThemeTagItem[] = [
  { label: 'LABEL' },
  { label: 'EDITORIAL' },
  { label: 'MONOCHROME' },
  { label: 'LABEL123456' },
  { label: 'INDUSTRIAL' }
];
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex items-baseline gap-3">
      <h2 class="text-h2 font-bold tracking-tight">ThemeTag</h2>
    </div>

    <div class="glass-panel rounded-[32px] px-7 py-8 sm:px-10">
      <div class="flex flex-wrap items-center gap-x-9 gap-y-5">
        <button
          v-for="tag in themeTags"
          :key="tag.label"
          type="button"
          class="min-h-11 rounded-full border border-gold-dim/70 px-7 text-sm font-semibold uppercase tracking-[0.22em] text-gold-dim transition-all duration-200 hover:border-gold-dim hover:bg-gold-dim/10 hover:text-text-primary hover:shadow-[0_0_22px_rgba(168,137,58,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim"
        >
          {{ tag.label }}
        </button>
      </div>
    </div>
  </section>
</template>
