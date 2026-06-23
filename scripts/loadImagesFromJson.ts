import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

// 一次性腳本：把 images_dump.json 灌進 DATABASE_URL 指向的資料庫（Supabase）。
// 用 ON CONFLICT DO NOTHING，重跑安全、不會插重複。
// needs_review 之後再跑 scripts/recomputeNeedsReview.ts 依 confidence 重算。
//   執行：npx tsx scripts/loadImagesFromJson.ts

interface DumpImage {
  id: string;
  url: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium: string | null;
  subMedium?: string | null;
  colorPalette: string[];
  source: string;
  attribution: string;
  confidence: unknown;
  needsReview: unknown;
}

async function main(): Promise<void> {
  const dumpPath = join(process.cwd(), 'images_dump.json');
  const images = JSON.parse(readFileSync(dumpPath, 'utf-8')) as DumpImage[];

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0;

  for (const image of images) {
    const result = await pool.query(
      `INSERT INTO images (id, url, title, style_group, style, medium, sub_medium, color_palette, source, attribution, confidence, needs_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        image.id,
        image.url,
        image.title,
        image.styleGroup,
        image.style,
        image.medium ?? null,
        image.subMedium ?? null,
        image.colorPalette,
        image.source,
        image.attribution,
        JSON.stringify(image.confidence),
        JSON.stringify(image.needsReview)
      ]
    );
    inserted += result.rowCount ?? 0;
  }

  const { rows } = await pool.query<{ count: string }>('SELECT count(*) FROM images');
  console.log(`讀入 ${images.length} 筆，新插入 ${inserted} 筆，images 表現在共 ${rows[0].count} 筆`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
