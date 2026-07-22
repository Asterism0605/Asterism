import { describe, expect, it } from 'vitest';
import { useFolderImageFilters } from '@/composables/useFolderImageFilters';
import type { SavedImage } from '@/types/moodboard';

function buildImage(overrides: Partial<SavedImage> & { id: string }): SavedImage {
  const { id, ...rest } = overrides;
  return {
    itemId: `item-${id}`,
    id,
    src: `/${id}.webp`,
    title: id,
    styleGroup: null,
    style: [],
    medium: null,
    createdAt: '2026-07-05T00:00:00.000Z',
    ...rest
  };
}

const images: SavedImage[] = [
  buildImage({ id: 'img1', styleGroup: 'A', medium: 'X' }),
  buildImage({ id: 'img2', styleGroup: 'A', medium: 'Y' }),
  buildImage({ id: 'img3', styleGroup: 'B', medium: 'X' }),
  buildImage({ id: 'img4', styleGroup: 'B', medium: 'Z' }),
  buildImage({ id: 'img5', styleGroup: 'C', medium: 'Y' }),
  buildImage({ id: 'img6', styleGroup: null, medium: 'X' }),
  buildImage({ id: 'img7', styleGroup: 'A', medium: null })
];

describe('useFolderImageFilters', () => {
  it('沒有任何篩選條件時回傳全部圖片與完整清單', () => {
    const filters = useFolderImageFilters(() => images);

    expect(filters.filteredImages.value).toHaveLength(images.length);
    expect(filters.hasActiveFilters.value).toBe(false);
    expect(filters.availableStyleGroups.value).toEqual(
      expect.arrayContaining([
        { value: 'A', count: 3 },
        { value: 'B', count: 2 },
        { value: 'C', count: 1 }
      ])
    );
    expect(filters.availableMediums.value).toEqual(
      expect.arrayContaining([
        { value: 'X', count: 3 },
        { value: 'Y', count: 2 },
        { value: 'Z', count: 1 }
      ])
    );
  });

  it('同一篩選器內多選為聯集（OR）', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');
    filters.toggleStyleGroup('B');

    expect(filters.filteredImages.value.map((image) => image.id).sort()).toEqual(
      ['img1', 'img2', 'img3', 'img4', 'img7'].sort()
    );
  });

  it('不同篩選器之間為交集（AND）', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');
    filters.toggleStyleGroup('B');
    filters.toggleMedium('X');

    // (A 或 B) 且 X → img1(A,X)、img3(B,X)
    expect(filters.filteredImages.value.map((image) => image.id).sort()).toEqual(
      ['img1', 'img3'].sort()
    );
  });

  it('取消其中一個已選項目時，只移除該項，其他已選條件保留', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');
    filters.toggleMedium('X');
    filters.toggleStyleGroup('A'); // 取消風格 A

    expect(filters.selectedStyleGroups.value.size).toBe(0);
    expect(filters.selectedMediums.value.has('X')).toBe(true);
    // 只剩 medium=X 篩選 → img1、img3、img6
    expect(filters.filteredImages.value.map((image) => image.id).sort()).toEqual(
      ['img1', 'img3', 'img6'].sort()
    );
  });

  it('已選項目因交集另一條件而暫時 0 筆時，仍保留在清單中', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');
    filters.toggleMedium('Z'); // A 與 Z 沒有交集

    expect(filters.filteredImages.value).toHaveLength(0);
    expect(filters.availableMediums.value).toEqual(
      expect.arrayContaining([{ value: 'Z', count: 0 }])
    );
    expect(filters.selectedMediums.value.has('Z')).toBe(true);
  });

  it('清單依另一個篩選器的已選集合收斂', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');

    // 風格 A 底下只出現過 medium X、Y（img7 沒有 medium，被排除在統計外）
    expect(filters.availableMediums.value.map((option) => option.value).sort()).toEqual(
      ['X', 'Y'].sort()
    );
  });

  it('reset 清空所有已選條件，不影響其他狀態', () => {
    const filters = useFolderImageFilters(() => images);

    filters.toggleStyleGroup('A');
    filters.toggleMedium('X');
    filters.reset();

    expect(filters.selectedStyleGroups.value.size).toBe(0);
    expect(filters.selectedMediums.value.size).toBe(0);
    expect(filters.hasActiveFilters.value).toBe(false);
    expect(filters.filteredImages.value).toHaveLength(images.length);
  });

  it('displayedImages 上限 20 張，依原有順序截斷，不做風格配額平衡', () => {
    const manyImages = Array.from({ length: 25 }, (_, index) =>
      buildImage({ id: `bulk-${index}`, styleGroup: 'A', medium: 'X' })
    );
    const filters = useFolderImageFilters(() => manyImages);

    expect(filters.displayedImages.value).toHaveLength(20);
    expect(filters.displayedImages.value.map((image) => image.id)).toEqual(
      manyImages.slice(0, 20).map((image) => image.id)
    );
  });
});
