# Issue #22 支線 A Demo：外部圖辨識 + PostgreSQL 種子池 — 設計

**日期:** 2026-06-16
**對應 Issue:** [#22](https://github.com/Asterism0605/Asterism/issues/22)
**基底分支:** `develop`（含已合併的 ImageSpread 實作）
**前置文件:** `docs/superpowers/specs/2026-06-15-external-image-styleGroup-recognition-design.md`（完整兩支線設計）
**文件性質:** demo 實作設計 —— 用可操作的 demo 取代純文字 spec，讓組員直接體驗「同風格延展不撈乾」

---

## 0. 為什麼要做這個 demo

前一份設計文件（2026-06-15）已經把 Issue #22 的完整架構（支線 A 離線辨識 + 支線 B 前端 lazy 延展）寫清楚，但純文字對組員來說難以想像「不撈乾」實際是什麼體驗。

這份文件的目標：**先把支線 A 做成一個組員可以親手操作的 demo**，看到本地 61 張圖會撈乾、而種子池夠大時不會。支線 B（即時 Pexels lazy fallback）**刻意不在這份 demo 範圍內**——做完支線 A 後再評估是否要做。

---

## 1. 範圍

### 這份 demo 要做的事

1. 離線腳本：從 Pexels + Unsplash 撈圖，跑 CLIP 三層分類（styleGroup/medium/subMedium）+ node-vibrant 取色，寫進 PostgreSQL。
2. 一個極簡 Express API，把 PostgreSQL 的資料回傳給前端。
3. 前端 `image.service.ts` 的資料來源從 `style-data.json` 改成 fetch API，**比對邏輯（`getRelatedImages`/`countSharedStyles`）完全不動**。
4. 沿用 develop 既有的 `ImageSpread.vue` 等 UI 元件，不新增畫面。

### 不在這份 demo 範圍內

- 支線 B（前端 lazy 延展、即時呼叫 Pexels 補圖）——做完這份 demo 後再決定要不要做。
- 人工審核介面（列出 needsReview 項目）。
- 正式上線需要的 DB migration 工具、index 規劃、auth、分頁。
- 把資料庫變成正式環境的長期資產——這個 PostgreSQL 庫是**demo 專用、可重建**，不是正式 schema 的定案（雖然欄位設計上有對齊，未來可沿用）。

---

## 2. 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│ 離線腳本（scripts/enrich-images.ts，Node + tsx，開發者本機跑一次） │
│                                                                 │
│  Pexels/Unsplash API 撈圖                                      │
│    → Transformers.js CLIP 三層分類（styleGroup/medium/subMedium）│
│    → node-vibrant 取色                                         │
│    → INSERT 進 PostgreSQL images 表                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Express API（server/，獨立於 Vite dev server）                  │
│                                                                 │
│  GET /api/images  → 回傳 images 表全部資料（對齊 StyleImage[]）  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 前端（沿用 develop 的 ImageSpread.vue 等元件，UI 不改）            │
│                                                                 │
│  image.service.ts：資料來源從 import style-data.json            │
│                     改成 fetch('/api/images')，記憶體快取一次     │
│  比對邏輯（getRelatedImages/countSharedStyles）完全不動           │
└─────────────────────────────────────────────────────────────┘
```

**關鍵原則**：只動「資料從哪來」這一層，UI 和比對邏輯都不碰，把改動面壓到最小，也維持「AI 鎖在離線、使用者操作當下不卡頓」的核心設計。

### 為什麼不會卡頓

- CLIP 分類只發生在離線腳本，使用者操作 demo 時不會觸發。
- 使用者點圖時，是在已抓回的 ~270 筆資料裡做純 JS 陣列比對，跟現在 61 張本地圖的程式碼路徑完全相同。
- 頁面載入時 `fetch('/api/images')` 抓一次全部 metadata（純 JSON，無圖片，毫秒級）。
- 圖片本身是外部圖庫網址，載入屬於一般網路圖片載入，跟 AI 無關。

---

## 3. 資料庫 schema

單一張表 `images`，欄位對齊前置文件 §6 的欄位字典：

```sql
CREATE TABLE images (
  id              TEXT PRIMARY KEY,           -- 'ext-pexels-12345'
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  style_group     TEXT NOT NULL,
  style           TEXT[] NOT NULL DEFAULT '{}',
  medium          TEXT,                       -- nullable
  sub_medium      TEXT,                       -- nullable
  color_palette   TEXT[] NOT NULL DEFAULT '{}',
  source          TEXT NOT NULL,              -- 'pexels' | 'unsplash'
  attribution     TEXT NOT NULL,
  confidence      JSONB NOT NULL,             -- { styleGroup, medium, subMedium }
  needs_review    JSONB NOT NULL,             -- { styleGroup, medium, subMedium }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

設計決定：

- **不正規化**：`style[]`、`colorPalette[]` 用 Postgres 陣列型，`confidence`/`needsReview` 用 jsonb。因為 API 整批撈回前端做比對（見 §5 方案 1），不需要 SQL 層查詢這些欄位，正規化只會增加 join 成本。
- 跟「Explore 頁面 6 張表」資料庫設計（`style_groups`/`tags`/`materials`...）是**不同領域、互不影響**——那是素材照瀏覽用的正式規劃，這裡是 demo 用的 StyleImage 延展池。
- 不建額外 index：demo 資料量小、查詢模式是整批撈取，PK 索引已足夠。

**這是 demo 專用、可重建的資料庫**，不是正式上線的 schema 定案。重跑離線腳本會清空重灌，不需要 migration 管理。欄位設計對齊了前置文件的欄位字典，未來若要正式上線，可以沿用這套結構作為起點，但 index、增量更新、migration 工具等屬於另一輪決定。

---

## 4. 離線腳本（支線 A）

新增 `scripts/enrich-images.ts`，用 `tsx` 直接執行：

```
① 從 Pexels + Unsplash 各撈圖（依 9 個 styleGroup 的關鍵字搜尋，各搜一輪）
② 逐張：
   - CLIP styleGroup 分類（9 個錨點文字，門檻 0.25）
   - CLIP medium 分類（門檻 0.30）
   - CLIP subMedium 分類，限定在該 medium 底下（門檻 0.35）
   - CLIP style[] 多標籤分類（候選池為該 styleGroup 的子風格字）
   - node-vibrant 取色（3 個 hex）
   - 沿用圖庫回傳的 description 當 title
③ 組成對齊 §3 schema 的物件
④ 用 pg 套件 batch INSERT 進 images 表
⑤ console 印出分類分佈 + needsReview 統計，供之後校準門檻
```

### CLIP styleGroup 錨點（9 組，取代前置文件僅 3 組的版本）

```ts
const STYLE_GROUP_ANCHORS = {
  'Future Tech & Digital Psychedelia': 'cyberpunk futurism glitch art techwear neo-tokyo',
  'Y2K & Internet Aesthetics': 'Y2K frutiger aero McBling chrome design bubblegum futurism',
  'Decorative & Opulent Art': 'art deco baroque rococo maximalism ornate luxury',
  'Minimal & Structured Modern': 'minimalism quiet luxury scandinavian modernism swiss design',
  'Earth & Organic Humanism': 'wabi-sabi japandi biophilic design organic modern',
  'Romantic & Pastoral Living': 'cottagecore romanticism grandmillennial vintage floral',
  'Retro & Nostalgia': 'vintage retro mid-century modern americana',
  'Experimental & Avant-Garde': 'brutalism anti-design deconstructivism avant-garde experimental typography',
  'Street & Youth Culture': 'streetwear hypebeast graffiti urban contemporary skate culture',
};
```

每組的 `style[]` 候選清單對應使用者提供的 9 組子風格陣列（共約 40 個子風格字）。

### 規模

**9 組 × 每組 30 張 = 270 張**，Pexels / Unsplash 各半（確保兩種來源的 attribution 格式都被測到）。

### 依賴

`@huggingface/transformers`（CLIP，JS 版）、`node-vibrant`（取色）、`pg`（寫入 Postgres）、`tsx`（執行 TS 腳本）。全部 JS/TS 生態，不碰 Python。

### 環境變數（`.env`，不進 git）

```
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
DATABASE_URL=postgres://...
```

### 執行方式

`npm run enrich:images`——一次性，重跑會清空重灌，demo 階段不考慮去重增量。第一次跑會自動下載 CLIP 模型權重（約數百 MB），需要幾分鐘。

---

## 5. Express API

新增 `server/` 資料夾，獨立於 Vite：

```
server/
  index.ts          — Express app，掛 CORS + JSON middleware
  db.ts             — pg Pool，讀 DATABASE_URL
  routes/images.ts  — GET /api/images
```

```ts
// routes/images.ts
router.get('/api/images', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM images');
  res.json(rows.map(toStyleImage)); // snake_case → camelCase 轉換
});
```

- `toStyleImage()` 把 `style_group`→`styleGroup`、`sub_medium`→`subMedium`、`needs_review`→`needsReview` 等轉換，輸出形狀對齊前端 `StyleImage` 型別。
- Vite dev server 設 proxy，把 `/api` 轉發到 Express（例如 `localhost:3001`）。開發時 `npm run dev` + `npm run server` 兩個一起跑。
- 不做分頁、不做快取、不做 auth——demo 用途不需要。

### 方案選擇記錄

評估過兩種做法：

| | 方案 1（採用）：API 全量回傳，沿用既有 JS 比對邏輯 | 方案 2：比對邏輯搬進 SQL，開 `/related` 端點 |
|---|---|---|
| 改動面 | 最小，比對邏輯零改動 | 比對邏輯要在 SQL 和 TS 兩邊各寫一份 |
| 開發時間 | 快 | 慢，且容易兩邊邏輯兜不起來 |
| 適合場景 | demo，證明「換資料來源、邏輯照樣動」 | 正式上線、資料量大到不能整批回傳時 |

採用方案 1，因為這次目的是讓組員看到效果，不是交出正式後端。

---

## 6. 前端整合

只動 `image.service.ts` 的資料來源，UI 元件（`ImageSpread.vue`、`RelatedImageCluster.vue`、`ImageSpreadOverlay.vue`）不改：

```ts
// 之前
import rawStyleImages from '@/data/style-data.json';

// 改成
let cachedImages: StyleImage[] | null = null;
async function loadImages(): Promise<StyleImage[]> {
  if (!cachedImages) {
    const res = await fetch('/api/images');
    cachedImages = await res.json();
  }
  return cachedImages;
}
```

- `getImageById`、`getRelatedImages`、`getHomeInspirationImages` 內部改成先 `await loadImages()` 取陣列，比對邏輯一行不改。
- 原本同步函式變成 async，呼叫端要跟著改成 `await`——這跟之後支線 B 本來就要做的改動（`getRelatedImages` 變 async）是同一個方向，等於提前鋪路。
- 首次進頁面抓一次、記憶體快取，同一個 session 不再重複打 API。
- demo 路由：沿用 develop 既有的 `/images/:imageId`，不另開新路由。

---

## 7. 開發環境設定

```
1. 本機啟動 PostgreSQL（Docker 或本機安裝）
2. 建表：psql -f scripts/schema.sql
3. 填 .env：PEXELS_API_KEY / UNSPLASH_ACCESS_KEY / DATABASE_URL
4. npm run enrich:images   ← 跑一次離線腳本，灌 270 張進 DB
5. npm run server          ← 啟動 Express API
6. npm run dev             ← 啟動前端，開 /images/:imageId 體驗
```

步驟 4 較久且需要 API key，因此額外提供 `scripts/seed-dump.sql`（跑完一次後 dump 出的種子資料），組員可以 `psql -f scripts/seed-dump.sql` 直接灌資料，不用申請 key、不用重跑 CLIP。README 會寫清楚兩條路徑。

---

## 8. 驗收標準

- [ ] `npm run enrich:images` 能成功從 Pexels + Unsplash 撈圖、跑完三層 CLIP 分類、寫進 PostgreSQL，console 印出分類分佈與 needsReview 統計
- [ ] `images` 表有約 270 筆資料，9 個 styleGroup 都有覆蓋
- [ ] `GET /api/images` 回傳的形狀跟前端 `StyleImage` 型別吻合，欄位命名正確轉換為 camelCase
- [ ] 打開 `/images/:imageId`，連續點擊輻射延展 15-20 次以上不會撈乾（對照現在 61 張版本，點幾次就會撈乾）
- [ ] 外部圖卡片上顯示 attribution
- [ ] `scripts/seed-dump.sql` 可讓組員不申請 API key 直接灌資料

---

## 9. 給組員看的 demo 腳本

1. 先開現有 61 張版本，點幾次讓組員親眼看到「撈乾」的瞬間。
2. 切到 demo 版本，同樣動作，連續點，池子明顯撐很久。
3. 順手點開一張 `needsReview` 的圖，講解信心分數低於門檻的意思，帶到「之後要做人工審核介面」的後續規劃。

---

## 10. 後續

完成這份 demo 後，回頭評估是否要做**支線 B**（前端 lazy 延展、即時呼叫 Pexels 補圖，做到理論上真正不撈乾）——前置文件 §7 已有完整設計，屆時直接接續即可。

---

## 11. 分支與檔案搬移

- 從 `develop` 切新分支（例如 `feat/issue22-demo`），取得現成的 `ImageSpread.vue`、`image.service.ts` 等元件。
- 順帶把 Moodboard 相關文件（`docs/superpowers/specs/2026-06-14-moodboard-style-image-design.md` 及相關 notes，目前在 `feat/Moodboard` 分支）一併帶進新分支。
