<script setup lang="ts">
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
</script>

<template>
  <div class="folder-filter-panel">
    <span
      class="folder-filter-panel__rule folder-filter-panel__rule--styles"
      aria-hidden="true"
    ></span>
    <span
      class="folder-filter-panel__rule folder-filter-panel__rule--mediums"
      aria-hidden="true"
    ></span>

    <div class="folder-filter folder-filter--styles">
      <div class="folder-filter__viewport">
        <div class="folder-filter__list">
          <span class="filter-node filter-node--filter-by" aria-hidden="true">
            <span class="filter-node__label">{{ t('moodboard.filterByHeading') }}</span>
            <span class="filter-node__anchor" aria-hidden="true"></span>
          </span>
          <span class="filter-node filter-node--heading" aria-hidden="true">
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label">{{ t('moodboard.filterGroupStyles') }}</span>
          </span>
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
            <span class="filter-node__label"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </div>

    <div class="folder-filter folder-filter--mediums">
      <div class="folder-filter__viewport">
        <div class="folder-filter__list">
          <span class="filter-node filter-node--heading" aria-hidden="true">
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label">{{ t('moodboard.filterGroupFields') }}</span>
          </span>
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
            <span class="filter-node__label"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </div>

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

.folder-filter-panel__rule {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1px;
  background: #f0ede6c2;
}

.folder-filter-panel__rule--styles {
  top: 70px;
}

.folder-filter-panel__rule--mediums {
  top: 130px;
}

.folder-filter {
  position: absolute;
  left: 8%;
  width: 84%;
  pointer-events: auto;
}

.folder-filter--styles {
  top: 38px;
}

.folder-filter--styles .folder-filter__viewport {
  padding-top: 28px;
  padding-left: 36px;
}

.folder-filter--mediums {
  top: 126px;
}

.folder-filter--mediums .folder-filter__viewport {
  padding-left: 144px;
}

.folder-filter__viewport {
  display: flex;
  overflow: auto hidden;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  scrollbar-width: none;
}

.folder-filter__viewport::-webkit-scrollbar {
  display: none;
}

.folder-filter__list {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 26px;
}

.filter-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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

.filter-node--heading {
  color: #f0ede6d1;
  opacity: 1;
  pointer-events: none;
}

.folder-filter--styles .filter-node--heading {
  margin-left: 20px;
}

.filter-node--filter-by {
  opacity: 1;
  pointer-events: none;
}

.filter-node--filter-by .filter-node__label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-bottom: 6px;
  transform: translateX(-50%);
  color: #f0ede6d1;
  font-size: 16px;
}

.filter-node:is(:hover, :focus-visible) {
  opacity: 0.85;
}

.filter-node__anchor {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f0ede6eb;
  transition: box-shadow 180ms ease;
}

.filter-node--heading .filter-node__anchor,
.filter-node--filter-by .filter-node__anchor {
  width: 10px;
  height: 10px;
}

.filter-node__label {
  font-size: 14px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-align: center;
}

.filter-node--heading .filter-node__label {
  font-size: 16px;
}

.filter-node--active {
  color: var(--color-text-primary);
  opacity: 1;
}

.filter-node--active .filter-node__anchor {
  box-shadow:
    0 0 0 1px #f0ede68c,
    0 0 10px #f0ede62e;
  transform: scale(1.25);
}

.folder-filter__reset {
  left: 82%;
  top: 16px;
  width: auto;
  padding: 5px 12px;
  border: 1px solid rgba(240, 237, 230, 0.3);
  border-radius: 999px;
  background: transparent;
  color: #f0ede6d1;
  font-size: 12px;
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
