<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MoodboardFolder } from '@/types/moodboard';

const props = defineProps<{
  folders: MoodboardFolder[];
  activeFolderId?: string | null;
}>();

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
        @mouseenter="emit('preview', folder.id)"
        @mouseleave="emit('previewEnd')"
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
  color: #f0ede6d6;
  opacity: 0.76;
  filter: drop-shadow(0 0 7px #f0ede657);
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
  font-size: 15px;
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

.folder-node--active .folder-node__anchor,
.folder-node:is(:hover, :focus-visible) .folder-node__anchor {
  width: 12px;
  height: 12px;
  margin-left: -6px;
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede62e;
}

.folder-node--active .folder-node__label,
.folder-node:is(:hover, :focus-visible) .folder-node__label {
  font-size: 20px;
}

.folder-node--active .folder-node__connector {
  width: 72px;
  background: #f0ede6e6;
}

@media (max-width: 768px) {
  .folder-directory {
    padding-top: 15px;
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
    display: flex;
    align-items: flex-start;
    height: 190px;
    padding-left: 0;
  }

  .folder-node {
    position: relative;
    width: max-content;
    flex-shrink: 0;
    height: 32px;
    margin-inline-end: 16px;
  }

  .folder-node:nth-of-type(5n + 1) {
    margin-top: 45px;
  }

  .folder-node:nth-of-type(5n + 2) {
    margin-top: 50px;
  }

  .folder-node:nth-of-type(5n + 3) {
    margin-top: 95px;
  }

  .folder-node:nth-of-type(5n + 4) {
    margin-top: 80px;
  }

  .folder-node:nth-of-type(5n) {
    margin-top: 100px;
  }

  .folder-node__connector {
    display: none;
  }

  .folder-node__anchor {
    width: 4px;
    height: 4px;
    margin-left: 0;
    margin-right: 6px;
  }

  .folder-node--active {
    transform: translate(25px, -40px);
  }

  .folder-node--active .folder-node__anchor {
    width: 4px;
    height: 4px;
    margin-left: 0;
    transform: scale(1.5);
  }

  .folder-node__label {
    margin-left: 0;
    font-size: 15px;
  }

  .folder-node--active .folder-node__label {
    font-size: 15px;
    transform: scale(1.3);
    transform-origin: left center;
  }
}
</style>
