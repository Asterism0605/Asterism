# 支線 A：外部圖離線 CLIP 辨識腳本 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一支離線 Node/TS 腳本，把外部圖庫（Pexels）的圖辨識成專案的 `ExternalStyleImage` 格式（styleGroup / medium / subMedium 三層分類 + 每層信心 + needsReview + 取色 + attribution）。

**Architecture:** 把「分類編排邏輯」（純函式、確定性、用假 scorer 做 TDD）和「I/O 轉接層」（CLIP、取色、Pexels —— 非確定性、只手動/整合驗證）分開。可成長的分類清單放 `taxonomy.ts`。CLI 進入點把各層接起來。

**Tech Stack:** TypeScript、vitest、`@huggingface/transformers`（JS 版 CLIP）、`node-vibrant`、Pexels API、`tsx`（跑 TS 腳本）。

> **本計畫不 commit、不 push**（使用者指示）。原本各任務最後的「Commit」步驟一律改為「跑 lint + 測試，綠燈即視為完成」。

---

## 對應 Spec

`docs/superpowers/specs/2026-06-15-external-image-styleGroup-recognition-design.md`（支線 A 部分；支線 B 前端延展另立計畫）。

## 測試/指令環境（實測）

- 測試：`npm run test`（= `vitest run`）；單檔：`npx vitest run <path>`
- Lint：`npm run lint`（eslint --fix）
- 既有測試放 `src/tests/*.spec.ts`，用 vitest。

## File Structure

| 檔案                                  | 責任                                                                                 | 動作   |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| `src/types/image.ts`                  | 加 `ImageSource` / `ClassificationConfidence` / `ReviewFlags` / `ExternalStyleImage` | Modify |
| `scripts/enrich/taxonomy.ts`          | 可成長的分類清單：styleGroup 錨點、medium、subMedium-by-medium、style 字庫、門檻     | Create |
| `scripts/enrich/scorer.ts`            | `Scorer` 介面（zero-shot 分類抽象，方便測試替身）                                    | Create |
| `scripts/enrich/classify.ts`          | **純編排**：三層分類 + style[] + 信心 + needsReview                                  | Create |
| `scripts/enrich/buildEntry.ts`        | 把分類結果 + 色票 + 圖庫 meta 組成 `ExternalStyleImage`                              | Create |
| `scripts/enrich/clipScorer.ts`        | Transformers.js 轉接，實作 `Scorer`（薄、不單元測）                                  | Create |
| `scripts/enrich/colorPalette.ts`      | node-vibrant 取色 → `string[]` hex（薄）                                             | Create |
| `scripts/enrich/pexelsClient.ts`      | 查 Pexels → `GalleryMeta[]`（薄）                                                    | Create |
| `scripts/enrich/index.ts`             | CLI 進入點，串起以上                                                                 | Create |
| `src/tests/enrich/classify.spec.ts`   | classify 純邏輯測試                                                                  | Test   |
| `src/tests/enrich/buildEntry.spec.ts` | buildEntry 組裝測試                                                                  | Test   |

---

## Task 1：安裝依賴 + 加型別 + 分類清單

**Files:**

- Modify: `src/types/image.ts`
- Create: `scripts/enrich/taxonomy.ts`
- Test: `src/tests/enrich/taxonomy.spec.ts`

- [ ] **Step 1：安裝依賴**

Run:

```bash
npm install @huggingface/transformers node-vibrant
npm install -D tsx
```

Expected: 三個套件寫入 package.json。

- [ ] **Step 2：擴充型別 `src/types/image.ts`（在檔尾 append）**

```ts
export type ImageSource = 'pexels' | 'unsplash';

export interface ClassificationConfidence {
  styleGroup: number;
  medium: number;
  subMedium: number | null;
}

export interface ReviewFlags {
  styleGroup: boolean;
  medium: boolean;
  subMedium: boolean;
}

// 外部圖在現有 StyleImage 上擴充來源、出處、信心、審核旗標。
// 既有讀 style-data.json 的程式碼不受影響（新欄位皆為外部圖才有）。
export interface ExternalStyleImage extends StyleImage {
  source: ImageSource;
  attribution: string;
  confidence: ClassificationConfidence;
  needsReview: ReviewFlags;
}
```

