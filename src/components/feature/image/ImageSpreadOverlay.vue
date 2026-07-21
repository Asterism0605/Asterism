<script setup lang="ts">
import { computed } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import Button from '@/components/ui/Button.vue';
import ImageSpreadLabel from '@/components/ui/ImageSpreadLabel.vue';
import ActionButton from '@/components/feature/image/ActionButton.vue';
import { useTaxonomyLabel } from '@/composables/useTaxonomyLabel';
import type { ImageSpreadNode } from '@/types/image';

const { localizeTaxon } = useTaxonomyLabel();

const returnButtonStyles = {
  root: 'group',
  label:
    'inline-block border-b border-white/80 pb-1 leading-none transition-[opacity,transform] duration-200 group-hover:scale-[0.94] group-hover:opacity-0',
  arrow:
    "pointer-events-none absolute left-1/2 top-1/2 h-px w-7 -translate-x-[40%] -translate-y-1/2 bg-current opacity-0 transition-[opacity,transform] duration-200 before:absolute before:left-0 before:top-1/2 before:size-[9px] before:-translate-y-1/2 before:rotate-45 before:border-b before:border-l before:border-current before:content-[''] group-hover:-translate-x-1/2 group-hover:opacity-100"
} as const;

const props = withDefaults(
  defineProps<{
    image: ImageSpreadNode;
    saved?: boolean;
    disabled?: boolean;
    folders?: { id: string; name: string; saved?: boolean }[];
    justSavedFolderId?: string | null;
    canSave?: boolean;
    saveMenuOpenRequest?: number;
  }>(),
  {
    saved: false,
    disabled: false,
    folders: () => [],
    justSavedFolderId: null,
    canSave: false,
    saveMenuOpenRequest: 0
  }
);

const emit = defineEmits<{
  return: [];
  'auth-required': [];
  'create-folder': [];
  'save-to-folder': [folderId: string];
}>();

const mainImageLabel = computed(() => {
  const isMainEntryImage = props.image.src.includes('main');

  if (isMainEntryImage) {
    return undefined;
  }

  return props.image.medium;
});
</script>

<template>
  <ImageSpreadEntrance
    as="section"
    kind="center"
    class="relative z-20 mx-auto flex w-full max-w-[460px] flex-col items-center gap-5 lg:gap-7"
  >
    <div class="relative flex w-full justify-center">
      <ConstellationBackground
        active
        class-name="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
        size="min(104vw, 760px)"
        :line-length="320"
        :line-width="1.2"
        :line-opacity="0.85"
        :inactive-node-opacity="0.25"
        :active-node-opacity="0.5"
        :glow-opacity="0.04"
        :node-size="5"
        :spacing="70"
      />

      <ImageSpreadEntrance
        as="figure"
        kind="centerFrame"
        data-testid="spread-main-image-frame"
        class="relative w-full max-w-[min(72vw,360px)] cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-elevated/60 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
      >
        <img
          data-testid="spread-main-image"
          :src="image.src"
          :alt="image.alt"
          class="aspect-[4/5] w-full cursor-pointer object-cover"
        />
        <ImageSpreadLabel
          v-if="mainImageLabel"
          as="figcaption"
          size="large"
          data-testid="spread-main-image-label"
        >
          {{ localizeTaxon(mainImageLabel) }}
        </ImageSpreadLabel>
      </ImageSpreadEntrance>
    </div>

    <ImageSpreadEntrance
      kind="actions"
      :delay="180"
      class="relative isolate flex origin-center scale-85 flex-wrap items-center justify-center gap-10 pt-1 before:pointer-events-none before:absolute before:-inset-x-6 before:-inset-y-3 before:-z-10 before:rounded-full before:bg-void before:blur-xl before:content-[''] lg:scale-100"
    >
      <Button
        variant="bracket"
        type="button"
        data-testid="return-home"
        :class="returnButtonStyles.root"
        @click="emit('return')"
      >
        <span :class="returnButtonStyles.label">{{ $t('image.return') }}</span>
        <span aria-hidden="true" :class="returnButtonStyles.arrow" />
      </Button>
      <ActionButton
        class="min-w-48"
        spread
        :saved="props.saved"
        :disabled="props.disabled"
        :can-save="props.canSave"
        :open-request="props.saveMenuOpenRequest"
        :folders="props.folders"
        :just-saved-folder-id="props.justSavedFolderId"
        @auth-required="emit('auth-required')"
        @create-folder="emit('create-folder')"
        @save-to-folder="(folderId) => emit('save-to-folder', folderId)"
      />
    </ImageSpreadEntrance>
  </ImageSpreadEntrance>
</template>
