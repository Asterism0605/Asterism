<script setup lang="ts">
import { nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

const props = defineProps<{
  title: string;
  description: string;
  nextDescription: string;
  proceedLabel: string;
  laterLabel: string;
}>();

const emit = defineEmits<{
  proceed: [];
  later: [];
}>();

const transitionElement = ref<HTMLElement | null>(null);
const backdropElement = ref<HTMLElement | null>(null);
const completionIcon = ref<HTMLElement | null>(null);
const completionCircle = ref<SVGCircleElement | null>(null);
const completionCheck = ref<SVGPathElement | null>(null);
const titleElement = ref<HTMLElement | null>(null);
const descriptionElement = ref<HTMLElement | null>(null);
const descriptionIntroElement = ref<HTMLElement | null>(null);
const descriptionNextElement = ref<HTMLElement | null>(null);
const proceedButton = ref<HTMLButtonElement | null>(null);
const laterButton = ref<HTMLButtonElement | null>(null);
const arrowImage = '/images/arrow.svg';
let splitTexts: SplitText[] = [];
let animation: gsap.core.Timeline | null = null;
let revealRequestId = 0;
let revealStarted = false;
let previousActiveElement: HTMLElement | null = null;

const CIRCLE_STROKE_LENGTH = 176;
const CHECK_STROKE_LENGTH = 70;

gsap.registerPlugin(SplitText);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function cleanupAnimation(): void {
  animation?.kill();
  animation = null;
  splitTexts.forEach((splitText) => splitText.revert());
  splitTexts = [];
}

function setCompletedIcon(): void {
  gsap.set([completionCircle.value, completionCheck.value], {
    strokeDashoffset: 0
  });
}

function createDescriptionSplitTexts(): SplitText[] {
  return [descriptionIntroElement.value, descriptionNextElement.value]
    .filter((element): element is HTMLElement => element !== null)
    .map((element) =>
      SplitText.create(element, {
        type: 'chars',
        charsClass: 'tour-transition__char'
      })
    );
}

function showFinalState(): void {
  if (
    !backdropElement.value ||
    !completionIcon.value ||
    !completionCircle.value ||
    !completionCheck.value ||
    !titleElement.value ||
    !descriptionElement.value ||
    !proceedButton.value ||
    !laterButton.value
  ) {
    return;
  }

  splitTexts = createDescriptionSplitTexts();
  setCompletedIcon();
  gsap.set(
    [backdropElement.value, completionIcon.value, titleElement.value, descriptionElement.value, proceedButton.value, laterButton.value],
    { autoAlpha: 1, y: 0, scale: 1 }
  );
  gsap.set(splitTexts.flatMap((splitText) => splitText.chars), { autoAlpha: 1, y: 0 });
}

async function playReveal(): Promise<void> {
  const requestId = ++revealRequestId;
  revealStarted = true;
  cleanupAnimation();
  await nextTick();

  if (
    requestId !== revealRequestId ||
    !backdropElement.value ||
    !completionIcon.value ||
    !completionCircle.value ||
    !completionCheck.value ||
    !titleElement.value ||
    !descriptionElement.value ||
    !descriptionIntroElement.value ||
    !descriptionNextElement.value ||
    !proceedButton.value ||
    !laterButton.value
  ) {
    return;
  }

  const buttons = [proceedButton.value, laterButton.value];

  if (prefersReducedMotion()) {
    showFinalState();
    return;
  }

  splitTexts = createDescriptionSplitTexts();
  const descriptionChars = splitTexts.flatMap((splitText) => splitText.chars);

  gsap.set(backdropElement.value, { autoAlpha: 0 });
  gsap.set(completionIcon.value, { autoAlpha: 0, scale: 0.78 });
  gsap.set(completionCircle.value, {
    strokeDasharray: CIRCLE_STROKE_LENGTH,
    strokeDashoffset: CIRCLE_STROKE_LENGTH
  });
  gsap.set(completionCheck.value, {
    strokeDasharray: CHECK_STROKE_LENGTH,
    strokeDashoffset: CHECK_STROKE_LENGTH
  });
  gsap.set(titleElement.value, { autoAlpha: 0, y: 16 });
  gsap.set(descriptionChars, { autoAlpha: 0, y: 16 });
  gsap.set(buttons, { autoAlpha: 0, y: 22 });

  animation = gsap.timeline({ defaults: { ease: 'circ.out' } });
  animation
    .to(backdropElement.value, { autoAlpha: 1, duration: 0.35 })
    .to(completionIcon.value, { autoAlpha: 1, scale: 1, duration: 0.32 }, '>-0.04')
    .to(
      completionCircle.value,
      { strokeDashoffset: 0, duration: 0.62, ease: 'power2.inOut' },
      '>-0.04'
    )
    .to(
      completionCheck.value,
      { strokeDashoffset: 0, duration: 0.36, ease: 'power2.out' },
      '>-0.08'
    )
    .to(titleElement.value, { autoAlpha: 1, y: 0, duration: 0.4 }, '>-0.03')
    .to(
      descriptionChars,
      { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.012 },
      '>-0.1'
    )
    .to(
      buttons,
      { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.14 },
      '>-0.08'
    );
}

async function focusFirstButton(): Promise<void> {
  await nextTick();
  if (transitionElement.value && proceedButton.value) {
    proceedButton.value.focus({ preventScroll: true });
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    return;
  }

  if (event.key !== 'Tab' || !transitionElement.value) return;

  const buttons = [proceedButton.value, laterButton.value].filter(
    (button): button is HTMLButtonElement => button !== null
  );
  if (buttons.length === 0) return;

  const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const nextIndex = event.shiftKey
    ? currentIndex <= 0
      ? buttons.length - 1
      : currentIndex - 1
    : currentIndex === buttons.length - 1
      ? 0
      : currentIndex + 1;

  event.preventDefault();
  buttons[nextIndex]?.focus({ preventScroll: true });
}

onBeforeMount(() => {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    previousActiveElement = document.activeElement;
  }
});

