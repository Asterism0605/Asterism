<script setup lang="ts">
import { Check, ChevronDown } from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DnaLoadingState from '@/components/feature/dna/DnaLoadingState.vue';
import StyleAnnotationDisplay from '@/components/feature/dna/StyleAnnotationDisplay.vue';
import Button from '@/components/ui/Button.vue';
import { showToast } from '@/composables/useToast';
import { useStyleDnaStore } from '@/stores/style-dna.store';

const { result } = storeToRefs(useStyleDnaStore());

const HERO_IMAGE = '/images/astronaut-dna.png';
// 動畫出現位置
const METEOR_SCROLL_THRESHOLD_VIEWPORTS = 0.6;
const METEOR_SCROLL_END_VIEWPORTS = 1.2;
const MESSAGE_SCROLL_START_VIEWPORTS = 1.2;
const MESSAGE_SCROLL_END_VIEWPORTS = 2;
const ROUTE_TRANSITION_START_VIEWPORTS = 2;
const ROUTE_TRANSITION_END_VIEWPORTS = 2.5;
const HOME_NAVIGATION_THRESHOLD_VIEWPORTS = 2.51;
const isLoading = ref(true);
const isRouteTransitioning = ref(false);
const hasMeteorStarted = ref(false);
const hasPersonalizedMessageStarted = ref(false);
const scrollPrompt = ref<HTMLElement | null>(null);
const scrollProgressTrack = ref<HTMLElement | null>(null);
const scrollProgressMeteor = ref<HTMLElement | null>(null);
const scrollProgressRatio = ref(0);
const isScrollProgressHintActive = ref(false);
const meteorLayer = ref<HTMLElement | null>(null);
const personalizedMessage = ref<HTMLElement | null>(null);
const router = useRouter();
const { t } = useI18n();
const personalizedMessageLines = computed(() => t('dna.homepagePersonalized').split('\n'));

let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;
let resultScrollOriginY = 0;
let scrollPromptAnimation: gsap.core.Tween | null = null;
let scrollProgressHintAnimation: gsap.core.Tween | null = null;

function navigateToPersonalizedHome(): void {
  if (isRouteTransitioning.value) {
    return;
  }

  isRouteTransitioning.value = true;
  scrollPromptAnimation?.kill();
  void router
    .push({ path: '/home', query: { source: 'style-dna' } })
    .catch(() => {
      isRouteTransitioning.value = false;
    });
}

function retakeQuiz(): void {
  void router.push({ name: 'style-dna' });
}

function handleResultScroll(): void {
  if (isLoading.value || isRouteTransitioning.value) {
    return;
  }

  const scrollDistance = Math.max(0, window.scrollY - resultScrollOriginY);
  const viewportProgress = scrollDistance / window.innerHeight;

  updateScrollPrompt(viewportProgress);
  updateScrollProgressMeteor(viewportProgress);
  updateMeteorScrollAnimation(viewportProgress);
  updatePersonalizedMessageAnimation(viewportProgress);

  if (viewportProgress >= HOME_NAVIGATION_THRESHOLD_VIEWPORTS) {
    navigateToPersonalizedHome();
  }
}

function updateScrollProgressMeteor(viewportProgress: number): void {
  if (!scrollProgressTrack.value || !scrollProgressMeteor.value) {
    return;
  }

  const progress = clampScrollProgress(viewportProgress / HOME_NAVIGATION_THRESHOLD_VIEWPORTS);
  const travelDistance = Math.max(
    0,
    scrollProgressTrack.value.clientHeight - scrollProgressMeteor.value.offsetHeight
  );

  scrollProgressRatio.value = progress;
  if (progress === 0) {
    startScrollProgressHintAnimation();
    return;
  }

  scrollProgressHintAnimation?.kill();
  scrollProgressHintAnimation = null;
  isScrollProgressHintActive.value = false;
  gsap.set(scrollProgressMeteor.value, { y: travelDistance * progress });
}

