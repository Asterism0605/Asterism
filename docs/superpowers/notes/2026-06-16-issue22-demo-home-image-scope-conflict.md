# Issue #22 demo 與 Issue #44 首頁圖片分佈的範圍衝突

**發現時間:** 2026-06-16,在 `demo/image-spread` 分支實機測試時發現。

## 問題

`demo/image-spread` 分支（Issue #22 支線 A demo）把 `src/services/image.service.ts` 的
資料來源整個換成打 Express API（`fetchImagesApi()` → PostgreSQL 239 張抓回來的外部圖），
而且 `getHomeInspirationImages()` 跟 `getRelatedImages()`/`getImageById()` 共用同一個
`loadImages()` 快取/資料池。

**這是錯的範圍劃分。** 使用者澄清的正確設計：

- **首頁圖片**：固定由使用者（組員）提供的本地素材，9 個風格 × 3 張 = 27 張，
  完全在本地、**不需要也不應該**去抓 Pexels/Unsplash 的圖。
  這個機制本來就是另一個 issue（Issue #44 首頁圖片分佈）已經做的事——
  詳見 memory `project_issue44_home_image_distribution.md`：
  分支 `feat/home-image-distribution`、commit `4e34c54`（未 push），
  等組員提供 27 張「概念照」（無 `medium` 欄位）才會開 PR。
- **延展圖片（同風格延展）**：使用者點擊首頁圖片**進入** image-spread 頁面之後，
  才需要去「延展池」找同風格的更多圖——這個延展池才是 Issue #22 支線 A
  抓回來、CLIP 分類好、存進 PostgreSQL 的那 239 張外部圖。

兩者是**互相獨立的兩個資料來源**，不應該共用 `image.service.ts` 裡同一個
`loadImages()` 快取。

## 目前 demo 分支的實際症狀

- `npm run enrich:images` 成功跑完，PostgreSQL `images` 表有 239 筆，9 個風格組都覆蓋到。
- `GET /api/images`、Vite proxy 都驗證正常（curl 測試 200，資料正確）。
- 但首頁 (`Home.vue`) 改成跟 `getRelatedImages` 共用同一個 API 資料源後，
  首頁不再顯示原本本地 3 張（id 含 `main` 的那批）代表圖，而是改用抓回來的 239 張裡
  挑出來的圖——這不符合使用者預期，使用者形容為「首頁圖片不見了」。

## 需要的修正方向（尚未實作，等之後重新設計）

把 `image.service.ts` 拆成兩條獨立的資料來源：

1. `getHomeInspirationImages()`：維持/改回讀本地素材（最終是 27 張，
   9 風格 × 3 張，來自 Issue #44 那批概念照），**不要**呼叫 `fetchImagesApi()`。
2. `getRelatedImages()` / `getImageById()`：才呼叫 `fetchImagesApi()`，
   走 Issue #22 支線 A 的 239 張外部圖延展池。

需要重新檢視：

- 是否要等 Issue #44 的 27 張概念照分支（`feat/home-image-distribution`）先合併，
  再決定 `image.service.ts` 怎麼分流兩種資料源。
- `image-spread` 流程裡，使用者從首頁點進去的「起點圖片」（`centerImage`/`rootImage`）
  本身是本地圖（27 張之一），但點進去之後的「延展/同風格更多圖」要從外部 239 張池子找——
  這代表 `getImageById(imageId)` 可能也要區分「這是本地圖 id 還是外部圖 id」，
  或者本地圖跟外部圖需要能用同一個 id 空間互相查找關聯（例如本地圖也要有 `styleGroup`
  欄位才能去外部池子找同 styleGroup 的延展圖）。這個串接細節也還�Think需要再設計。

## 不在這次修正範圍

- 不動 `docs/superpowers/plans/2026-06-16-issue22-frontend-demo-implementation.md`
  已完成的 15 個任務本身的程式碼（離線 CLIP 腳本、Postgres schema、Express API 都是對的，
  問題只在前端 `image.service.ts` 怎麼分流首頁跟延展兩種資料源）。
- 不在本次對話實作修正，先寫成這份筆記，下次有 token/時間再回來重新設計。
