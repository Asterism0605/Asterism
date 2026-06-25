import { getSupabase } from '@/api/supabaseClient';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

interface ImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[] | null;
  medium: string | null;
  sub_medium: string | null;
  color_palette: string[] | null;
  needs_review: { styleGroup?: boolean; medium?: boolean; subMedium?: boolean } | null;
}

function isReviewed(nr: ImageRow['needs_review']): boolean {
  return !nr?.styleGroup && !nr?.medium && !nr?.subMedium;
}

function toStyleImage(row: ImageRow): StyleImage {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    styleGroup: row.style_group,
    style: row.style ?? [],
    medium: row.medium ?? undefined,
    subMedium: row.sub_medium ?? undefined,
    colorPalette: row.color_palette ?? []
  };
}

// 改讀 Supabase images（只取已審+未排除）；任何錯誤降級回打包 JSON。
export async function fetchImagesApi(): Promise<StyleImage[]> {
  try {
    const { data, error } = await getSupabase()
      .from('images')
      .select('id,url,title,style_group,style,medium,sub_medium,color_palette,needs_review')
      .eq('excluded', false);
    if (error) throw error;
    return (data as ImageRow[]).filter((r) => isReviewed(r.needs_review)).map(toStyleImage);
  } catch (e) {
    console.warn('[image] Supabase 讀取失敗，降級為打包資料：', e);
    return rawStyleImages as StyleImage[];
  }
}