function startScrollProgressHintAnimation(): void {
  if (
    scrollProgressHintAnimation ||
    !scrollProgressTrack.value ||
    !scrollProgressMeteor.value ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const travelDistance = Math.max(
    0,
    scrollProgressTrack.value.clientHeight - scrollProgressMeteor.value.offsetHeight
  );

  isScrollProgressHintActive.value = true;
  scrollProgressHintAnimation = gsap.fromTo(
    scrollProgressMeteor.value,
    { y: 0, autoAlpha: 0.28 },
    {
      y: travelDistance,
      autoAlpha: 1,
      duration: 1.8,
      ease: 'power1.in',
      repeat: -1,
      repeatDelay: 0.25
    }
  );
}

function clampScrollProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function updateScrollPrompt(viewportProgress: number): void {
  if (viewportProgress <= METEOR_SCROLL_THRESHOLD_VIEWPORTS || !scrollPrompt.value) {
    return;
  }

  scrollPromptAnimation?.kill();
  gsap.set(scrollPrompt.value, { autoAlpha: 0 });
}

function updateMeteorScrollAnimation(viewportProgress: number): void {
  if (!meteorLayer.value) {
    return;
  }

  const meteorProgress = clampScrollProgress(
    (viewportProgress - METEOR_SCROLL_THRESHOLD_VIEWPORTS) /
      (METEOR_SCROLL_END_VIEWPORTS - METEOR_SCROLL_THRESHOLD_VIEWPORTS)
  );
  const isActive =
    viewportProgress > METEOR_SCROLL_THRESHOLD_VIEWPORTS &&
    viewportProgress < METEOR_SCROLL_END_VIEWPORTS;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const meteors = meteorLayer.value.querySelectorAll<HTMLElement>('.result-meteor');

  hasMeteorStarted.value = isActive;
  gsap.set(meteorLayer.value, { autoAlpha: isActive ? 1 : 0 });

  meteors.forEach((meteor, index) => {
    const distanceMultiplier = 1 + index * 0.1;
    const opacityMultiplier = Math.max(0.38, 1 - index * 0.07);
    const opacity = isActive ? Math.sin(meteorProgress * Math.PI) * opacityMultiplier : 0;

    gsap.set(meteor, {
      x: 0,
      y: prefersReducedMotion ? 0 : -180 + 540 * meteorProgress * distanceMultiplier,
      autoAlpha: opacity
    });
  });
}

function updatePersonalizedMessageAnimation(viewportProgress: number): void {
  if (!personalizedMessage.value) {
    return;
  }

  const messageProgress = clampScrollProgress(
    (viewportProgress - MESSAGE_SCROLL_START_VIEWPORTS) /
      (MESSAGE_SCROLL_END_VIEWPORTS - MESSAGE_SCROLL_START_VIEWPORTS)
  );
  const routeTransitionProgress = clampScrollProgress(
    (viewportProgress - ROUTE_TRANSITION_START_VIEWPORTS) /
      (ROUTE_TRANSITION_END_VIEWPORTS - ROUTE_TRANSITION_START_VIEWPORTS)
  );
  const isActive = viewportProgress > MESSAGE_SCROLL_START_VIEWPORTS;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const entranceOffset = 28 * (1 - messageProgress);
  const exitOffset = -28 * routeTransitionProgress;

  hasPersonalizedMessageStarted.value = isActive;
  gsap.set(personalizedMessage.value, {
    autoAlpha: messageProgress * (1 - routeTransitionProgress),
    y: prefersReducedMotion ? 0 : entranceOffset + exitOffset,
    filter: `blur(${10 * (1 - messageProgress) + 8 * routeTransitionProgress}px)`
  });
}

function startScrollPromptAnimation(): void {
  if (!scrollPrompt.value) {
    return;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(scrollPrompt.value, { autoAlpha: 1 });
    return;
  }

  scrollPromptAnimation = gsap.fromTo(
    scrollPrompt.value,
    { autoAlpha: 0.52, y: 0 },
    {
      autoAlpha: 1,
      y: 8,
      duration: 0.8,
      ease: 'power1.inOut',
      repeat: -1,
      repeatDelay: 0.15,
      yoyo: true
    }
  );
}

onMounted(() => {
  if (window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  resultScrollOriginY = window.scrollY;
  window.addEventListener('scroll', handleResultScroll, { passive: true });

  loadingTimer = window.setTimeout(() => {
    isLoading.value = false;
    void nextTick(() => {
      startScrollPromptAnimation();
      startScrollProgressHintAnimation();
    });

    if (result.value.isFallback) {
      showToast({
        type: 'info',
        message: t('dna.sampleResultNotice'),
        actionText: t('dna.retakeQuiz'),
        duration: 5000,
        onAction: () => {
          retakeQuiz();
        }
      });
    }
  }, 1500);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleResultScroll);
  scrollPromptAnimation?.kill();
  scrollProgressHintAnimation?.kill();
  scrollPromptAnimation = null;
  scrollProgressHintAnimation = null;

  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
  }
});
</script>

