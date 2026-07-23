<script setup lang="ts">
import { Check } from '@lucide/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue';
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue';
import StyleDnaResultAnimation from '@/components/feature/dna/StyleDnaResultAnimation.vue';
import Button from '@/components/ui/Button.vue';
import { showToast } from '@/composables/useToast';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const { answers, result } = storeToRefs(useStyleDnaStore());
const router = useRouter();
const { t } = useI18n();

const HERO_IMAGE = '/images/astronaut-dna.png';
const RESULT_SCROLLBAR_HIDDEN_CLASS = 'style-dna-result-scrollbar-hidden';
const isLoading = ref(true);
let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;

function retakeQuiz(): void {
  void router.push({ name: 'style-dna' });
}

onMounted(() => {
  document.documentElement.classList.add(RESULT_SCROLLBAR_HIDDEN_CLASS);
  loadingTimer = window.setTimeout(() => {
    isLoading.value = false;

    if (result.value.isFallback) {
      showToast({
        type: 'info',
        message: t('dna.sampleResultNotice'),
        actionText: t('dna.retakeQuiz'),
        duration: 5000,
        onAction: retakeQuiz
      });
    }
  }, 1500);
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove(RESULT_SCROLLBAR_HIDDEN_CLASS);

  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
  }
});
</script>

<template>
  <DnaLoadingState v-if="isLoading" />

  <main v-else class="relative min-h-[750vh] bg-void p-0 text-text-primary">
    <section class="sticky top-0 h-screen overflow-hidden lg:relative lg:top-auto lg:overflow-visible">
      <div class="relative h-screen overflow-hidden bg-void lg:overflow-visible">
        <div
          class="absolute left-6 top-[4.375rem] z-[70] max-w-[16.5rem]
          lg:left-[7.5rem] lg:top-[134px] lg:max-w-[min(34rem,42vw)]"
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
            <span>{{ $t('dna.complete') }}</span>
          </p>

          <h1
            class="translate-y-7 font-title text-[3.2rem] font-extralight leading-[1.12] text-text-primary
            lg:translate-y-0 lg:text-display lg:leading-[1.02]"
          >
            {{ $t('dna.resultYour') }}<br />
            <span class="whitespace-nowrap">Style DNA</span>
          </h1>
        </div>

        <StyleAnnotationDisplay
          :primary-style="result.primaryStyle"
          :hero-image="HERO_IMAGE"
          :styles="result.styles"
          :annotations="result.annotations"
        >
          <template #mobile-panel>
            <div class="flex flex-col items-start lg:h-full lg:w-full lg:justify-center lg:pr-0">
              <p class="ml-3 inline-flex items-center gap-2.5 whitespace-nowrap text-xs font-medium text-text-primary lg:hidden">
                <span>{{ $t('dna.complete') }}</span>
                <span
                  class="inline-flex size-4 items-center justify-center rounded-full border border-text-secondary/80 text-text-primary"
                  aria-hidden="true"
                >
                  <Check class="size-2.5" :stroke-width="2.4" />
                </span>
              </p>

              <div class="mt-5 flex flex-col items-start gap-3 lg:mt-8 lg:flex-row lg:items-center lg:gap-x-8 lg:gap-y-4">
                <Button
                  type="button"
                  variant="secondary"
                  class="w-[9rem] min-w-0 px-5 py-2.5 text-sm active:bg-text-primary active:text-deep lg:w-auto lg:min-w-[13.5rem] lg:px-9 lg:py-3 lg:text-base"
                  data-testid="retake-quiz"
                  @click="retakeQuiz"
                >
                  {{ $t('dna.retakeQuiz') }}
                </Button>
              </div>
            </div>
          </template>
        </StyleAnnotationDisplay>

        <StyleDnaResultAnimation :answers="answers" :result="result" />
      </div>
    </section>
  </main>
</template>
