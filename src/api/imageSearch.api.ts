import { getSupabase } from '@/api/supabaseClient';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import type { ImageSearchResult } from '@/types/imageSearch';

interface ImageSearchResultRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  similarity: number;
}

function toImageSearchResult(row: ImageSearchResultRow): ImageSearchResult {
  return {
    id: row.id,
    src: row.url,
    alt: row.title,
    styleGroup: row.style_group,
    similarity: row.similarity
  };
}

// 純檢索：全庫 kNN，不先分類 styleGroup——視覺相似度是骨幹，風格調整交給呼叫端的
// 軟重排（rerankByStyle）。曾試過改打風格過濾的 RPC（search_images_by_embedding），
// 分類邊界案例會整批犧牲視覺相似度，已回退，取捨紀錄見 imageSearch.config.ts。
export async function searchSimilarImages(
  embedding: number[],
  matchCount = IMAGE_SEARCH_CONFIG.matchCount
): Promise<ImageSearchResult[]> {
  const { data, error } = await getSupabase().rpc('search_similar_images', {
    query_embedding: embedding,
    match_count: matchCount
  });

  if (error) throw error;

  return (data as ImageSearchResultRow[]).map(toImageSearchResult);
}
