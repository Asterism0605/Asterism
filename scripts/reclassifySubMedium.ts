import 'dotenv/config';
import { Pool } from 'pg';
import type { Scorer } from './enrich/scorer';
import { SUBMEDIUM_BY_MEDIUM } from './enrich/taxonomy';

// 一次性腳本：回填既有資料庫列的 subMedium。
// 不能靠重跑 enrich/index.ts —— 它每次重新去 gallery 撈「新圖」，且 dbWriter 是
// ON CONFLICT DO NOTHING，撞 id 會跳過、不更新既有列。故此腳本讀既有列、用存好的 url
// 只重跑 subMedium 那層 CLIP，再 UPDATE 寫回。其餘欄位（styleGroup/medium/style/palette）不動。
//   執行：npx tsx scripts/reclassifySubMedium.ts

interface Confidence {
  styleGroup: number;
  medium: number;
  subMedium: number | null;
}

interface NeedsReview {
  styleGroup: boolean;
  medium: boolean;
  subMedium: boolean;
}

export interface ExistingRow {
  id: string;
  url: string;
  medium: string | null;
  confidence: Confidence;
  needsReview: NeedsReview;
}

export interface SubMediumUpdate {
  subMedium: string;
  confidence: Confidence & { subMedium: number };
  needsReview: NeedsReview;
}

// 純邏輯：對單列只跑 subMedium 那層，合併進既有 confidence/needs_review JSONB
// （保留 styleGroup/medium 欄位，只覆寫 subMedium，並把 subMedium 標記為待審）。
// medium 不在候選表（理論上不會）或缺 medium 時回 null，由呼叫端略過。
export async function reclassifyRowSubMedium(
  scorer: Scorer,
  row: ExistingRow
): Promise<SubMediumUpdate | null> {
  if (!row.medium) {
    return null;
  }

  const subLabels = SUBMEDIUM_BY_MEDIUM[row.medium];
  if (!subLabels || subLabels.length === 0) {
    return null;
  }

  const subScores = await scorer.classify(row.url, subLabels);
  const top = subScores[0];

  return {
    subMedium: top.label,
    confidence: { ...row.confidence, subMedium: top.score },
    needsReview: { ...row.needsReview, subMedium: true }
  };
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // 動態載入避免測試 import 此模組時把 @huggingface/transformers 一起拉進來。
  const { createClipScorer } = await import('./enrich/clipScorer');
  const scorer = await createClipScorer();

  const { rows } = await pool.query<{
    id: string;
    url: string;
    medium: string | null;
    confidence: Confidence;
    needs_review: NeedsReview;
  }>('SELECT id, url, medium, confidence, needs_review FROM images');

  let updated = 0;
  let skipped = 0;
  const distribution: Record<string, number> = {};

  for (const row of rows) {
    const update = await reclassifyRowSubMedium(scorer, {
      id: row.id,
      url: row.url,
      medium: row.medium,
      confidence: row.confidence,
      needsReview: row.needs_review
    });

    if (!update) {
      skipped += 1;
      console.warn(`略過 ${row.id}（medium=${row.medium ?? 'null'} 無候選子類）`);
      continue;
    }

    await pool.query(
      'UPDATE images SET sub_medium = $2, confidence = $3, needs_review = $4 WHERE id = $1',
      [row.id, update.subMedium, JSON.stringify(update.confidence), JSON.stringify(update.needsReview)]
    );

    distribution[update.subMedium] = (distribution[update.subMedium] ?? 0) + 1;
    updated += 1;
  }

  console.log(`共 ${rows.length} 筆，更新 ${updated} 筆、略過 ${skipped} 筆`);
  console.log('subMedium 分佈：', distribution);

  await pool.end();
}

// 測試 import 此模組時不連線資料庫（vitest 會設定 process.env.VITEST）。
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
