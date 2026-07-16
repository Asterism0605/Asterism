import { getSupabase } from '@/api/supabaseClient';
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

export async function searchImagesByEmbedding(
  embedding: number[],
  styleGroup: string,
  matchCount = 4
): Promise<ImageSearchResult[]> {
  const { data, error } = await getSupabase().rpc('search_images_by_embedding', {
    query_embedding: embedding,
    p_style_group: styleGroup,
    match_count: matchCount
  });

  if (error) throw error;

  return (data as ImageSearchResultRow[]).map(toImageSearchResult);
}
