# 首頁圖片點擊導覽規格

## 目標

首次造訪首頁的使用者會看見一個輕量導覽：畫面其餘區域變暗、指定圖片發亮、小星軌指向該圖片並顯示提示。使用者點擊目標圖片後，導覽立即結束，且保留原本進入圖片詳情頁的行為。

## 範圍與非目標

- 僅支援首頁的一個導覽步驟。
- 完成狀態以此瀏覽器的 `localStorage` 保存；不使用 Pinia、後端或第三方導覽函式庫。
- 不提供重新播放入口、跨裝置同步或多步驟 onboarding。未來真的需要多步驟導覽時再評估抽象。
- MVP 可不提供明顯跳過按鈕，但需保留安全關閉方式，例如 `Escape` 關閉，避免導覽在例外狀況下卡住使用者。

## 互動流程

1. `Home.vue` 完成首頁圖片資料載入並渲染目標卡片。
2. `useHomeImageGuide` 檢查 `asterism:guide:home-image-click`；未完成時準備顯示導覽。
3. `FloatingImageNetwork` 優先對索引 `5` 的卡片加上 glow 與 `data-guide-target` 標記。
4. 若索引 `5` 不存在、尚未渲染或不在可視範圍內，導覽 fallback 至第一張可見圖片。
5. `HomeImageClickGuide` 讀取目標卡片的實際矩形，以四片固定暗幕保留可見洞口，並繪製星軌與 tooltip。
6. 使用者點擊目標圖片時，首頁先記錄導覽完成、移除導覽，再照既有流程前往 `image-spread`。

圖片版面是動態計算的；「固定」指固定資料索引，而非每個 viewport 都保證在螢幕最右側。導覽會使用實際 DOM 位置定位，隨視窗大小、捲動與圖片尺寸改變更新。

## 預計檔案位置與責任

| 檔案                                                                    | 動作 | 責任                                          |
| ----------------------------------------------------------------------- | ---- | --------------------------------------------- |
| `src/constants/userTour.ts`                                             | 新增 | 單一儲存鍵與目標圖片索引常數。                |
| `src/composables/guide/useHomeImageGuide.ts`                            | 新增 | 導覽狀態、安全 storage 與 fallback 目標選擇。 |
| `src/components/feature/guide/HomeImageClickGuide.vue`                  | 新增 | 暗幕洞口、星軌、tooltip 與目標位置追蹤。      |
| `src/components/sections/FloatingImageNetwork/FloatingImageNetwork.vue` | 修改 | 接收目標索引、標記並發亮該卡片。              |
| `src/pages/Home.vue`                                                    | 修改 | 等待首頁資料渲染、串接 guide、保留既有導頁。  |
| `src/tests/useHomeImageGuide.spec.ts`                                   | 新增 | 驗證首次顯示與完成後不再顯示。                |
| `src/tests/FloatingImageNetwork.spec.ts`                                | 修改 | 驗證指定圖卡取得導覽標記與 glow class。       |
| `src/tests/Home.spec.ts`                                                | 修改 | 驗證點擊目標卡片會完成導覽且仍導頁。          |

## 設計說明

導覽依專案既有的 type-based 架構分層：元件放在 `src/components/feature/guide/`、composable 放在 `src/composables/guide/`、常數放在 `src/constants/`。導覽狀態仍是頁面級 UX 狀態，不使用 Pinia。視覺層獨立為元件，避免 `Home.vue` 同時持有 SVG、幾何定位與頁面導覽流程；圖片網路元件只知道「哪個索引是目標」並提供標記，不持有導覽儲存或路由邏輯。

暗幕使用四片元素，而非一張攔截事件的全螢幕遮罩；目標圖片保持可見、可點，星軌預設不攔截操作。若 tooltip 未來加入關閉按鈕，tooltip 本身才需要 `pointer-events: auto`。

支援 `prefers-reduced-motion`：停止 glow 與星軌動畫，並降低 glow 強度，改用靜態 border / outline 保留提示效果。

## 技術風險與改善方式

### 1. 目標圖片不存在或不在可視範圍內

導覽目前以索引 `5` 作為優先目標，但首頁圖片數量、排序、RWD 版面與浮動位置可能改變。若指定索引不存在、尚未渲染或不在 viewport 內，畫面變暗後使用者可能看不到導覽目標。

**改善方式**

- 保留 `GUIDE_TARGET_INDEX = 5`，但補上 fallback。
- fallback 優先選第一張目前可見且尺寸有效的圖片。
- 若找不到任何可用目標，不顯示導覽，避免畫面只剩暗幕。

```ts
const GUIDE_TARGET_INDEX = 5;
const FALLBACK_GUIDE_TARGET_INDEX = 0;
```

### 2. 圖片尺寸尚未穩定導致定位錯誤

首頁圖片資料載入完成，不代表圖片高度、瀑布流位置與 DOM 矩形已穩定。若太早呼叫 `getBoundingClientRect()`，暗幕洞口、星軌與 tooltip 可能會偏移。

**改善方式**

