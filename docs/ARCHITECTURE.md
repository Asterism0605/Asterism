# Asterism 專案架構文件 (Architecture Documentation)
<!-- > **📐 本文件與 `vue3-team-guideline.md` 保持一致。**
> 開發規範細節（命名規則、Git 流程、Pinia 寫法等）請直接參閱該文件。 -->
---

## 1. 系統概述

Asterism 是一個結合 AI 推薦、美學 DNA 分析與靈感收藏的生活風格探索平台。專案以視覺感官、高端美學為核心，使用者可透過盲選測驗建立美學人格，並在沉浸式的瀑布流（Masonry）圖片牆中探索靈感、建立並管理個人 Moodboard。

### 核心功能 (MVP 範疇)
- **Explore 首頁**：沉浸式瀑布流圖片牆，支援分類篩選與無限滾動。
- **美學 DNA 測驗**：多輪圖片二選一盲選，依權重計算美學人格與推薦色盤。
- **Moodboard 系統**：使用者可將收藏的圖片加入自訂看板，並可進行拖曳排版。
- **身份驗證與收藏**：輕量級 JWT 登入/註冊，提供跨裝置的收藏同步。

---

## 2. 技術棧 (Tech Stack)

### 前端 (Frontend)
- **核心框架**：Vue 3 (Composition API, `<script setup lang="ts">`) + TypeScript strict mode
- **建構工具**：Vite 8 + vue-tsc 3 (type-checking)
- **狀態管理**：Pinia（Composition API 風格）
- **路由管理**：Vue Router 4
- **樣式方案**：Tailwind CSS v4，透過 `@theme` 定義 Design Tokens
- **字體**：Fustat（標題）、Inter + Noto Sans TC（內文）、JetBrains Mono（等寬）

### 後端 (Backend) - *預計 Week 3 啟動*
- **核心框架**：Node.js + Express + TypeScript
- **資料庫**：PostgreSQL + pgvector (向量搜尋預留)
- **身份驗證**：JWT (Json Web Token)

---

## 3. 前端架構與目錄結構

```
src/
├── api/               # API 呼叫函數（只負責打 HTTP 請求，不做業務判斷）
├── assets/            # 靜態資源（圖片、Logo、字體等）
├── components/        # 可重複使用的 UI 元件（如 ImageCard, ThemeTag）
├── composables/       # 可重複使用的邏輯（useXxx，如 useAuth, useInfiniteScroll）
├── layouts/           # 頁面佈局元件（如 AppHeader, PageContainer）
├── pages/             # 頁面級元件，每個路由對應一個檔案（如 ExplorePage, LoginPage）
├── router/            # 路由定義與 Navigation Guards
├── services/          # 業務邏輯層（組合 api/，處理結果後寫入 store，供 pages 呼叫）
├── stores/            # Pinia 全域狀態（Composition API 風格，檔名 xxx.store.ts）
├── styles/            # 全域樣式與 Design Tokens（main.css，Tailwind @theme）
├── types/             # TypeScript 型別定義（用 interface，type 僅用於 union/別名）
├── utils/             # 工具函數（formatDate, debounce 等）
├── App.vue            # 根元件
└── main.ts            # 專案入口
```

### 各層職責

| 目錄 | 負責什麼 | 不負責什麼 |
|------|---------|-----------|
| `api/` | 打 API 的原始函數 | 業務邏輯、狀態管理 |
| `components/` | 可被多頁共用的 UI 元件 | 只用一次的頁面元件 |
| `pages/` | 頁面級元件（對應路由） | 小 UI 片段 |
| `services/` | 呼叫 `api/` 並處理結果、寫入 store | UI 邏輯、直接打 API |
| `stores/` | 跨頁面共享的狀態 | 單一元件內用的狀態 |
| `composables/` | 可複用的有狀態邏輯 | UI 模板 |
| `layouts/` | 頁面佈局元件（AppHeader, PageContainer） | 業務邏輯 |
| `utils/` | 純函數工具 | 有副作用的邏輯 |

### 頁面專用元件的擺放

```bash
# 只有在一個頁面使用的子元件，放在該頁面旁邊
pages/
  ImageDetail/
    ImageDetail.vue          # 頁面本體
    ImageDetailPanel.vue     # 只有這頁用的子元件
    SimilarImageRow.vue
```

---

## 4. 設計系統與 Design Tokens

Design Tokens 定義於 `src/styles/main.css` 的 `@theme` 區塊中，所有顏色、字體、間距**一律使用 CSS Variable，不得寫死色碼**。

### 色彩系統 (Color Tokens)

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-void` | `#060608` | 最深背景 |
| `--color-deep` | `#0E0E12` | 次深背景 |
| `--color-elevated` | `#17171D` | 卡片／區塊背景 |
| `--color-overlay` | `#222228` | 彈窗／懸浮層背景 |
| `--color-text-primary` | `#F0EDE6` | 主文字（暖白） |
| `--color-text-secondary` | `#8A8880` | 次文字（中灰） |
| `--color-stellar-red` | `#C45C3A` | 點綴橘紅 |
| `--color-gold-dim` | `#A8893A` | 點綴金黃 |

### 字體系統 (Font Families)

| Token | 字體 | 用途 |
|-------|------|------|
| `--font-family-title` | Fustat, Noto Sans TC | 標題 |
| `--font-family-body` | Inter, Noto Sans TC | 內文 |
| `--font-family-mono` | JetBrains Mono | 等寬字（標籤、關鍵字） |

### 排版階層

| Utility Class | 用途 |
|-------------|------|
| `.text-display` | 展示級大標（clamp 3.5rem–8rem） |
| `.text-h1` | 一級標題（clamp 2rem–2.75rem） |
| `.text-h2` | 二級標題（clamp 1.5rem–2.25rem） |
| `.text-body` | 正文（1rem） |
| `.text-caption` | 輔助文字（0.875rem） |
| `.text-mono` | 等寬文字（0.75rem） |

### 圓角與間距

- **圓角**：`2px`（按鈕／Tag）、`4px`（卡片／圖片）、`8px`（Modal／資料夾），避免大圓角（pill shape）除非設計稿指定。
- **間距**：採用 8pt Grid System — `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 px`。

---

## 5. API 架構

採用**兩層分離**設計：

```
pages（頁面）
  └─ 只呼叫 services/
       └─ services 組合 api/ 的函數
            └─ api/ 負責實際打 HTTP 請求
```

- **`api/`** — 只負責發送 HTTP 請求，不做任何業務判斷。
- **`services/`** — 呼叫 `api/` 的函數，處理回覆、錯誤處理、將結果寫入 Store。
- **`pages/`** — 只管 UI 與使用者互動，只呼叫 `services/`，不直接碰 `api/`。

---

## 6. 命名規則速覽

| 類別 | 規則 | 範例 |
|------|------|------|
| Vue 元件 | PascalCase | `UserCard.vue` |
| Composables | `use` + PascalCase | `useAuth.ts` |
| Store 檔案 | `xxx.store.ts` | `auth.store.ts` |
| API 檔案 | `xxx.api.ts` | `auth.api.ts` |
| 變數 | camelCase | `isLoading` |
| 常數 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 型別 | `interface` 物件, `type` union/別名 | `interface UserProfile` |

---

## 7. 品質規範

- **TypeScript strict mode**：Props、API 回應皆需定義明確型別，避免使用 `any`。
- **ESLint + Prettier**：強制執行程式碼風格，`npm run lint` 無誤方可合併。
- **Composition API**：不使用 Options API。
- **CSS Variable**：顏色一律使用 `var(--color-xxx)`，不寫死 hex。