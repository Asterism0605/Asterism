# Asterism 使用者導覽企劃與規格書

> 文件版本：v1.2
> 更新日期：2026-07-15  
> 適用範圍：首頁探索、圖片延展、圖片詳情、顧問諮詢、個人選單、Moodboard

---

## 1. 一句話摘要

Asterism 目前的主要問題不是「功能不存在」，而是使用者無法理解功能之間的因果關係；導覽應從單一箭頭提示，升級為可自由開關、跨頁保存進度、依情境分段出現的產品教學系統。

---

## 2. 使用者回饋快速分析

### 2.1 核心問題

使用者回饋可歸納為三類：

| 問題類型     | 使用者感受                                 | 產品根因                                           |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| 產品定位不清 | 看不懂網站是做什麼                         | 首頁缺少一句話價值主張與功能入口說明               |
| 操作意圖不清 | 不知道為什麼要選 Style DNA 題目            | 測驗前缺少目的、結果用途與作答方式說明             |
| 功能關聯斷裂 | 做完測驗後首頁沒有明顯變化，也不知道下一步 | 結果頁、首頁推薦、收藏、顧問諮詢未形成可感知的閉環 |
| 互動提示不足 | 不知道圖片、縮圖、標籤、資料夾軌道可以操作 | 介面視覺語言偏沉浸式，但 affordance 太弱           |
| 導覽只教單點 | 只知道首頁圖片可點                         | 現有箭頭沒有解釋「點了之後會得到什麼」             |

### 2.2 關鍵判斷

現有首頁懸浮箭頭只能解決「這裡可點」，無法解決：

1. Asterism 的用途是什麼。
2. 四張延伸圖片為什麼出現。
3. 收藏、Style DNA、顧問諮詢之間如何串連。
4. 使用者完成任務後，下一步應該去哪裡。

因此不建議繼續堆疊更多永久箭頭：資訊變多，理解不一定變多。

---

## 3. 導覽目標

### 3.1 產品目標

- 讓首次使用者在 1 分鐘內理解 Asterism 的核心價值。
- 讓使用者知道首頁圖片、四領域延展、收藏、顧問諮詢與 Moodboard 的關係。
- 降低首次進站後的迷失、誤點與中途離開。
- 讓使用者能自行選擇「接受引導」或「自由探索」。

### 3.2 使用者完成導覽後應能回答

- Asterism 可以幫我做什麼？
- 首頁圖片點開後，四張圖片代表什麼？
- 我可以在哪裡收藏圖片？
- 顧問會使用哪些資料理解我的需求？
- 我要去哪裡查看收藏、測驗結果與預約？
- Moodboard 的資料夾與軌道如何操作？

---

## 4. 導覽設計原則

### 4.1 採「分段式導覽」，不做一次性 10 步強制教學

導覽依功能情境拆成六個段落：

1. 首次進站與產品定位
2. 首頁探索與四領域延展
3. 圖片詳情與收藏
4. 個人選單與功能入口
5. Moodboard
6. 顧問諮詢

Style DNA 不納入本期使用者導覽流程；既有測驗與結果功能仍可正常使用。

每段只在使用者進入對應頁面時出現。避免一登入就連續跳十幾個 tooltip，畢竟使用者是來找靈感，不是參加公司新人訓練。

### 4.2 導覽只解釋當下可見、可操作的項目

- 不提前介紹尚未出現在畫面上的功能。
- 每一步最多一個主要操作。
- Tooltip 文案控制在標題 14 字、說明 50 字內。
- 需要分段操作時提供「下一步」與「略過此段」；最後一步使用「完成」或由指定操作結束。
- Flow B 在 B3 點擊延伸圖片後結束，不另外介紹返回按鈕。

### 4.3 導覽與產品狀態連動

導覽不可只是遮罩與文字，必須配合真實操作：

- 指定首頁圖片時，其他圖片暫時不可點擊。
- 導覽首頁箭頭與既有流動箭頭不可同時顯示。
- 使用者完成指定操作後才進入下一步。
- 跨頁後延續導覽狀態。
- 導覽結束後恢復所有互動。

---

## 5. 導覽入口與開關

### 5.1 首次進站入口

首次登入或首次註冊完成後，首頁進入一次性的沉浸式聚焦狀態，不顯示卡片式 Welcome Modal。

