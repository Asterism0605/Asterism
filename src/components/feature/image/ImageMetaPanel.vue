<script setup lang="ts">
import ColorPaletteSwatch from '@/components/ui/ColorPaletteSwatch.vue';
import ProfileCard from '@/components/ui/ProfileCard.vue';
import ThemeTag from '@/components/ui/ThemeTag.vue';
import ActionButton from '@/components/feature/image/ActionButton.vue';
import { ArrowLeft, ExternalLink } from '@lucide/vue';
import SimilarImages from '@/components/feature/image/SimilarImages.vue';

interface Props {
  sourceUrl?: string;
  sourceLabel?: string;
  colorPalette: string[];
  styleTags: string[];
  photographerName?: string;
  photographerRole?: string;
  photographerDate?: string;
  similarImages?: string[];
  loading?: boolean;
  error?: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  back: [];
  'create-folder': [];
  'save-to-folder': [];
}>();

const siteLogoSrc = '/sitelogo.png';
</script>

<template>
  <div
    class="flex flex-col gap-11 overflow-y-auto px-6 py-6 md:h-full"
    style="background: linear-gradient(180deg, #2c2c2c 0%, #1e1e1e 100%)"
  >
    <button
      type="button"
      class="cursor-pointer flex w-fit items-center gap-1 text-base text-text-secondary transition-colors duration-150 hover:text-text-primary"
      @click="emit('back')"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Back
    </button>

    <div class="flex items-center justify-between gap-4">
      <h1 class="text-h1 font-[300] text-text-primary leading-tight">Info</h1>
      <a
        v-if="sourceUrl"
        :href="sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-widest text-text-secondary underline underline-offset-2 transition-colors duration-150 hover:text-text-primary"
      >
        {{ sourceLabel ?? sourceUrl }}
        <ExternalLink class="size-2.5" aria-hidden="true" />
      </a>
    </div>

    <div class="flex flex-col gap-[12px]">
      <p v-if="photographerDate || photographerName" class="text-mono text-text-secondary">
        Photo shared<span v-if="photographerDate"> on {{ photographerDate }}</span
        ><span v-if="photographerName"> by</span>
      </p>

      <ProfileCard
        v-if="photographerName"
        class="pt-0!"
        :name="photographerName"
        :subtitle="photographerRole"
        :show-follow="true"
      />
    </div>

    <ColorPaletteSwatch :colors="colorPalette" class="bg-transparent! p-0!" />

    <ThemeTag :tags="styleTags" compact />

    <div class="flex items-center gap-3">
      <ActionButton class="flex-1" variant="consult" />
      <ActionButton
        class="flex-1"
        :loading="loading"
        :error="error"
        @create-folder="emit('create-folder')"
        @save-to-folder="emit('save-to-folder')"
      />
    </div>

    <div class="flex items-center gap-4">
      <div class="h-0.5 flex-1 bg-white/15" />
      <img :src="siteLogoSrc" alt="Asterism" class="h-9 w-9 opacity-60" />
      <div class="h-0.5 flex-1 bg-white/15" />
    </div>

    <SimilarImages v-if="similarImages?.length" :images="similarImages" />
  </div>
</template>

<style scoped>
:deep(.glass-panel) {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
:deep(article > div) {
  flex-direction: row;
  align-items: center;
}
:deep(article button) {
  width: auto;
  margin-left: auto;
  min-height: 2rem;
}
</style>
