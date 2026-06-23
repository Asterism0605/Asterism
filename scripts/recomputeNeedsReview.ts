import 'dotenv/config';
import { Pool } from 'pg';
import { THRESHOLDS } from './enrich/taxonomy';

// 一次性腳本：用「已存在資料庫」的 confidence 值，套上目前 taxonomy.ts 的新門檻
// 重新計算每筆 needs_review，不重跑 CLIP。改門檻後執行一次即可。
//   執行：npx tsx scripts/recomputeNeedsReview.ts

interface Row {
  id: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { rows } = await pool.query<Row>('SELECT id, confidence FROM images');
  let changed = 0;

  for (const row of rows) {
    const c = row.confidence;
    const needsReview = {
      styleGroup: c.styleGroup < THRESHOLDS.styleGroup,
      medium: c.medium < THRESHOLDS.medium,
      // subMedium 是強制猜出來的，一律送人工審核（與 enrich/classify.ts 一致）
      subMedium: true
    };

    await pool.query('UPDATE images SET needs_review = $1 WHERE id = $2', [
      JSON.stringify(needsReview),
      row.id
    ]);

    if (needsReview.styleGroup || needsReview.medium || needsReview.subMedium) {
      changed += 1;
    }
  }

  console.log(`套用門檻 styleGroup<${THRESHOLDS.styleGroup} / medium<${THRESHOLDS.medium} / subMedium<${THRESHOLDS.subMedium}`);
  console.log(`共 ${rows.length} 筆，其中 ${changed} 筆被標記 needs_review = true`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