onMounted(() => {
  void playReveal();
  void focusFirstButton();
});

watch(
  () => [props.title, props.description, props.nextDescription, props.proceedLabel, props.laterLabel],
  async () => {
    if (!revealStarted) return;

    const requestId = ++revealRequestId;
    cleanupAnimation();
    await nextTick();
    if (requestId !== revealRequestId) return;

    showFinalState();
  }
);

onBeforeUnmount(() => {
  revealRequestId += 1;
  revealStarted = false;
  cleanupAnimation();

  if (previousActiveElement?.isConnected) {
    previousActiveElement.focus({ preventScroll: true });
  }
  previousActiveElement = null;
});
</script>

<template>
  <div
    ref="transitionElement"
    class="fixed inset-0 z-[200] m-0 overflow-hidden bg-transparent p-0 text-text-primary"
    data-testid="tour-transition"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tour-transition-title"
    aria-describedby="tour-transition-description"
    @keydown="handleKeydown"
  >
    <div
      ref="backdropElement"
      class="fixed inset-0 z-0 bg-[rgb(5_5_8_/_0.78)] backdrop-blur-[8px]"
      data-testid="tour-transition-backdrop"
      aria-hidden="true"
    />

    <div
      class="relative z-[1] mt-[60px] flex h-[calc(80vh-60px)] flex-col justify-end gap-3 pl-30 px-[clamp(1.5rem,5vw,4rem)] pb-[clamp(5rem,15vh,9rem)] max-md:px-6 max-md:pb-16 lg:h-[calc(100vh-60px)]"
    >
      <div
        ref="completionIcon"
        class="mb-2 flex size-16 items-center justify-center text-text-primary"
        data-testid="tour-transition-complete-icon"
        aria-hidden="true"
      >
        <svg class="size-full" viewBox="0 0 64 64" fill="none">
          <circle
            ref="completionCircle"
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            ref="completionCheck"
            d="M19 33.5L28 42L46 23"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h1
        id="tour-transition-title"
        ref="titleElement"
        class="text-h1 m-0 font-[300] tracking-normal text-text-primary [text-shadow:0_4px_24px_rgba(255,255,255,0.18)]"
      >
        {{ props.title }}
      </h1>

      <p
        id="tour-transition-description"
        ref="descriptionElement"
        class="mb-[clamp(7rem,8vh,9rem)] w-full max-w-none text-[clamp(0.8rem,1.2vw,1rem)] leading-[1.5] tracking-[0.01em] text-text-primary md:max-w-[35rem] xl:max-w-[56rem]"
      >
        <span ref="descriptionIntroElement">{{ props.description }}</span>
        <br />
        <span ref="descriptionNextElement">{{ props.nextDescription }}</span>
      </p>

      <div
        class="flex w-[min(100%,28rem)] flex-col gap-4 self-end lg:gap-5 max-md:w-max max-md:max-w-[calc(100vw-1rem)]"
      >
        <button
          ref="proceedButton"
          type="button"
          class="inline-flex cursor-pointer items-center justify-start gap-4 border-0 bg-transparent p-0 text-left font-[inherit] text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.5] text-text-primary transition-[text-shadow] duration-300 hover:[text-shadow:0_0_15px_rgb(255_255_255_/_0.8)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-text-primary focus-visible:outline-offset-2"
          data-testid="tour-transition-proceed"
          @click="emit('proceed')"
        >
          <img
            :src="arrowImage"
            alt=""
            class="ml-20 h-auto w-[3rem] shrink-0 motion-reduce:animate-none animate-[homeTourArrow_1.8s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span class="text-body">{{ props.proceedLabel }}</span>
        </button>

        <button
          ref="laterButton"
          type="button"
          class="ml-[clamp(4rem,7vw,7rem)] inline-flex cursor-pointer items-center justify-start gap-4 border-0 bg-transparent p-0 text-left font-[inherit] text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.5] text-text-primary transition-[text-shadow] duration-300 hover:[text-shadow:0_0_15px_rgb(255_255_255_/_0.8)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-text-primary focus-visible:outline-offset-2 max-md:ml-[clamp(2rem,4.5vw,3.5rem)]"
          data-testid="tour-transition-later"
          @click="emit('later')"
        >
          <img
            :src="arrowImage"
            alt=""
            class="ml-20 h-auto w-[3rem] shrink-0 motion-reduce:animate-none animate-[homeTourArrow_1.8s_ease-in-out_infinite] [animation-delay:0.18s]"
            aria-hidden="true"
          />
          <span class="text-body">{{ props.laterLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
