<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue';
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const { result } = storeToRefs(useStyleDnaStore());

const isLoading = ref(true);

let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;

onMounted(() => {
  loadingTimer = window.setTimeout(() => {
    isLoading.value = false;
  }, 1500);
});

onBeforeUnmount(() => {
  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
  }
});
</script>

<template>
  <DnaLoadingState v-if="isLoading" />

  <main v-else class="h-screen overflow-hidden bg-deep p-0 text-text-primary">
    <section class="h-screen overflow-hidden">
      <div class="relative h-screen overflow-hidden bg-void">
        <div
          class="pointer-events-none absolute left-8 top-[5.75rem] z-20 max-w-[18rem] sm:left-12 lg:left-14 lg:top-24 lg:max-w-[min(32rem,82vw)]"
        >
          <p class="mb-4 text-xs text-text-secondary lg:mb-8">
            <span class="lg:hidden">Your aesthetic asterism has emerged</span>
            <span class="hidden lg:inline">Click to choose your preferred style</span>
          </p>
          <h1
            class="font-title text-[2.35rem] font-extralight leading-[1.2] text-text-primary sm:text-[3.25rem] lg:text-display lg:leading-[1.02]"
          >
            Your<br />
            <span class="whitespace-nowrap">Style DNA</span>
          </h1>
        </div>

        <StyleAnnotationDisplay
          :primary-style="result.primaryStyle"
          :hero-image="result.heroImage"
          :styles="result.styles"
          :annotations="result.annotations"
        />

        <div
          v-if="result.isFallback"
          class="relative z-30 mt-6 hidden flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between lg:absolute lg:bottom-8 lg:right-8 lg:mt-0 lg:flex lg:max-w-md lg:bg-void/55 lg:backdrop-blur-md"
        >
          <p class="max-w-xl text-sm leading-6 text-text-secondary">
            We do not have quiz data yet, so this is a sample Style DNA result.
          </p>
          <a
            class="inline-flex min-h-11 items-center justify-center rounded-lg border border-gold-dim/55 px-5 text-sm font-semibold text-text-primary transition-colors hover:border-gold-dim hover:bg-gold-dim/10"
            href="/discover-dna"
          >
            Retake quiz
          </a>
        </div>
      </div>
    </section>
  </main>
</template>
