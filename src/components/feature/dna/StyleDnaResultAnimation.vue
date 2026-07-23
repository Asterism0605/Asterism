<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { StyleDnaAnswer } from '@/types/style-dna';
import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

interface Props {
  answers: StyleDnaAnswer[];
  result: ComputedStyleDnaResult;
}

interface TransitionImage {
  id: string;
  src: string;
  alt: string;
}

interface ResultMeteor {
  id: string;
  positionClass: string;
  appearanceClass: string;
  motionMultiplier?: number;
  opacityMultiplier?: number;
}

const props = defineProps<Props>();

const HERO_IMAGE = '/images/astronaut-dna.png';
const METEOR_SCROLL_THRESHOLD_VIEWPORTS = 0.6;
const METEOR_SCROLL_END_VIEWPORTS = 1.7;
const MESSAGE_SCROLL_START_VIEWPORTS = 1.7;
const MESSAGE_SCROLL_END_VIEWPORTS = 4.5;
const ROUTE_TRANSITION_START_VIEWPORTS = 4.5;
const ROUTE_TRANSITION_END_VIEWPORTS = 6;
const HOME_NAVIGATION_THRESHOLD_VIEWPORTS = 6.5;
const INTERLEAVE_ITEM_STAGGER = 0.12;
const INTERLEAVE_REVEAL_DURATION = 0.28;
const RESULT_TRANSITION_IMAGE_LIMIT = 3;
const RESULT_METEORS: ResultMeteor[] = [
  { id: 'right-upper', positionClass: 'top-[18%] left-[78%] h-[clamp(120px,18vh,260px)]', appearanceClass: 'via-text-primary/85 shadow-[0_0_14px_rgb(240_237_230_/_55%)]' },
  { id: 'right-middle', positionClass: 'top-[42%] left-[62%] h-[clamp(90px,14vh,210px)]', appearanceClass: 'via-text-primary/70 shadow-[0_0_12px_rgb(240_237_230_/_45%)]' },
  { id: 'right-lower', positionClass: 'top-[68%] left-[88%] h-[clamp(70px,11vh,170px)]', appearanceClass: 'via-text-primary/55 shadow-[0_0_10px_rgb(240_237_230_/_35%)]' },
  { id: 'far-right-upper', positionClass: 'top-[32%] left-[92%] h-[clamp(75px,12vh,180px)]', appearanceClass: 'via-text-primary/60 shadow-[0_0_10px_rgb(240_237_230_/_38%)]' },
  { id: 'right-center-lower', positionClass: 'top-[58%] left-[72%] h-[clamp(100px,15vh,220px)]', appearanceClass: 'via-text-primary/75 shadow-[0_0_13px_rgb(240_237_230_/_46%)]' },
  { id: 'left-upper', positionClass: 'top-[24%] left-[12%] h-[clamp(110px,17vh,240px)]', appearanceClass: 'via-text-primary/80 shadow-[0_0_14px_rgb(240_237_230_/_50%)]' },
  { id: 'left-middle', positionClass: 'top-[48%] left-[28%] h-[clamp(85px,13vh,190px)]', appearanceClass: 'via-text-primary/65 shadow-[0_0_12px_rgb(240_237_230_/_42%)]' },
  { id: 'far-left-lower', positionClass: 'top-[72%] left-[6%] h-[clamp(65px,10vh,150px)]', appearanceClass: 'via-text-primary/50 shadow-[0_0_10px_rgb(240_237_230_/_32%)]' },
  { id: 'left-center-upper', positionClass: 'top-[16%] left-[34%] h-[clamp(80px,12vh,185px)]', appearanceClass: 'via-text-primary/62 shadow-[0_0_11px_rgb(240_237_230_/_40%)]' },
  { id: 'left-lower', positionClass: 'top-[62%] left-[18%] h-[clamp(95px,14vh,205px)]', appearanceClass: 'via-text-primary/70 shadow-[0_0_12px_rgb(240_237_230_/_44%)]' },
  { id: 'center-upper', positionClass: 'top-[20%] left-[48%] h-[clamp(100px,15vh,220px)]', appearanceClass: 'via-text-primary/80 shadow-[0_0_14px_rgb(240_237_230_/_52%)]', motionMultiplier: 1.15, opacityMultiplier: 0.85 },
  { id: 'center-middle', positionClass: 'top-[44%] left-[52%] h-[clamp(120px,18vh,260px)]', appearanceClass: 'via-text-primary/90 shadow-[0_0_16px_rgb(240_237_230_/_60%)]', motionMultiplier: 1.05, opacityMultiplier: 0.9 },
  { id: 'center-lower', positionClass: 'top-[69%] left-[46%] h-[clamp(80px,12vh,185px)]', appearanceClass: 'via-text-primary/75 shadow-[0_0_13px_rgb(240_237_230_/_48%)]', motionMultiplier: 1.2, opacityMultiplier: 0.8 }
];

