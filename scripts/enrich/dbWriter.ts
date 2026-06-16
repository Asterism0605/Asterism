import type { Pool } from 'pg';
import type { ImageRow } from './buildImageRow';

export async function insertImageRows(pool: Pool, rows: ImageRow[]): Promise<void> {
  for (const row of rows) {
    await pool.query(
      `INSERT INTO images (id, url, title, style_group, style, medium, sub_medium, color_palette, source, attribution, confidence, needs_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        row.url,
        row.title,
        row.style_group,
        row.style,
        row.medium,
        row.sub_medium,
        row.color_palette,
        row.source,
        row.attribution,
        JSON.stringify(row.confidence),
        JSON.stringify(row.needs_review)
      ]
    );
  }
}