畫面只保留以下內容清晰可見：

- 現有 `Asterism` 大標題。
- 位於大標題上方的產品定位文案。
- `Start Tour` 與 `Explore on my own` 文字按鈕。
- 位於兩個文字按鈕右側的白色小箭頭。

其餘首頁內容以半透明黑色模糊背景遮罩覆蓋，且不可點擊或操作。產品定位文案先浮現，再依序浮現兩個文字按鈕；兩個箭頭持續做輕微左右晃動，提示文字可以操作。文案內容與語系對照以[使用者導覽雙語文案規格](user-tour-bilingual-spec.md)為準。

使用者只能透過上述兩個文字按鈕離開聚焦狀態；點擊背景或按下 `Escape` 均不關閉。

### 5.2 常駐入口

於右上角頭像選單或設定區新增：

- `使用者導覽`
- 狀態：`開啟 / 關閉`
- 操作：`重新開始導覽`

### 5.3 狀態保存

本期只保存登入後首次首頁聚焦導覽是否已處理：

```ts
const WELCOME_TOUR_STORAGE_KEY = 'asterism:tour:welcome';
const WELCOME_TOUR_HANDLED_VALUE = 'handled';
```

Phase 1 只需完成 `WELCOME_TOUR_STORAGE_KEY` 的本機保存。完整的跨流程狀態模型保留給後續階段：

```ts
interface LocalUserTourState {
  enabled: boolean;
  currentFlow: TourFlow | null;
  currentStep: number;
  completedFlows: TourFlow[];
  updatedAt: string;
}

type TourFlow =
  | 'welcome'
  | 'home-explore'
  | 'image-detail'
  | 'profile-navigation'
  | 'moodboard'
  | 'consultation';
```

Phase 2 為支援 Home、ImageSpread 與 PictureDetail 跨 route 延續，先建立使用者隔離的最小本機狀態：

登入後的 Welcome key 與核心狀態 key 均加上使用者 ID suffix，避免同一瀏覽器切換帳號時共用完成紀錄；既有未分流 Welcome key 會在首次讀取時搬移到當前帳號。

```ts
interface UserTourState {
  version: 1;
  enabled: boolean;
  status: 'idle' | 'active' | 'paused' | 'completed';
  step: UserTourStep | null;
  targetImageId?: string;
  updatedAt: string;
}
```

點擊 Pause 先以既有 `ModalOverlay.vue` 確認；確認暫停後保留進度，只有重新開始才重置進度。完整的常駐選單、各頁獨立重播與 `completedFlows` 保留給後續階段。本期不新增 schema、不同步 Supabase，也不建立登入後的雲端導覽狀態；跨裝置同步列為未來需求，未達到實際需求前不實作。

### 5.4 Phase 1 身份分流

- 未登入使用者：維持現有首頁圖片導覽流程。
- 已登入使用者：首次進入首頁時不自動啟動圖片導覽，先顯示首頁聚焦導覽；完成選擇後不再重複顯示。
- `Start Tour`：離開聚焦狀態，並接續首頁指定圖片導覽。
- `Explore on my own`：離開聚焦狀態，直接恢復首頁自由操作，不啟動後續導覽。
- 背景、頁首與其他首頁內容在聚焦狀態中均不可操作。
- Phase 1 只建立入口與狀態骨架；登入後的多步驟 target 導覽留到後續 Phase。

---

## 6. 導覽流程規格

## Flow A：首次進站與首頁探索

### 目標

讓使用者理解網站定位、首頁圖片可點擊，以及點擊後會進入風格延展。

| Step | Target         | 說明文案                                                                                         | 互動規則                                                                                               | 完成條件                         |
| ---- | -------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| A1   | 首頁聚焦導覽   | 產品定位文案（內容見雙語文案規格）。                                                        | 其餘首頁套用半透明黑色模糊遮罩並禁止操作；文案與兩個文字按鈕依序浮現；只能選擇開始導覽或自由探索       | 點擊任一文字按鈕                 |
| A2   | 首頁探索區     | 首頁是一座靈感星圖，每張圖片都可以展開探索。                                               | 選擇 `Start Tour` 後才顯示；背景降暗，僅保留指定圖片                                                   | 顯示完成                         |
| A3   | 指定圖片       | 點擊圖片，查看它在不同生活領域中的風格延伸。                                               | 僅指定圖片可點；隱藏原有首頁箭頭                                                                       | 點擊指定圖片                     |

