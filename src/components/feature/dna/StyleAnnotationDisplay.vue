<template>
  <section class="relative h-screen min-h-0 overflow-hidden text-text-primary lg:overflow-visible">
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
      class="pointer-events-none relative z-40 h-screen min-h-0 px-0 pb-0 pt-0 sm:px-12 lg:grid lg:grid-cols-[0.5fr_0.5fr] lg:items-center lg:px-14"
    >
      <div class="hidden min-w-0 lg:block" aria-hidden="true" />

      <div
        class="absolute bottom-[7vh] right-[-1.25rem] z-50 h-[64vh] w-[70vw] min-w-0 sm:right-0 sm:w-[58vw] 
        lg:relative lg:bottom-auto lg:right-auto lg:h-screen lg:w-auto lg:min-h-0"
      >
        <div class="relative flex h-full min-h-0 items-end justify-center">
          <img
            :src="heroImage"
            :alt="`${primaryStyle} style DNA hero image`"
            class="image-float-y relative z-50 h-full w-auto max-w-none translate-x-5 translate-y-4 object-contain drop-shadow-[0_28px_60px_rgba(0,0,0,0.5)]
            lg:h-[115vh] lg:max-h-none lg:max-w-none lg:translate-x-0 lg:translate-y-[200px]"
          />

          <div
            v-for="annotation in annotations"
            :key="`${annotation.position}-${annotation.label}-${annotation.value}`"
            class="style-annotation absolute z-[60] w-30 text-xs text-text-primary sm:w-36 lg:w-46 lg:text-base"
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
                :class="annotation.position === 'right' ? 'hidden rotate-[-42deg] lg:block' : 'rotate-[-42deg]'"
              />
              <span class="style-annotation__line h-0.5 flex-1 bg-text-primary/80" />
              <span
                v-if="annotation.position === 'left' || annotation.position === 'right'"
                class="style-annotation__tail ml-[-1px] mt-px block h-px w-9 origin-left bg-text-primary/80"
                :class="annotation.position === 'right' ? 'rotate-[42deg] lg:hidden' : 'rotate-[42deg]'"
              />
            </div>
            <div
              class="style-annotation__content mt-3"
              :class="annotationContentClasses[annotation.position]"
            >
              <p class="whitespace-pre-line font-light leading-tight">
                <span
                  class="pointer-events-auto cursor-pointer outline-none"
                  :aria-label="t('dna.viewTagDetails', { tag: displayLabel(annotation.label) })"
                  role="button"
                  tabindex="0"
                  @click="openTagModal(annotation.label)"
                  @keydown.enter="openTagModal(annotation.label)"
                  @keydown.space.prevent="openTagModal(annotation.label)"
                >
                  <ScrambleText
                    :text="formatStyleLabel(displayLabel(annotation.label))"
                    :duration="getAnnotationScrambleDuration(annotation.label)"
                    :delay="annotationScrambleDelays[annotation.position]"
                  />
                </span>
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
      class="style-result-panel glass-panel font-title absolute left-5 top-[15rem] z-20 h-auto w-[9rem] rounded-none border-0 px-0 py-0
      lg:bottom-0 lg:left-0 lg:top-auto lg:flex lg:h-[26vh] lg:w-[92%] lg:items-center lg:px-[7.5rem] lg:py-0">
      <div class="h-full w-full">
        <slot name="mobile-panel" />
      </div>
    </div>

    <StyleTagModal
      :model-value="activeTagLabel !== null"
      :tag-label="activeTagLabel"
      @update:model-value="closeTagModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ScrambleText from '@/components/effects/ScrambleText.vue';
import StyleTagModal from '@/components/feature/dna/StyleTagModal.vue';
import { useI18n } from 'vue-i18n';
import { useStyleTagLabel } from '@/composables/useStyleTagLabel';
import type { StyleDnaAnnotation, StyleDnaScore } from '@/utils/computeStyleDnaResult';

const props = defineProps<{
  primaryStyle: string;
  heroImage: string;
  styles: StyleDnaScore[];
  annotations: StyleDnaAnnotation[];
}>();

const { displayLabel } = useStyleTagLabel();
const { t } = useI18n();
const activeTagLabel = ref<string | null>(null);
const CJK_PATTERN = /[\p{Script=Han}]/u;
const ANNOTATION_CJK_CHARACTER_DURATION_SECONDS = 0.12;
const ANNOTATION_LATIN_DURATION_SECONDS = 1;
const ANNOTATION_SCRAMBLE_GAP_SECONDS = 0.4;
const annotationPositionOrder: StyleDnaAnnotation['position'][] = ['left', 'top-right', 'right'];

function getAnnotationText(label: string): string {
  return formatStyleLabel(displayLabel(label));
}

function getAnnotationScrambleDuration(label: string): number {
  return CJK_PATTERN.test(getAnnotationText(label))
    ? ANNOTATION_CJK_CHARACTER_DURATION_SECONDS
    : ANNOTATION_LATIN_DURATION_SECONDS;
}

function getAnnotationAnimationSpan(label: string): number {
  const text = getAnnotationText(label);

  if (!CJK_PATTERN.test(text)) {
    return ANNOTATION_LATIN_DURATION_SECONDS;
  }

  const characterCount = Array.from(text).filter((character) => character.trim().length > 0).length;
  return Math.max(0, characterCount - 1) * ANNOTATION_CJK_CHARACTER_DURATION_SECONDS;
}

const annotationScrambleDelays = computed<Record<StyleDnaAnnotation['position'], number>>(() => {
  const delays: Record<StyleDnaAnnotation['position'], number> = {
    left: 0,
    'top-right': 0,
    right: 0
  };
  let nextDelay = 0;

  annotationPositionOrder.forEach((position) => {
    delays[position] = nextDelay;
    const annotation = props.annotations.find((item) => item.position === position);

    if (annotation) {
      nextDelay += getAnnotationAnimationSpan(annotation.label) + ANNOTATION_SCRAMBLE_GAP_SECONDS;
    }
  });

  return delays;
});

function openTagModal(label: string): void {
  activeTagLabel.value = label;
}

function closeTagModal(): void {
  activeTagLabel.value = null;
}

const annotationPositionClasses: Record<StyleDnaAnnotation['position'], string> = {
  left:
    'left-[calc(-12vw-40px)] top-[38%] lg:left-[16%] lg:top-[42%] lg:-translate-x-1/2',
  right:
    'left-[calc(-2vw-30px)] top-[65%] lg:left-auto lg:right-[3%] lg:top-[58%] lg:bottom-auto',
  'top-right': 'right-[2.25rem] top-[1%] sm:right-[1.5rem] lg:right-[7%] lg:top-[24%]'
};

const annotationLineClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'justify-start',
  right: 'justify-start lg:justify-end',
  'top-right': 'justify-end'
};

const annotationContentClasses: Record<StyleDnaAnnotation['position'], string> = {
  left: 'text-left',
  right: 'text-left lg:pr-1 lg:text-right',
  'top-right': 'text-right'
};

function formatStyleLabel(label: string): string {
  const words = label.trim().split(/\s+/);

  return words.length === 2 ? words.join('\n') : label;
}
</script>

<style scoped>
@media (max-width: 768px) {
  .style-result-panel {
    border: none;
    background: transparent;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (min-width: 769px) {
  .style-result-panel {
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
