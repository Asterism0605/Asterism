# 外部圖庫圖片 styleGroup 自動辨識與同風格延展 — 設計調查

**日期:** 2026-06-15
**對應 Issue:** [#22](https://github.com/Asterism0605/Asterism/issues/22)
**分支:** feat/Moodboard
**文件性質:** 調查 + 可實作設計（給組員閱讀，記錄「決定了什麼」與「為什麼這樣決定」）

---

## 0. 給組員的三分鐘導讀

我們想把**外部圖庫**（Pexels、Unsplash）的圖，自動接進專案現有的資料格式，並且：

1. 自動判斷每張圖屬於我們哪一個風格分類；
2. 讓 develop 上已實作的「點一張圖 → 周圍輻射出同風格相關圖」探索，**不會因為池子只有 61 張而很快撈乾**。

這份文件最重要的一個觀念，先講在前面：

> **整個系統拆成「兩支獨立的東西」。一支慢、離線、做一次（負責分得準）；一支快、即時、不碰 AI（負責看不完、不卡頓）。**

把這兩件事分開，是整個設計能同時做到「分類準確」又「使用者不卡」的關鍵。下面所有章節都圍繞這個切分展開。

---

## 1. 背景與現況

### 1.1 現有資料格式

來源資料：`src/data/style-data.json`，目前 **61 筆**。每筆長這樣：

```jsonc
{
  "id": "y2k-graphic-001",
  "url": "/style-image/style2-graphic.webp",
  "title": "Cloud9 鍍鉻專輯海報",
  "styleGroup": "Y2K & Internet Aesthetics",
  "style": ["Y2K", "Frutiger Aero", "Chrome Design", "McBling"],
  "medium": "Graphic Design",
  "subMedium": "Editorial Design",
  "colorPalette": ["#8CB9F7", "#B9A8F3", "#E9F5FF"]
}
```

### 1.2 現有的分類維度

| 維度             | 現況                 | 值                                                                                                         |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `styleGroup`     | 3 組                 | `Y2K & Internet Aesthetics`(20) / `Future Tech & Digital Psychedelia`(20) / `Decorative & Opulent Art`(21) |
| `medium`         | 4 類（**目前寫死**） | `Outfit` / `Graphic Design` / `Interior Design` / `Architecture`                                           |
| `subMedium`      | 多種，**可空**       | 例：`Poster Design` / `Editorial Design` / `Branding`…（Architecture、Interior、各組 main 封面照無子分類） |
| `style[]`        | 多標籤               | 子風格字，如 `McBling`、`Chrome Design`                                                                    |
| `colorPalette[]` | 主色                 | 3 個 hex                                                                                                   |

> **重要事實校正**：並非每筆都有 `medium`/`subMedium`。實測 61 筆中，3 筆缺 `medium`（即每組唯一的 `*-main-*` 概念封面照）、15 筆缺 `subMedium`。這與「`subMedium` 本來就設計成可空」「main 封面照性質特殊」是一致的。目前這些值是 demo 階段**人工寫死**的。

### 1.3 目標（未來）

> 之後改成：**圖抓回來時，由 AI 判斷它屬於什麼 `styleGroup` / `medium` / `subMedium`**，而且判斷出來的類別**不一定**落在目前列的那幾個 —— 所以分類清單要能成長，且每一格判斷都要有信心分數與人工審核機制。

### 1.4 現有實作（develop 已合併，本份是接著它做）

Explore 在 develop 上**已經實作**（在 `feat/Moodboard` 分支看不到，但 develop 有）。它叫 **ImageSpread**，相關檔案：

| 檔案                                                   | 角色                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `src/pages/ImageSpread.vue`                            | 頁面，路由 `/images/:imageId`                                                |
| `src/services/image.service.ts`                        | **服務層**：`getImageById` / `getRelatedImages` / `getHomeInspirationImages` |
| `src/components/feature/image/RelatedImageCluster.vue` | 中心圖周圍輻射的 4 張相關圖                                                  |
| `src/components/feature/image/ImageSpreadOverlay.vue`  | 中心放大圖                                                                   |
| `src/types/image.ts`                                   | 型別 `StyleImage` / `ImageSpreadNode` / `HomeInspirationImage`               |

**互動方式**（和我原本以為的「進入某 styleGroup」不同）：

```
落在一張中心圖 → 周圍輻射 4 張「同風格相關圖」
   → 點其中一張 → 它變中心、相關圖刷新（一層 spread depth）
   → 用 visitedImageIds 排除看過的，避免重複
```

**「同風格延展」其實已有雛形** —— `getRelatedImages(imageId, { visitedImageIds })`：

- 篩**同 `styleGroup`** 的候選；
- 依**共享 `style[]` 標籤數**（`countSharedStyles`）由多到少排序；
- 排除 `visitedImageIds`；
- 取前 `DEFAULT_RELATED_LIMIT = 4` 張。

**但它只從本地 61 張種子圖撈。** 加上「排除已看過」，輻射探索點幾下就**撈乾**了。

### 1.5 所以 issue #22 真正要補的洞

> 輻射探索會撈乾，是因為池子太小、且全是本地靜態資料。issue #22 的兩支正好補這個洞，且**對接點很明確**：
>
> - **支線 A（離線）**：把外部圖分類後灌進 `style-data.json` → `getRelatedImages` 的池子變大。
> - **支線 B（即時）**：當本地相關圖快撈乾時，用**基準圖的 `style[]` 標籤**當搜尋字去 Pexels 撈外部圖補上 —— 直接擴充 `image.service.ts` 的 `getRelatedImages`（加一條 async 外部 fallback）。
>
> 本設計**不需要再造服務層**，是接在既有 `image.service.ts` + `StyleImage` 型別上。

---

## 2. 系統總覽：兩支獨立的東西

```
┌──────────────────────────────────────────────────────────────────┐
│  支線 A：離線辨識腳本（開發者本機跑，一次性）                        │
│  慢 · 用 AI(CLIP) · 負責「分得準」                                  │
│                                                                    │
│   Pexels/Unsplash 撈圖 → CLIP 三層分類 + 取色 → 寫進 style-data.json │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  支線 B：前端 lazy 延展（使用者操作當下）                            │
│  快 · 不碰 AI · 負責「看不完、不卡頓」                               │
│                                                                    │
│   本地相關圖快撈乾 → 拿基準圖的 style[] 當搜尋字 → Pexels 撈新圖     │
│                    → loading 骨架顯示，補進輻射相關圖               │
└──────────────────────────────────────────────────────────────────┘
```

|                | 支線 A 離線辨識                      | 支線 B 前端 lazy 延展                         |
| -------------- | ------------------------------------ | --------------------------------------------- |
| 何時跑         | 開發者本機，一次性                   | 使用者點圖探索、本地相關圖快撈乾時            |
| 速度           | 慢（每張數秒），無所謂               | 快（< 1 秒），有所謂                          |
| 用什麼         | Transformers.js(CLIP) + node-vibrant | 純呼叫 Pexels API                             |
| 對接           | 寫進 `style-data.json`               | 擴充 `image.service.ts` 的 `getRelatedImages` |
| 碰 AI 嗎       | 是                                   | **否**                                        |
| 使用者會遇到嗎 | 永遠不會                             | 會                                            |

**為什麼這樣切**：會造成「點下去卡好幾秒」的，是 AI 辨識。而辨識只需要做**一次**（一張圖屬於哪個風格是固定的，算完存起來就好）。所以把 AI 鎖在離線，使用者當下那一步就只是普通圖片搜尋，不卡。

---

## 3. 技術選型（含被否決的選項與理由）

### 3.1 辨識引擎：為什麼是 CLIP

我們的需求不是「讓 AI 自由描述圖片」，而是「**把圖歸到幾個已知的分類，並給把握分數**」。這種任務叫**零樣本分類（zero-shot classification）**，CLIP 正是為此而生。

CLIP（OpenAI 開源）的能力是：**算「一張圖」和「一句文字」有多像**（相似度 0~1）。做法是把每個分類寫成文字，跟圖一起算相似度，取最高分。相似度分數本身就是天然的「信心分數」。

### 3.2 為什麼用 JS 版（Transformers.js）而非 Python 版

CLIP **不綁 Python**。Hugging Face 的 **Transformers.js**（`@huggingface/transformers`）能在 Node.js 直接跑 CLIP，語法是 JavaScript。

|                             | Python 版 CLIP   | **JS 版 (Transformers.js)** ← 採用 |
| --------------------------- | ---------------- | ---------------------------------- |
| 分類結果/信心分數           | 一樣             | **一樣**（同一個模型）             |
| 免費 / 本機 / 無限次 / 離線 | 是               | 是                                 |
| 跑大批圖速度                | 快一點           | 慢一點                             |
| 可選模型種類                | 多               | 少（夠用）                         |
| 跟本專案同語言              | ❌ 要另學 Python | ✅ 就是 TypeScript                 |

**決定理由**：本情境是「離線一次、幾百張、要免費、團隊用 JS」。在這個情境下速度/模型種類的差異無感，而「同語言、同工具鏈、組員看得懂」是實打實的好處。**結果零差別，JS 版省掉學 Python。**

### 3.3 其餘選型

| 工作              | 採用                               | 為什麼免費可行                                  |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| 撈圖              | Pexels / Unsplash 免費 API         | 普通 HTTP 請求，JS 原生 `fetch` 即可，零 Python |
| 取色 colorPalette | `node-vibrant`（JS）               | 本機讀像素，離線、零成本                        |
| title 來源        | 沿用圖庫回傳的 `alt`/`description` | 圖庫附帶，免費，免另外生成                      |

### 3.4 被否決 / 暫不採用的選項（記錄供組員參考）

| 選項                                                          | 為什麼這次不用                                                                                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **純關鍵字對應**（不用 AI，直接拿圖庫 tags 映射）             | 最便宜，但抽象風格分不準（issue 也指出此侷限）。可作為 CLIP 之外的輔助訊號，不單獨使用                                                                    |
| **生成式雲端模型（Gemini 免費額度 / Claude 付費）做主力辨識** | 要 API key、要連網、有額度上限/政策變動風險。本任務是離線一次性，CLIP 本機更可控、零依賴。**但生成式有一個 CLIP 做不到的能力（見 §5），故保留為未來擴充** |
| **Python 版 CLIP**                                            | 見 §3.2，與團隊語言不一致，無額外好處                                                                                                                     |

---

## 4. 支線 A：離線辨識腳本

### 4.1 整體流程

```
輸入：一批外部圖（從 Pexels/Unsplash 撈來）
   │
   ① 準備「風格錨點」文字（整支腳本只做一次）
   │
   ▼ 逐張處理：
   ├─ 2a. CLIP 比 styleGroup（3 類）        → styleGroup + 信心
   ├─ 2b. CLIP 比 medium（清單）            → medium + 信心
   ├─ 2c. CLIP 比 subMedium（限該 medium 底下） → subMedium + 信心
   ├─ 2d. CLIP 多標籤比子風格字庫           → style[]
   ├─ 2e. node-vibrant 取色                 → colorPalette[]
   ├─ 2f. 沿用圖庫描述                       → title
   └─ 2g. 任一層信心 < 門檻 → 標記該層 needsReview
   │
   ▼
組成一筆對齊 style-data.json 的物件 → 寫入（或先進審核暫存）
```

### 4.2 程式碼示意（TypeScript，僅示意核心邏輯）

```ts
import { pipeline } from '@huggingface/transformers';
import Vibrant from 'node-vibrant';

// 載入一次 CLIP（模型權重首次自動下載，之後離線可用）
const clip = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');

// 第1層：styleGroup（3 類）
const sg = await clip(imageUrl, [
  'Y2K chrome bubblegum glossy internet aesthetic, McBling',
  'futuristic tech, neon cyber, digital psychedelia',
  'decorative opulent baroque ornate luxury gold'
]);
// sg = [{ label: 'Y2K...', score: 0.31 }, ...] → 取最高分 + score 當信心

// 第2層：medium（用「當下的 medium 清單」，不是寫死）
const md = await clip(imageUrl, MEDIUM_LABELS);

// 第3層：subMedium（只在所選 medium 底下的子類裡比）
const subLabels = SUBMEDIUM_BY_MEDIUM[md[0].label] ?? [];
const sub = subLabels.length ? await clip(imageUrl, subLabels) : null;

// 取色
const palette = await Vibrant.from(imageUrl).getPalette();
```

### 4.3 三層分類設計

`styleGroup`（粗）→ `medium`（中）→ `subMedium`（細），三層都用 CLIP 同一招，只換「標籤清單」。

**關鍵設計：subMedium 跟著 medium 走。** 不讓 CLIP 從「全部子類」亂選，而是先定 medium，再**只在那個 medium 底下的子類裡比對**。

```
medium 判成 "Graphic Design"
  → subMedium 只在 [Poster Design, Editorial Design, Branding...] 裡比
medium 判成 "Architecture"
  → 該 medium 無子類 → subMedium 留空
```

好處有二：

1. **更準**：候選變少，CLIP 較不會錯。
2. **自動避免矛盾資料**：不會出現「medium=建築 但 subMedium=上衣」。（順帶解掉 DB 設計待解問題：category/subcategory 一致性沒有約束的疑慮。）

### 4.4 信心分數與門檻

CLIP 越細的分類越容易猶豫：`styleGroup`(3 類) 最準 → `medium`(4 類) 次之 → `subMedium`(更細) 最容易錯。所以**每層各設一個門檻**，越細的層門檻越嚴、越依賴人工。

| 層         | 起始門檻（先抓，跑完看分數分佈再調） |
| ---------- | ------------------------------------ |
| styleGroup | 0.25                                 |
| medium     | 0.30                                 |
| subMedium  | 0.35                                 |

低於門檻 → 標記**該層** `needsReview = true`。人工只審被標記的那一格，不必整筆重看。

> 門檻是**經驗起始值**，不是定論。第一批跑完後要看實際分數分佈來校準 —— 這本身是 MVP 的一個產出。

---

## 5. 會成長的分類清單（最重要的設計轉變）

### 5.1 問題

未來 AI 判斷出的 `medium`/`subMedium` **不一定**落在現有清單裡。例如抓回一張其實是「Photography」「Sculpture」的圖，但我們清單只有 4 個 medium。

### 5.2 CLIP 的硬限制：封閉式，不會發明新類別

CLIP 是**封閉式分類（closed-set）**：你給它哪幾個標籤，它只能在那幾個裡挑最像的。

```
清單只有 4 個 medium，來一張其實是「雕塑」的圖
  → CLIP 不會說「這是雕塑」（它不會吐出沒給過的字）
  → 它會硬塞進最接近的那個
  → 但信心分數會很低 ← 這就是破綻，也正是線索
```

要「自己發現並命名新類別」，需要的是**會生成文字的模型**（生成式），CLIP 做不到。

|                | 在已知清單內分類 | 發現全新類別              |
| -------------- | ---------------- | ------------------------- |
| CLIP（封閉式） | ✅ 很行          | ❌ 做不到，只會低信心示警 |
| 生成式模型     | ✅               | ✅ 能提名新字             |

### 5.3 採用方案：做法 A —— 低信心 → 人工命名 → 清單成長

```
CLIP 信心低 → 進人工審核佇列 → 人看一眼決定：
                               ├─ 歸到某個現有類別，或
                               └─ 新增一個類別（例如 "Photography"）
                                  → 加進 medium 清單
                                  → 之後同類圖 CLIP 就能自動歸進去了
```

- ✅ 全免費、CLIP 一招到底。
- ✅ 「低信心」本來就要人看，順手決定命名，不算額外負擔。
- 由此推出一個**必要的設計轉變**：

> **`medium` / `subMedium` 清單不再寫死，改為 config 裡「可成長的資料清單」。** CLIP 永遠拿「當下清單」去比；新類別經人工加入後，下次自動分。

### 5.4 保留的未來擴充：做法 B —— 生成式自動提名

當想再省人力時，可在「CLIP 信心低」時，把圖丟給生成式視覺模型（如 Gemini 免費額度）開放式詢問「這張的 medium 是什麼？」，由它**提名**新字、人只要按確認。

- 本次**不實作**，但設計上預留接口（審核佇列的項目可掛一個「建議類別」欄位）。
- 取捨：省人力，但要 API key、有額度上限。

---

## 6. 輸出資料格式（欄位字典）

每一筆轉好的外部圖：

```jsonc
{
  // ── 對齊現有 style-data.json 的欄位 ──
  "id": "ext-pexels-12345",
  "url": "https://images.pexels.com/photos/12345.jpg",
  "title": "shiny blue chrome bubble texture",
  "styleGroup": "Y2K & Internet Aesthetics",
  "style": ["Y2K", "Chrome Design", "McBling"],
  "medium": "Graphic Design",
  "subMedium": "Poster Design", // 該 medium 無子類時可為 null
  "colorPalette": ["#8EC9FF", "#B9A8F3", "#E9F5FF"],

  // ── 外部圖新增欄位 ──
  "source": "pexels",
  "attribution": "Photo by Jane Doe / Pexels",
  "confidence": { "styleGroup": 0.31, "medium": 0.28, "subMedium": 0.19 },
  "needsReview": { "styleGroup": false, "medium": false, "subMedium": true }
}
```

### 欄位逐一說明

| 欄位                                  | 是什麼                            | 為什麼非有不可                                                                                                   |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`                                  | 唯一識別碼，前綴 `ext-`/`pexels-` | 一眼看出是外部來源，方便管理                                                                                     |
| `url` / `title`                       | 圖片網址 / 標題（沿用圖庫描述）   | 基本顯示                                                                                                         |
| `styleGroup` / `medium` / `subMedium` | 三層分類結果                      | `getRelatedImages` 用 `styleGroup` 篩同風格；`medium`/`subMedium` 供未來分類瀏覽                                 |
| `style[]`                             | 子風格多標籤                      | 風格細節呈現                                                                                                     |
| `colorPalette[]`                      | 主色                              | 對接現有色票呈現                                                                                                 |
| `source`                              | 來源圖庫（pexels/unsplash）       | ① 去重 ② 不同圖庫標註規則不同，要知來源才知怎麼標                                                                |
| `attribution`                         | 攝影師/來源標註字串               | **法律/授權要求**。Unsplash 要求標註攝影師、Pexels 建議標。對應驗收標準「preserve attribution」                  |
| `confidence`（分三層）                | 每層 AI 判斷的把握分數            | ① 知道每格能不能信 ② 低於門檻觸發人工 ③ 跑完看分佈反過來調門檻。**分三層**因三層準確度差很多，不能用一個數字概括 |
| `needsReview`（分三層）               | 哪一格需要人看                    | 讓人工**只審被標記的那一格**，不必整筆重看                                                                       |

> 一句話：前半段是「圖的內容」，後半段是「**這筆可不可信、誰要負責看**」—— 後半段就是 issue 要求的信心分數 + 低信心標記 + 保留出處。

**對接現有型別**：前半段欄位已對齊 develop 的 `StyleImage`（`src/types/image.ts`，`medium?`/`subMedium?` 本來就 optional）。後半段 4 個新欄位（`source`/`attribution`/`confidence`/`needsReview`）是**外部圖的擴充**，建議做成 `StyleImage` 的可選欄位或一個 `ExternalStyleImage extends StyleImage`，這樣既有讀 `style-data.json` 的程式不受影響。

---

## 7. 支線 B：前端 lazy 延展

### 7.1 為什麼需要它（而不是全部離線存好）

issue 字面要求「**同風格延展**」= 看到的不只精選那幾張，能不斷撈出更多同風格圖。這逼出：為什麼不能「全部離線存進 JSON」？

| 原因               | 說明                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **會過期**         | 圖庫有上百萬張。離線存的是快照，每次看到同一批，很快膩。lazy 撈能每次帶來新鮮、不重複的圖                   |
| **體積爆炸**       | 不可能把上千張延展圖塞進 repo 的 JSON，專案會肥死。**精選種子圖**離線存著，「更多」用時再撈，資料集保持輕巧 |
| **issue 直接要求** | 驗收標準寫明「generate search queries → retrieve matching images」，這動作本身就是即時去撈                  |

### 7.2 為什麼是「lazy（點下去才撈）」

- **省流量/省 API 次數**：使用者不一定每個 styleGroup 都點，只在他真的點進去才撈。
- **首頁載入快**：進站不用等一堆 API。
- **不會卡**：點下去時 styleGroup **已知**、搜尋字**事先寫好**，這一步**完全不碰 AI**，只是普通圖片搜尋（< 1 秒）+ loading 骨架。慢的 AI 辨識早在離線做完了。

### 7.3 資料存哪？（種子圖 vs 延展圖）

「精選種子圖離線存著」精確講是**三個不同的S東西分開放**，搞清楚這條 lazy 流程就通了：

| 東西                                                  | 存哪                                                                                 | 何時進來                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 種子圖的**資料**（id/styleGroup/style/colorPalette…） | `src/data/style-data.json`                                                           | build 時打包進 app；`image.service.ts` 開頭 `import rawStyleImages from '@/data/style-data.json'` 讀進記憶體 |
| 種子圖的**圖片檔**                                    | `public/style-image/`（如 `style2-graphic.webp`）                                    | Vite 當靜態資源服務，url 是 `/style-image/...`                                                               |
| **延展圖**（外部撈的）                                | **不存！** runtime 從 Pexels 抓，直接用遠端網址 `https://images.pexels.com/...` 顯示 | 使用者點圖、本地不夠時才即時抓                                                                               |

- 支線 A 離線腳本做的事，本質就是**往 `style-data.json` 多塞分類好的筆數**，讓池子變大。
- 延展圖**完全不落地** —— 顯示完就算，下次重抓。理由＝ §7.1 的「會過期、體積爆炸」。

### 7.4 完整 lazy 流程（接在既有 `getRelatedImages` 上）

S
現況 `getRelatedImages` 是**同步**、只查本地。支線 B 把它改成 **async**，後面加一條外部 fallback：

```
getRelatedImages(imageId, { visitedImageIds }) → async：

① 先照舊查本地 → localResults（0~4 張）
② 夠 limit(4) 張？
   ├─ 夠 → 直接回傳（跟現在一樣，零網路、零 loading）
   └─ 不夠 → 進 lazy ③
③ 用「基準圖 style[]」組搜尋字
     style=["Y2K","Chrome Design"] → query "Y2K Chrome Design"
④ 呼叫 Pexels 搜該 query（多抓一些備用）
⑤ 過濾：去掉已在 localResults 的、visitedImageIds 看過的、壞圖/無 alt 的
⑥ 最小化轉換成 ImageSpreadNode：
     { id:"ext-pexels-123", src:遠端url, title:圖庫描述,
       styleGroup:沿用基準圖, attribution:"Photo by … / Pexels" }
     ※ 不跑 CLIP —— styleGroup 直接繼承基準圖（拿它的 style 去搜的，本就同風格）
⑦ localResults + 外部圖 → 湊滿 4 張回傳
```

- ③~⑥ **完全不碰 AI**：styleGroup 直接繼承基準圖、不辨識 —— 這就是「即時不卡」的原因。
- **搜尋字用「基準圖的 `style[]`」**，貼合現有「共享 style 越多越相關」排序。（style 太少時可用該 styleGroup 的固定字當後備。）

### 7.5 畫面層（`ImageSpread.vue`）要配合改

`getRelatedImages` 從同步變 async，元件這邊：

1. `refreshRelatedImages` 改 await：`isLoadingRelated=true` → `await getRelatedImages(...)` → `=false`。
2. `RelatedImageCluster` 在 loading 時顯示**骨架**（4 個灰色閃爍方塊佔位），抓回再換真圖 —— 體感是「位置先佔好、圖陸續浮現」，非整頁卡住。
3. 外部圖卡片角落顯示 **attribution**（Pexels 授權要求）。
4. 抓不到/失敗 → 只顯示本地那幾張，不報錯（**優雅降級**）。

### 7.6 一個必須面對的坑：API key 會曝光

延展在**前端**呼叫 Pexels，`PEXELS_API_KEY` 放前端 → devtools 看得到。兩種處理（見 §9 D6）：

| 做法          | 說明                                         | 適合             |
| ------------- | -------------------------------------------- | ---------------- |
| A. 直接放前端 | Pexels 免費 key 風險低，被盜頂多多耗免費額度 | demo / MVP，最快 |
| B. 小代理     | 極簡 serverless function 代轉，key 藏伺服器  | 正式上線較安全   |

### 7.7 兩個收尾設計

- **session 內快取**：同一 query 撈過的存記憶體 Map，來回點同張不重抓，省 API 次數。
- **不落地**：外部圖不寫進 `style-data.json`。要正式收錄是支線 A 離線腳本的事（先跑 CLIP 補完整分類 + 人工審核），跟「即時顯示」解耦。

### 7.8 分工總結

```
離線（慢、一次性、CLIP）  ：分類外部圖灌進 JSON      → 把 getRelatedImages 的池子養大
前端 lazy（快、即時、無 AI）：本地撈乾時用 style[] 撈外部 → 讓輻射探索「看不完、不卡」
```

一句話：**本地（`style-data.json`）夠就用本地、零網路；不夠時拿基準圖 `style[]` 去 Pexels 即時補、繼承同 styleGroup、配骨架、不落地。**

---

## 8. 範圍：MVP vs 第二階段

### MVP（先做）

- 單張外部圖 → 轉成對齊 style-data.json 的格式。
- CLIP 三層分類（styleGroup / medium / subMedium），每層含信心分數。
- node-vibrant 取色、沿用圖庫描述當 title、保留 attribution。
- 低信心 → `needsReview` 標記。
- `medium`/`subMedium` 清單改為可成長的 config 資料。
- 支線 B：擴充 `getRelatedImages` —— 本地不足時用基準圖 `style[]` 去 Pexels 撈、配 loading（可先給簡單顯示）。
- 跑完第一批，**校準三層門檻**。

### 第二階段（之後）

- 批次處理多張、去重。
- **人工審核介面**：列出 `needsReview` 項目，可改類別 / 新增類別 / 確認。
- 做法 B：生成式（Gemini）對低信心項目**自動提名**新類別。
- 支線 B 進階：背景預抓快取、無限捲動。

---

## 9. 待拍板的小決定（實作前確認）

| #   | 項目                          | 目前傾向                                            | 待確認                                           |
| --- | ----------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| D1  | 三層信心門檻起始值            | 0.25 / 0.30 / 0.35                                  | 是否同意先用這組、跑完再校準                     |
| D2  | 延展搜尋字來源                | 主用「基準圖的 `style[]`」；styleGroup 固定字當後備 | 是否同意（取代原本「每 styleGroup 一組固定字」） |
| D3  | 圖庫優先序                    | Pexels 優先（完全免費），Unsplash 次之              | 是否兩個都接、或先只接 Pexels                    |
| D4  | CLIP 模型                     | `Xenova/clip-vit-base-patch32`（體積小）            | 是否要更大模型換準確度（離線可接受較慢）         |
| D5  | 種子 vs 延展是否混在同一 JSON | 傾向分開（種子 = 精選離線、延展 = 即時不落地）      | 是否同意                                         |
| D6  | 延展呼叫 Pexels 的 API key    | MVP 先放前端（A）；上線再換小代理（B）              | 是否同意（見 §7.6）                              |

---

## 10. 已確認的決定（討論記錄）

1. 產出目標：**調查 + 完整可實作 spec**，且文件供組員閱讀（含被否決選項與理由）。
2. 執行模型：**② 離線辨識 + 當下 lazy 延展**（AI 鎖離線，避免點擊卡頓）。
3. 延展觸發點：**ImageSpread 點圖探索、本地相關圖快撈乾時**（Explore 已在 develop 實作為 ImageSpread；本設計接在既有 `image.service.ts` 的 `getRelatedImages` 上，不另造服務層）。
4. 辨識引擎：**Transformers.js（JS 版 CLIP）**，全免費、本機、同語言、不用 Python。
5. medium/subMedium：**也用 CLIP 自動判斷**，三層各有信心與人工審核門檻；subMedium 限定在所選 medium 底下。
6. 分類清單：**改為可成長的資料清單**（不再寫死）。
7. 未知類別處理：**做法 A（低信心 → 人工命名 → 清單成長）**；做法 B（生成式提名）列為未來擴充並預留接口。