選擇 `Explore on my own` 時，Flow A 於 A1 結束，首頁立即恢復自由操作，不進入 A2 與 A3。

### 驗收條件

- 首次登入後只顯示一次首頁聚焦導覽。
- 聚焦狀態只顯示 `Asterism` 大標題、產品定位文案、兩個文字按鈕與白色箭頭。
- 產品定位文案、`Start Tour`、`Explore on my own` 依序浮現。
- 兩個白色小箭頭位於文字按鈕右側，並做輕微左右晃動。
- 聚焦狀態中，背景點擊、`Escape` 與其他首頁操作都不能關閉或繞過導覽選擇。
- `Start Tour` 接續首頁指定圖片導覽；`Explore on my own` 不啟動後續導覽。
- 導覽中只有指定圖片可以觸發下一頁。
- 點擊其他圖片不跳頁，可輕微震動或顯示「請先點擊導覽圖片」。
- 進入延展頁後，自動接續 Flow B。

---

## Flow B：四大領域延展頁

### 目標

讓使用者理解中央圖片與四張延伸圖片的關係，並知道點擊延伸圖片可以繼續探索。

### 四張圖片意義

中央圖片代表目前的核心靈感；周圍四張圖片代表此風格在四大領域中的延伸應用，例如：

- 室內設計
- 燈具照明
- 裝飾細節
- 臥室或其他生活場景

實際領域名稱應由資料中的 `medium / subMedium` 動態帶入，不應把固定四種名稱硬寫死。

| Step | Target           | 說明文案                                       | 互動規則       | 完成條件       |
| ---- | ---------------- | ---------------------------------------------- | -------------- | -------------- |
| B1   | 中央圖片         | 這是你剛才選擇的核心靈感。                     | 僅說明，不阻擋 | 下一步         |
| B2   | 四張延伸圖片群組 | 周圍圖片顯示相同風格在不同生活領域中的延伸。   | 整組框選       | 下一步         |
| B3   | 任一延伸圖片     | 點擊延伸圖片，可繼續探索更細的主題與相似內容。 | 指定一張可點   | 點擊該延伸圖片 |

### UX 補充

- 四張圖片出現時，可增加短暫標題：`同一風格，不同生活領域`。
- 每張卡片保留明確分類標籤。
- Hover 或 focus 時顯示一句分類說明，避免標籤只剩名稱。

---

## Flow C：圖片詳情頁

### 目標

讓使用者理解左側縮圖、風格標籤、收藏與顧問諮詢入口。

| Step | Target         | 說明文案                                               | 互動規則                      | 完成條件         |
| ---- | -------------- | ------------------------------------------------------ | ----------------------------- | ---------------- |
| C1   | 左側懸浮縮圖   | 點擊縮圖，可以切換同一風格中的相關圖片。               | 指定縮圖顯示 focus ring       | 點擊縮圖         |
| C2   | 主題／風格標籤 | 標籤不只用來分類，也能查看風格背景、特徵與應用方式。   | 點擊標籤開啟 Popover / Drawer | 開啟說明         |
| C3   | 收藏功能       | 將圖片存入既有資料夾，或建立新的 Moodboard 資料夾。    | 開啟收藏選單                  | 完成收藏或下一步 |
| C4   | 顧問諮詢 CTA   | 顧問會結合這張圖片、Style DNA 與你填寫的需求提供建議。 | 顯示資料來源說明              | 下一步或進入諮詢 |

### 標籤知識說明規格

點擊風格標籤後顯示：

- 中文名稱與英文名稱
- 40–80 字風格描述
- 3–5 個視覺特徵
- 常見應用領域
- 相關標籤

建議使用 `Popover`（桌面）與 `Bottom Sheet`（手機），不要直接塞進 tooltip。

---

## Flow D：個人選單與功能入口

### 目標

讓使用者知道右上角頭像是主要功能導覽入口。

| Step | Target     | 說明文案                         | 完成條件 |
| ---- | ---------- | -------------------------------- | -------- |
| E1   | 右上角頭像 | 點擊頭像，可以開啟個人功能選單。 | 點擊頭像 |

