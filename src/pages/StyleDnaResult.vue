<script setup lang="ts">
import { Check, ChevronRight } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue';
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue';
import Button from '@/components/ui/Button.vue';
import { showToast } from '@/composables/useToast';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const { result } = storeToRefs(useStyleDnaStore());

const HERO_IMAGE = '/images/astronaut-dna.png';
const isLoading = ref(true);
const router = useRouter();
const primaryPercentage = computed(() => result.value.styles[0]?.percentage ?? 0);

let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;

function startExploring(): void {
  void router.push({ name: 'home' });
}

function retakeQuiz(): void {
  void router.push({ name: 'style-dna' });
}

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
          retakeQuiz();
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
          class="absolute left-8 top-[4.75rem] z-[70] max-w-[18rem] lg:left-[7.5rem] lg:top-[5.25rem] lg:max-w-[min(34rem,42vw)]"
        >
          <p
            class="mb-5 inline-flex items-center gap-3 text-xs font-medium text-text-secondary lg:mb-7"
          >
            <span
              class="inline-flex size-4 items-center justify-center rounded-full border border-text-secondary/80 text-text-primary"
              aria-hidden="true"
            >
              <Check class="size-2.5" :stroke-width="2.4" />
            </span>
            <span>Style DNA Complete</span>
          </p>

          <h1
            class="font-title text-[2.35rem] font-extralight leading-[1.16] text-text-primary lg:text-display lg:leading-[1.02]"
          >
            Your<br />
            <span class="whitespace-nowrap">Style DNA</span>
          </h1>

          <div class="mt-8 lg:mt-10">
            <p class="mt-4 max-w-[34rem] text-sm font-medium leading-relaxed text-text-secondary">
              Your homepage is now personalized based on your Style DNA.
            </p>
          </div>

          <div class="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-11 lg:-translate-y-5">
            <Button
              type="button"
              variant="light"
              class="min-w-[13.5rem] px-9 py-3 text-base"
              data-testid="start-exploring"
              @click="startExploring"
            >
              Start Exploring
            </Button>

            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-3 rounded-full py-3 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary"
              data-testid="retake-quiz"
              @click="retakeQuiz"
            >
              <span>Retake Quiz</span>
              <ChevronRight class="size-4" :stroke-width="1.8" aria-hidden="true" />
            </button>
          </div>
        </div>

        <StyleAnnotationDisplay
          :primary-style="result.primaryStyle"
          :hero-image="HERO_IMAGE"
          :styles="result.styles"
          :annotations="result.annotations"
        />
      </div>
    </section>
  </main>
</template>