- [ ] **Step 3：寫失敗測試 `src/tests/enrich/taxonomy.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  STYLE_GROUP_ANCHORS,
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  THRESHOLDS
} from '../../../scripts/enrich/taxonomy';

describe('taxonomy', () => {
  it('每個 styleGroup 錨點都有 prompt', () => {
    expect(STYLE_GROUP_ANCHORS.length).toBe(3);
    for (const anchor of STYLE_GROUP_ANCHORS) {
      expect(anchor.styleGroup).toBeTruthy();
      expect(anchor.prompt).toBeTruthy();
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

- [ ] **Step 4：跑測試確認失敗**

Run: `npx vitest run src/tests/enrich/taxonomy.spec.ts`
Expected: FAIL（找不到模組 `scripts/enrich/taxonomy`）。

- [ ] **Step 5：建立 `scripts/enrich/taxonomy.ts`**

```ts
export interface StyleGroupAnchor {
  styleGroup: string;
  prompt: string; // 給 CLIP 比對的英文描述
}

// 可成長的分類清單 —— 新類別由人工審核後加進這些陣列即可。
export const STYLE_GROUP_ANCHORS: StyleGroupAnchor[] = [
  {
    styleGroup: 'Y2K & Internet Aesthetics',
    prompt: 'Y2K chrome bubblegum glossy internet aesthetic, McBling'
  },
  {
    styleGroup: 'Future Tech & Digital Psychedelia',
    prompt: 'futuristic tech, neon cyber, digital psychedelia'
  },
  {
    styleGroup: 'Decorative & Opulent Art',
    prompt: 'decorative opulent baroque ornate luxury gold'
  }
];

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

export const STYLE_VOCAB: string[] = [
  'Y2K',
  'McBling',
  'Chrome Design',
  'Frutiger Aero',
  'Bubblegum Futurism',
  'Neon',
  'Cyberpunk',
  'Baroque',
  'Rococo',
  'Art Deco'
];

export const THRESHOLDS = {
  styleGroup: 0.25,
  medium: 0.3,
  subMedium: 0.35
} as const;

export const STYLE_TOP_K = 4;
```

- [ ] **Step 6：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/enrich/taxonomy.spec.ts && npm run lint`
Expected: PASS、lint 0 error。完成（不 commit）。

---

## Task 2：Scorer 介面 + classify 純編排（TDD）

**Files:**

- Create: `scripts/enrich/scorer.ts`
- Create: `scripts/enrich/classify.ts`
- Test: `src/tests/enrich/classify.spec.ts`

- [ ] **Step 1：建立 `scripts/enrich/scorer.ts`（介面，無邏輯）**

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

const Y2K_PROMPT = STYLE_GROUP_ANCHORS[0].prompt;

