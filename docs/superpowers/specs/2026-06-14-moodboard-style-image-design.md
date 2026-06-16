# Moodboard 改用 style-image + 手機可滑動 — 設計

**日期:** 2026-06-14
**分支:** feat/Moodboard

## 目標

把 Moodboard 四個照片畫面從 `/images/imageN.png`（少量重複 mock）改成從 `public/style-image/`（61 張真實風格照）隨機抽取顯示；並讓手機「資料夾內」畫面在照片多到一個螢幕放不下時可以上下滑動看更多。模擬未來「依使用者在該資料夾收藏的照片動態渲染」的效果。

## 範圍

四個目前用 `/images` 的畫面全部換成 style-image 隨機：

| 畫面 | 現況 | 改法 |
|---|---|---|
| 桌面球體（首頁） | `IMG_URLS` 取自固定 `photos` | 隨機抽 20 張 |
| 桌面散布（資料夾內） | `photos.slice(0, DETAIL_CAP)` | 每次開資料夾隨機抽 `DETAIL_CAP` 張 |
| 手機首頁 | 固定 `mHomePhotos` | 隨機抽 6 張 |
| 手機資料夾內 | 固定 `mDetailBase` | 每次開資料夾隨機抽 N 張 |

**桌面不加滑動** —— 球體與散布維持原本佈局，只換圖。手機**首頁**也不滑動，滑動只在點進資料夾後的 detail。

## 照片來源

- 來源資料：`src/data/style-data.json`，每筆有 `url`（例如 `/style-image/style2-main.webp`）。
- 在 `config.ts` 匯入並取出 `STYLE_POOL: string[]`（61 個 url）。
- `pickRandom(n)`：從池中**不重複**隨機抽 n 個 url（洗牌後取前 n）。61 ≥ 任何需求數，足夠不重複。
- **每次** `buildDetail` / `buildMobileDetail` / `buildMobileHome` 與球體初始化時各自呼叫 `pickRandom`，所以每次開資料夾都是新的一組。

## 照片尺寸 / 比例

- 版面所有照片用 `object-fit: cover`，圖片自動填滿裁切框，因此只需給排版框一個 w/h，不需讀真實比例。
- 散布 / 手機照片：沿用現有「隨機尺寸變化」風格 —— 每張在既有尺寸範圍內給隨機 w/h，維持錯落美感。
- 球體：`sphere.ts` 自己讀真實圖片算 aspect，只需餵 URL，**不改 sphere.ts**。

## 手機資料夾內 —— 可滑動散布（自動判斷）

核心：**照片維持舒適大小，需要多高排多高；排完超出螢幕才能滑。**

1. 照片給一個基準尺寸；依張數估算需要的排版高度 `contentH`。
2. 照片渲染進一個獨立滾動層（`overflow-y: auto`），視窗高 = 螢幕可視高。
   - `contentH ≤ 可視高` → 內容放得下，**不可滑**（收藏少時手感正常，不會有多餘滑動）。
   - `contentH > 可視高` → **可上下滑**看更多。
3. `packPhotos` 的 `yMax` 傳入 `contentH`，使照片維持基準大小、往下鋪開，而非被壓縮。
4. **固定不動**（不隨照片滑動）：圓圈線條、左上 NAME、Back 按鈕、底部資料夾名稱 tab。
5. 滾動層底部加一道漸隱遮罩，暗示下方還有內容。

## 邊界 / 不變動

- 圖片載入失敗 → 沿用現有 `onImgError` 條紋 placeholder。
- 手機首頁資料夾層（最多 10 個）佈局不變。
- 張數先寫死當 mock（detail 抽 `DETAIL_CAP` 張）；未來接真實收藏時，把「隨機抽取」換成「讀該資料夾使用者收藏」即可，排版與滑動邏輯不需改。

## 測試

- `npm run lint` 0 errors。
- 手動驗證：桌面球體/散布顯示 style-image；手機首頁顯示 style-image；手機 detail 照片少時不可滑、照片多時可滑且圓圈/NAME/Back/tab 固定；重複開同一資料夾每次照片不同。