<template>
  <DnaLoadingState v-if="isLoading" />

  <main v-else class="relative min-h-[351vh] bg-void p-0 text-text-primary">
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
            lg:translate-y-0 lg:text-display lg:leading-[1.02]">
            {{ $t('dna.resultYour') }}<br/>
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
            <div class="flex h-full flex-col justify-center pr-5 lg:w-full lg:pr-0">
              <p class="mb-4 inline-flex items-center gap-2.5 text-xs font-medium text-text-primary lg:hidden">
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
                  class="min-w-[11.5rem] px-7 py-2.5 text-sm active:bg-text-primary active:text-deep lg:min-w-[13.5rem] lg:px-9 lg:py-3 lg:text-base"
                  data-testid="retake-quiz"
                  @click="retakeQuiz"
                >
                  {{ $t('dna.retakeQuiz') }}
                </Button>
              </div>
            </div>
          </template>
        </StyleAnnotationDisplay>

        <div
          ref="scrollPrompt"
          class="pointer-events-none absolute bottom-[20px] left-1/2 z-[80] flex max-w-[16rem] -translate-x-1/2 flex-col items-center gap-2 text-center text-[14px] tracking-[0.08em] text-text-secondary lg:max-w-[20rem] lg:text-base"
          data-testid="result-scroll-prompt"
          role="status"
        >
          <span>{{ $t('dna.scrollToSimilarStyles') }}</span>
          <ChevronDown class="size-6" aria-hidden="true" />
        </div>

        <div
          ref="scrollProgressTrack"
          class="pointer-events-none fixed top-1/2 right-[18px] z-[95] h-[25vh] w-[20px] -translate-y-1/2"
          data-testid="result-scroll-track"
          :data-progress="scrollProgressRatio.toFixed(2)"
          :data-hint-active="isScrollProgressHintActive ? 'true' : 'false'"
          aria-hidden="true"
        >
          <span
            class="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-text-primary/20"
          />
          <span
            ref="scrollProgressMeteor"
            class="absolute top-0 left-1/2 h-[clamp(90px,14vh,210px)] w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-text-primary/70 to-text-primary shadow-[0_0_12px_rgb(240_237_230_/_50%)]"
            data-testid="result-scroll-meteor"
          />
        </div>

        <div
          ref="meteorLayer"
          class="pointer-events-none fixed inset-0 z-[85] opacity-0"
          data-testid="result-meteor-layer"
          :data-active="hasMeteorStarted ? 'true' : 'false'"
          aria-hidden="true"
        >
          <span
            class="result-meteor absolute top-[18%] left-[78%] h-[clamp(120px,18vh,260px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/85 to-transparent shadow-[0_0_14px_rgb(240_237_230_/_55%)]"
          />
          <span
            class="result-meteor absolute top-[42%] left-[62%] h-[clamp(90px,14vh,210px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/70 to-transparent shadow-[0_0_12px_rgb(240_237_230_/_45%)]"
          />
          <span
            class="result-meteor absolute top-[68%] left-[88%] h-[clamp(70px,11vh,170px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/55 to-transparent shadow-[0_0_10px_rgb(240_237_230_/_35%)]"
          />
          <span
            class="result-meteor absolute top-[32%] left-[92%] h-[clamp(75px,12vh,180px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/60 to-transparent shadow-[0_0_10px_rgb(240_237_230_/_38%)]"
          />
          <span
            class="result-meteor absolute top-[58%] left-[72%] h-[clamp(100px,15vh,220px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/75 to-transparent shadow-[0_0_13px_rgb(240_237_230_/_46%)]"
          />
          <span
            class="result-meteor absolute top-[24%] left-[12%] h-[clamp(110px,17vh,240px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/80 to-transparent shadow-[0_0_14px_rgb(240_237_230_/_50%)]"
          />
          <span
            class="result-meteor absolute top-[48%] left-[28%] h-[clamp(85px,13vh,190px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/65 to-transparent shadow-[0_0_12px_rgb(240_237_230_/_42%)]"
          />
          <span
            class="result-meteor absolute top-[72%] left-[6%] h-[clamp(65px,10vh,150px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/50 to-transparent shadow-[0_0_10px_rgb(240_237_230_/_32%)]"
          />
          <span
            class="result-meteor absolute top-[16%] left-[34%] h-[clamp(80px,12vh,185px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/62 to-transparent shadow-[0_0_11px_rgb(240_237_230_/_40%)]"
          />
          <span
            class="result-meteor absolute top-[62%] left-[18%] h-[clamp(95px,14vh,205px)] w-[2px] bg-gradient-to-b from-transparent via-text-primary/70 to-transparent shadow-[0_0_12px_rgb(240_237_230_/_44%)]"
          />
        </div>

        <div
          class="result-personalized-message-layer pointer-events-none fixed inset-0 z-[90] flex items-center justify-center px-6"
          data-testid="result-personalized-message-layer"
          :data-active="hasPersonalizedMessageStarted ? 'true' : 'false'"
          role="status"
        >
          <h1
            ref="personalizedMessage"
            class="text-h1 max-w-[20ch] text-center font-title font-light text-text-primary opacity-0"
          >
            <span
              v-for="line in personalizedMessageLines"
              :key="line"
              class="result-personalized-message-line block"
            >
              {{ line }}
            </span>
          </h1>
        </div>
      </div>
    </section>
  </main>
</template>
