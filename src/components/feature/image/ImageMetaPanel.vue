<script setup lang="ts">
import ColorPaletteSwatch from '@/components/ui/ColorPaletteSwatch.vue';
import ProfileCard from '@/components/ui/ProfileCard.vue';
import ThemeTag from '@/components/ui/ThemeTag.vue';
import ActionButton from '@/components/feature/image/ActionButton.vue';

interface Props {
  title: string;
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
</script>

<template>
  <div
    class="flex flex-col gap-6 px-6 py-6 md:h-full md:overflow-hidden"
    style="background: linear-gradient(180deg, #2c2c2c 0%, #1e1e1e 100%)"
  >
    <button
      type="button"
      class="flex w-fit items-center gap-1 text-base text-text-secondary transition-colors duration-150 hover:text-text-primary"
      @click="emit('back')"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 3L5 8L10 13"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Back
    </button>

    <div class="flex items-start justify-between gap-4">
      <h1 class="text-2xl leading-tight text-text-primary">{{ title }}</h1>
      <a
        v-if="sourceUrl"
        :href="sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-1 flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-widest text-text-secondary underline underline-offset-2 transition-colors duration-150 hover:text-text-primary"
      >
        {{ sourceLabel ?? sourceUrl }}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M2 8L8 2M8 2H4M8 2V6"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </a>
    </div>

    <p v-if="photographerName" class="text-base text-text-secondary">
      Photo shared by {{ photographerName
      }}<span v-if="photographerRole"> | {{ photographerRole }}</span
      ><span v-if="photographerDate"> · {{ photographerDate }}</span>
    </p>

    <ProfileCard
      v-if="photographerName"
      :name="photographerName"
      :subtitle="photographerRole"
      :show-follow="true"
    />

    <ColorPaletteSwatch :colors="colorPalette" class="bg-transparent! p-0!" />

    <ThemeTag :tags="styleTags" />

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
      <img src="/sitelogo.png" alt="Asterism" class="h-9 w-9 opacity-60" />
      <div class="h-0.5 flex-1 bg-white/15" />
    </div>

    <p class="font-mono text-2xl uppercase tracking-widest text-text-primary">Similar</p>

    <div v-if="similarImages?.length" class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <img
        v-for="(img, i) in similarImages.slice(0, 4)"
        :key="i"
        :src="img"
        alt=""
        class="aspect-square w-full rounded object-cover"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.size-16) {
  width: 2rem;
  height: 2rem;
}
:deep(.text-2xl.font-medium) {
  font-size: 1rem;
}
:deep(h2.text-2xl) {
  font-size: 1.5rem;
  font-weight: normal;
  color: var(--color-text-primary);
}
:deep(section.flex-col) {
  gap: 0.375rem;
}
:deep(.glass-panel) {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
:deep(button.min-h-10) {
  min-height: 2rem;
}
:deep(.h-16) {
  height: 3rem;
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
