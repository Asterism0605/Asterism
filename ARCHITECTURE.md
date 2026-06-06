# Asterism 專案架構文件 (Architecture Documentation)

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
- **核心框架**：Vue 3 (Composition API) + TypeScript
- **建構工具**：Vite
- **狀態管理**：Pinia
- **路由管理**：Vue Router
- **樣式方案**：Vanilla CSS / CSS Variables (可選配 Tailwind CSS v3/v4 作為實作輔助)
- **核心套件**：
  - `vue-masonry-wall`：用於高效瀑布流排版。
  - `vuedraggable`：用於 Moodboard 圖片拖曳排版。

### 後端 (Backend) - *預計 Week 3 啟動*
- **核心框架**：Node.js + Express + TypeScript (或 Supabase 快速方案)
- **資料庫**：PostgreSQL + pgvector (向量搜尋預留)
- **身份驗證**：JWT (Json Web Token)

---

## 3. 前端架構與目錄結構

前端專案將初始化於根目錄下，結構定義如下：

```
Asterism/
├── src/
│   ├── assets/             # 靜態資源 (圖片、Logo 等)
│   ├── components/         # 全域可重用 UI 元件 (如 BaseButton, BaseInput)
│   ├── features/           # 依業務功能劃分的模組 (如 dna-test, moodboard, explore)
│   ├── layouts/            # 頁面佈局元件 (如 AppHeader, PageContainer)
│   ├── router/             # 路由定義與 Navigation Guards
│   ├── services/           # API 請求層與 Axios 實例配置
│   ├── stores/             # Pinia 狀態管理 (auth, image, moodboard)
│   ├── styles/             # 全域樣式與 Design Tokens (CSS Variables)
│   ├── types/              # TypeScript 類型定義 (*.d.ts)
│   ├── views/              # 路由頁面元件 (Explore, Login, Moodboard)
│   ├── App.vue             # 根元件
│   └── main.ts             # 專案入口
├── ARCHITECTURE.md         # 本架構文件
├── package.json
└── vite.config.ts
```

---

## 4. 設計系統與 Design Tokens (Day 2)

依據設計稿與色彩系統圖片，我們定義以下核心變數於 `src/styles/tokens.css` 中：

### 色彩系統 (Color Tokens)
- `--color-void`: `#060608` (極深黑背景)
- `--color-deep`: `#0E0E12` (主背景)
- `--color-elevated`: `#17171D` (卡片與區塊背景)
- `--color-overlay`: `#222228` (彈窗與懸浮層背景)
- `--color-text-primary`: `#F0EDE6` (主文字色，暖白)
- `--color-text-secondary`: `#8A8880` (次文字色，中灰)
- `--color-stellar-red`: `#C45C3A` (點綴橘紅)
- `--color-gold-dim`: `#A8893A` (點綴金黃)

### 字體與排版 (Typography)
- **字型**：優先選用 `Outfit` (標題) 與 `Inter` / `Noto Sans TC` (內文)。
- **字重**：Regular (400), Medium (500), SemiBold (600), Bold (700)。

### 圓角與間距 (Layout Tokens)
- **圓角 (Border Radius)**：`--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 16px`, `--radius-full: 9999px`。
- **毛玻璃效果 (Glassmorphism)**：配合深色底層，使用 `backdrop-filter: blur(10px)` 與半透明邊框。

---

## 5. 安全性與品質規範

- **TypeScript 強型別**：所有元件的 Props、API 回應皆需定義明確型別，避免使用 `any`。
- **ESLint & Prettier**：強制執行程式碼風格排版，確保專案品質。
- **語意化 HTML**：使用 `header`, `main`, `footer`, `section` 等標籤提升 SEO 與可讀性。