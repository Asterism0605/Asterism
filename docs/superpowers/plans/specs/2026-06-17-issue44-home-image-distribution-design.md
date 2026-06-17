# Issue #44 首頁圖片分佈 — 設計文件（2026-06-17）

對應 issue：[#44 [Fix] 首頁照片散佈：顯示全部主圖、調整高度與散佈](https://github.com/Asterism0605/Asterism/issues/44)
分支：`demo/image-spread`

---

## 背景

組員 PR #53 已合併進 `develop`，補齊 9 個風格群組的概念照與 cover photo，
`src/data/style-data.json` 擴到 223 筆。其中 **45 張概念照**（每組 5 張、id 含 `main`、
無 `medium` 欄位、url 指向 `/style-image/*.webp`）。

首頁的 `FloatingImageNetwork` 現況寫死「最多 6 張」、容器高度固定 200vh，
導致只顯示 6 張被截斷。本次要顯示全部 45 張概念照，並調整高度與散佈密度。

## 目標

首頁主圖 = 9 個 styleGroup × 每組 5 張 = **固定 45 張**，以「每 100vh 約 5 張」
的密度往下鋪，總高 **900vh**，避免空白螢幕、避免擠中間。

## 非目標（YAGNI）

- 不改延展（spread）相關邏輯、不碰 Supabase / API 那條線。
- 不整包 merge develop（只精準取需要的資料）。
- 不重做 d3-force 演算法，沿用現有 preset 機制只調參數。

---

## 決策（已與使用者確認）

| 項目 | 決定 |
| --- | --- |
| 在哪個分支做 | `demo/image-spread` |
| 顯示幾張 | 全部 45 張（每組 5 張，組員實際提供） |
| 範圍 | 完整 Issue #44（換圖 + 篩選 + 數量 + 高度 + 散佈） |
| 取資料方式 | 方式 A：精準 `git checkout` develop 的資料檔，不整包 merge |
| 密度 | 每 100vh 放 **5 張**（非原 issue 的 3 張）→ 高度 900vh |
| 篩選判準 | 維持 `!image.medium`（新資料上等同 id 含 `main`，圈出同一批 45 張） |

> 密度 5 張是「先試試看」的值，覺得太擠再調。高度用算式 `(張數 ÷ 5) × 100vh`
> 推導，不寫死，之後改密度或張數會自動跟著變。

---

## 設計

### ① 匯入新資料（方式 A）

```bash
git checkout origin/develop -- src/data/style-data.json public/style-image/
```

- 把 develop 的 223 筆資料與 WebP 圖檔拉進 `demo/image-spread`，取代舊的 61 筆。
- 只動資料與靜態資源，不碰 develop 的程式（image.service / router / 元件）。
- 風險：新資料的 id 命名（`ftdp-main-001` 等）與舊測試寫死的 id（`y2k-main-001` 等）
  不同 → 既有測試會壞，需在 ② 一併更新。

### ② 篩選邏輯（確認 + 更新測試）

- `getHomeInspirationImages()` 維持 `localStyleImages.filter((i) => !i.medium)`。
  在新資料上自動圈出 45 張概念照（已驗證：9 組各 5 張、皆無 medium）。
- **服務層邏輯不改**，只更新測試期望：
  - `image.service.spec`：「3 張」→「45 張、9 組各 5、皆無 medium」。
  - `Home.spec`：傳給 `FloatingImageNetwork` 的 images 由 3 → 45。
  - 既有用 `y2k-main-001` / `y2k-graphic-001` 等舊 id 的 spec（image.service、
    ImageSpread）改用新資料存在的 id。

### ③ 放開數量上限（`config.ts`）

- `MAX_IMAGES` 6 → 提到 ≥45 或直接移除 `slice`，顯示全部主圖。
- `widths` / `aspects` / `constellationSizes`（各 6 個）已用 `i % length` 循環，
  45 張可正常取用，不需改。

### ④ 容器高度 = 900vh（`Home.vue`，必要時 `layout.ts`）

- 現況 `Home.vue` 傳 `height="calc(200vh - var(--app-header-height))"`。
- 改成依密度算：`height = (images.length / 5) * 100vh`（45 張 → 900vh），
  外層 `home-page` / section 的 `min-h` 一併放大到對應高度。
- 若 `layout.ts` 有 `resolveContainerSize` / `resolveConfiguredHeight`，配合調整。

### ⑤ 均勻散佈 + 向心力調弱（`config.ts` home preset / layout）

- 把 900vh 切成約 **9 個帶、每帶約 5 張**，初始 y 依帶均勻分佈，
  讓密度穩定在「每 100vh 約 5 張」，避免空白螢幕。
- x 維持置中；**y 方向向心力調弱**（降低或移除 y 的 `centerStrength` 貢獻），
  靠均勻分帶 + `forceCollide` 把 45 張穩定往下鋪。
- 確認 `clampPosition` 的 y 邊界（現為 `Math.min(height - 120, ...)`）配合 900vh 仍正確。

### ⑥ 保留既有修正

- `demo/image-spread` 的 `FloatingImageNetwork` 已有「圖片非同步載入後 `watch`
  重算座標」的修正（解 opacity 永遠 0 的 bug），改散佈邏輯時務必保留，
  新座標計算要相容「圖片陣列從 0 變 45」的非同步流程。

### ⑦ TDD

- 每項改動（篩選張數、MAX_IMAGES、高度算式、分帶散佈）先寫/改測試再動。
- 完成後 `npm run test`（全綠）+ `npx vue-tsc --noEmit`（乾淨）。

---

## 影響檔案

| 檔案 | 改動 |
| --- | --- |
| `src/data/style-data.json` | 取代為 develop 版（223 筆） |
| `public/style-image/*.webp` | 新增（develop 版圖檔） |
| `src/components/sections/FloatingImageNetwork/config.ts` | MAX_IMAGES、home preset（散佈/向心力） |
| `src/components/sections/FloatingImageNetwork/`（layout 計算） | 高度/分帶（視實作） |
| `src/pages/Home.vue` | 容器高度算式、min-h |
| `src/tests/Home.spec.ts` | 期望張數 3 → 45 |
| `src/tests/image.service.spec.ts` | 期望張數、改用新 id |
| `src/tests/ImageSpread.spec.ts` | 改用新資料存在的 id（若受影響） |

## 驗收標準

1. 首頁顯示全部 45 張概念照（9 組各 5），不再截斷成 6 張。
2. 容器高度 900vh，每 100vh 約 5 張，無整個空白的螢幕。
3. 圖往下鋪、不擠中間；非同步載入後座標正確（無 opacity=0 隱形卡片）。
4. `getHomeInspirationImages()` 只回無 medium 的概念照（45 張），不混入延展圖。
5. `npm run test` 全綠、`vue-tsc` 乾淨。
