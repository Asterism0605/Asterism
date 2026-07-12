<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { onBeforeUnmount, onMounted, ref } from 'vue';

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

gsap.registerPlugin(ScrambleTextPlugin);

function play(): void {
  if (!element.value) return;

  gsap.killTweensOf(element.value);
  gsap.to(element.value, {
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

defineExpose({ play });

onBeforeUnmount(() => {
  if (element.value) gsap.killTweensOf(element.value);
});
</script>

<template>
  <span ref="element">{{ text }}</span>
</template>