describe('classifyImage', () => {
  it('挑出最高分 styleGroup，並把錨點 prompt 對回 styleGroup 名稱', async () => {
    const scorer = fakeScorer({
      [Y2K_PROMPT]: 0.4,
      'Graphic Design': 0.5,
      'Poster Design': 0.6,
      Y2K: 0.6
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

  it('低於門檻的層被標記 needsReview', async () => {
    // styleGroup 0.1 < 0.25 → review；medium 0.5 ≥ 0.3 → 不 review
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
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  STYLE_VOCAB,
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

export async function classifyImage(
  scorer: Scorer,
  imageRef: string
): Promise<ClassificationResult> {
  // 第1層：styleGroup（用錨點 prompt 比，再把 prompt 對回群組名）
  const sgPrompts = STYLE_GROUP_ANCHORS.map((anchor) => anchor.prompt);
  const sgScores = await scorer.classify(imageRef, sgPrompts);
  const topSg = sgScores[0];
  const matchedAnchor = STYLE_GROUP_ANCHORS.find((anchor) => anchor.prompt === topSg.label);
  const styleGroup = matchedAnchor ? matchedAnchor.styleGroup : STYLE_GROUP_ANCHORS[0].styleGroup;
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

  // style[]：多標籤取前 K
  const styleScores = await scorer.classify(imageRef, STYLE_VOCAB);
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
Expected: PASS、lint 0 error。完成（不 commit）。

---

## Task 3：buildEntry 組裝（TDD）

**Files:**

- Create: `scripts/enrich/buildEntry.ts`
- Test: `src/tests/enrich/buildEntry.spec.ts`

- [ ] **Step 1：寫失敗測試 `src/tests/enrich/buildEntry.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildExternalEntry } from '../../../scripts/enrich/buildEntry';
import type { ClassificationResult } from '../../../scripts/enrich/classify';

const classification: ClassificationResult = {
  styleGroup: 'Y2K & Internet Aesthetics',
  medium: 'Graphic Design',
  subMedium: 'Poster Design',
  style: ['Y2K', 'Chrome Design'],
  confidence: { styleGroup: 0.31, medium: 0.28, subMedium: 0.19 },
  needsReview: { styleGroup: false, medium: false, subMedium: true }
};

describe('buildExternalEntry', () => {
  it('組出對齊 ExternalStyleImage 的物件', () => {
    const entry = buildExternalEntry(classification, ['#8EC9FF', '#B9A8F3'], {
      source: 'pexels',
      externalId: '12345',
      url: 'https://images.pexels.com/photos/12345.jpg',
      description: 'shiny chrome bubble',
      photographer: 'Jane Doe'
    });

    expect(entry.id).toBe('ext-pexels-12345');
    expect(entry.title).toBe('shiny chrome bubble');
    expect(entry.attribution).toBe('Photo by Jane Doe / Pexels');
    expect(entry.styleGroup).toBe('Y2K & Internet Aesthetics');
    expect(entry.subMedium).toBe('Poster Design');
    expect(entry.colorPalette).toEqual(['#8EC9FF', '#B9A8F3']);
    expect(entry.needsReview.subMedium).toBe(true);
  });

  it('subMedium 為 null 時，輸出欄位為 undefined（對齊 StyleImage 的 optional）', () => {
    const entry = buildExternalEntry({ ...classification, subMedium: null }, [], {
      source: 'pexels',
      externalId: '1',
      url: 'u',
      description: 'd',
      photographer: 'P'
    });

    expect(entry.subMedium).toBeUndefined();
  });
});
```

- [ ] **Step 2：跑測試確認失敗**

Run: `npx vitest run src/tests/enrich/buildEntry.spec.ts`
Expected: FAIL（找不到 `buildExternalEntry`）。

- [ ] **Step 3：建立 `scripts/enrich/buildEntry.ts`**

```ts
import type { ExternalStyleImage, ImageSource } from '@/types/image';
import type { ClassificationResult } from './classify';

export interface GalleryMeta {
  source: ImageSource;
  externalId: string;
  url: string;
  description: string; // → title
  photographer: string; // → attribution
}

const GALLERY_LABEL: Record<ImageSource, string> = {
  pexels: 'Pexels',
  unsplash: 'Unsplash'
};

export function buildExternalEntry(
  classification: ClassificationResult,
  palette: string[],
  meta: GalleryMeta
): ExternalStyleImage {
  return {
    id: `ext-${meta.source}-${meta.externalId}`,
    url: meta.url,
    title: meta.description,
    styleGroup: classification.styleGroup,
    style: classification.style,
    medium: classification.medium,
    subMedium: classification.subMedium ?? undefined,
    colorPalette: palette,
    source: meta.source,
    attribution: `Photo by ${meta.photographer} / ${GALLERY_LABEL[meta.source]}`,
    confidence: classification.confidence,
    needsReview: classification.needsReview
  };
}
```

- [ ] **Step 4：跑測試確認通過 + lint**

Run: `npx vitest run src/tests/enrich/buildEntry.spec.ts && npm run lint`
Expected: PASS、lint 0 error。完成（不 commit）。

---

## Task 4：I/O 轉接層（CLIP / 取色 / Pexels）

> 這三個是薄轉接層，碰外部模型/網路、非確定性，**不寫單元測試**，靠 Task 5 手動整合驗證。每段都給完整程式碼。

**Files:**

- Create: `scripts/enrich/clipScorer.ts`
- Create: `scripts/enrich/colorPalette.ts`
- Create: `scripts/enrich/pexelsClient.ts`

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
import type { GalleryMeta } from './buildEntry';

const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

interface PexelsPhoto {
  id: number;
  alt: string | null;
  photographer: string | null;
  src: { large: string };
}

// 需要環境變數 PEXELS_API_KEY（Pexels 免費申請）。
export async function searchPexels(query: string, perPage = 10): Promise<GalleryMeta[]> {
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

- [ ] **Step 4：lint**

Run: `npm run lint`
Expected: 0 error。完成（不 commit）。

---

## Task 5：CLI 進入點 + 手動整合驗證 + 門檻校準

**Files:**

- Create: `scripts/enrich/index.ts`

- [ ] **Step 1：`scripts/enrich/index.ts`**

```ts
import { classifyImage } from './classify';
import { buildExternalEntry } from './buildEntry';
import { createClipScorer } from './clipScorer';
import { extractPalette } from './colorPalette';
import { searchPexels } from './pexelsClient';

async function main(): Promise<void> {
  const query = process.argv[2];
  if (!query) {
    console.error('用法：tsx scripts/enrich/index.ts "<pexels 搜尋字>"');
    process.exit(1);
  }

  const scorer = await createClipScorer();
  const candidates = await searchPexels(query);

  const entries = [];
  for (const meta of candidates) {
    const classification = await classifyImage(scorer, meta.url);
    const palette = await extractPalette(meta.url);
    entries.push(buildExternalEntry(classification, palette, meta));
  }

  // 先輸出到 stdout，方便人工審核；確認後再決定併入 style-data.json。
  console.log(JSON.stringify(entries, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2：設定 Pexels 金鑰並試跑**

Run（PowerShell）：

```powershell
$env:PEXELS_API_KEY = "<你的金鑰>"
npx tsx scripts/enrich/index.ts "y2k chrome aesthetic"
```

Expected: 印出一個 JSON 陣列，每筆含 `id`/`styleGroup`/`medium`/`confidence`/`needsReview`/`colorPalette`/`attribution`。首次會花時間下載 CLIP 模型。

- [ ] **Step 3：門檻校準（spec §4.4 的 MVP 產出）**

- 觀察輸出裡各層 `confidence` 的分數分佈。
- 若某層大量落在門檻邊緣、誤判多 → 調 `scripts/enrich/taxonomy.ts` 的 `THRESHOLDS`。
- 重跑 Step 2 直到 `needsReview` 標記的比例合理（明顯該人工看的才被標）。

- [ ] **Step 4：全測試 + lint 收尾**

Run: `npm run test && npm run lint`
Expected: 全 PASS、lint 0 error。完成（不 commit）。

---

## 之後（不在本計畫）

- 把確認過的 entries **併入 `src/data/style-data.json`**（或獨立外部圖檔，對應 spec D5）。
- **支線 B**：擴充 `image.service.ts` 的 `getRelatedImages` 加 async Pexels fallback（另立計畫）。
- 第二階段：批次/去重、人工審核介面、做法 B（Gemini 生成式提名）。

---

## Self-Review（已執行）

- **Spec 覆蓋**：三層分類(Task2)、信心+門檻+needsReview(Task2)、subMedium 限定 medium(Task2)、取色(Task4)、title/attribution(Task3)、可成長清單(Task1 taxonomy)、輸出格式(Task3 + 型別 Task1)、CLI/校準(Task5) 皆有對應任務。支線 B 與「併入 JSON」明列為後續，不在本計畫範圍。
- **Placeholder 掃描**：無 TBD/TODO；每個 code step 都有完整程式碼。
- **型別一致**：`Scorer`/`ScoredLabel`(scorer.ts) → classify/clipScorer 一致；`ClassificationResult`(classify.ts) → buildEntry/測試一致；`GalleryMeta`(buildEntry.ts) → pexelsClient/index 一致；`ExternalStyleImage`/`ImageSource`(types) → buildEntry 一致。
- **註記**：`scripts/` 在 `src/` 之外。若 `npm run build`（vue-tsc）需納入型別檢查，於 `tsconfig` 的 `include` 補 `scripts/**/*`；vitest 跑測試不受影響（透過 vite 解析）。`node-vibrant` 採 v4 的 `node-vibrant/node` 匯入路徑。
