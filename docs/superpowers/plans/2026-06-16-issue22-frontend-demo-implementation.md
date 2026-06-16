# Issue #22 支線 A Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Issue #22 支線 A 做成一個組員能親手操作的 demo：離線腳本從 Pexels/Unsplash 撈圖、跑 CLIP 三層分類 + 取色、寫進 PostgreSQL；一個極簡 Express API 把資料回傳給前端；前端 `image.service.ts` 改成從 API 取資料，UI 與比對邏輯完全不動。

**Architecture:** 把「分類編排邏輯」拆成純函式（`classify.ts`、`buildImageRow.ts`，用假 scorer TDD）和「I/O 轉接層」（CLIP、取色、Pexels/Unsplash、Postgres——非確定性，不寫單元測試，靠手動整合驗證）。Express 層只負責把 DB row 轉成前端 `StyleImage` 形狀（`transform.ts`，可 TDD）並原樣回傳全部資料。前端只動資料來源這一層：`image.api.ts` 改打真實 API，`image.service.ts` 的比對邏輯（`getRelatedImages`/`countSharedStyles`）一行不改，只是包進 `async`。

**Tech Stack:** TypeScript、Vitest、Vue 3 + `@vue/test-utils`、Express、PostgreSQL（`pg`）、`@huggingface/transformers`（CLIP JS 版）、`node-vibrant`、`tsx`、`dotenv`。

---

## 對應 Spec

`docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md`（基底分支 `develop`，分支 `demo/image-spread`）。
前置設計：`docs/superpowers/specs/2026-06-15-external-image-styleGroup-recognition-design.md`。
前置（已被本計畫取代/擴充的舊計畫，僅供參考分類邏輯雛形）：`docs/superpowers/plans/2026-06-15-external-image-enrichment-offline.md`（該計畫只有 3 個 styleGroup、輸出 JSON 到 stdout；本計畫改成 9 個 styleGroup、輸出進 PostgreSQL，並加上 Express API 與前端整合）。

## 測試/指令環境（實測）

- 測試：`npm run test`（= `vitest run`）；單檔：`npx vitest run <path>`
- Lint：`npm run lint`
- 既有測試放 `src/tests/*.spec.ts`，用 Vitest + jsdom（`vite.config.ts` 的 `test.environment: 'jsdom'`），純 Node 邏輯測試一樣能在這個環境跑。
- 路徑別名 `@` → `src/`（`vite.config.ts` resolve.alias，Vitest 共用同一份設定）。`scripts/`、`server/` 在 `src/` 之外，沒有別名，用相對路徑 import。

## 風格分類資料來源說明（重要前提）

`docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md` §4 已經定出 9 個 styleGroup 的 CLIP 錨點文字（`STYLE_GROUP_ANCHORS`）。但每個 styleGroup 底下的 `style[]` 候選詞（子風格字），目前只有「Y2K & Internet Aesthetics」「Future Tech & Digital Psychedelia」「Decorative & Opulent Art」三組在 `src/data/style-data.json` 裡有實際資料可查。其餘 6 組（Minimal & Structured Modern / Earth & Organic Humanism / Romantic & Pastoral Living / Retro & Nostalgia / Experimental & Avant-Garde / Street & Youth Culture）的子風格詞清單，本計畫**直接從已核准 spec §4 的錨點文字裡萃取代表詞**（例如 `Minimal & Structured Modern` 錨點是 `'minimalism quiet luxury scandinavian modernism swiss design'` → 子風格字取 `Minimalism / Quiet Luxury / Scandinavian Modernism / Swiss Design`）。這只影響 demo 用的 CLIP 候選詞庫，不是正式 schema 決定；Task 3 的 Step 5 會把完整清單列出來，若组員之後有更精確的子風格字版本，直接改 `scripts/enrich/taxonomy.ts` 即可，不影響其他任何檔案。

## File Structure

| 檔案 | 責任 | 動作 |
| --- | --- | --- |
| `.env.example` | 環境變數範本 | Create |
| `.gitignore` | 排除 `.env` | Modify |
| `package.json` | 新依賴 + `server`/`enrich:images` script | Modify |
| `scripts/schema.sql` | `images` 表 DDL | Create |
| `scripts/enrich/taxonomy.ts` | 9 組 styleGroup 錨點、medium/subMedium 清單、style 候選詞、門檻 | Create |
| `scripts/enrich/scorer.ts` | `Scorer` 抽象介面 | Create |
| `scripts/enrich/classify.ts` | 純編排：三層分類 + style[] + 信心 + needsReview | Create |
| `scripts/enrich/galleryMeta.ts` | `GalleryMeta`/`ImageSource` 型別 | Create |
| `scripts/enrich/buildImageRow.ts` | 分類結果 + 色票 + 圖庫 meta → DB row | Create |
| `scripts/enrich/clipScorer.ts` | Transformers.js 轉接（薄、不單元測） | Create |
| `scripts/enrich/colorPalette.ts` | node-vibrant 取色（薄） | Create |
| `scripts/enrich/pexelsClient.ts` | 查 Pexels（薄） | Create |
| `scripts/enrich/unsplashClient.ts` | 查 Unsplash（薄） | Create |
| `scripts/enrich/dbWriter.ts` | batch INSERT 進 Postgres（薄） | Create |
| `scripts/enrich/index.ts` | CLI 進入點，串起以上、印統計 | Create |
| `server/transform.ts` | DB row → 前端 `StyleImage` 形狀轉換 | Create |
| `server/db.ts` | pg Pool | Create |
| `server/routes/images.ts` | `GET /api/images` | Create |
| `server/index.ts` | Express app | Create |
| `vite.config.ts` | dev server proxy `/api` → Express | Modify |
| `src/api/image.api.ts` | 改打真實 API（httpClient） | Modify |
| `src/services/image.service.ts` | 改成 async，資料來源換成 `fetchImagesApi()` | Modify |
| `src/pages/ImageSpread.vue` | 呼叫端改 async | Modify |
| `src/pages/Home.vue` | 呼叫端改 async（`ref` + `onMounted`） | Modify |
| `docs/demo-setup.md` | 給組員的環境設定步驟 | Create |
| `src/tests/enrich/taxonomy.spec.ts` | taxonomy 測試 | Test |
| `src/tests/enrich/classify.spec.ts` | classify 測試 | Test |
| `src/tests/enrich/buildImageRow.spec.ts` | buildImageRow 測試 | Test |
| `src/tests/server/transform.spec.ts` | transform 測試 | Test |
| `src/tests/image.api.spec.ts` | 改成 mock httpClient | Modify |
| `src/tests/image.service.spec.ts` | 改成 async + mock image.api | Modify |
| `src/tests/ImageSpread.spec.ts` | 加 mock + flushPromises | Modify |
| `src/tests/Home.spec.ts` | 加 mock + flushPromises | Modify |

---

## Task 1：依賴、環境變數、package.json scripts

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1：安裝依賴**

Run:
```bash
npm install express cors pg dotenv
npm install -D @huggingface/transformers node-vibrant tsx @types/express @types/cors @types/pg
```
Expected: `package.json` 的 `dependencies`/`devDependencies` 新增上述套件。

- [ ] **Step 2：在 `package.json` 的 `scripts` 加入兩個指令**

