# Asterism 架構文件

本文件說明 Asterism 前端目前的執行方式、分層邊界與主要整合。

## 1. 系統概覽

Asterism 是以 Vue 3 建置的單頁應用程式，主要包含：

- 圖片探索、圖片詳情、相似圖片與以圖搜圖
- Moodboard 收藏與資料夾管理
- Style DNA 測驗、結果與首頁個人化
- Supabase 帳號驗證與角色權限
- 風格顧問推薦、預約、付款結果與諮詢紀錄
- 中英文介面與站內導覽

目前 repository 只包含前端。資料由 Supabase、`VITE_API_BASE_URL` 指向的 REST API，以及打包於前端的 fallback 資料提供。

## 2. 技術棧

目前使用的技術與開發工具請參考 [README 技術棧](../README.md#技術棧)。

## 3. 啟動流程

`src/main.ts` 在掛載應用程式前依序完成：

1. 建立 Pinia，初始化 Auth、Style DNA 與 Moodboard stores。
2. 從本機儲存還原 Style DNA 結果。
3. 嘗試還原 Supabase session。
4. 已登入時，同步 Style DNA 並載入 Moodboard。
5. 載入 Supabase 圖片資料；失敗時由 API 層使用打包 JSON fallback。
6. 註冊 Pinia、Vue Router、Vue I18n 並掛載應用程式。

驗證或圖片載入失敗不會阻止應用程式掛載，避免外部服務異常時出現白畫面。

## 4. 分層與資料流

```text
page / component
       |
       v
service / composable
       |
       v
api -> Supabase / REST API / bundled fallback data

Pinia store <-> service
```

| 分層                    | 責任                                          |
| ----------------------- | --------------------------------------------- |
| `pages/`、`components/` | 畫面呈現、使用者互動與頁面組合                |
| `composables/`          | 可重用的 UI 或流程邏輯，包含生命週期清理      |
| `stores/`               | 跨頁共享狀態與 domain actions                 |
| `services/`             | 業務流程、資料正規化、API 協調與 store 串接   |
| `api/`                  | HTTP、Supabase 與 fallback data 的原始存取    |
| `types/`                | API、domain 與 UI 共用的 TypeScript contracts |
| `utils/`                | 無副作用的共用函式                            |

頁面與元件應呼叫 `services/`，不直接組合複雜 API 流程。`api/` 不處理業務判斷。

## 5. 目錄結構

```text
src/
├── api/          HTTP client、Supabase client 與原始資料請求
├── assets/       圖片、字型與靜態資源
├── components/   auth、effects、feature、legal、overlay、sections、ui 元件
├── composables/  可重用流程與 UI 邏輯
├── config/       應用程式設定
├── constants/    共用常數
├── data/         靜態資料與 fallback data
├── i18n/         中英文翻譯與法律文件內容
├── layouts/      跨頁版面元件
├── pages/        Vue Router 頁面元件
├── router/       路由表與權限 guard
├── services/     業務流程與資料映射
├── stores/       setup-style Pinia stores
├── styles/       Tailwind theme、全域樣式與導覽樣式
├── tests/        Vitest 測試與共用 setup
├── types/        TypeScript contracts
└── utils/        純工具函式
```

現有功能仍以 `components/feature/` 為主；只有已具備明確 domain 邊界的程式碼放入 `features/`。不要只為統一目錄而搬移既有檔案。

## 6. 狀態與持久化

Pinia stores 依 domain 拆分，包括 Auth、Moodboard、Style DNA、Image Search 與上傳圖片預覽。元件內的表單、modal、tab 等單頁狀態維持在元件或 composable。

主要持久化來源：

- Supabase session：登入狀態與自動更新 token
- Supabase database：使用者、圖片、Moodboard 與 Style DNA 等伺服器資料
- Local Storage：可安全在本機還原的導覽或 Style DNA 狀態
- Session Storage：付款與跨頁流程所需的暫時狀態

伺服器資料、本機狀態與 route query 不應保存同一份 source of truth。

## 7. 外部服務與 API

### Supabase

`src/api/supabaseClient.ts` 以 lazy singleton 建立 client，負責 Auth、database 與 OAuth callback session。需要 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`。

### REST API

`src/api/httpClient.ts` 提供共用 Axios instance：

- base URL 由 `VITE_API_BASE_URL` 設定
- timeout 為 10 秒
- response interceptor 將錯誤正規化為 `ApiError`

顧問預約、付款等流程透過 service 組合 REST requests、Supabase session 與 domain data。

### 圖片資料與搜尋

圖片 API 優先讀取 Supabase，服務不可用時回退至打包 JSON。以圖搜圖頁面 lazy-load Transformers.js，在瀏覽器端產生 CLIP embedding，再交由搜尋流程取得相似結果。

## 8. 路由與權限

Vue Router 使用 HTML5 history mode。Route meta 支援：

| Meta                 | 用途             |
| -------------------- | ---------------- |
| `requiresAuth`       | 僅限已登入使用者 |
| `requiresAdmin`      | 僅限管理員       |
| `requiresConsultant` | 僅限顧問帳號     |

`src/router/authGuard.ts` 依 Auth store 的 session 與角色資訊決定放行或重新導向。圖片詳情另在進入前驗證圖片 ID，不存在時導向 404。

## 9. 樣式、動態與國際化

- Tailwind CSS 4 透過 Vite plugin 載入。
- `src/styles/main.css` 的 `@theme` 是顏色、字型與共用 design tokens 的 source of truth。
- Three.js 與 D3 Force 處理 Moodboard 與圖片關聯視覺化。
- GSAP 與 Driver.js 處理動態與站內導覽。
- Vue I18n 管理中英文介面；法律文件內容集中於 `src/i18n/legal/`。

## 10. 測試與建置

Vitest 使用 jsdom，設定集中在 `vite.config.ts`，共用 setup 位於 `src/tests/setup.ts`。

```bash
npm run lint
npm run test
npm run build
```

`npm run build` 會先執行 `vue-tsc -b`，再由 Vite 建立正式版本。
