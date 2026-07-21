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
  <div
    class="folder-filter-panel absolute left-[5%] top-[5%] z-[4] flex flex-col items-start gap-7 pointer-events-none"
  >
    <section class="w-[450px] pointer-events-auto">
      <button
        type="button"
        class="folder-filter__label flex items-center p-0 border-0 text-base tracking-[0.02em] cursor-pointer opacity-50"
        data-testid="folder-filter-styles-toggle"
        :aria-expanded="stylesExpanded"
        @click="stylesExpanded = !stylesExpanded"
      >
        <span class="folder-filter__anchor" aria-hidden="true"></span>
        <span class="folder-filter__connector" aria-hidden="true"></span>
        <span class="ml-2.5">{{ t('moodboard.filterByStyles') }}</span>
      </button>
      <div
        v-show="stylesExpanded"
        class="folder-filter__viewport overflow-x-hidden overflow-y-auto max-h-[calc(3*36px)] pl-[46px] mt-5"
      >
        <div class="flex flex-col">
          <button
            v-for="option in styleOptions"
            :key="option.value"
            type="button"
            class="filter-node relative flex items-center h-9 p-0 border-0 cursor-pointer opacity-50"
            :class="{ 'filter-node--active': selectedStyleGroups.has(option.value) }"
            data-testid="folder-filter-style-option"
            :aria-pressed="selectedStyleGroups.has(option.value)"
            @click="emit('toggle-style', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__connector" aria-hidden="true"></span>
            <span class="ml-2.5 text-sm tracking-[0.02em] whitespace-nowrap"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <section class="w-[260px] pointer-events-auto">
      <button
        type="button"
        class="folder-filter__label flex items-center p-0 border-0 text-base tracking-[0.02em] cursor-pointer opacity-50"
        data-testid="folder-filter-fields-toggle"
        :aria-expanded="mediumsExpanded"
        @click="mediumsExpanded = !mediumsExpanded"
      >
        <span class="folder-filter__anchor" aria-hidden="true"></span>
        <span class="folder-filter__connector" aria-hidden="true"></span>
        <span class="ml-2.5">{{ t('moodboard.filterByFields') }}</span>
      </button>
      <div
        v-show="mediumsExpanded"
        class="folder-filter__viewport overflow-x-hidden overflow-y-auto max-h-[calc(4*36px)] pl-[46px] mt-2"
      >
        <div class="flex flex-col">
          <button
            v-for="option in mediumOptions"
            :key="option.value"
            type="button"
            class="filter-node relative flex items-center h-9 p-0 border-0 cursor-pointer opacity-50"
            :class="{ 'filter-node--active': selectedMediums.has(option.value) }"
            data-testid="folder-filter-medium-option"
            :aria-pressed="selectedMediums.has(option.value)"
            @click="emit('toggle-medium', option.value)"
          >
            <span class="filter-node__anchor" aria-hidden="true"></span>
            <span class="filter-node__connector" aria-hidden="true"></span>
            <span class="ml-2.5 text-sm tracking-[0.02em] whitespace-nowrap"
              >{{ localizeTaxon(option.value) }} ({{ option.count }})</span
            >
          </button>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="folder-filter__reset py-1.5 px-3.5 border rounded-full text-[13px] tracking-[0.04em] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 pointer-events-auto"
      data-testid="folder-filter-reset"
      :disabled="!hasActiveFilters"
      @click="emit('reset')"
    >
      {{ t('moodboard.resetFilters') }}
    </button>
  </div>
</template>

<style scoped>
.folder-filter__label {
  background: transparent;
  color: #f0ede6bd;
  font-weight: 400;
  text-align: left;
  transition:
    color 180ms ease,
    opacity 180ms ease;
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
  overscroll-behavior: contain;
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
