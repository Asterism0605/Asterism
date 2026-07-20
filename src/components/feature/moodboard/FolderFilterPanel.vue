<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTaxonomyLabel } from '@/composables/useTaxonomyLabel';
import type { FilterOption } from '@/composables/useFolderImageFilters';

defineProps<{
  styleOptions: FilterOption[];
  mediumOptions: FilterOption[];
  selectedStyleGroups: Set<string>;
  selectedMediums: Set<string>;
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  'toggle-style': [value: string];
  'toggle-medium': [value: string];
  reset: [];
}>();

const { t } = useI18n();
const { localizeTaxon } = useTaxonomyLabel();

const stylesExpanded = ref(false);
const mediumsExpanded = ref(false);
</script>

<template>
  <div class="folder-filter-panel">
    <section class="folder-filter folder-filter--styles">
      <button
        type="button"
        class="folder-filter__label"
        :aria-expanded="stylesExpanded"
        @click="stylesExpanded = !stylesExpanded"
      >
        <span class="folder-filter__anchor" aria-hidden="true"></span>
        <span class="folder-filter__connector" aria-hidden="true"></span>
        <span class="folder-filter__label-text">{{ t('moodboard.filterByStyles') }}</span>
      </button>
      <div v-show="stylesExpanded" class="folder-filter__viewport">
        <div class="folder-filter__list">
          <button
            v-for="option in styleOptions"
            :key="option.value"
            type="button"
            class="filter-node"
            :class="{ 'filter-node--active': selectedStyleGroups.has(option.value) }"
            :aria-pressed="selectedStyleGroups.has(option.value)"
            @click="emit('toggle-style', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__connector" aria-hidden="true"></span>
            <span class="filter-node__label"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <section class="folder-filter folder-filter--mediums">
      <button
        type="button"
        class="folder-filter__label"
        :aria-expanded="mediumsExpanded"
        @click="mediumsExpanded = !mediumsExpanded"
      >
        <span class="folder-filter__anchor" aria-hidden="true"></span>
        <span class="folder-filter__connector" aria-hidden="true"></span>
        <span class="folder-filter__label-text">{{ t('moodboard.filterByFields') }}</span>
      </button>
      <div
        v-show="mediumsExpanded"
        class="folder-filter__viewport folder-filter__viewport--mediums"
      >
        <div class="folder-filter__list">
          <button
            v-for="option in mediumOptions"
            :key="option.value"
            type="button"
            class="filter-node"
            :class="{ 'filter-node--active': selectedMediums.has(option.value) }"
            :aria-pressed="selectedMediums.has(option.value)"
            @click="emit('toggle-medium', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__connector" aria-hidden="true"></span>
            <span class="filter-node__label"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="folder-filter folder-filter__reset"
      data-testid="folder-filter-reset"
      :disabled="!hasActiveFilters"
      @click="emit('reset')"
    >
      {{ t('moodboard.resetFilters') }}
    </button>
  </div>
</template>

<style scoped>
.folder-filter-panel {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.folder-filter {
  position: absolute;
  width: 260px;
  pointer-events: auto;
}

.folder-filter--styles {
  left: 5%;
  top: 5%;
  width: 450px;
}

.folder-filter--mediums {
  left: 7%;
  top: 24%;
}

.folder-filter__label {
  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6bd;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-align: left;
  opacity: 0.5;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.folder-filter__label-text {
  margin-left: 10px;
}

.folder-filter__label:not([aria-expanded='true']):is(:hover, :focus-visible) {
  color: #f0ede6d6;
  opacity: 0.76;
}

.folder-filter__label[aria-expanded='true'] {
  color: var(--color-text-primary);
  opacity: 1;
}

.folder-filter__anchor {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f0ede6eb;
}

.folder-filter__connector {
  width: 68px;
  height: 1px;
  background: #f0ede6c2;
}

.folder-filter__viewport {
  overflow: hidden auto;
  max-height: calc(3 * 36px);
  padding-left: 46px;
  margin-top: 8px;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.folder-filter__viewport::-webkit-scrollbar {
  display: none;
}

.folder-filter__viewport--mediums {
  max-height: calc(4 * 36px);
}

.folder-filter--styles .folder-filter__viewport {
  margin-top: 20px;
}

.folder-filter__list {
  display: flex;
  flex-direction: column;
}

.filter-node {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
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

.filter-node:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.filter-node:not(.filter-node--active):is(:hover, :focus-visible) {
  color: #f0ede6d6;
  opacity: 0.76;
}

.filter-node:not(.filter-node--active):is(:hover, :focus-visible) .filter-node__anchor {
  transform: scale(1.08);
}

.filter-node__anchor {
  width: 6px;
  height: 6px;
  margin-left: 2px;
  border-radius: 50%;
  background: #f0ede6eb;
  transition: box-shadow 180ms ease;
}

.filter-node__connector {
  width: 48px;
  height: 1px;
  background: #f0ede6c2;
}

.filter-node__label {
  margin-left: 10px;
  font-size: 14px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.filter-node--active {
  color: var(--color-text-primary);
  opacity: 1;
}

.filter-node--active .filter-node__anchor {
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede62e;
  transform: scale(1.15);
}

.filter-node--active .filter-node__connector {
  background: #f0ede6e6;
}

.folder-filter__reset {
  left: 21%;
  top: 53%;
  width: auto;
  padding: 6px 14px;
  border: 1px solid rgba(240, 237, 230, 0.3);
  border-radius: 999px;
  background: transparent;
  color: #f0ede6d1;
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.folder-filter__reset:is(:hover, :focus-visible) {
  background: rgba(240, 237, 230, 0.1);
  color: var(--color-text-primary);
}

.folder-filter__reset:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.folder-filter__reset:disabled:is(:hover, :focus-visible) {
  background: transparent;
  color: #f0ede6d1;
}
</style>
