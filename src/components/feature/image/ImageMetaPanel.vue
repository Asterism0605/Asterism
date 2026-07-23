<script setup lang="ts">
import ColorPaletteSwatch from '@/components/ui/ColorPaletteSwatch.vue';
import ProfileCard from '@/components/ui/ProfileCard.vue';
import ThemeTag from '@/components/ui/ThemeTag.vue';
import ActionButton from '@/components/feature/image/ActionButton.vue';
import { ArrowLeft, ChevronDown, ExternalLink, FolderPlus } from '@lucide/vue';
import SimilarImages from '@/components/feature/image/SimilarImages.vue';
import { SITE_LOGO_SRC } from '@/constants/assets.constants';
import type { ImageSpreadNode } from '@/types/image';

interface Props {
  sourceUrl?: string;
  sourceLabel?: string;
  colorPalette: string[];
  styleTags: string[];
  photographerName?: string;
  photographerDate?: string;
  photographerAvatarUrl?: string;
  similarImages?: ImageSpreadNode[];
  saved?: boolean;
  disabled?: boolean;
  folders?: { id: string; name: string; saved?: boolean }[];
  justSavedFolderId?: string | null;
  canSave?: boolean;
  saveMenuOpenRequest?: number;
}

withDefaults(defineProps<Props>(), {
  sourceUrl: undefined,
  sourceLabel: undefined,
  photographerName: undefined,
  photographerDate: undefined,
  photographerAvatarUrl: undefined,
  similarImages: () => [],
  saved: false,
  disabled: false,
  folders: () => [],
  justSavedFolderId: null,
  canSave: false,
  saveMenuOpenRequest: 0
});

const emit = defineEmits<{
  back: [];
  consult: [];
  'auth-required': [];
  'save-opened': [];
  'create-folder': [];
  'save-to-folder': [folderId: string];
  'select-image': [imageId: string];
  'select-style-tag': [tag: string];
}>();

const siteLogoSrc = SITE_LOGO_SRC;
</script>

<template>
  <div
    class="flex flex-col gap-12 overflow-y-auto px-6 py-6 md:h-full"
    style="background: linear-gradient(180deg, #2c2c2c 0%, #1e1e1e 100%)"
  >
    <button
      type="button"
      class="cursor-pointer flex w-fit items-center gap-1 text-base text-text-secondary transition-colors duration-150 hover:text-text-primary"
      @click="emit('back')"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('image.back') }}
    </button>

    <div class="flex items-center justify-between gap-4">
      <h1 class="text-h1 font-[100] text-text-primary leading-tight">{{ $t('image.info') }}</h1>
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

    <ProfileCard
      v-if="photographerName"
      class="detail-profile-card"
      :name="photographerName"
      :avatar-url="photographerAvatarUrl"
    />

    <ColorPaletteSwatch :colors="colorPalette" class="bg-transparent! p-0!" />

    <div data-tour="detail-style-tag">
      <ThemeTag :tags="styleTags" compact @select="emit('select-style-tag', $event)" />
    </div>

    <div class="flex items-center justify-between gap-3">
      <ActionButton
        class="flex-1 md:w-[calc(50%_-_56px)] md:origin-left md:scale-[1.1] md:flex-none"
        data-tour="detail-consult"
        variant="consult"
        bracket
        @consult="emit('consult')"
      />
      <ActionButton
        class="detail-save-action flex-1 md:w-[calc(50%_-_56px)] md:origin-right md:scale-[1.1] md:flex-none [&>button>span]:text-xs md:[&>button>span]:text-sm"
        data-tour="detail-save"
        bracket
        :saved="saved"
        :disabled="disabled"
        :can-save="canSave"
        :open-request="saveMenuOpenRequest"
        :folders="folders"
        :just-saved-folder-id="justSavedFolderId"
        @auth-required="emit('auth-required')"
        @opened="emit('save-opened')"
        @create-folder="emit('create-folder')"
        @save-to-folder="(folderId) => emit('save-to-folder', folderId)"
      >
        <template #create-folder-icon>
          <FolderPlus class="detail-menu-icon" :stroke-width="1.5" aria-hidden="true" />
        </template>
        <template #save-folder-icon>
          <ChevronDown class="detail-menu-icon" :stroke-width="1.5" aria-hidden="true" />
        </template>
      </ActionButton>
    </div>

    <div class="flex items-center gap-4">
      <div class="h-0.5 flex-1 bg-white/15" />
      <img :src="siteLogoSrc" alt="Asterism" class="h-9 w-9 opacity-60" />
      <div class="h-0.5 flex-1 bg-white/15" />
    </div>

    <SimilarImages
      v-if="similarImages?.length"
      :images="similarImages"
      @select="emit('select-image', $event)"
    />
  </div>
</template>

<style scoped>
:deep(.detail-profile-card) {
  padding-top: 0;
  padding-bottom: 0;
}

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

:deep(.detail-save-action) {
  --detail-menu-content-left: clamp(1rem, 15%, 2.5rem);
  --detail-menu-icon-gap: 0.5rem;
  --detail-menu-icon-size: 1rem;
}

:deep(.detail-save-action > button > span:not([aria-hidden])) {
  display: grid;
  grid-template-columns: var(--detail-menu-icon-size) auto;
  column-gap: var(--detail-menu-icon-gap);
  align-items: center;
  justify-content: center;
  text-align: left;
}

:deep(.detail-save-action > div > div.relative > div > button:first-child),
:deep(.detail-save-action > div > div.relative > div > div.relative > button),
:deep(.detail-save-action [data-leading-icon]) {
  display: grid;
  grid-template-columns: var(--detail-menu-icon-size) minmax(0, 1fr);
  column-gap: var(--detail-menu-icon-gap);
  align-items: center;
  justify-content: stretch;
  text-align: left;
  padding-left: var(--detail-menu-content-left);
}

:deep(.detail-save-action > button > span:not([aria-hidden]) > span) {
  justify-self: start;
}

:deep(.detail-save-action > div > div.relative > div > button:first-child) {
  white-space: nowrap;
}

:deep(.detail-save-action .detail-menu-icon),
:deep(.detail-save-action [data-leading-icon] > svg) {
  width: var(--detail-menu-icon-size);
  height: var(--detail-menu-icon-size);
  position: static;
  margin-right: 0;
}

</style>
