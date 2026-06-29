import { beforeEach, describe, expect, it, vi } from 'vitest';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ from }) }));

import { fetchImagesApi } from '@/api/image.api';

const row = {
  id: 'r1',
  url: 'u',
  title: 't',
  style_group: 'doa',
  style: ['a'],
  medium: 'Painting',
  sub_medium: 'Oil',
  color_palette: ['#fff'],
  needs_review: { styleGroup: false, medium: false, subMedium: false }
};
const pending = {
  ...row,
  id: 'r2',
  needs_review: { styleGroup: false, medium: true, subMedium: false }
};

describe('image.api fetchImagesApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('讀 excluded=false、濾掉 needs_review 有 true、映射成 StyleImage', async () => {
    eq.mockResolvedValue({ data: [row, pending], error: null });

    const images = await fetchImagesApi();

    expect(from).toHaveBeenCalledWith('images');
    expect(eq).toHaveBeenCalledWith('excluded', false);
    expect(images).toHaveLength(1);
    expect(images[0]).toEqual({
      id: 'r1',
      url: 'u',
      title: 't',
      styleGroup: 'doa',
      style: ['a'],
      medium: 'Painting',
      subMedium: 'Oil',
      colorPalette: ['#fff']
    });
  });

  it('needs_review=null 視為未審、不出現在結果（會走空結果降級）', async () => {
    const nullReview = { ...row, id: 'r3', needs_review: null };
    eq.mockResolvedValue({ data: [nullReview], error: null });

    const images = await fetchImagesApi();

    expect(images.some((img) => img.id === 'r3')).toBe(false);
    expect(images).toHaveLength((rawStyleImages as StyleImage[]).length);
  });

  it('query 出錯 → 降級回打包 JSON', async () => {
    eq.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const images = await fetchImagesApi();

    expect(images).toHaveLength((rawStyleImages as StyleImage[]).length);
    expect(images[0]).toEqual((rawStyleImages as StyleImage[])[0]);
  });

  it('Supabase 成功但結果為空 → 降級回打包 JSON', async () => {
    eq.mockResolvedValue({ data: [], error: null });

    const images = await fetchImagesApi();

    expect(images).toHaveLength((rawStyleImages as StyleImage[]).length);
    expect(images[0]).toEqual((rawStyleImages as StyleImage[])[0]);
  });
});