選單項目可補上 icon 與一句次要說明，降低英文名稱帶來的理解成本；本段不逐項介紹選單內容。

---

## Flow E：Moodboard

### 目標

讓使用者理解收藏圖片、資料夾與軌道拖曳操作。

| Step | Target       | 說明文案                                   | 互動規則             | 完成條件         |
| ---- | ------------ | ------------------------------------------ | -------------------- | ---------------- |
| F1   | 中央收藏圖片 | 這裡會顯示你收藏的圖片，形成個人靈感集合。 | Highlight 中央區域   | 下一步           |
| F2   | 外圈資料夾   | 外圈代表不同 Moodboard 資料夾。            | Highlight 資料夾節點 | 下一步           |
| F3   | 軌道         | 拖曳軌道可以瀏覽其他資料夾。               | 顯示手勢動畫一次     | 實際拖曳或下一步 |
| F4   | 資料夾       | 點擊資料夾，查看其中收藏的圖片。           | 指定資料夾可點       | 點擊資料夾       |

### 空狀態處理

若使用者尚未收藏圖片：

- 不啟動完整 Moodboard 導覽。
- 顯示空狀態說明與 `前往探索圖片` CTA。
- 第一張收藏完成後，再提示可前往 Moodboard 查看。

---

## Flow F：顧問諮詢

### 目標

解釋諮詢服務的用途、資料使用方式與流程。

| Step | Target       | 說明文案                                                           |
| ---- | ------------ | ------------------------------------------------------------------ |
| G1   | 顧問諮詢入口 | 當你想把靈感落實到空間、穿搭或設計需求時，可以預約風格顧問。       |
| G2   | 資料來源說明 | 顧問可參考你選擇的圖片、Style DNA 結果與表單資訊，理解個人化需求。 |
| G3   | 預約流程     | 選擇方式與時間、填寫需求、完成付款後即可建立預約。                 |

### 隱私與透明度

進入表單前應清楚列出：

- 將提供給顧問的資料
- 哪些欄位為必要
- 圖片與 Style DNA 是否可取消附帶
- 付款與預約狀態如何查看

---

## 7. 導覽元件規格

### 7.1 元件組成

```txt
src/
├─ components/feature/guide/
│  ├─ HomeImageClickGuide.vue
│  ├─ HomeTourIntro.vue
│  ├─ UserTourActions.vue
│  └─ UserTourPauseModal.vue
├─ composables/guide/
│  ├─ useHomeImageGuide.ts
│  ├─ useHomeTourFlow.ts
│  ├─ usePageUserTour.ts
│  ├─ useUserTour.ts
│  ├─ useUserTourPresenter.ts
│  └─ useWelcomeTour.ts
├─ services/guide/
│  ├─ userTourDriver.ts
│  └─ userTourPause.ts
├─ constants/
│  └─ userTour.ts
└─ styles/
   └─ user-tour.css
```

Phase 2 已出現第二個以上的跨頁 target 流程，依既有 type-based 架構分離元件、composable、service、constants 與樣式；導覽狀態仍維持頁面級，不額外建立 Pinia Store、全域 `TourProvider` 或 Portal。

### 7.2 Tooltip 必要元素

- 步驟標題
- 簡短說明
- 必要時提供 `上一步`
- `下一步` 或指定操作提示
- `略過此段`
- `結束導覽`
- 目前進度，例如 `2 / 5`

### 7.3 RWD

- Desktop：Tooltip 靠近 target，避免遮住核心圖片。
- Tablet：限制寬度，必要時固定於畫面下方。
- Mobile：改用 Bottom Sheet，Spotlight 保留。
- Tooltip 不得超出 viewport。
- 使用 `ResizeObserver`、scroll 與 route change 重新計算位置。

### 7.4 Accessibility

- 導覽開啟時將焦點移入 Tooltip。
- 使用 focus trap。
- `Esc` 關閉導覽。
- `Tab` 順序合理。
- Tooltip 使用 `role="dialog"` 或合適的 ARIA 屬性。
- 不只靠顏色指出 target，需有邊框、光暈或箭頭。
- 尊重 `prefers-reduced-motion`。

---

## 8. 技術實作建議（Vue 3）

### 8.1 架構

