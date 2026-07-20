<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MoodboardFolder } from '@/types/moodboard';

const props = withDefaults(
  defineProps<{
    folders: MoodboardFolder[];
    activeFolderId?: string | null;
    // 手機沒有鍵盤 focus 操作的情境，兩段式 Tap 也不需要 focus/blur 觸發預覽。
    focusPreview?: boolean;
  }>(),
  { activeFolderId: null, focusPreview: true }
);

const emit = defineEmits<{
  preview: [folderId: string];
  previewEnd: [];
  open: [folderId: string];
}>();

const { t } = useI18n();

const sortedFolders = computed(() =>
  [...props.folders].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
);

function folderLabel(folder: MoodboardFolder): string {
  return folder.images.length === 0
    ? `${folder.name} ${t('moodboard.folderEmptySuffix')}`
    : folder.name;
}
</script>

<template>
  <nav class="folder-directory" :aria-label="t('moodboard.folderSelected')">
    <div class="folder-directory__list">
      <button
        v-for="folder in sortedFolders"
        :key="folder.id"
        type="button"
        class="folder-node"
        :class="{
          'folder-node--active': folder.id === activeFolderId,
          'folder-node--empty': folder.images.length === 0
        }"
        :data-testid="`folder-directory-item-${folder.id}`"
        :aria-current="folder.id === activeFolderId ? 'true' : undefined"
        @pointerenter="emit('preview', folder.id)"
        @pointerleave="emit('previewEnd')"
        @focus="focusPreview && emit('preview', folder.id)"
        @blur="focusPreview && emit('previewEnd')"
        @click="emit('open', folder.id)"
      >
        <span class="folder-node__anchor" aria-hidden="true"></span>
        <span class="folder-node__connector" aria-hidden="true"></span>
        <span class="folder-node__label">{{ folderLabel(folder) }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.folder-directory {
  position: relative;
  z-index: 2;
  padding-top: 150px;
}

.folder-directory__list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
  padding-left: 5px;
}

.folder-node {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6bd;
  font: inherit;
  cursor: pointer;
  opacity: 0.5;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.folder-node:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.folder-node:not(.folder-node--active):is(:hover, :focus-visible) {
  color: #f0ede6d6;
  opacity: 0.76;
}

.folder-node__anchor {
  width: 10px;
  height: 10px;
  margin-left: -5px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #f0ede6eb;
}

.folder-node__connector {
  width: 42px;
  height: 1px;
  flex: 0 0 auto;
  background: #f0ede6c2;
}

.folder-node__label {
  margin-left: 20px;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.025em;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  width: max-content;
  max-width: none;
}

.folder-node--active {
  opacity: 1;
  color: var(--color-text-primary);
}

.folder-node--active .folder-node__anchor {
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede62e;
  transform: scale(1.15);
}

.folder-node:not(.folder-node--active):is(:hover, :focus-visible) .folder-node__anchor {
  transform: scale(1.08);
}

.folder-node--active .folder-node__label {
  font-size: 18px;
}

.folder-node--active .folder-node__connector {
  width: 56px;
  background: #f0ede6e6;
}

@media (max-width: 768px) {
  .folder-directory {
    padding-top: 15px;
    height: 210px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
    scrollbar-width: none;
  }

  .folder-directory::-webkit-scrollbar {
    display: none;
  }

  .folder-directory__list {
    grid-auto-flow: column;
    grid-auto-columns: 33.333%;
    width: 100%;
    height: 100%;
    gap: 0;
    padding-left: 0;
  }

  .folder-node {
    position: relative;
    width: 100%;
    min-width: 0;
    height: 40px;
  }

  .folder-node:nth-of-type(3n + 1) {
    left: 8px;
    top: 0;
  }

  .folder-node:nth-of-type(3n + 2) {
    left: 24%;
    top: 36px;
  }

  .folder-node:nth-of-type(3n) {
    left: 52%;
    top: 72px;
  }

  .folder-node__connector {
    display: none;
  }

  .folder-node__anchor {
    display: block;
    flex: 0 0 4px;
    width: 4px;
    height: 4px;
    margin-left: 0;
  }

  .folder-node--active .folder-node__anchor {
    width: 4px;
    height: 4px;
    margin-left: 0;
    box-shadow:
      0 0 0 1px #f0ede68c,
      0 0 10px #f0ede62e;
    transform: scale(1.25);
  }

  .folder-node:is(:hover, :focus-visible) .folder-node__anchor {
    width: 4px;
    height: 4px;
    margin-left: 0;
    transform: scale(1.25);
  }

  .folder-node__label {
    margin-left: 12px;
    font-size: 14px;
  }

  .folder-node--active .folder-node__label {
    font-size: 14px;
  }
}
</style>
