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
  <div
    class="folder-filter-panel absolute inset-0 z-[4] pointer-events-none"
    role="group"
    aria-labelledby="mobile-folder-filter-heading"
  >
    <h2 id="mobile-folder-filter-heading" class="sr-only">
      {{ t('moodboard.filterByHeading') }}
    </h2>
    <span
      class="folder-filter-panel__rule folder-filter-panel__rule--styles"
      aria-hidden="true"
    ></span>
    <span
      class="folder-filter-panel__rule folder-filter-panel__rule--mediums"
      aria-hidden="true"
    ></span>

    <section
      class="absolute left-[8%] top-[38px] w-[84%] pointer-events-auto"
      aria-labelledby="mobile-folder-filter-styles-heading"
    >
      <h3 id="mobile-folder-filter-styles-heading" class="sr-only">
        {{ t('moodboard.filterGroupStyles') }}
      </h3>
      <div
        class="folder-filter__viewport flex overflow-x-auto overflow-y-hidden touch-pan-x pt-7 pl-9"
      >
        <div class="flex flex-row items-start gap-[26px]">
          <span
            class="filter-node filter-node--filter-by relative flex flex-col items-center gap-1.5 p-0 border-0 cursor-pointer opacity-100 pointer-events-none"
            aria-hidden="true"
          >
            <span class="filter-node__label absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-base tracking-[0.02em] whitespace-nowrap">{{ t('moodboard.filterByHeading') }}</span>
            <span class="filter-node__anchor" aria-hidden="true"></span>
          </span>
          <span
            class="filter-node filter-node--heading relative flex flex-col items-center gap-1.5 p-0 border-0 cursor-pointer opacity-100 pointer-events-none ml-5"
            aria-hidden="true"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label text-base tracking-[0.02em] whitespace-nowrap">{{ t('moodboard.filterGroupStyles') }}</span>
          </span>
          <button
            v-for="option in styleOptions"
            :key="option.value"
            type="button"
            class="filter-node relative flex flex-col items-center gap-1.5 p-0 border-0 cursor-pointer opacity-50"
            :class="{ 'filter-node--active': selectedStyleGroups.has(option.value) }"
            data-testid="folder-filter-style-option"
            :aria-pressed="selectedStyleGroups.has(option.value)"
            @click="emit('toggle-style', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label text-sm tracking-[0.02em] whitespace-nowrap"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <section
      class="absolute left-[8%] top-[126px] w-[84%] pointer-events-auto"
      aria-labelledby="mobile-folder-filter-mediums-heading"
    >
      <h3 id="mobile-folder-filter-mediums-heading" class="sr-only">
        {{ t('moodboard.filterGroupFields') }}
      </h3>
      <div class="folder-filter__viewport flex overflow-x-auto overflow-y-hidden touch-pan-x pl-36">
        <div class="flex flex-row items-start gap-[26px]">
          <span
            class="filter-node filter-node--heading relative flex flex-col items-center gap-1.5 p-0 border-0 cursor-pointer opacity-100 pointer-events-none"
            aria-hidden="true"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label text-base tracking-[0.02em] whitespace-nowrap">{{ t('moodboard.filterGroupFields') }}</span>
          </span>
          <button
            v-for="option in mediumOptions"
            :key="option.value"
            type="button"
            class="filter-node relative flex flex-col items-center gap-1.5 p-0 border-0 cursor-pointer opacity-50"
            :class="{ 'filter-node--active': selectedMediums.has(option.value) }"
            data-testid="folder-filter-medium-option"
            :aria-pressed="selectedMediums.has(option.value)"
            @click="emit('toggle-medium', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__label text-sm tracking-[0.02em] whitespace-nowrap"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="folder-filter__reset absolute left-[82%] top-4 w-auto py-[5px] px-3 border rounded-full text-xs tracking-[0.04em] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 pointer-events-auto"
      data-testid="folder-filter-reset"
      :disabled="!hasActiveFilters"
      @click="emit('reset')"
    >
      {{ t('moodboard.resetFilters') }}
    </button>
  </div>
</template>

<style scoped>
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

.folder-filter__viewport {
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.folder-filter__viewport::-webkit-scrollbar {
  display: none;
}

.filter-node {
  background: transparent;
  color: #f0ede6bd;
  font: inherit;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.filter-node--heading {
  color: #f0ede6d1;
}

.filter-node--filter-by .filter-node__label {
  color: #f0ede6d1;
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
  text-align: center;
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
  border-color: rgba(240, 237, 230, 0.3);
  background: transparent;
  color: #f0ede6d1;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.folder-filter__reset:is(:hover, :focus-visible) {
  background: rgba(240, 237, 230, 0.1);
  color: var(--color-text-primary);
}

.folder-filter__reset:disabled:is(:hover, :focus-visible) {
  background: transparent;
  color: #f0ede6d1;
}
</style>