把：
```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --fix",
  "format": "prettier --write src/",
  "test": "vitest run",
  "test:watch": "vitest"
}
```
改成：
```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --fix",
  "format": "prettier --write src/",
  "test": "vitest run",
  "test:watch": "vitest",
  "server": "tsx server/index.ts",
  "enrich:images": "tsx scripts/enrich/index.ts"
}
```

- [ ] **Step 3：建立 `.env.example`**

```
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
DATABASE_URL=postgres://localhost:5432/asterism_demo
SERVER_PORT=3001
```

- [ ] **Step 4：在 `.gitignore` 加入 `.env`**

把：
```
# TypeScript
*.tsbuildinfo
.superpowers/
```
改成：
```
# TypeScript
*.tsbuildinfo
.superpowers/

# Env
.env
```

- [ ] **Step 5：確認沒有破壞既有測試**

Run: `npm run test`
Expected: 全部既有測試維持 PASS（這步只動依賴和 script，不動程式碼）。

---

## Task 2：PostgreSQL `images` 表 schema

**Files:**
- Create: `scripts/schema.sql`

- [ ] **Step 1：建立 `scripts/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS images (
  id              TEXT PRIMARY KEY,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  style_group     TEXT NOT NULL,
  style           TEXT[] NOT NULL DEFAULT '{}',
  medium          TEXT,
  sub_medium      TEXT,
  color_palette   TEXT[] NOT NULL DEFAULT '{}',
  source          TEXT NOT NULL,
  attribution     TEXT NOT NULL,
  confidence      JSONB NOT NULL,
  needs_review    JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 2：手動驗證（需要本機已起 PostgreSQL）**

Run（PowerShell，假設用 `psql` 連到 `DATABASE_URL` 指定的庫）：
```powershell
psql $env:DATABASE_URL -f scripts/schema.sql
```
Expected: 印出 `CREATE TABLE`，且 `psql $env:DATABASE_URL -c "\d images"` 能看到上述欄位。

---

## Task 3：分類清單 `taxonomy.ts`（TDD）

**Files:**
- Create: `scripts/enrich/taxonomy.ts`
- Test: `src/tests/enrich/taxonomy.spec.ts`

- [ ] **Step 1：寫失敗測試 `src/tests/enrich/taxonomy.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  STYLE_GROUP_ANCHORS,
  STYLE_VOCAB_BY_GROUP,
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  THRESHOLDS
} from '../../../scripts/enrich/taxonomy';

