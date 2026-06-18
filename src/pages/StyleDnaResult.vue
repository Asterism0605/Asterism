<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue';
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue';
import { showToast } from '@/composables/useToast';
import { computeStyleDnaResult, type StyleDnaSelection } from '@/utils/computeStyleDnaResult';

const props = withDefaults(
  defineProps<{
    selectionHistory?: StyleDnaSelection[];
  }>(),
  { selectionHistory: () => [] }
);

const isLoading = ref(true);
const result = computed(() => computeStyleDnaResult(props.selectionHistory));
const router = useRouter();

let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;

onMounted(() => {
  loadingTimer = window.setTimeout(() => {
    isLoading.value = false;

    if (result.value.isFallback) {
      showToast({
        type: 'info',
        message: 'We do not have quiz result yet, so this is a sample Style DNA result.',
        actionText: 'Retake quiz',
        duration: 5000,
        onAction: () => {
          void router.push('/style-dna');
        }
      });
    }
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
          class="pointer-events-none absolute left-8 top-[5.75rem] z-20 max-w-[18rem] sm:left-12 lg:left-[7.5rem] lg:top-24 lg:max-w-[min(32rem,82vw)]"
        >
          <p class="mb-4 text-xs text-text-secondary lg:mb-8">
            <span class="lg:hidden">Your aesthetic asterism has emerged</span>
            <span class="hidden lg:inline">Click to choose your preferred style</span>
          </p>
          <h1 class="font-title text-[2.35rem] font-extralight leading-[1.2] text-text-primary sm:text-[3.25rem] lg:text-display lg:leading-[1.02]">
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
      </div>
    </section>
  </main>
</template>
