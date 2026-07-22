# ⁂ Asterism

![Version](https://img.shields.io/badge/version-1.0.0-555)

> **將散落的美學，連成屬於你的星座 --**
> _Discover your aesthetic. Build your visual identity._

Asterism 是一個美感靈感探索平台，協助使用者探索圖片、整理 Moodboard，並透過 Style DNA 與相似圖片推薦建立個人風格脈絡。

---

## 功能

- 圖片探索、詳情與相似圖片關聯
- 以圖搜圖與本機 CLIP 圖片嵌入
- Moodboard 資料夾與收藏管理
- Style DNA 測驗、分析結果與個人化首頁
- 帳號註冊、登入、第三方登入與密碼重設
- 風格顧問推薦、預約與諮詢紀錄
- 中英文介面與站內使用者導覽

## 技術棧

| 類別       | 技術                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 核心       | ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)                                                                                                 |
| 路由與狀態 | ![Vue Router](https://img.shields.io/badge/Vue_Router-4FC08D?logo=vuerouter&logoColor=white) ![Pinia](https://img.shields.io/badge/Pinia-FFD859?logo=pinia&logoColor=222)                                                                                                                                                                                     |
| 樣式與介面 | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide-F56565?logo=lucide&logoColor=white) ![Vue I18n](https://img.shields.io/badge/Vue_I18n-42B883?logo=vuedotjs&logoColor=white)                                                                                  |
| 視覺與動態 | ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white) ![GSAP](https://img.shields.io/badge/GSAP-0AE448?logo=greensock&logoColor=050505) ![D3 Force](https://img.shields.io/badge/D3_Force-F9A03C?logo=d3&logoColor=white) ![Driver.js](https://img.shields.io/badge/Driver.js-7C3AED)                                     |
| 資料與驗證 | ![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)                                                                                                                                                                                        |
| 圖片分析   | ![Transformers.js](https://img.shields.io/badge/Transformers.js-FFD21E?logo=huggingface&logoColor=111)                                                                                                                                                                                                                                                        |
| 品質工具   | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white) ![Vue Test Utils](https://img.shields.io/badge/Vue_Test_Utils-4FC08D?logo=vuedotjs&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=222) |

## 安裝與啟動

### 環境需求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm

### 本機開發

```bash
git clone <repository-url>
cd Asterism
npm install
```

複製環境變數範例並填入實際值：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

啟動開發伺服器：

```bash
npm run dev
```

### 環境變數

| 變數                     | 用途                  |
| ------------------------ | --------------------- |
| `VITE_API_BASE_URL`      | 後端 API 基底網址     |
| `VITE_SUPABASE_URL`      | Supabase 專案網址     |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公開金鑰 |

### 常用指令

```bash
npm run dev       # 啟動開發伺服器
npm run build     # 型別檢查並建立正式版本
npm run preview   # 預覽正式版本
npm run lint      # 執行 ESLint 並修正可自動修正的問題
npm run test      # 執行測試
```

## 文件導覽

- [架構文件](./docs/ARCHITECTURE.md)
- [使用者導覽企劃與規格](./docs/user-guide/user-tour-plan-and-spec.md)
- [Pull Request 提交範本](./.github/PULL_REQUEST_TEMPLATE.md)

## 聯絡我們

如有問題或建議，請寄信至 [asterism.f2e@gmail.com](mailto:asterism.f2e@gmail.com)。

## License

本專案採用 [MIT License](https://opensource.org/license/mit/)。