- 不只等待資料 fetch 完成，也要等待目標卡片 DOM 存在。
- 顯示 guide 前至少經過 `nextTick` 與 `requestAnimationFrame`。
- 若元件能取得圖片 loaded 狀態，應以目標圖片 loaded 作為更穩定的顯示條件。

```ts
await nextTick();
requestAnimationFrame(() => {
  updateTargetRect();
  startGuide();
});
```

### 3. scroll / resize 更新可能造成效能問題

導覽需要在 resize、scroll 後重新定位，但不可在高頻事件中不斷讀取 DOM 並更新 state，否則可能造成卡頓或 Safari 抖動。Safari 已經夠難伺候了，不必再主動餵它 bug。

**改善方式**

- scroll listener 使用 `{ passive: true }`。
- 位置更新透過 `requestAnimationFrame` 排程。
- 元件卸載時清除 event listener 與尚未執行的 animation frame。

```ts
let frameId: number | null = null;

function scheduleUpdate() {
  if (frameId !== null) return;

  frameId = requestAnimationFrame(() => {
    frameId = null;
    updateTargetRect();
  });
}
```

### 4. 需要確認首頁實際 scroll container

如果首頁滾動來源是 `window`，監聽 `window.scroll` 即可。若首頁使用自訂 scroll container，只監聽 `window` 會導致洞口、星軌與 tooltip 不同步。

**改善方式**

- 實作前確認首頁 scroll container。
- 若不是 `window`，`HomeImageClickGuide` 應接收或查找實際 scroll container。
- 規格與測試中需固定這個假設，避免後續 layout 調整時悄悄壞掉。

### 5. 導覽不可阻斷既有圖片點擊流程

點擊目標圖片後，guide 需要完成並保存狀態，但不能破壞原本前往圖片詳情頁的行為。這裡不應讓 overlay 攔截目標圖片點擊，也不應在圖片點擊流程中使用不必要的 `preventDefault` 或 `stopPropagation`。

**改善方式**

- `completeGuide()` 作為圖片點擊 handler 的附加動作。
- 先完成 guide，再呼叫既有 `openImageSpread()` 或路由流程。
- overlay 與星軌預設不接收 pointer event，目標圖片本身保持可點。

```ts
function handleImageClick(image, index) {
  if (isGuideVisible.value && index === guideTargetIndex.value) {
    completeGuide();
  }

  openImageSpread(image);
}
```

### 6. `localStorage` 需安全存取

`localStorage` 在一般 SPA 中可用，但仍可能在隱私模式、測試環境或未來 SSR 情境中出錯。導覽功能不應因為 storage 失敗導致首頁壞掉。

**改善方式**

- `useHomeImageGuide` 內部包裝 safe storage helper，讀取和寫入皆需處理例外與 `window` 不存在的情況。
- 儲存失敗時，至少保證當前頁面可以關閉 guide。
- 不需要為 MVP 改成 Pinia 或後端儲存。

```ts
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failure.
  }
}
```

### 7. z-index 與既有首頁元素可能衝突

首頁可能已有 header、hover overlay、收藏按鈕或其他 fixed 元件。若 guide 沒有明確 z-index 層級，可能出現 glow 被蓋住、tooltip 被遮住或目標圖片不可點的問題。

**改善方式**

- 暗幕、星軌與 tooltip 使用固定且一致的層級。
- 四片暗幕在目標卡片周圍留下洞口，因此目標卡片不需要跨 stacking context 提高 z-index，仍可保持可見及可點擊。
- 避免在多個元件中隨意使用不一致的 z-index 數字。

```css
.guide-backdrop {
  z-index: 40;
}
.guide-orbit {
  z-index: 50;
}
.guide-tooltip {
  z-index: 60;
}
```

### 8. 測試不應過度綁定像素位置

暗幕洞口與星軌是否精準對齊屬於視覺效果，若 unit test 過度驗證 pixel-level 位置，測試會很脆弱。

**改善方式**

- unit test 聚焦在狀態、localStorage、guide 標記、glow class 與點擊流程。
- `getBoundingClientRect()` 可 mock 一組基本 rect，確認位置更新函式會被觸發。
- 星軌與暗幕精準對齊列入手動 QA 或後續 screenshot test，不列為 MVP unit test 重點。

## 驗收標準

- [ ] 未完成導覽的使用者進首頁後，索引 5 圖片會發亮且顯示繁中提示。
- [ ] 若索引 5 圖片不存在、尚未渲染或不在可視範圍內，會 fallback 至第一張可見圖片。
- [ ] 目標之外的首頁畫面會變暗；目標圖片仍可見、可點擊。
- [ ] 星軌指向目標圖片，並會在 resize、scroll 後重新定位。
- [ ] scroll / resize 位置更新不會造成明顯卡頓，且元件卸載時會清除監聽。
- [ ] 點擊目標圖片會關閉並保存導覽完成狀態，同時照既有行為前往圖片詳情。
- [ ] 重新整理頁面後，已完成的使用者不再看到導覽。
- [ ] `localStorage` 不可用時，首頁不會因此噴錯，guide 仍可在當前頁面關閉。
- [ ] reduced-motion 使用者不會看見持續動畫，且 glow 改為較低刺激的靜態提示。