describe('taxonomy', () => {
  it('有 9 個 styleGroup 錨點', () => {
    expect(Object.keys(STYLE_GROUP_ANCHORS)).toHaveLength(9);
  });

  it('每個 styleGroup 都有對應的 style 候選詞', () => {
    for (const styleGroup of Object.keys(STYLE_GROUP_ANCHORS)) {
      expect(STYLE_VOCAB_BY_GROUP[styleGroup]).toBeDefined();
      expect(STYLE_VOCAB_BY_GROUP[styleGroup].length).toBeGreaterThan(0);
    }
  });

  it('SUBMEDIUM_BY_MEDIUM 的每個 key 必須是合法 medium', () => {
    for (const medium of Object.keys(SUBMEDIUM_BY_MEDIUM)) {
      expect(MEDIUM_LABELS).toContain(medium);
    }
  });

  it('門檻越細越嚴：styleGroup < medium < subMedium', () => {
    expect(THRESHOLDS.styleGroup).toBeLessThan(THRESHOLDS.medium);
    expect(THRESHOLDS.medium).toBeLessThan(THRESHOLDS.subMedium);
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/enrich/taxonomy.spec.ts`
Expected: FAIL（找不到模組 `scripts/enrich/taxonomy`）。

- [ ] **Step 3：建立 `scripts/enrich/taxonomy.ts`**

```ts
// 9 個 styleGroup 的 CLIP 錨點文字（給 zero-shot 分類比對用的英文描述）。
// 對齊 docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md §4。
export const STYLE_GROUP_ANCHORS: Record<string, string> = {
  'Future Tech & Digital Psychedelia': 'cyberpunk futurism glitch art techwear neo-tokyo',
  'Y2K & Internet Aesthetics': 'Y2K frutiger aero McBling chrome design bubblegum futurism',
  'Decorative & Opulent Art': 'art deco baroque rococo maximalism ornate luxury',
  'Minimal & Structured Modern': 'minimalism quiet luxury scandinavian modernism swiss design',
  'Earth & Organic Humanism': 'wabi-sabi japandi biophilic design organic modern',
  'Romantic & Pastoral Living': 'cottagecore romanticism grandmillennial vintage floral',
  'Retro & Nostalgia': 'vintage retro mid-century modern americana',
  'Experimental & Avant-Garde':
    'brutalism anti-design deconstructivism avant-garde experimental typography',
  'Street & Youth Culture': 'streetwear hypebeast graffiti urban contemporary skate culture'
};

// 每個 styleGroup 的 style[] 候選詞 —— CLIP 多標籤分類只在對應群組的詞庫裡比。
// 前 3 組沿用 src/data/style-data.json 既有資料；其餘 6 組從上面的錨點文字萃取代表詞
// （demo 用詞庫，未來校準可直接改這裡，不影響其他檔案）。
export const STYLE_VOCAB_BY_GROUP: Record<string, string[]> = {
  'Future Tech & Digital Psychedelia': [
    'Cyberpunk',
    'Neo Tokyo',
    'Future Tech',
    'Digital Psychedelia',
    'Glitch Aesthetic'
  ],
  'Y2K & Internet Aesthetics': [
    'Y2K',
    'Frutiger Aero',
    'McBling',
    'Chrome Design',
    'Bubblegum Futurism'
  ],
  'Decorative & Opulent Art': [
    'Baroque',
    'Rococo',
    'Art Deco',
    'Gilded Ornament',
    'Opulent Classicism'
  ],
  'Minimal & Structured Modern': [
    'Minimalism',
    'Quiet Luxury',
    'Scandinavian Modernism',
    'Swiss Design'
  ],
  'Earth & Organic Humanism': ['Wabi-Sabi', 'Japandi', 'Biophilic Design', 'Organic Modernism'],
  'Romantic & Pastoral Living': [
    'Cottagecore',
    'Romanticism',
    'Grandmillennial',
    'Vintage Floral'
  ],
  'Retro & Nostalgia': ['Vintage', 'Retro', 'Mid-Century Modern', 'Americana'],
  'Experimental & Avant-Garde': [
    'Brutalism',
    'Anti-Design',
    'Deconstructivism',
    'Experimental Typography'
  ],
  'Street & Youth Culture': ['Streetwear', 'Hypebeast', 'Graffiti', 'Skate Culture']
};

export const MEDIUM_LABELS: string[] = [
  'Outfit',
  'Graphic Design',
  'Interior Design',
  'Architecture'
];

// 只有 Graphic Design 有子分類（對齊現有 style-data.json）。
// 其餘 medium 無子類 → subMedium 留空。新子類由人工加進來。
export const SUBMEDIUM_BY_MEDIUM: Record<string, string[]> = {
  'Graphic Design': ['Poster Design', 'Editorial Design', 'Branding']
};

export const THRESHOLDS = {
  styleGroup: 0.25,
  medium: 0.3,
  subMedium: 0.35
} as const;

export const STYLE_TOP_K = 4;
```

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/enrich/taxonomy.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 4：`Scorer` 介面 + `classify.ts` 純編排（TDD）

**Files:**
- Create: `scripts/enrich/scorer.ts`
- Create: `scripts/enrich/classify.ts`
- Test: `src/tests/enrich/classify.spec.ts`

- [ ] **Step 1：建立 `scripts/enrich/scorer.ts`**

```ts
export interface ScoredLabel {
  label: string;
  score: number;
}

// zero-shot 分類抽象：給一張圖和一組標籤，回傳依分數由高到低排序的結果。
// 真實實作是 CLIP（clipScorer.ts）；測試用假替身。
export interface Scorer {
  classify(imageRef: string, labels: string[]): Promise<ScoredLabel[]>;
}
```

- [ ] **Step 2：寫失敗測試 `src/tests/enrich/classify.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { classifyImage } from '../../../scripts/enrich/classify';
import type { Scorer, ScoredLabel } from '../../../scripts/enrich/scorer';
import { STYLE_GROUP_ANCHORS } from '../../../scripts/enrich/taxonomy';

// 假 scorer：依傳入的分數表回傳排序結果。
function fakeScorer(scoreMap: Record<string, number>): Scorer {
  return {
    async classify(_imageRef: string, labels: string[]): Promise<ScoredLabel[]> {
      return labels
        .map((label) => ({ label, score: scoreMap[label] ?? 0 }))
        .sort((a, b) => b.score - a.score);
    }
  };
}

const Y2K_PROMPT = STYLE_GROUP_ANCHORS['Y2K & Internet Aesthetics'];

describe('classifyImage', () => {
  it('挑出最高分 styleGroup，並把錨點文字對回 styleGroup 名稱', async () => {
    const scorer = fakeScorer({
      [Y2K_PROMPT]: 0.4,
      'Graphic Design': 0.5,
      'Poster Design': 0.6,
      McBling: 0.6
    });

    const result = await classifyImage(scorer, 'img');

    expect(result.styleGroup).toBe('Y2K & Internet Aesthetics');
    expect(result.confidence.styleGroup).toBe(0.4);
  });

  it('medium 有子類時才給 subMedium；無子類時 subMedium 為 null', async () => {
    const withSub = fakeScorer({ [Y2K_PROMPT]: 0.4, 'Graphic Design': 0.5, 'Poster Design': 0.7 });
    const noSub = fakeScorer({ [Y2K_PROMPT]: 0.4, Architecture: 0.9 });

    const a = await classifyImage(withSub, 'img');
    const b = await classifyImage(noSub, 'img');

    expect(a.medium).toBe('Graphic Design');
    expect(a.subMedium).toBe('Poster Design');
    expect(b.medium).toBe('Architecture');
    expect(b.subMedium).toBeNull();
    expect(b.confidence.subMedium).toBeNull();
  });

  it('style[] 只在所選 styleGroup 的子風格詞庫裡比', async () => {
    const scorer = fakeScorer({
      [Y2K_PROMPT]: 0.4,
      'Graphic Design': 0.1,
      McBling: 0.9,
      Y2K: 0.8
    });

    const result = await classifyImage(scorer, 'img');

    expect(result.style).toContain('McBling');
    expect(result.style).not.toContain('Cyberpunk');
  });

  it('低於門檻的層被標記 needsReview', async () => {
    const scorer = fakeScorer({ [Y2K_PROMPT]: 0.1, 'Graphic Design': 0.5, 'Poster Design': 0.7 });

    const result = await classifyImage(scorer, 'img');

    expect(result.needsReview.styleGroup).toBe(true);
    expect(result.needsReview.medium).toBe(false);
    expect(result.needsReview.subMedium).toBe(false);
  });
});
```

- [ ] **Step 3：跑測試確認失敗**

Run: `npx vitest run src/tests/enrich/classify.spec.ts`
Expected: FAIL（找不到 `classify`）。

- [ ] **Step 4：建立 `scripts/enrich/classify.ts`**

```ts
import type { Scorer } from './scorer';
import {
  STYLE_GROUP_ANCHORS,
  STYLE_VOCAB_BY_GROUP,
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  THRESHOLDS,
  STYLE_TOP_K
} from './taxonomy';

export interface ClassificationResult {
  styleGroup: string;
  medium: string;
  subMedium: string | null;
  style: string[];
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needsReview: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

export async function classifyImage(scorer: Scorer, imageRef: string): Promise<ClassificationResult> {
  // 第1層：styleGroup（用錨點文字比，再把文字對回群組名）
  const sgLabels = Object.keys(STYLE_GROUP_ANCHORS);
  const sgPrompts = sgLabels.map((label) => STYLE_GROUP_ANCHORS[label]);
  const sgScores = await scorer.classify(imageRef, sgPrompts);
  const topSg = sgScores[0];
  const matchedLabel = sgLabels.find((label) => STYLE_GROUP_ANCHORS[label] === topSg.label);
  const styleGroup = matchedLabel ?? sgLabels[0];
  const sgConfidence = topSg.score;

  // 第2層：medium
  const mdScores = await scorer.classify(imageRef, MEDIUM_LABELS);
  const medium = mdScores[0].label;
  const mdConfidence = mdScores[0].score;

  // 第3層：subMedium —— 只在所選 medium 底下的子類裡比；無子類則 null
  const subLabels = SUBMEDIUM_BY_MEDIUM[medium] ?? [];
  let subMedium: string | null = null;
  let subConfidence: number | null = null;
  if (subLabels.length > 0) {
    const subScores = await scorer.classify(imageRef, subLabels);
    subMedium = subScores[0].label;
    subConfidence = subScores[0].score;
  }

  // style[]：多標籤分類，候選池限定在所選 styleGroup 的詞庫
  const styleVocab = STYLE_VOCAB_BY_GROUP[styleGroup] ?? [];
  const styleScores = await scorer.classify(imageRef, styleVocab);
  const style = styleScores.slice(0, STYLE_TOP_K).map((entry) => entry.label);

  return {
    styleGroup,
    medium,
    subMedium,
    style,
    confidence: { styleGroup: sgConfidence, medium: mdConfidence, subMedium: subConfidence },
    needsReview: {
      styleGroup: sgConfidence < THRESHOLDS.styleGroup,
      medium: mdConfidence < THRESHOLDS.medium,
      subMedium: subConfidence !== null && subConfidence < THRESHOLDS.subMedium
    }
  };
}
```

- [ ] **Step 5：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/enrich/classify.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 5：`buildImageRow`（分類結果 → DB row，TDD）

**Files:**
- Create: `scripts/enrich/galleryMeta.ts`
- Create: `scripts/enrich/buildImageRow.ts`
- Test: `src/tests/enrich/buildImageRow.spec.ts`

- [ ] **Step 1：建立 `scripts/enrich/galleryMeta.ts`**

```ts
export type ImageSource = 'pexels' | 'unsplash';

export interface GalleryMeta {
  source: ImageSource;
  externalId: string;
  url: string;
  description: string; // → title（可能是空字串）
  photographer: string; // → attribution
}
```

- [ ] **Step 2：寫失敗測試 `src/tests/enrich/buildImageRow.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildImageRow } from '../../../scripts/enrich/buildImageRow';
import type { ClassificationResult } from '../../../scripts/enrich/classify';

const classification: ClassificationResult = {
  styleGroup: 'Y2K & Internet Aesthetics',
  medium: 'Graphic Design',
  subMedium: 'Poster Design',
  style: ['Y2K', 'Chrome Design'],
  confidence: { styleGroup: 0.31, medium: 0.28, subMedium: 0.19 },
  needsReview: { styleGroup: false, medium: false, subMedium: true }
};

describe('buildImageRow', () => {
  it('組出對齊 images 表 schema 的 row 物件', () => {
    const row = buildImageRow(classification, ['#8EC9FF', '#B9A8F3'], {
      source: 'pexels',
      externalId: '12345',
      url: 'https://images.pexels.com/photos/12345.jpg',
      description: 'shiny chrome bubble',
      photographer: 'Jane Doe'
    });

    expect(row.id).toBe('ext-pexels-12345');
    expect(row.title).toBe('shiny chrome bubble');
    expect(row.attribution).toBe('Photo by Jane Doe / Pexels');
    expect(row.style_group).toBe('Y2K & Internet Aesthetics');
    expect(row.sub_medium).toBe('Poster Design');
    expect(row.color_palette).toEqual(['#8EC9FF', '#B9A8F3']);
    expect(row.needs_review.subMedium).toBe(true);
  });

  it('description 為空時用 styleGroup 組預設 title；subMedium 為 null 時原樣保留', () => {
    const row = buildImageRow({ ...classification, subMedium: null }, [], {
      source: 'unsplash',
      externalId: '1',
      url: 'u',
      description: '',
      photographer: 'P'
    });

    expect(row.title).toBe('Y2K & Internet Aesthetics inspiration');
    expect(row.sub_medium).toBeNull();
    expect(row.attribution).toBe('Photo by P / Unsplash');
  });
});
```

- [ ] **Step 3：跑測試確認失敗**

Run: `npx vitest run src/tests/enrich/buildImageRow.spec.ts`
Expected: FAIL（找不到 `buildImageRow`）。

- [ ] **Step 4：建立 `scripts/enrich/buildImageRow.ts`**

```ts
import type { ClassificationResult } from './classify';
import type { GalleryMeta, ImageSource } from './galleryMeta';

export interface ImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[];
  medium: string | null;
  sub_medium: string | null;
  color_palette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needs_review: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

const GALLERY_LABEL: Record<ImageSource, string> = {
  pexels: 'Pexels',
  unsplash: 'Unsplash'
};

export function buildImageRow(
  classification: ClassificationResult,
  palette: string[],
  meta: GalleryMeta
): ImageRow {
  return {
    id: `ext-${meta.source}-${meta.externalId}`,
    url: meta.url,
    title: meta.description || `${classification.styleGroup} inspiration`,
    style_group: classification.styleGroup,
    style: classification.style,
    medium: classification.medium,
    sub_medium: classification.subMedium,
    color_palette: palette,
    source: meta.source,
    attribution: `Photo by ${meta.photographer} / ${GALLERY_LABEL[meta.source]}`,
    confidence: classification.confidence,
    needs_review: classification.needsReview
  };
}
```

- [ ] **Step 5：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/enrich/buildImageRow.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 6：I/O 轉接層（CLIP / 取色 / Pexels / Unsplash）

> 這四個是薄轉接層，碰外部模型/網路、非確定性，**不寫單元測試**，靠 Task 8 手動整合驗證。每段都給完整程式碼。

**Files:**
- Create: `scripts/enrich/clipScorer.ts`
- Create: `scripts/enrich/colorPalette.ts`
- Create: `scripts/enrich/pexelsClient.ts`
- Create: `scripts/enrich/unsplashClient.ts`

- [ ] **Step 1：`scripts/enrich/clipScorer.ts`**

```ts
import { pipeline } from '@huggingface/transformers';
import type { Scorer, ScoredLabel } from './scorer';

// 首次呼叫會下載模型權重（約數百 MB），之後離線可用。
export async function createClipScorer(model = 'Xenova/clip-vit-base-patch32'): Promise<Scorer> {
  const classifier = await pipeline('zero-shot-image-classification', model);

  return {
    async classify(imageRef: string, labels: string[]): Promise<ScoredLabel[]> {
      const output = (await classifier(imageRef, labels)) as Array<{
        label: string;
        score: number;
      }>;
      return [...output].sort((a, b) => b.score - a.score);
    }
  };
}
```

- [ ] **Step 2：`scripts/enrich/colorPalette.ts`**

```ts
import { Vibrant } from 'node-vibrant/node';

// 取主色 → hex 陣列，依族群人口數由多到少。
export async function extractPalette(imageRef: string, max = 3): Promise<string[]> {
  const palette = await Vibrant.from(imageRef).getPalette();

  return Object.values(palette)
    .filter((swatch): swatch is NonNullable<typeof swatch> => swatch !== null)
    .sort((a, b) => b.population - a.population)
    .slice(0, max)
    .map((swatch) => swatch.hex);
}
```

- [ ] **Step 3：`scripts/enrich/pexelsClient.ts`**

```ts
import type { GalleryMeta } from './galleryMeta';

const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

interface PexelsPhoto {
  id: number;
  alt: string | null;
  photographer: string | null;
  src: { large: string };
}

// 需要環境變數 PEXELS_API_KEY（Pexels 免費申請）。
export async function searchPexels(query: string, perPage = 15): Promise<GalleryMeta[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY 未設定');
  }

  const url = `${PEXELS_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    throw new Error(`Pexels API 失敗：${response.status}`);
  }

  const data = (await response.json()) as { photos: PexelsPhoto[] };
  return data.photos.map((photo) => ({
    source: 'pexels' as const,
    externalId: String(photo.id),
    url: photo.src.large,
    description: photo.alt ?? '',
    photographer: photo.photographer ?? 'Unknown'
  }));
}
```

- [ ] **Step 4：`scripts/enrich/unsplashClient.ts`**

```ts
import type { GalleryMeta } from './galleryMeta';

const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

interface UnsplashPhoto {
  id: string;
  alt_description: string | null;
  user: { name: string };
  urls: { regular: string };
}

// 需要環境變數 UNSPLASH_ACCESS_KEY（Unsplash Developers 免費申請）。
export async function searchUnsplash(query: string, perPage = 15): Promise<GalleryMeta[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY 未設定');
  }

  const url = `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` }
  });
  if (!response.ok) {
    throw new Error(`Unsplash API 失敗：${response.status}`);
  }

  const data = (await response.json()) as { results: UnsplashPhoto[] };
  return data.results.map((photo) => ({
    source: 'unsplash' as const,
    externalId: photo.id,
    url: photo.urls.regular,
    description: photo.alt_description ?? '',
    photographer: photo.user.name
  }));
}
```

- [ ] **Step 5：lint**

Run: `npm run lint`
Expected: 0 error。

---

## Task 7：Postgres 寫入層 `dbWriter.ts`

> 同樣是薄 I/O 層，不單元測試。

**Files:**
- Create: `scripts/enrich/dbWriter.ts`

- [ ] **Step 1：`scripts/enrich/dbWriter.ts`**

```ts
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
```

- [ ] **Step 2：lint**

Run: `npm run lint`
Expected: 0 error。

---

## Task 8：CLI 進入點 + 手動整合驗證 + 門檻校準

**Files:**
- Create: `scripts/enrich/index.ts`

- [ ] **Step 1：`scripts/enrich/index.ts`**

```ts
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
```

- [ ] **Step 2：設定環境變數並試跑**

Run（PowerShell，先確認 `scripts/schema.sql` 已跑過、`.env` 已填好 `PEXELS_API_KEY`/`UNSPLASH_ACCESS_KEY`/`DATABASE_URL`）：

```powershell
npx tsx scripts/enrich/index.ts
```

Expected: 依序印出 9 組各撈完幾張，最後印出分類分佈與 `needsReview` 筆數，且 `images` 表有約 270 筆資料（`psql $env:DATABASE_URL -c "SELECT count(*) FROM images;"`）。首次執行會花時間下載 CLIP 模型權重。

- [ ] **Step 3：門檻校準**

- 觀察輸出的分類分佈與 `needsReview` 比例。
- 若某層大量落在門檻邊緣、誤判多 → 調 `scripts/enrich/taxonomy.ts` 的 `THRESHOLDS`。
- 改完門檻後重跑前先清空表（`TRUNCATE images;`），因為 `dbWriter.ts` 用 `ON CONFLICT DO NOTHING`，同 id 不會被新分類結果覆蓋。
- 重跑 Step 2 直到 `needsReview` 標記的比例合理。

- [ ] **Step 4：全測試 + lint 收尾**

Run: `npm run test && npm run lint`
Expected: 全 PASS、lint 0 error。

---

## Task 9：Express API（TDD transform + 整合驗證）

**Files:**
- Create: `server/transform.ts`
- Create: `server/db.ts`
- Create: `server/routes/images.ts`
- Create: `server/index.ts`
- Test: `src/tests/server/transform.spec.ts`

- [ ] **Step 1：寫失敗測試 `src/tests/server/transform.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { toStyleImage } from '../../../server/transform';
import type { ImageRow } from '../../../server/transform';

const row: ImageRow = {
  id: 'ext-pexels-1',
  url: 'https://images.pexels.com/photos/1.jpg',
  title: 'shiny chrome bubble',
  style_group: 'Y2K & Internet Aesthetics',
  style: ['Y2K', 'Chrome Design'],
  medium: 'Graphic Design',
  sub_medium: 'Poster Design',
  color_palette: ['#8EC9FF', '#B9A8F3'],
  source: 'pexels',
  attribution: 'Photo by Jane Doe / Pexels',
  confidence: { styleGroup: 0.31, medium: 0.28, subMedium: 0.19 },
  needs_review: { styleGroup: false, medium: false, subMedium: true },
  created_at: '2026-06-16T00:00:00.000Z'
};

describe('toStyleImage', () => {
  it('把 snake_case 的 DB row 轉成前端 StyleImage 形狀（camelCase）', () => {
    const image = toStyleImage(row);

    expect(image.styleGroup).toBe('Y2K & Internet Aesthetics');
    expect(image.subMedium).toBe('Poster Design');
    expect(image.needsReview.subMedium).toBe(true);
    expect(image.colorPalette).toEqual(['#8EC9FF', '#B9A8F3']);
  });

  it('medium/sub_medium 為 null 時轉成 undefined（對齊 StyleImage 的 optional 欄位）', () => {
    const image = toStyleImage({ ...row, medium: null, sub_medium: null });

    expect(image.medium).toBeUndefined();
    expect(image.subMedium).toBeUndefined();
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/server/transform.spec.ts`
Expected: FAIL（找不到模組 `server/transform`）。

- [ ] **Step 3：建立 `server/transform.ts`**

```ts
export interface ImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[];
  medium: string | null;
  sub_medium: string | null;
  color_palette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needs_review: { styleGroup: boolean; medium: boolean; subMedium: boolean };
  created_at: string;
}

export interface DemoStyleImage {
  id: string;
  url: string;
  title: string;
  styleGroup: string;
  style: string[];
  medium?: string;
  subMedium?: string;
  colorPalette: string[];
  source: string;
  attribution: string;
  confidence: { styleGroup: number; medium: number; subMedium: number | null };
  needsReview: { styleGroup: boolean; medium: boolean; subMedium: boolean };
}

export function toStyleImage(row: ImageRow): DemoStyleImage {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    styleGroup: row.style_group,
    style: row.style,
    medium: row.medium ?? undefined,
    subMedium: row.sub_medium ?? undefined,
    colorPalette: row.color_palette,
    source: row.source,
    attribution: row.attribution,
    confidence: row.confidence,
    needsReview: row.needs_review
  };
}
```

- [ ] **Step 4：跑測試確認通過**

Run: `npx vitest run src/tests/server/transform.spec.ts`
Expected: PASS。

- [ ] **Step 5：建立 `server/db.ts`**

```ts
import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

- [ ] **Step 6：建立 `server/routes/images.ts`**

```ts
import { Router } from 'express';
import { pool } from '../db';
import { toStyleImage } from '../transform';
import type { ImageRow } from '../transform';

export const imagesRouter = Router();

imagesRouter.get('/api/images', async (_req, res) => {
  const { rows } = await pool.query<ImageRow>('SELECT * FROM images');
  res.json(rows.map(toStyleImage));
});
```

- [ ] **Step 7：建立 `server/index.ts`**

```ts
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { imagesRouter } from './routes/images';

const app = express();
const PORT = process.env.SERVER_PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use(imagesRouter);

app.listen(PORT, () => {
  console.log(`Demo API listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 8：手動整合驗證**

Run（先確保 Task 8 已把資料灌進 `images` 表）：
```bash
npm run server
```
另開一個終端機：
```bash
curl http://localhost:3001/api/images
```
Expected: 回傳一個 JSON 陣列，每筆物件有 `styleGroup`/`subMedium`/`needsReview` 等 camelCase 欄位，數量約 270。

- [ ] **Step 9：全測試 + lint**

Run: `npm run test && npm run lint`
Expected: 全 PASS、lint 0 error。

---

## Task 10：Vite dev server proxy

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1：加上 `/api` proxy**

把：
```ts
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```
改成：
```ts
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 2：跑既有測試確認沒壞**

Run: `npm run test`
Expected: 全 PASS（這步只影響 dev server，不影響 Vitest）。

---

## Task 11：`image.api.ts` 改打真實 API（TDD）

**Files:**
- Modify: `src/api/image.api.ts`
- Modify: `src/tests/image.api.spec.ts`

- [ ] **Step 1：把測試改成 mock `httpClient`（取代舊的「跟本地 JSON 比對」假設）**

把 `src/tests/image.api.spec.ts` 整個檔案改成：

```ts
import { describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/api/httpClient';
import { fetchImagesApi } from '@/api/image.api';

vi.mock('@/api/httpClient', () => ({
  httpClient: { get: vi.fn() }
}));

describe('image.api', () => {
  it('fetches images from the demo API and wraps them in the ApiResponse contract', async () => {
    const mockImages = [
      {
        id: 'ext-pexels-1',
        url: 'https://images.pexels.com/photos/1.jpg',
        title: 'shiny chrome bubble',
        styleGroup: 'Y2K & Internet Aesthetics',
        style: ['Y2K'],
        colorPalette: ['#8EC9FF']
      }
    ];
    vi.mocked(httpClient.get).mockResolvedValue({ data: mockImages });

    const response = await fetchImagesApi();

    expect(httpClient.get).toHaveBeenCalledWith('/api/images');
    expect(response.data).toEqual(mockImages);
    expect(response.meta.timestamp).toEqual(expect.any(String));
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/image.api.spec.ts`
Expected: FAIL（`fetchImagesApi` 目前還是回傳本地 mock 資料，`httpClient.get` 沒被呼叫）。

- [ ] **Step 3：把 `src/api/image.api.ts` 改成**

```ts
import { httpClient } from '@/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { StyleImage } from '@/types/image';

export async function fetchImagesApi(): Promise<ApiResponse<StyleImage[]>> {
  const response = await httpClient.get<StyleImage[]>('/api/images');

  return {
    data: response.data,
    meta: { timestamp: new Date().toISOString() }
  };
}
```

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/image.api.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 12：`image.service.ts` 改成 async（TDD）

**Files:**
- Modify: `src/services/image.service.ts`
- Modify: `src/tests/image.service.spec.ts`

- [ ] **Step 1：把測試改成 mock `@/api/image.api`，並把每個呼叫加上 `await`**

把 `src/tests/image.service.spec.ts` 整個檔案改成：

```ts
import { describe, expect, it, vi } from 'vitest';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));

import {
  getHomeInspirationImages,
  getImageById,
  getRelatedImages
} from '@/services/image.service';

describe('image.service', () => {
  it('finds an image by id and returns undefined for unknown ids', async () => {
    expect((await getImageById('y2k-main-001'))?.id).toBe('y2k-main-001');
    expect(await getImageById('missing-image')).toBeUndefined();
  });

  it('returns five home inspiration images led by every style group', async () => {
    const images = await getHomeInspirationImages({ random: () => 0 });
    const styleGroups = images.map((image) => image.styleGroup);

    expect(images).toHaveLength(5);
    expect(new Set(styleGroups.slice(0, 3))).toEqual(
      new Set([
        'Y2K & Internet Aesthetics',
        'Future Tech & Digital Psychedelia',
        'Decorative & Opulent Art'
      ])
    );
    expect(images[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        src: expect.stringContaining('/style-image/'),
        alt: expect.any(String),
        styleGroup: expect.any(String)
      })
    );
  });

  it('returns related images from the same style group without current or visited images', async () => {
    const relatedImages = await getRelatedImages('y2k-main-001', {
      visitedImageIds: ['y2k-graphic-001']
    });

    expect(relatedImages).toHaveLength(4);
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-main-001');
    expect(relatedImages.map((image) => image.id)).not.toContain('y2k-graphic-001');
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });

  it('does not fill related images from another style group', async () => {
    const relatedImages = await getRelatedImages('y2k-main-001', {
      limit: 50
    });

    expect(relatedImages).toHaveLength(19);
    expect(relatedImages.every((image) => image.styleGroup === 'Y2K & Internet Aesthetics')).toBe(
      true
    );
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/image.service.spec.ts`
Expected: FAIL（目前函式是同步的，回傳值不是 Promise，`await` 在現有實作下不會報錯但下一步的實作改動才是重點——先確認失敗是因為 mock 的 `@/api/image.api` 還沒被用到，實際資料來源仍是直接 import 的 `style-data.json`，這本來就會通過；真正會讓人確認「改動有生效」的方式是接著做 Step 3 後重跑，並順手跑一次 `npx vitest run src/tests/image.service.spec.ts --reporter=verbose` 確認測試確實呼叫了 mock）。

> 註：因為原始實作恰好也會讓這份新測試碼通過（資料來源相同），這一步主要是確認語法正確、mock 有正確掛上；下一步把實作換成走 `fetchImagesApi()` 後，再次執行同一份測試確認仍然 PASS，即代表新資料流接好了。

- [ ] **Step 3：把 `src/services/image.service.ts` 改成**

```ts
import { fetchImagesApi } from '@/api/image.api';
import type { HomeInspirationImage, ImageSpreadNode, StyleImage } from '@/types/image';

interface RelatedImageOptions {
  limit?: number;
  visitedImageIds?: string[];
}

interface HomeInspirationOptions {
  random?: () => number;
}

const DEFAULT_RELATED_LIMIT = 4;
const HOME_INSPIRATION_LIMIT = 5;

let cachedImagesPromise: Promise<StyleImage[]> | null = null;

function loadImages(): Promise<StyleImage[]> {
  if (!cachedImagesPromise) {
    cachedImagesPromise = fetchImagesApi().then((response) => response.data);
  }

  return cachedImagesPromise;
}

function toSpreadNode(image: StyleImage): ImageSpreadNode {
  return {
    id: image.id,
    src: image.url,
    alt: image.title || image.style.join(', '),
    title: image.title,
    styleGroup: image.styleGroup,
    style: image.style,
    medium: image.medium,
    subMedium: image.subMedium,
    colorPalette: image.colorPalette
  };
}

function countSharedStyles(baseImage: StyleImage, candidate: StyleImage): number {
  const baseStyles = new Set(baseImage.style);

  return candidate.style.filter((style) => baseStyles.has(style)).length;
}

function toHomeInspirationImage(image: StyleImage): HomeInspirationImage {
  return {
    id: image.id,
    src: image.url,
    alt: image.title || image.style.join(', '),
    styleGroup: image.styleGroup
  };
}

function getFirstImagesByStyleGroup(styleImages: StyleImage[]): StyleImage[] {
  const groups = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (!groups.has(image.styleGroup)) {
      groups.set(image.styleGroup, image);
    }
  }

  return [...groups.values()];
}

function getFirstImagesByStyle(styleImages: StyleImage[], excludedImageIds: Set<string>): StyleImage[] {
  const styles = new Map<string, StyleImage>();

  for (const image of styleImages) {
    if (excludedImageIds.has(image.id)) {
      continue;
    }

    for (const style of image.style) {
      if (!styles.has(style)) {
        styles.set(style, image);
      }
    }
  }

  return [...new Map([...styles.values()].map((image) => [image.id, image])).values()];
}

function pickRandomImages(
  candidates: StyleImage[],
  count: number,
  random: () => number
): StyleImage[] {
  const pool = [...candidates];
  const selectedImages: StyleImage[] = [];

  while (pool.length > 0 && selectedImages.length < count) {
    const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
    const [image] = pool.splice(index, 1);
    selectedImages.push(image);
  }

  return selectedImages;
}

export async function getImageById(imageId: string): Promise<ImageSpreadNode | undefined> {
  const styleImages = await loadImages();
  const image = styleImages.find((item) => item.id === imageId);

  return image ? toSpreadNode(image) : undefined;
}

export async function getRelatedImages(
  imageId: string,
  options: RelatedImageOptions = {}
): Promise<ImageSpreadNode[]> {
  const styleImages = await loadImages();
  const baseImage = styleImages.find((item) => item.id === imageId);

  if (!baseImage) {
    return [];
  }

  const limit = options.limit ?? DEFAULT_RELATED_LIMIT;
  const excludedIds = new Set([imageId, ...(options.visitedImageIds ?? [])]);
  const candidates = styleImages.filter((image) => !excludedIds.has(image.id));
  const sameGroupImages = candidates
    .filter((image) => image.styleGroup === baseImage.styleGroup)
    .sort(
      (first, second) => countSharedStyles(baseImage, second) - countSharedStyles(baseImage, first)
    );

  return sameGroupImages.slice(0, limit).map(toSpreadNode);
}

export async function getHomeInspirationImages(
  options: HomeInspirationOptions = {}
): Promise<HomeInspirationImage[]> {
  const styleImages = await loadImages();
  const random = options.random ?? Math.random;
  const groupLeadImages = getFirstImagesByStyleGroup(styleImages);

  if (groupLeadImages.length >= HOME_INSPIRATION_LIMIT) {
    return groupLeadImages.slice(0, HOME_INSPIRATION_LIMIT).map(toHomeInspirationImage);
  }

  const selectedIds = new Set(groupLeadImages.map((image) => image.id));
  const fillerImages = pickRandomImages(
    getFirstImagesByStyle(styleImages, selectedIds),
    HOME_INSPIRATION_LIMIT - groupLeadImages.length,
    random
  );

  return [...groupLeadImages, ...fillerImages]
    .slice(0, HOME_INSPIRATION_LIMIT)
    .map(toHomeInspirationImage);
}
```

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/image.service.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 13：`ImageSpread.vue` 改成 async 呼叫

**Files:**
- Modify: `src/pages/ImageSpread.vue`
- Modify: `src/tests/ImageSpread.spec.ts`

- [ ] **Step 1：把 `src/tests/ImageSpread.spec.ts` 加上 mock 和 flushPromises**

在檔案最上方（`import { flushPromises, mount } from '@vue/test-utils';` 之後）加入：

```ts
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));
```

把 `mountImageSpread` 改成：

```ts
async function mountImageSpread(imageId = 'y2k-main-001') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread }
    ]
  });
  const push = vi.spyOn(router, 'push');

  router.push(`/images/${imageId}/spread`);
  await router.isReady();

  const wrapper = mount(ImageSpread, {
    global: {
      plugins: [router],
      stubs: {
        ConstellationBackground: true
      }
    }
  });
  await flushPromises();

  return { wrapper, push, router };
}
```

把第三個測試（"moves a related image to the center..."）裡的：
```ts
const routeImage = getImageById(Array.isArray(routeImageId) ? routeImageId[0] : routeImageId);
```
改成：
```ts
const routeImage = await getImageById(Array.isArray(routeImageId) ? routeImageId[0] : routeImageId);
```
同樣的修改也套用到第五個測試（"returns to the previous spread layer..."）裡相同的那一行。

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/ImageSpread.spec.ts`
Expected: FAIL（`await getImageById(...)` 在目前同步實作下沒問題，但 `getRelatedImages`/`getImageById` 還沒透過 mock 的 API 取資料，且元件內部呼叫還是同步——這一步主要先確認測試檔案本身語法/型別正確；真正驗證點落在 Step 4）。

- [ ] **Step 3：把 `src/pages/ImageSpread.vue` 的 `<script setup>` 改成**

```ts
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageSpreadOverlay from '@/components/feature/image/ImageSpreadOverlay.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import Button from '@/components/ui/Button.vue';
import { getImageById, getRelatedImages } from '@/services/image.service';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();

const centerImage = ref<ImageSpreadNode | undefined>();
const rootImage = ref<ImageSpreadNode | undefined>();
const relatedImages = ref<ImageSpreadNode[]>([]);
const visitedImageIds = ref<string[]>([]);
const spreadDepth = ref(0);
let syncedRouteImageId: string | undefined;

const routeImageId = computed(() => {
  const rawImageId = route.params.imageId;

  return Array.isArray(rawImageId) ? rawImageId[0] : rawImageId;
});

async function refreshRelatedImages(imageId: string) {
  relatedImages.value = await getRelatedImages(imageId, {
    visitedImageIds: visitedImageIds.value
  });
}

async function loadImageSpread(imageId: string | undefined) {
  if (!imageId) {
    centerImage.value = undefined;
    rootImage.value = undefined;
    relatedImages.value = [];
    visitedImageIds.value = [];
    spreadDepth.value = 0;
    return;
  }

  const image = await getImageById(imageId);
  centerImage.value = image;
  rootImage.value = image;
  relatedImages.value = [];
  visitedImageIds.value = image ? [image.id] : [];
  spreadDepth.value = 0;

  if (image) {
    await refreshRelatedImages(image.id);
  }
}

function syncSpreadRoute(imageId: string) {
  if (routeImageId.value === imageId) {
    return;
  }

  syncedRouteImageId = imageId;
  void router
    .replace({
      name: 'image-spread',
      params: { imageId }
    })
    .catch(() => {
      if (syncedRouteImageId === imageId) {
        syncedRouteImageId = undefined;
      }
    });
}

function returnToPreviousLayer() {
  if (spreadDepth.value > 0 && rootImage.value) {
    centerImage.value = rootImage.value;
    visitedImageIds.value = [rootImage.value.id];
    spreadDepth.value = 0;
    void refreshRelatedImages(rootImage.value.id);
    syncSpreadRoute(rootImage.value.id);
    return;
  }

  router.back();
}

function handleRelatedSelect(image: ImageSpreadNode) {
  if (spreadDepth.value >= 1) {
    void router.push({ path: `/images/${image.id}` });
    return;
  }

  centerImage.value = image;
  visitedImageIds.value = [...visitedImageIds.value, image.id];
  spreadDepth.value = 1;
  void refreshRelatedImages(image.id);
  syncSpreadRoute(image.id);
}

watch(
  routeImageId,
  (imageId) => {
    if (imageId && syncedRouteImageId === imageId) {
      syncedRouteImageId = undefined;
      return;
    }

    void loadImageSpread(imageId);
  },
  { immediate: true }
);
```

（`<template>` 和 `<style scoped>` 區塊維持原樣不動。）

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/ImageSpread.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

---

## Task 14：`Home.vue` 改成 async 呼叫

**Files:**
- Modify: `src/pages/Home.vue`
- Modify: `src/tests/Home.spec.ts`

- [ ] **Step 1：在 `src/tests/Home.spec.ts` 加上 mock 和 flushPromises**

在檔案最上方（`import type { HomeInspirationImage } from '@/types/image';` 之後）加入：

```ts
import { flushPromises } from '@vue/test-utils';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));
```

在 `'routes clicked inspiration images to the image spread page'` 測試裡，`mount(...)` 之後、`await wrapper.find(...).trigger('click')` 之前加一行：
```ts
await flushPromises();
```

在 `'passes grouped home inspiration entry points to the floating network'` 測試裡，`mount(...)` 之後、`const floatingNetwork = ...` 之前加一行：
```ts
await flushPromises();
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/Home.spec.ts`
Expected: FAIL（目前 `Home.vue` 仍是同步載入，`getHomeInspirationImages()` 回傳的還不是 Promise，因此元件目前的 prop 仍是陣列而非空陣列——這一步確認測試檔案語法正確；下一步改完元件後，因為資料來源變成 async，若沒加 `flushPromises()` 的兩個案例會在 Step 4 前先觀察到圖片陣列為空，加了之後才會等到 onMounted 內的 Promise resolve）。

- [ ] **Step 3：把 `src/pages/Home.vue` 的 `<script setup>` 改成**

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Lock, MoveDownLeft } from '@lucide/vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import FloatingImageNetwork from '@/components/sections/FloatingImageNetwork';
import { getHomeInspirationImages } from '@/services/image.service';
import type { HomeInspirationImage } from '@/types/image';

const scrollLimitVh = 150;
const router = useRouter();
const isLimitModalOpen = ref(false);
const hasTriggeredLimit = ref(false);
const inspirationImages = ref<HomeInspirationImage[]>([]);

function openLimitModal() {
  if (hasTriggeredLimit.value) {
    return;
  }

  hasTriggeredLimit.value = true;
  isLimitModalOpen.value = true;
}

function handleScrollLimit() {
  if (typeof window === 'undefined') {
    return;
  }

  const limit = window.innerHeight * (scrollLimitVh / 100);
  const viewportBottom = window.scrollY + window.innerHeight;

  if (viewportBottom >= limit) {
    openLimitModal();
  }
}

function startStyleDnaSignUp() {
  void router.push({ name: 'sign-up', query: { next: '/discover-dna' } });
}

function goToLogin() {
  void router.push({ name: 'login' });
}

function openImageSpread(index: number) {
  const image = inspirationImages.value[index];

  if (!image) {
    return;
  }

  void router.push({
    name: 'image-spread',
    params: { imageId: image.id }
  });
}

async function loadInspirationImages() {
  inspirationImages.value = await getHomeInspirationImages();
}

onMounted(() => {
  handleScrollLimit();
  window.addEventListener('scroll', handleScrollLimit, { passive: true });
  void loadInspirationImages();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollLimit);
});
```

（`<template>` 和 `<style scoped>` 區塊維持原樣不動，`<FloatingImageNetwork :images="inspirationImages" ...>` 不用改，因為 Vue 範本裡的 ref 會自動解套。）

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/Home.spec.ts && npm run lint`
Expected: PASS、lint 0 error。

- [ ] **Step 5：全專案測試收尾**

Run: `npm run test && npm run lint`
Expected: 全 PASS、lint 0 error（確認這個 demo 改動沒有波及其他既有測試，例如 `Header`/`Auth` 相關測試）。

---

## Task 15：開發環境文件 + 種子資料 dump + 手動驗收

**Files:**
- Create: `docs/demo-setup.md`

- [ ] **Step 1：建立 `docs/demo-setup.md`**

```markdown
# Issue #22 支線 A Demo 環境設定

對應設計文件：`docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md`

## 路徑 A：從頭跑離線辨識（需要 API key，較久）

1. 啟動本機 PostgreSQL（Docker 或本機安裝）。
2. 建表：
   ```
   psql $DATABASE_URL -f scripts/schema.sql
   ```
3. 複製 `.env.example` 成 `.env`，填入 `PEXELS_API_KEY`、`UNSPLASH_ACCESS_KEY`、`DATABASE_URL`。
4. 跑離線腳本（第一次會下載 CLIP 模型，需要幾分鐘）：
   ```
   npm run enrich:images
   ```
5. 啟動 Express API：
   ```
   npm run server
   ```
6. 啟動前端：
   ```
   npm run dev
   ```
   開 `/images/:imageId`，連續點擊延展體驗。

## 路徑 B：直接灌種子資料（不用申請 API key）

1. 建表（同路徑 A 的 Step 2）。
2. 灌種子資料：
   ```
   psql $DATABASE_URL -f scripts/seed-dump.sql
   ```
3. 接路徑 A 的 Step 5、6。

## 種子資料怎麼來的

`scripts/seed-dump.sql` 是路徑 A 跑完一次之後，用以下指令 dump 出來的：
```
pg_dump --table=images --data-only --inserts $DATABASE_URL > scripts/seed-dump.sql
```
跑完 Task 8 後執行這行指令一次，把產出的 `scripts/seed-dump.sql` 加進 git，組員就可以走路徑 B。
```

- [ ] **Step 2：跑完 Task 8 後，產生種子資料檔**

Run:
```bash
pg_dump --table=images --data-only --inserts $DATABASE_URL > scripts/seed-dump.sql
```
Expected: 產生 `scripts/seed-dump.sql`，內容是約 270 筆 `INSERT INTO images ...` 陳述句。

- [ ] **Step 3：對照 spec §8 驗收標準逐項手動驗證**

- `npm run enrich:images` 成功撈圖、分類、寫入 PostgreSQL，console 印出分類分佈與 needsReview 統計 → 已在 Task 8 驗證。
- `images` 表約 270 筆，9 個 styleGroup 都有覆蓋 → 用 `psql $env:DATABASE_URL -c "SELECT style_group, count(*) FROM images GROUP BY style_group;"` 確認 9 列都有資料。
- `GET /api/images` 回傳形狀對齊 `StyleImage` → 已在 Task 9 Step 8 驗證。
- 連續點擊延展 15-20 次不撈乾 → 開 `npm run dev`，瀏覽器開 `/images/:imageId`，手動連續點擊確認。
- 外部圖卡片顯示 attribution → 確認 `ImageSpreadOverlay.vue`/`RelatedImageCluster.vue` 有沒有顯示 `attribution` 欄位；若目前元件沒有渲染這個欄位，這是既有 UI 元件未涵蓋的顯示需求，記錄下來但不在本計畫範圍內新增 UI（spec §1 已聲明「沿用 develop 既有 UI 元件，不新增畫面」），可在 demo 時口頭補充說明，或另開一個小任務跟進。
- `scripts/seed-dump.sql` 可讓組員不用申請 API key 直接灌資料 → 已在 Step 1、2 完成。

---

## Self-Review（已執行）

- **Spec 覆蓋**：離線腳本 9 組 styleGroup × CLIP 三層分類 + 取色（Task 3-8）、Postgres schema（Task 2）、Express API 全量回傳 + camelCase 轉換（Task 9）、Vite proxy（Task 10）、前端資料來源改 `fetchImagesApi()`、比對邏輯不變（Task 11-12）、`ImageSpread.vue`/`Home.vue` 呼叫端 async 化（Task 13-14）、開發環境文件 + 種子資料 + 驗收標準逐項對照（Task 15）。spec §1「不在範圍」的支線 B、人工審核介面、正式 DB migration 工具均未出現在任何任務中，符合範圍。
- **Placeholder 掃描**：全文無 TBD/TODO；每個程式碼 Step 都附完整程式碼；Task 8/15 的「手動驗證」步驟雖無法寫成自動化測試（牽涉真實外部 API、CLIP 模型、本機 PostgreSQL），但都給了確切指令與預期輸出，不是空泛描述。
- **型別一致性**：`GalleryMeta`/`ImageSource`（`galleryMeta.ts`）→ `pexelsClient.ts`/`unsplashClient.ts`/`buildImageRow.ts` 一致；`ClassificationResult`（`classify.ts`）→ `buildImageRow.ts`/測試一致；`ImageRow`（`buildImageRow.ts`）→ `dbWriter.ts`/`index.ts` 一致；`ImageRow`（`server/transform.ts`，注意這是另一個同名但欄位多了 `created_at` 的型別，分屬離線腳本與 Express 兩個獨立模組，互不 import，故同名不衝突）→ `server/routes/images.ts` 一致；`StyleImage`（`src/types/image.ts`，未修改）→ `image.api.ts`/`image.service.ts` 全程一致。
- **既有測試相容性**：Task 11-14 每一步都先改測試、跑失敗、再改實作、跑通過，並在 Task 14 Step 5 額外跑一次全專案 `npm run test` 確認沒有波及 `Header`/`Auth` 等其他既有測試套件。
- **環境依賴註記**：`scripts/`、`server/` 在 `tsconfig.json` 的 `include`（僅 `src/**/*`）之外，`npm run build`（`vue-tsc -b`）不會檢查這兩個目錄；用 `tsx` 直接執行不需要事先 build。Vitest 透過 Vite 設定解析模組，不受 `tsconfig.json` 的 `include` 限制，因此 `src/tests/enrich/*.spec.ts`、`src/tests/server/*.spec.ts` 可以正常 import 這兩個目錄下的檔案。

---

## 之後（不在本計畫範圍）

完成本計畫後，依使用者指示回頭評估是否要做支線 B（前端 lazy 延展、即時呼叫 Pexels 補圖）。前置設計 `docs/superpowers/specs/2026-06-15-external-image-styleGroup-recognition-design.md` §7 已有完整設計，屆時可直接接續。
