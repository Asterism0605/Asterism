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

// 純檢索：全庫 kNN，不先分類 styleGroup。open-set 拒絕由呼叫端對 top-1 相似度設門檻。
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
