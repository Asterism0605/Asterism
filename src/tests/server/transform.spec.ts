import { describe, it, expect } from 'vitest';
import { toStyleImage } from '../../../server/transform';
import type { ImageRow } from '../../../server/transform';

const row: ImageRow = {
  id: 'ext-pexels-1',
  url: 'https://images.pexels.com/photos/1.jpg',
  title: 'shiny chrome bubble',
  style_group: 'Y2K & Internet Aesthetics',
  style: ['Y2K', 'Chrome Design'],
  medium: 'Graphic Design',
  sub_medium: 'Poster Design',
  color_palette: ['#8EC9FF', '#B9A8F3'],
  source: 'pexels',
  attribution: 'Photo by Jane Doe / Pexels',
  confidence: { styleGroup: 0.31, medium: 0.28, subMedium: 0.19 },
  needs_review: { styleGroup: false, medium: false, subMedium: true },
  excluded: false,
  created_at: '2026-06-16T00:00:00.000Z'
};

describe('toStyleImage', () => {
  it('把 snake_case 的 DB row 轉成前端 StyleImage 形狀（camelCase）', () => {
    const image = toStyleImage(row);

    expect(image.styleGroup).toBe('Y2K & Internet Aesthetics');
    expect(image.subMedium).toBe('Poster Design');
    expect(image.needsReview.subMedium).toBe(true);
    expect(image.colorPalette).toEqual(['#8EC9FF', '#B9A8F3']);
    expect(image.excluded).toBe(false);
  });

  it('medium/sub_medium 為 null 時轉成 undefined（對齊 StyleImage 的 optional 欄位）', () => {
    const image = toStyleImage({ ...row, medium: null, sub_medium: null });

    expect(image.medium).toBeUndefined();
    expect(image.subMedium).toBeUndefined();
  });
});
