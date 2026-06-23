import 'dotenv/config';
import { Pool } from 'pg';
import { STYLE_GROUP_ANCHORS } from './taxonomy';
import { classifyImage } from './classify';
import { buildImageRow } from './buildImageRow';
import type { ImageRow } from './buildImageRow';
import { createClipScorer } from './clipScorer';
import { extractPalette } from './colorPalette';
import { searchPexels } from './pexelsClient';
import { searchUnsplash } from './unsplashClient';
import { insertImageRows } from './dbWriter';

const IMAGES_PER_SOURCE = 15; // 15 Pexels + 15 Unsplash = 30 張/組，9 組 = 270 張

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const scorer = await createClipScorer();
  const rows: ImageRow[] = [];

  for (const [styleGroup, anchorPrompt] of Object.entries(STYLE_GROUP_ANCHORS)) {
    const [pexelsResults, unsplashResults] = await Promise.all([
      searchPexels(anchorPrompt, IMAGES_PER_SOURCE),
      searchUnsplash(anchorPrompt, IMAGES_PER_SOURCE)
    ]);

    for (const meta of [...pexelsResults, ...unsplashResults]) {
      const classification = await classifyImage(scorer, meta.url);
      const palette = await extractPalette(meta.url);
      rows.push(buildImageRow(classification, palette, meta));
    }

    console.log(`[${styleGroup}] 撈完 ${pexelsResults.length + unsplashResults.length} 張`);
  }

  await insertImageRows(pool, rows);

  const distribution = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.style_group] = (acc[row.style_group] ?? 0) + 1;
    return acc;
  }, {});
  const needsReviewCount = rows.filter(
    (row) => row.needs_review.styleGroup || row.needs_review.medium || row.needs_review.subMedium
  ).length;

  console.log('分類分佈：', distribution);
  console.log(`needsReview 筆數：${needsReviewCount} / ${rows.length}`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
