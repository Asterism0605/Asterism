import { computed, ref } from 'vue';
import type { SavedImage } from '@/types/moodboard';

export interface FilterOption {
  value: string;
  count: number;
}

const IMAGE_DISPLAY_LIMIT = 20;

function countBy(
  images: SavedImage[],
  pick: (image: SavedImage) => string | null
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const image of images) {
    const value = pick(image);
    if (value === null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function toFilterOptions(counts: Map<string, number>): FilterOption[] {
  return [...counts.entries()].map(([value, count]) => ({ value, count }));
}

export function useFolderImageFilters(getImages: () => SavedImage[]) {
  const selectedStyleGroups = ref<Set<string>>(new Set());
  const selectedMediums = ref<Set<string>>(new Set());

  function toggleStyleGroup(styleGroup: string): void {
    const next = new Set(selectedStyleGroups.value);
    if (next.has(styleGroup)) next.delete(styleGroup);
    else next.add(styleGroup);
    selectedStyleGroups.value = next;
  }

  function toggleMedium(medium: string): void {
    const next = new Set(selectedMediums.value);
    if (next.has(medium)) next.delete(medium);
    else next.add(medium);
    selectedMediums.value = next;
  }

  function reset(): void {
    selectedStyleGroups.value = new Set();
    selectedMediums.value = new Set();
  }

  const hasActiveFilters = computed(
    () => selectedStyleGroups.value.size > 0 || selectedMediums.value.size > 0
  );

  const imagesMatchingStyleGroups = computed(() => {
    const images = getImages();
    if (selectedStyleGroups.value.size === 0) return images;
    return images.filter(
      (image) => image.styleGroup !== null && selectedStyleGroups.value.has(image.styleGroup)
    );
  });

  const imagesMatchingMediums = computed(() => {
    const images = getImages();
    if (selectedMediums.value.size === 0) return images;
    return images.filter(
      (image) => image.medium !== null && selectedMediums.value.has(image.medium)
    );
  });

  // 交集：同時套用風格與媒介兩個篩選條件。
  const filteredImages = computed(() => {
    let result = getImages();
    if (selectedStyleGroups.value.size > 0) result = imagesMatchingStyleGroups.value;
    if (selectedMediums.value.size > 0) {
      result = result.filter(
        (image) => image.medium !== null && selectedMediums.value.has(image.medium)
      );
    }
    return result;
  });

  const displayedImages = computed(() => filteredImages.value.slice(0, IMAGE_DISPLAY_LIMIT));

  // 「Filter by Styles」清單依「Filter by Mediums」目前的已選集合收斂；
  // 已選中的風格即使收斂後 0 筆，也要保留在清單裡（維持可見、可取消）。
  const availableStyleGroups = computed<FilterOption[]>(() => {
    const counts = countBy(imagesMatchingMediums.value, (image) => image.styleGroup);
    for (const selected of selectedStyleGroups.value) {
      if (!counts.has(selected)) counts.set(selected, 0);
    }
    return toFilterOptions(counts);
  });

  const availableMediums = computed<FilterOption[]>(() => {
    const counts = countBy(imagesMatchingStyleGroups.value, (image) => image.medium);
    for (const selected of selectedMediums.value) {
      if (!counts.has(selected)) counts.set(selected, 0);
    }
    return toFilterOptions(counts);
  });

  return {
    selectedStyleGroups,
    selectedMediums,
    toggleStyleGroup,
    toggleMedium,
    reset,
    hasActiveFilters,
    filteredImages,
    displayedImages,
    availableStyleGroups,
    availableMediums
  };
}
