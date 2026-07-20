<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

const props = defineProps<{
  description: string;
  startLabel: string;
  exploreLabel: string;
}>();

const emit = defineEmits<{
  start: [];
  explore: [];
}>();

const dialogElement = ref<HTMLDialogElement | null>(null);
const descriptionElement = ref<HTMLElement | null>(null);
const startButton = ref<HTMLButtonElement | null>(null);
const exploreButton = ref<HTMLButtonElement | null>(null);
const arrowImage = '/images/arrow.svg';
let splitText: SplitText | null = null;
let animation: gsap.core.Timeline | null = null;

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
  splitText?.revert();
  splitText = null;
}

function playReveal(): void {
  if (!descriptionElement.value || !startButton.value || !exploreButton.value) {
    return;
  }

  cleanupAnimation();
  const buttons = [startButton.value, exploreButton.value];

  if (prefersReducedMotion()) {
    gsap.set([descriptionElement.value, ...buttons], { autoAlpha: 1, y: 0 });
    return;
  }

  splitText = SplitText.create(descriptionElement.value, {
    type: 'chars',
    charsClass: 'home-tour-intro__char'
  });

  gsap.set([...splitText.chars, ...buttons], { autoAlpha: 0, y: 22 });
  animation = gsap.timeline({ defaults: { ease: 'circ.out' } });
  animation
    .to(splitText.chars, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.02
    })
    .to(
      buttons,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.14
      },
      '>-0.08'
    );
}

function openDialog(): void {
  const dialog = dialogElement.value;
  if (!dialog) {
    return;
  }

  if (!dialog.open) {
    dialog.show();
  }
}

onMounted(async () => {
  openDialog();
  await nextTick();
  playReveal();
});

watch(
  () => props.description,
  async () => {
    cleanupAnimation();
    await nextTick();

    if (!descriptionElement.value) {
      return;
    }

    splitText = SplitText.create(descriptionElement.value, {
      type: 'chars',
      charsClass: 'home-tour-intro__char'
    });
    gsap.set(splitText.chars, { autoAlpha: 1, y: 0 });
  }
);

onBeforeUnmount(() => {
  cleanupAnimation();
  if (dialogElement.value?.open) {
    dialogElement.value.close();
  }
});
</script>

<template>
  <dialog
    ref="dialogElement"
    class="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-text-primary"
    data-testid="home-tour-intro"
    aria-labelledby="home-tour-title"
    aria-describedby="home-tour-description"
  >
    <div
      class="fixed inset-x-0 bottom-0 top-[var(--app-header-height)] z-0 bg-[rgb(5_5_8_/_0.72)] backdrop-blur-[8px]"
      aria-hidden="true"
    />

    <div
      class="relative z-[1] mt-[var(--app-header-height)] flex gap-3 h-[calc(65vh-var(--app-header-height))] lg:h-[calc(100vh-var(--app-header-height))] flex-col justify-end px-[clamp(1.5rem,5vw,4rem)] lg:pl-30 pb-[clamp(5rem,15vh,9rem)] max-md:px-6 max-md:pb-16"
    >
      <p
        id="home-tour-description"
        ref="descriptionElement"
        class="w-full max-w-[21rem] md:max-w-none text-[clamp(0.8rem,1.2vw,1rem)] leading-[1.5] tracking-[0.01em] text-text-primary"
      >
        {{ props.description }}
      </p>

      <h1
        id="home-tour-title"
        class="text-display m-0 mb-[clamp(7rem,8vh,9rem)] max-w-[9ch] tracking-normal text-text-primary [text-shadow:0_4px_24px_rgba(255,255,255,0.18)]"
      >
        Asterism
      </h1>

      <div
        class="flex w-[min(100%,28rem)] flex-col gap-4 lg:gap-5 self-end max-md:w-max max-md:max-w-[calc(100vw-1rem)]"
      >
        <button
          ref="startButton"
          type="button"
          class="inline-flex cursor-pointer items-center justify-start gap-4 border-0 bg-transparent p-0 text-left font-[inherit] text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.5] text-text-primary transition-[text-shadow] duration-300 hover:[text-shadow:0_0_15px_rgb(255_255_255_/_0.8)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-text-primary focus-visible:outline-offset-2"
          data-testid="home-tour-start"
          @click="emit('start')"
        >
          <img
            :src="arrowImage"
            alt=""
            class="ml-20 h-auto w-[3rem] shrink-0 motion-reduce:animate-none animate-[homeTourArrow_1.8s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span class="text-body">{{ props.startLabel }}</span>
        </button>

        <button
          ref="exploreButton"
          type="button"
          class="inline-flex cursor-pointer items-center justify-start gap-4 border-0 bg-transparent p-0 text-left font-[inherit] text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.5] text-text-primary transition-[text-shadow] duration-300 hover:[text-shadow:0_0_15px_rgb(255_255_255_/_0.8)] outline-offset-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-text-primary ml-[clamp(4rem,7vw,7rem)] max-md:ml-[clamp(2rem,4.5vw,3.5rem)]"
          data-testid="home-tour-explore"
          @click="emit('explore')"
        >
          <img
            :src="arrowImage"
            alt=""
            class="ml-20 h-auto w-[3rem] shrink-0 [animation-delay:0.18s] motion-reduce:animate-none animate-[homeTourArrow_1.8s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span class="text-body">{{ props.exploreLabel }}</span>
        </button>
      </div>
    </div>
  </dialog>
</template>

<style>
@keyframes homeTourArrow {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(0.35rem);
  }
}
</style>
