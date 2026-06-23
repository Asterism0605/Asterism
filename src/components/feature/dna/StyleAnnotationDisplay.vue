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
      class="relative z-40 h-screen min-h-0 px-0 pb-0 pt-0 sm:px-12 lg:grid lg:grid-cols-[0.5fr_0.5fr] lg:items-center lg:px-14"
    >
      <div class="hidden min-w-0 lg:block" aria-hidden="true" />

      <div
        class="absolute bottom-[7vh] right-[-1.25rem] z-50 h-[64vh] w-[70vw] min-w-0 sm:right-0 sm:w-[58vw] lg:relative lg:bottom-auto lg:right-auto lg:h-screen lg:w-auto lg:min-h-0"
      >
        <div class="relative flex h-full min-h-0 items-end justify-center">
          <img
            :src="heroImage"
            :alt="`${primaryStyle} style DNA hero image`"
            class="relative z-50 h-full w-auto max-w-none object-contain drop-shadow-[0_28px_60px_rgba(0,0,0,0.5)] lg:h-[115vh] lg:max-h-none lg:max-w-none lg:translate-y-[200px]"
          />

          <div
            v-for="annotation in annotations"
            :key="`${annotation.position}-${annotation.label}-${annotation.value}`"
            class="style-annotation absolute z-[60] w-28 text-xs text-text-primary sm:w-36 lg:w-40 lg:text-base"
            :class="annotationPositionClasses[annotation.position]"
            data-testid="style-annotation"
          >
            <div
              class="style-annotation__line-wrap flex items-start"
              :class="annotationLineClasses[annotation.position]"
            >
              <span
                v-if="annotation.position !== 'left'"
                class="style-annotation__tail mr-[-1px] mt-px block h-px w-9 origin-right bg-text-primary/80"
                :class="annotationTailClasses[annotation.position]"
              />
              <span class="style-annotation__line h-0.5 flex-1 bg-text-primary/80" />
              <span
                v-if="annotation.position === 'left'"
                class="style-annotation__tail ml-[-1px] mt-px block h-px w-9 origin-left bg-text-primary/80"
                :class="annotationTailClasses[annotation.position]"
              />
            </div>
            <div
              class="style-annotation__content mt-3"
              :class="annotationContentClasses[annotation.position]"
            >
              <p class="truncate font-light">
                {{ annotation.label }}
              </p>
              <p class="mt-1 text-text-secondary">
                {{ annotation.value }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="glass-panel font-title absolute bottom-0 left-0 z-20 h-[52vh] w-[74vw] rounded-none rounded-tr-[4.5rem] border-b-0 border-l-0 px-4 py-9 sm:px-12 lg:h-[24vh] lg:w-[92%] lg:px-[7.5rem] lg:py-9"
    >
      <div class="grid gap-5 lg:max-w-2xl lg:grid-cols-3 lg:gap-5">
        <div v-for="style in styles" :key="style.label" class="min-w-0">
          <p
            class="max-w-[calc(74vw-2rem)] whitespace-normal break-words text-[13px] font-extralight leading-snug text-text-secondary lg:max-w-full lg:truncate lg:text-lg"
          >
            {{ style.label }}
          </p>
          <p
            class="mt-2 text-5xl font-extralight leading-none text-text-primary lg:text-6xl"
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

const annotationPositionClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'left-[-12vw] top-[20%] sm:left-[6vw] lg:left-[16%] lg:top-[42%] lg:-translate-x-1/2',
  right: 'right-[4rem] bottom-[-7%] sm:right-[1.5rem] lg:right-[8%] lg:top-[48%] lg:bottom-auto',
  'top-right': 'right-[2.25rem] top-[1%] sm:right-[1.5rem] lg:right-[7%] lg:top-[18%]'
};

const annotationLineClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'justify-start',
  right: 'justify-end',
  'top-right': 'justify-end'
};

const annotationTailClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'rotate-[42deg]',
  right: 'rotate-[42deg] lg:rotate-[-42deg]',
  'top-right': 'rotate-[-42deg]'
};

const annotationContentClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'text-left',
  right: 'pr-1 text-right',
  'top-right': 'text-right'
};
</script>
