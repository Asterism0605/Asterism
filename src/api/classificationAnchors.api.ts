import { getSupabase } from '@/api/supabaseClient';

export interface ClassificationAnchor {
  label: string;
  embedding: number[];
}

interface ClassificationAnchorRow {
  label: string;
  embedding: string;
}

// pgvector 欄位透過 PostgREST（Supabase anon key 直連）回傳的是字串（例如
// "[0.1,0.2,...]"），不是原生陣列——用真實資料查證過才確認這件事，要手動
// JSON.parse 轉成 number[]。
function toClassificationAnchor(row: ClassificationAnchorRow): ClassificationAnchor {
  return {
    label: row.label,
    embedding: JSON.parse(row.embedding) as number[]
  };
}

export async function fetchClassificationAnchors(dimension: string): Promise<ClassificationAnchor[]> {
  const { data, error } = await getSupabase()
    .from('classification_anchors')
    .select('label,embedding')
    .eq('dimension', dimension);

  if (error) throw error;

  return (data as ClassificationAnchorRow[]).map(toClassificationAnchor);
}