```txt
src/
├─ components/feature/guide/HomeImageClickGuide.vue
├─ composables/guide/useHomeImageGuide.ts
└─ constants/userTour.ts
```

本期架構以現有專案為準：導覽元件、頁面級 composable 與常數依責任放入既有的 type-based 目錄。不為尚未實作的 Moodboard、顧問諮詢等流程預先建立 Store 或額外型別層。

### 8.2 Target 規範

導覽 target 使用穩定的 data attribute，不綁 Tailwind class 或 DOM 階層：

```html
<button data-guide-target="true" data-guide-image-index="5">探索圖片</button>
```

未來若流程數量增加，再抽出 `TourStep` 型別與各流程設定檔。

### 8.3 狀態邊界

- 以 `useUserTour` 管理最小狀態轉換，頁面只負責 DOM ready 與真實操作完成事件。
- 以登入使用者 ID 隔離的 `localStorage` 保存 `enabled`、執行狀態與必要流程進度。
- Driver.js 只處理 spotlight、popover、箭頭與定位，不直接操作 router 或 localStorage。
- 不建立 Pinia Store，不同步 Supabase，不修改 schema。
- 導覽完成或關閉後恢復原本互動。

### 8.4 不建議

- 一個大型 component 寫死全部頁面步驟。
- 用大量 `setTimeout` 猜 DOM 何時出現。
- 直接依賴 index 選取 DOM。
- 讓導覽操作與真實功能使用不同 mock handler。
- 在尚未有跨頁流程需求前，建立預測性的全域導覽狀態。

### 8.5 Driver.js 評估

Phase 1 不引入 Driver.js；登入後入口仍採首頁原生視覺語言，未登入首頁導覽也保留既有專用定位與互動邏輯。

Phase 2 因 Home、ImageSpread、PictureDetail 已形成多頁、多 target 流程，導入 Driver.js 作為單一 spotlight 與 popover 呈現層。Popover 使用 Asterism 半透明毛玻璃樣式、Driver.js 小箭頭及既有 `Button.vue`；所有標題、說明、區段與按鈕文案由現有 i18n 中英文語系提供。跨 route 狀態、真實點擊完成條件與生命週期仍由 Vue composable 管理。

---

## 9. 事件追蹤與成效指標

### 建議事件

```txt
tour_impression
tour_started
tour_step_viewed
tour_step_completed
tour_flow_skipped
tour_closed
tour_completed
tour_restarted
```

事件參數：

```ts
interface TourAnalyticsPayload {
  flow: TourFlow;
  stepId?: string;
  source: 'first-login' | 'profile-menu' | 'contextual-hint';
  durationMs?: number;
}
```

### 成效指標

- 首次導覽開始率
- 導覽完成率
- 各步驟跳出率
- 首次收藏完成率
- Moodboard 首次開啟率
- 顧問諮詢入口點擊率
- 導覽使用者與自由探索使用者的任務完成率差異

---

## 10. 驗收標準

### 功能

- [ ] 首次使用者可選擇開始導覽或自由探索。
- [ ] 使用者可於右上角選單重新開啟導覽。
- [ ] 導覽可跨 route 延續。
- [ ] 重新整理後可恢復進度。
- [ ] 每段可獨立略過。
- [ ] 導覽關閉後所有互動恢復。
- [ ] 指定操作完成後能正確前進。
- [ ] DOM target 不存在時不造成頁面錯誤，應略過或等待合理時間。

### UX

- [ ] Tooltip 不遮住主要操作。
- [ ] Desktop、Tablet、Mobile 均可使用。
- [ ] 導覽中不會同時出現既有提示箭頭。
- [ ] 使用者可以隨時退出。
- [ ] 文案解釋「為什麼做」，不只描述「按哪裡」。

### Accessibility

- [ ] 支援鍵盤操作與 Esc 關閉。
- [ ] Focus trap 正常。
- [ ] Screen reader 可讀取標題與內容。
- [ ] Reduced motion 下停用非必要動畫。

### 測試

- [ ] Vitest：composable 狀態轉換、flow 切換、localStorage 持久化。
- [ ] Component test：Tooltip 定位、按鈕與 focus。
- [ ] Playwright：首次登入到完成首頁導覽。
- [ ] Playwright：跨頁延續至圖片詳情。
- [ ] Playwright：略過、關閉、重新開始。
- [ ] Playwright：Mobile Bottom Sheet。

