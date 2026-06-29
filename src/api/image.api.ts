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

// 只有三個維度都明確 false 才算已審；null / 缺欄位一律當未審，避免漏到前端。
function isReviewed(nr: ImageRow['needs_review']): boolean {
  return nr != null && nr.styleGroup === false && nr.medium === false && nr.subMedium === false;
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
    const reviewed = (data as ImageRow[]).filter((r) => isReviewed(r.needs_review)).map(toStyleImage);
    // 空結果（或全被未審濾掉）會讓首頁/探索沒圖，視為異常降級回打包 JSON。
    if (reviewed.length === 0) throw new Error('no reviewed images');
    return reviewed;
  } catch (e) {
    console.warn('[image] Supabase 讀取失敗，降級為打包資料：', e);
    return rawStyleImages as StyleImage[];
  }
}
