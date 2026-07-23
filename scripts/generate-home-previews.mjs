/**
 * 首頁概念圖預覽產生器（issue #181）。
 *
 * 首頁 FloatingImageNetwork 的卡片只顯示 240px（桌機）/ ≤132px（手機），
 * 但原圖是 1400px+ 全尺寸，白白多載約 6 倍像素。此腳本把「無 medium 的概念圖」
 * （＝首頁圖片集，見 image.service.ts getHomeInspirationImages）批次轉成
 * 480w / 720w 的 WebP 預覽，並把尺寸寫回 home-preview-manifest.json，
 * 交給 <img srcset> 依裝置像素密度挑檔。
 *
 * 原圖保留不動，詳情頁照舊用全尺寸。可重跑（idempotent）：新增首頁圖後再跑一次即可；
 * 重跑會順手清掉已從資料移除／改名的舊縮圖，讓輸出目錄完整反映目前資料。
 *
 *   node scripts/generate-home-previews.mjs           # 產圖（含清理失效縮圖）
 *   node scripts/generate-home-previews.mjs --check    # 只驗證，不產圖（部署前檢查用）
 *
 * --check：不改任何檔案，驗證每個概念圖的原圖存在、且 manifest 每筆都有實體
 * 480w/720w 縮圖，任一缺漏就非零退出——把「檔名打錯／資產漏部署」擋在上線前。
 */
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src/data/style-data.json');
// { 原圖檔名(去副檔): [寬, 高] }。image.service 依 url 檔名比對此清單，只對「確實有
// preview 檔」的圖套縮圖（避免破圖），並用尺寸給 <img> 預留比例消 CLS。
const MANIFEST_FILE = path.join(ROOT, 'src/data/home-preview-manifest.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PREVIEW_URL_DIR = '/style-image/preview';
const OUT_DIR = path.join(PUBLIC_DIR, PREVIEW_URL_DIR.replace(/^\//, ''));

// 顯示最大 240px，480w=2x、720w=3x 已覆蓋所有裝置。品質 72：對這種小顯示尺寸
// 的照片視覺上等同無損（縮圖本身已消化大部分壓縮），需要更狠可往下調。
const TARGET_WIDTHS = [480, 720];
const WEBP_QUALITY = 72;

const isConceptImage = (image) => !image.medium;
const baseName = (url) => path.basename(url, path.extname(url));
const previewName = (base, width) => `${base}-${width}.webp`;

async function readConceptImages() {
  const images = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  return images.filter(isConceptImage);
}

// 刪掉輸出目錄裡「不在本次輸出清單」的舊 .webp——資料改名／移除後殘留的縮圖，
// 若不清會隨重跑一直累積，撐大 repo 與部署體積。先產後刪，避免中途崩潰誤刪現用檔。
async function pruneStalePreviews(keepFilenames) {
  const existing = await readdir(OUT_DIR);
  let removed = 0;
  for (const filename of existing) {
    if (filename.endsWith('.webp') && !keepFilenames.has(filename)) {
      await unlink(path.join(OUT_DIR, filename));
      removed += 1;
    }
  }
  return removed;
}

async function generate() {
  await mkdir(OUT_DIR, { recursive: true });
  const conceptImages = await readConceptImages();

  let generated = 0;
  let originalBytes = 0;
  let previewBytes = 0;
  let skipped = 0;
  const manifest = {};
  const writtenFilenames = new Set();

  for (const image of conceptImages) {
    const inputPath = path.join(PUBLIC_DIR, image.url);
    if (!existsSync(inputPath)) {
      console.warn(`跳過：找不到原圖 ${image.url}`);
      skipped += 1;
      continue;
    }

    const base = baseName(image.url);
    const meta = await sharp(inputPath).metadata();
    originalBytes += (await readFile(inputPath)).length;

    for (const width of TARGET_WIDTHS) {
      const filename = previewName(base, width);
      const info = await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(path.join(OUT_DIR, filename));
      writtenFilenames.add(filename);
      generated += 1;
      previewBytes += info.size;
    }

    // 記原圖尺寸供 <img width/height> 預留比例（消 CLS）。
    manifest[base] = [meta.width, meta.height];
  }

  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((key) => [key, manifest[key]])
  );
  await writeFile(MANIFEST_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf-8');

  const removed = await pruneStalePreviews(writtenFilenames);

  const mb = (n) => (n / 1e6).toFixed(1);
  console.log(`\n完成：${generated} 個預覽檔，跳過 ${skipped} 筆，清理失效縮圖 ${removed} 個`);
  console.log(`原圖總計 ${mb(originalBytes)} MB → 預覽總計 ${mb(previewBytes)} MB`);
  console.log(`白名單已寫入 ${path.relative(ROOT, MANIFEST_FILE)}（${Object.keys(sorted).length} 筆，含尺寸）`);
}

// 部署前一致性檢查：不產圖，只驗證資料 ↔ 實體資產對得上。發現任一缺漏就回報並非零退出。
async function check() {
  const conceptImages = await readConceptImages();
  const manifest = JSON.parse(await readFile(MANIFEST_FILE, 'utf-8'));
  const problems = [];

  // 1) 每個概念圖的原圖都要存在（漏部署／檔名打錯 → 產圖時會被跳過而缺縮圖）。
  for (const image of conceptImages) {
    if (!existsSync(path.join(PUBLIC_DIR, image.url))) {
      problems.push(`原圖遺漏：${image.url}（id: ${image.id}）`);
    }
  }

  // 2) manifest 每筆都要有實體 480w/720w 縮圖（entry 在、檔卻不在 → 正式站破圖）。
  const expected = new Set();
  for (const base of Object.keys(manifest)) {
    for (const width of TARGET_WIDTHS) {
      const filename = previewName(base, width);
      expected.add(filename);
      if (!existsSync(path.join(OUT_DIR, filename))) {
        problems.push(`縮圖遺漏：${PREVIEW_URL_DIR}/${filename}`);
      }
    }
  }

  // 3) 有實體縮圖卻不在 manifest（殘留檔）——只警告，不擋，重跑產圖會自動清掉。
  const stale = (await readdir(OUT_DIR)).filter(
    (filename) => filename.endsWith('.webp') && !expected.has(filename)
  );
  for (const filename of stale) {
    console.warn(`殘留縮圖（重跑產圖會清掉）：${PREVIEW_URL_DIR}/${filename}`);
  }

  if (problems.length > 0) {
    console.error(`\n一致性檢查失敗，共 ${problems.length} 項：`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exit(1);
  }
  console.log(
    `一致性檢查通過：${conceptImages.length} 張概念圖、${Object.keys(manifest).length} 筆 manifest × ${TARGET_WIDTHS.length} 縮圖齊全`
  );
}

const run = process.argv.includes('--check') ? check : generate;
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
