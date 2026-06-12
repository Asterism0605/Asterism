<template>
  <section class="relative h-screen min-h-0 overflow-hidden text-text-primary">
    <div class="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
      <span
        v-for="dot in 18"
        :key="dot"
        class="absolute size-1 rounded-full bg-text-secondary/55"
        :style="{ left: `${(dot * 19) % 94}%`, top: `${(dot * 29) % 82}%` }"
      />
      <span class="absolute left-[8%] top-[8%] h-px w-72 -rotate-6 bg-white/10" />
      <span class="absolute right-[12%] top-[18%] h-px w-52 rotate-[-32deg] bg-white/10" />
      <span class="absolute left-[4%] bottom-[18%] h-px w-60 rotate-[28deg] bg-white/10" />
      <span
        class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent"
      />
    </div>

    <div
      class="relative z-40 h-screen min-h-0 px-0 pb-0 pt-0 sm:px-12 lg:grid lg:grid-cols-[0.58fr_0.42fr] lg:items-center lg:px-14"
    >
      <div class="hidden min-w-0 lg:block" aria-hidden="true" />

      <div
        class="absolute bottom-[7vh] right-[-5.5rem] z-50 h-[64vh] w-[82vw] min-w-0 sm:right-0 sm:w-[58vw] lg:relative lg:bottom-auto lg:right-auto lg:h-screen lg:w-auto lg:min-h-0"
      >
        <div class="relative flex h-full min-h-0 items-end justify-center">
          <img
            :src="heroImage"
            :alt="`${primaryStyle} style DNA hero image`"
            class="relative z-50 h-full w-auto max-w-none object-contain drop-shadow-[0_28px_60px_rgba(0,0,0,0.5)] lg:h-auto lg:max-h-[82vh] lg:max-w-full lg:-translate-y-5"
          />

          <div
            v-for="annotation in annotations"
            :key="`${annotation.position}-${annotation.label}-${annotation.value}`"
            class="absolute z-[60] max-w-44 text-xs text-text-primary before:absolute before:top-3 before:h-px before:bg-text-primary/80"
            :class="annotationClasses[annotation.position]"
          >
            <p class="truncate font-light">
              {{ annotation.label }}
            </p>
            <p class="text-text-secondary">
              {{ annotation.value }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      class="glass-panel absolute bottom-0 left-0 z-20 h-[52vh] w-[74vw] rounded-none rounded-tr-[4.5rem] border-b-0 border-l-0 px-4 py-9 sm:px-12 lg:h-[24vh] lg:w-[92%] lg:px-14 lg:py-9"
    >
      <div class="grid gap-5 lg:max-w-2xl lg:grid-cols-3 lg:gap-5">
        <div v-for="style in styles" :key="style.label" class="min-w-0">
          <p
            class="max-w-[calc(74vw-2rem)] whitespace-normal break-words text-[13px] font-light leading-snug text-text-secondary lg:max-w-full lg:truncate lg:text-lg"
          >
            {{ style.label }}
          </p>
          <p
            class="mt-2 font-title text-5xl font-extralight leading-none text-text-primary lg:text-6xl"
          >
            {{ style.percentage }}<span class="ml-1 text-lg text-text-secondary">%</span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { StyleDnaAnnotation, StyleDnaScore } from '@/utils/computeStyleDnaResult';

defineProps<{
  primaryStyle: string;
  heroImage: string;
  styles: StyleDnaScore[];
  annotations: StyleDnaAnnotation[];
}>();

const annotationClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'left-[-36vw] top-[18%] text-left before:left-full before:w-28 sm:left-[-10vw] lg:left-0 lg:top-[42%] lg:-translate-x-1/2 lg:before:w-24',
  right:
    'right-[7rem] bottom-[2%] text-right before:right-full before:w-28 sm:right-0 lg:right-0 lg:top-[48%] lg:bottom-auto lg:translate-x-1/3 lg:before:w-24',
  'top-right':
    'right-[6.75rem] top-[-6%] text-right before:right-full before:w-24 sm:right-0 lg:right-0 lg:top-[18%] lg:translate-x-1/3 lg:before:w-32'
};
</script>
