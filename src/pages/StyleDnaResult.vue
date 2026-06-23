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
          class="absolute left-6 top-[4.375rem] z-[70] max-w-[16.5rem] 
          lg:left-[7.5rem] lg:top-[5.25rem] lg:max-w-[min(34rem,42vw)]"
        >
          <p
            class="mb-3 hidden items-center gap-2.5 text-xs font-medium text-text-secondary 
            lg:mb-7 lg:inline-flex lg:gap-3"
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
            class="translate-y-5 font-title text-[3rem] font-extralight leading-[1.12] text-text-primary 
            lg:translate-y-0 lg:text-display lg:leading-[1.02]">
            Your<br />
            <span class="whitespace-nowrap">Style DNA</span>
          </h1>

          <div 
            class="hidden 
            lg:mt-10 lg:block">
            <p class="mt-3 max-w-[15.5rem] text-xs font-medium leading-relaxed text-text-secondary lg:mt-4 lg:max-w-[34rem] lg:text-sm">
              Your homepage is now personalized based on your Style DNA.
            </p>
          </div>

          <div
            class="hidden flex-wrap items-center gap-x-5 gap-y-3 
            lg:mt-11 lg:flex lg:-translate-y-5 lg:gap-x-8 lg:gap-y-4">
            <Button
              type="button"
              variant="light"
              class="min-w-[11.5rem] px-7 py-2.5 text-sm 
              lg:min-w-[13.5rem] lg:px-9 lg:py-3 lg:text-base"
              data-testid="start-exploring"
              @click="startExploring">
              Start Exploring
            </Button>

            <button
              type="button"
              class="inline-flex cursor-pointer items-center gap-2.5 rounded-full py-2 text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary 
              lg:gap-3 lg:py-3 lg:text-sm"
              data-testid="retake-quiz"
              @click="retakeQuiz">
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
        >
          <template #mobile-panel>
            <div class="flex h-full flex-col justify-center pr-5">
              <p class="mb-4 inline-flex items-center gap-2.5 text-xs font-medium text-text-primary">
                <span>Style DNA Complete</span>
                <span
                  class="inline-flex size-4 items-center justify-center rounded-full border border-text-secondary/80 text-text-primary"
                  aria-hidden="true"
                >
                  <Check class="size-2.5" :stroke-width="2.4" />
                </span>
              </p>

              <p class="max-w-[15rem] text-xs font-medium leading-relaxed text-text-secondary">
                Your homepage is now personalized based on your Style DNA.
              </p>

              <div class="mt-5 flex flex-col items-start gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  class="min-w-[11.5rem] px-7 py-2.5 text-sm active:bg-text-primary active:text-deep"
                  data-testid="start-exploring"
                  @click="startExploring"
                >
                  Start Exploring
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  class="min-w-[11.5rem] px-7 py-2.5 text-sm active:bg-text-primary active:text-deep"
                  data-testid="retake-quiz"
                  @click="retakeQuiz"
                >
                  Retake Quiz
                </Button>
              </div>
            </div>
          </template>
        </StyleAnnotationDisplay>
      </div>
    </section>
  </main>
</template>
