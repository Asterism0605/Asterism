<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { SplitText } from 'gsap/SplitText';

const props = withDefaults(
  defineProps<{
    text: string | number;
    chars?: string;
    duration?: number;
    delay?: number;
    speed?: number;
    autoplay?: boolean;
  }>(),
  {
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    duration: 1,
    delay: 0,
    speed: 0.25,
    autoplay: true
  }
);

const element = ref<HTMLElement | null>(null);
const splitText = ref<SplitText | null>(null);
const animation = ref<gsap.core.Tween | gsap.core.Timeline | null>(null);
const usesCjkReveal = computed(() => /[\p{Script=Han}]/u.test(String(props.text)));

gsap.registerPlugin(ScrambleTextPlugin, SplitText);

function cleanupAnimation(): void {
  animation.value?.kill();
  animation.value = null;
  splitText.value?.revert();
  splitText.value = null;
}

function playCjkTypewriter(): void {
  if (!element.value) return;

  splitText.value = SplitText.create(element.value, {
    type: 'chars',
    charsClass: 'scramble-text__char'
  });

  const characters = splitText.value.chars;
  const timeline = gsap.timeline({ delay: props.delay });

  gsap.set(characters, { autoAlpha: 0 });
  characters.forEach((character, index) => {
    timeline.set(character, { autoAlpha: 1 }, index * props.duration);
  });

  animation.value = timeline;
}

function play(): void {
  if (!element.value) return;

  cleanupAnimation();
  element.value.textContent = String(props.text);

  if (usesCjkReveal.value) {
    playCjkTypewriter();
    return;
  }

  animation.value = gsap.to(element.value, {
    duration: props.duration,
    delay: props.delay,
    ease: 'none',
    scrambleText: {
      text: String(props.text),
      chars: props.chars,
      speed: props.speed
    }
  });
}

onMounted(() => {
  if (props.autoplay) play();
});

watch(
  () => props.text,
  async () => {
    cleanupAnimation();
    await nextTick();

    if (props.autoplay) {
      play();
    } else if (element.value) {
      element.value.textContent = String(props.text);
    }
  }
);

defineExpose({ play });

onBeforeUnmount(() => {
  cleanupAnimation();
});
</script>

<template>
  <span ref="element">{{ text }}</span>
</template>
