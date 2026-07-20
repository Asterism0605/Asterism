/**
 * 首頁概念圖預覽產生器（issue #181）。
 *
 * 首頁 FloatingImageNetwork 的卡片只顯示 240px（桌機）/ ≤132px（手機），
 * 但原圖是 1400px+ 全尺寸，白白多載約 6 倍像素。此腳本把「無 medium 的概念圖」
 * （＝首頁圖片集，見 image.service.ts getHomeInspirationImages）批次轉成
 * 480w / 720w 的 WebP 預覽，並把 previewSrc / previewSrcset / width / height
 * 寫回 style-data.json，交給 <img srcset> 依裝置像素密度挑檔。
 *
 * 原圖保留不動，詳情頁照舊用全尺寸。可重跑（idempotent）：新增首頁圖後再跑一次即可。
 *
 *   node scripts/generate-home-previews.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src/data/style-data.json');
// 白名單＋尺寸：{ 原圖檔名(去副檔): [寬, 高] }。首頁改吃 Supabase 資料，
// 其 url 可能是 asterism.pics 絕對網址；image.service 依 url 檔名比對此清單，
// 只對「確實有 preview 檔」的圖套縮圖（避免破圖），並用尺寸給 <img> 預留比例消 CLS。
const MANIFEST_FILE = path.join(ROOT, 'src/data/home-preview-manifest.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PREVIEW_URL_DIR = '/style-image/preview';

// 顯示最大 240px，480w=2x、720w=3x 已覆蓋所有裝置。品質 72：對這種小顯示尺寸
// 的照片視覺上等同無損（縮圖本身已消化大部分壓縮），需要更狠可往下調。
const TARGET_WIDTHS = [480, 720];
const WEBP_QUALITY = 72;

const isConceptImage = (image) => !image.medium;
const previewName = (url, width) =>
  `${path.basename(url, path.extname(url))}-${width}.webp`;

async function main() {
  const images = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  const outDir = path.join(PUBLIC_DIR, PREVIEW_URL_DIR.replace(/^\//, ''));
  await mkdir(outDir, { recursive: true });

  let generated = 0;
  let originalBytes = 0;
  let previewBytes = 0;
  let skipped = 0;
  const manifest = {};

  for (const image of images) {
    if (!isConceptImage(image)) continue;

    const inputPath = path.join(PUBLIC_DIR, image.url);
    if (!existsSync(inputPath)) {
      console.warn(`跳過：找不到原圖 ${image.url}`);
      skipped += 1;
      continue;
    }

    const meta = await sharp(inputPath).metadata();
    originalBytes += (await readFile(inputPath)).length;

    for (const width of TARGET_WIDTHS) {
      const outPath = path.join(outDir, previewName(image.url, width));
      const info = await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);
      generated += 1;
      previewBytes += info.size;
    }

    // 記原圖尺寸供 <img width/height> 預留比例（消 CLS）。
    const base = path.basename(image.url, path.extname(image.url));
    manifest[base] = [meta.width, meta.height];
  }

  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((key) => [key, manifest[key]])
  );
  await writeFile(MANIFEST_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf-8');

  const mb = (n) => (n / 1e6).toFixed(1);
  console.log(`\n完成：${generated} 個預覽檔，跳過 ${skipped} 筆`);
  console.log(`原圖總計 ${mb(originalBytes)} MB → 預覽總計 ${mb(previewBytes)} MB`);
  console.log(`白名單已寫入 ${path.relative(ROOT, MANIFEST_FILE)}（${Object.keys(sorted).length} 筆，含尺寸）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