---

## 11. 開發任務拆解

## 使用者導覽任務清單

### Phase 1 — 導覽骨架（進行中）

- [x] 保留未登入使用者現有首頁圖片導覽（Frontend）
- [x] 建立登入後首頁聚焦導覽與一次性顯示狀態（Frontend）
- [x] 建立 `Start Tour`／`Explore on my own` 行動分流（Frontend）
- [x] 聚焦狀態中遮蔽並禁止操作其他首頁內容（Frontend）
- [x] 補齊繁中與英文首頁聚焦導覽文案（Frontend）
- [x] 評估 Driver.js：Phase 1 不引入（Architecture）

以下項目留待後續多步驟導覽需要時再建立：

- [ ] 通用 `TourFlow`、`TourStep` 與跨頁狀態模型
- [ ] 通用 `data-tour` selector 與流程設定檔

### Phase 2 — 核心流程（預計 2 天）

- [x] 導入 Driver.js，完成毛玻璃 popover、小箭頭、共用 Button 與中英文案（Frontend）
- [x] 建立使用者隔離的最小本機狀態與 pause／resume／restart 語意（Frontend）
- [x] 導覽期間只開放 Header 語言切換，切換後即時重繪當前步驟；其他導航維持鎖定（Frontend）
- [x] Pause 使用既有 ModalOverlay 二次確認，互動步驟不顯示無功能的 Next（Frontend）
- [x] 實作 Welcome、首頁探索、四領域延展導覽（Frontend）
- [x] 實作圖片詳情縮圖、風格標籤與收藏入口導覽（Frontend）
- [x] 處理跨 route 延續、重新整理恢復與互動鎖定（Frontend）
- [x] 隱藏既有首頁箭頭，避免提示衝突（Frontend）

### Phase 3 — 個人化功能（預計 2 天）

- [x] AppHeader 常駐 Target 導覽控制入口（Frontend）
- [x] 導覽控制支援開始、繼續、重新開始與完成後重播（Frontend）
- [ ] 個人選單導覽（Frontend）
- [ ] Moodboard 軌道與資料夾導覽（Frontend）
- [ ] 顧問諮詢說明（Frontend）

### Phase 4 — 本機狀態與測試（預計 1.5–2 天）

- [ ] 建立 UserMenu 動態選單與各頁獨立重播（Frontend）
- [x] 補 Phase 2 狀態、Driver adapter 與核心頁面 Vitest（Frontend）
- [ ] 補完整 Playwright 跨頁流程測試（Frontend）
- [ ] RWD、Accessibility、Reduced motion 驗證（Frontend）
- [ ] 評估既有事件追蹤能力；本期不新增資料表或追蹤服務（Frontend）

### Definition of Done

- 首次使用者能理解主要功能並完成一次首頁圖片探索。
- 導覽可自由開關、略過與重新開始。
- 導覽可跨頁保存進度。
- 核心流程 E2E 測試通過。
- 首頁圖片探索與圖片詳情之間形成可理解的操作閉環。

---

## 12. 優先級建議

### P0：先修產品斷點

1. 首頁、四領域延展、圖片詳情與收藏形成第一條完整導覽。
2. 右上角選單加入導覽重新開啟入口。

### P1：補齊主要功能教學

1. 圖片詳情縮圖與標籤說明。
2. Moodboard 軌道與資料夾操作。
3. 顧問諮詢資料來源與價值說明。

### P2：優化與量測

1. 導覽事件分析。
2. 依使用行為顯示 contextual hint。
3. 對未完成任務提供非阻塞式提醒。
4. 確有跨裝置需求時，再評估雲端同步導覽狀態。

---

## 13. 最終建議

第一版不要一次實作六條完整導覽。MVP 應先完成：

`Welcome → 首頁圖片 → 四領域延展 → 圖片詳情／收藏`

這條路徑最能直接回答「網站是做什麼」：發現靈感、理解延伸、查看細節並保存偏好。個人選單 E1、Moodboard 與顧問諮詢依實際頁面成熟度再接續導覽。

導覽可以降低理解成本，但不能代替功能閉環；本期先確保首頁探索到圖片詳情的操作回饋清楚。