const router = useRouter();
const { t } = useI18n();
const isRouteTransitioning = ref(false);
const hasMeteorStarted = ref(false);
const hasPersonalizedMessageStarted = ref(false);
const hasTransitionImagesStarted = ref(false);
const scrollPrompt = ref<HTMLElement | null>(null);
const scrollProgressTrack = ref<HTMLElement | null>(null);
const scrollProgressMeteor = ref<HTMLElement | null>(null);
const scrollProgressRatio = ref(0);
const isScrollProgressHintActive = ref(false);
const meteorLayer = ref<HTMLElement | null>(null);
const transitionImageLayer = ref<HTMLElement | null>(null);
const personalizedMessage = ref<HTMLElement | null>(null);
const personalizedMessageLines = computed(() => t('dna.homepagePersonalized').split('\n'));

gsap.registerPlugin(SplitText);

function normalizeStyleTag(style: string): string {
  return style.trim().toLowerCase();
}

function answerMatchesStyle(answer: StyleDnaAnswer, normalizedStyle: string): boolean {
  const matchesWeight = Object.entries(answer.weights).some(
    ([style, weight]) => weight > 0 && normalizeStyleTag(style) === normalizedStyle
  );
  const matchesMetadata = answer.selectedImage.style.some(
    (style) => normalizeStyleTag(style) === normalizedStyle
  );

  return matchesWeight || matchesMetadata;
}

function createTransitionImage(answer: StyleDnaAnswer, primaryStyle: string): TransitionImage {
  return {
    id: answer.selectedImage.id,
    src: answer.selectedImage.url,
    alt: answer.selectedImage.title ?? primaryStyle
  };
}

function createFallbackTransitionImages(
  primaryStyle: string,
  heroImage: string
): TransitionImage[] {
  const imageUrl = heroImage.trim();

  if (!imageUrl || imageUrl === HERO_IMAGE) {
    return [];
  }

  return [{ id: `primary-style-${primaryStyle}`, src: imageUrl, alt: primaryStyle }];
}

const transitionImages = computed<TransitionImage[]>(() => {
  if (props.result.isFallback) {
    return [];
  }

  const primaryStyle = normalizeStyleTag(props.result.primaryStyle);
  const seenImageIds = new Set<string>();
  const selectedImages: TransitionImage[] = [];

  for (const answer of props.answers) {
    const imageId = answer.selectedImage.id;

    if (seenImageIds.has(imageId) || !answerMatchesStyle(answer, primaryStyle)) {
      continue;
    }

    seenImageIds.add(imageId);
    selectedImages.push(createTransitionImage(answer, props.result.primaryStyle));

    if (selectedImages.length === RESULT_TRANSITION_IMAGE_LIMIT) {
      break;
    }
  }

  return selectedImages.length > 0
    ? selectedImages
    : createFallbackTransitionImages(props.result.primaryStyle, props.result.heroImage);
});

let resultScrollOriginY = 0;
let scrollPromptAnimation: gsap.core.Tween | null = null;
let scrollProgressHintAnimation: gsap.core.Tween | null = null;
let personalizedMessageSplitText: SplitText | null = null;

function createPersonalizedMessageSplitText(): void {
  if (!personalizedMessage.value) {
    return;
  }

  personalizedMessageSplitText?.revert();
  personalizedMessageSplitText = SplitText.create(personalizedMessage.value, {
    type: 'lines',
    linesClass: 'result-personalized-message-line',
    aria: 'auto'
  });

  gsap.set(personalizedMessage.value, { autoAlpha: 1, y: 0 });
  gsap.set(personalizedMessageSplitText.lines, {
    autoAlpha: 0,
    y: 28,
    filter: 'blur(10px)'
  });
}

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

function clampScrollProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
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
    const meteorConfig = RESULT_METEORS[index];
    const distanceMultiplier = meteorConfig?.motionMultiplier ?? 1 + index * 0.1;
    const opacityMultiplier =
      meteorConfig?.opacityMultiplier ?? Math.max(0.38, 1 - index * 0.07);
    const opacity = isActive ? Math.sin(meteorProgress * Math.PI) * opacityMultiplier : 0;

    gsap.set(meteor, {
      x: 0,
      y: prefersReducedMotion ? 0 : -180 + 540 * meteorProgress * distanceMultiplier,
      autoAlpha: opacity
    });
  });
}

function updatePersonalizedMessageAnimation(viewportProgress: number): void {
  if (!personalizedMessage.value || !personalizedMessageSplitText) {
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
  const exitOffset = -28 * routeTransitionProgress;
  const messageLines = personalizedMessageSplitText.lines;
  hasPersonalizedMessageStarted.value = isActive;
  gsap.set(personalizedMessage.value, {
    autoAlpha: 1 - routeTransitionProgress,
    y: prefersReducedMotion ? 0 : exitOffset,
    filter: `blur(${8 * routeTransitionProgress}px)`
  });

  messageLines.forEach((line, index) => {
    const lineProgress = prefersReducedMotion
      ? Number(isActive)
      : clampScrollProgress(
          (messageProgress - index * 2 * INTERLEAVE_ITEM_STAGGER) /
            INTERLEAVE_REVEAL_DURATION
        );

    gsap.set(line, {
      autoAlpha: lineProgress,
      y: prefersReducedMotion ? 0 : 28 * (1 - lineProgress),
      filter: `blur(${10 * (1 - lineProgress)}px)`
    });
  });
}

function updateTransitionImageAnimation(viewportProgress: number): void {
  if (!transitionImageLayer.value) {
    return;
  }

  const transitionProgress = clampScrollProgress(
    (viewportProgress - ROUTE_TRANSITION_START_VIEWPORTS) /
      (ROUTE_TRANSITION_END_VIEWPORTS - ROUTE_TRANSITION_START_VIEWPORTS)
  );
  const messageProgress = clampScrollProgress(
    (viewportProgress - MESSAGE_SCROLL_START_VIEWPORTS) /
      (MESSAGE_SCROLL_END_VIEWPORTS - MESSAGE_SCROLL_START_VIEWPORTS)
  );
  const firstImageRevealStart = INTERLEAVE_ITEM_STAGGER;
  const isActive =
    transitionImages.value.length > 0 &&
    messageProgress > firstImageRevealStart &&
    viewportProgress <= HOME_NAVIGATION_THRESHOLD_VIEWPORTS;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const imageElements =
    transitionImageLayer.value.querySelectorAll<HTMLElement>('.result-transition-image');

  hasTransitionImagesStarted.value = isActive;

  imageElements.forEach((image, index) => {
    const initialYOffset =
      Number.parseFloat(
        window
          .getComputedStyle(image)
          .getPropertyValue('--transition-image-initial-y')
      ) || 0;
    const travelDistance = window.innerHeight + image.offsetHeight + initialYOffset;
    const imageRevealStart = (index * 2 + 1) * INTERLEAVE_ITEM_STAGGER;
    const imageRevealProgress = prefersReducedMotion
      ? Number(messageProgress > imageRevealStart)
      : clampScrollProgress(
          (messageProgress - imageRevealStart) / INTERLEAVE_REVEAL_DURATION
        );

    gsap.set(image, {
      autoAlpha: imageRevealProgress,
      y: prefersReducedMotion ? 0 : -transitionProgress * travelDistance
    });
  });
}

function handleResultScroll(): void {
  if (isRouteTransitioning.value) {
    return;
  }

  const scrollDistance = Math.max(0, window.scrollY - resultScrollOriginY);
  const viewportProgress = scrollDistance / window.innerHeight;

  updateScrollPrompt(viewportProgress);
  updateScrollProgressMeteor(viewportProgress);
  updateMeteorScrollAnimation(viewportProgress);
  updatePersonalizedMessageAnimation(viewportProgress);
  updateTransitionImageAnimation(viewportProgress);

  if (viewportProgress >= HOME_NAVIGATION_THRESHOLD_VIEWPORTS) {
    navigateToPersonalizedHome();
  }
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

  void nextTick(() => {
    createPersonalizedMessageSplitText();
    startScrollPromptAnimation();
    startScrollProgressHintAnimation();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleResultScroll);
  scrollPromptAnimation?.kill();
  scrollProgressHintAnimation?.kill();
  personalizedMessageSplitText?.revert();
  scrollPromptAnimation = null;
  scrollProgressHintAnimation = null;
  personalizedMessageSplitText = null;
});
</script>

<template>
  <div
    ref="scrollPrompt"
    class="pointer-events-none absolute bottom-[25px] left-1/2 z-[80] flex max-w-[16rem] -translate-x-1/2 flex-col items-center gap-2 text-center text-[14px] text-text-primary lg:max-w-[20rem] lg:text-base"
    data-testid="result-scroll-prompt"
    role="status"
  >
    <span>{{ $t('dna.scrollToSimilarStyles') }}</span>
    <ChevronDown class="size-6" aria-hidden="true" />
  </div>

  <div
    ref="scrollProgressTrack"
    class="pointer-events-none fixed top-1/2 right-[18px] z-[95] hidden h-[25vh] w-[20px] -translate-y-1/2 lg:block"
    data-testid="result-scroll-track"
    :data-progress="scrollProgressRatio.toFixed(2)"
    :data-hint-active="isScrollProgressHintActive ? 'true' : 'false'"
    aria-hidden="true"
  >
    <span class="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-text-primary/20" />
    <span
      ref="scrollProgressMeteor"
      class="absolute top-0 left-1/2 h-[clamp(90px,14vh,210px)] w-[2px] -translate-x-1/2 brightness-125 bg-gradient-to-b from-transparent via-text-primary/80 to-text-primary shadow-[0_0_16px_rgb(240_237_230_/_65%)]"
      data-testid="result-scroll-meteor"
    />
  </div>

  <div
    ref="meteorLayer"
    class="pointer-events-none fixed inset-0 z-[85] brightness-150 opacity-0"
    data-testid="result-meteor-layer"
    :data-active="hasMeteorStarted ? 'true' : 'false'"
    aria-hidden="true"
  >
    <span
      v-for="meteor in RESULT_METEORS"
      :key="meteor.id"
      class="result-meteor absolute w-[2px] bg-gradient-to-b from-transparent to-transparent"
      :class="[meteor.positionClass, meteor.appearanceClass]"
      :data-meteor-id="meteor.id"
    />
  </div>

  <div
    v-show="hasTransitionImagesStarted"
    ref="transitionImageLayer"
    class="pointer-events-none fixed inset-0 z-[88] overflow-hidden"
    data-testid="result-transition-image-layer"
    :data-active="hasTransitionImagesStarted ? 'true' : 'false'"
    aria-hidden="true"
  >
    <figure
      v-for="(image, index) in transitionImages"
      :key="image.id"
      class="result-transition-image absolute"
      :class="{
        'left-[5vw] top-[5vh] w-[34vw] lg:left-[7vw] lg:top-[18vh] lg:w-[18vw]': index === 0,
        'right-[5vw] top-[57vh] w-[32vw] lg:right-[8vw] lg:top-[5vh] lg:w-[16vw]': index === 1,
        'bottom-[8vh] left-[10vw] w-[36vw] lg:bottom-[-10vh] lg:left-[65vw] lg:w-[17vw]': index === 2
      }"
      data-testid="result-transition-image"
    >
      <div class="result-transition-image__content">
        <div
          class="image-float-y overflow-hidden rounded-[4px] border border-text-primary/10 shadow-[0_18px_60px_rgb(0_0_0_/_45%)]"
        >
          <img
            :src="image.src"
            :alt="image.alt"
            loading="eager"
            decoding="async"
            class="block h-auto w-full"
          />
        </div>
      </div>
    </figure>
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
      <template
        v-for="(line, index) in personalizedMessageLines"
        :key="line"
      >
        <span>{{ line }}</span>
        <br v-if="index < personalizedMessageLines.length - 1" />
      </template>
    </h1>
  </div>
</template>

<style scoped>
.result-transition-image {
  --transition-image-initial-y: 72px;
}

.result-transition-image__content {
  transform: translateY(var(--transition-image-initial-y));
}
</style>
