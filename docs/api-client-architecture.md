# API Client 架構說明

> 狀態：MVP mock flow 階段  
> 目的：先建立前端 API contract 與替換邊界，讓目前的 mock 流程未來可以平滑換成真實後端 API。

## 目前這一階段在做什麼

這一階段不是正式 backend auth，也不是正式資料庫串接。

目前建立的是前端 API 架構骨架：

```txt
Page / Component
  -> Store 或 Service
    -> api/*.api.ts
      -> httpClient.ts 或 mockAdapter.ts
```

換句話說，頁面不直接碰 axios，component 也不直接處理 HTTP。頁面只負責 UI 與流程組裝，商業流程放在 service，跨頁狀態放在 Pinia store，HTTP 或 mock API contract 放在 `src/api/`。

## 各檔案責任

| 檔案 | 責任 |
|---|---|
| `src/types/api.ts` | 定義共用 API contract，例如 `ApiResponse<T>`、`ApiError`、`ApiMeta` |
| `src/api/httpClient.ts` | 建立 axios instance，集中設定 `baseURL`、`timeout`、interceptors、錯誤整理 |
| `src/api/mockAdapter.ts` | 建立 mock response/error/delay helper，讓 mock API 回傳形狀接近真 API |
| `src/api/*.api.ts` | 定義某個 domain 的 API function，例如 `registerApi`、`loginApi` |
| `src/services/*.service.ts` | 呼叫 API function，整理 response data，包裝商業流程 |
| `src/stores/*.store.ts` | 保存跨頁需要的全域狀態，例如目前登入的 user/session |
| `src/pages/*.vue` | 呼叫 store/service，處理 UI loading/error/redirect，不直接 import axios |

## Auth Flow 現在怎麼跑

目前 register/login 是 mock flow，資料流如下：

```txt
SignUp.vue / Login.vue
  -> useAuthStore().register() / useAuthStore().login()
    -> auth.service.ts register() / login()
      -> auth.api.ts registerApi() / loginApi()
        -> mockAdapter.ts createMockSuccess()
```

`auth.store.ts` 只保存跨頁會用到的資料：

- `user`
- `session`
- `isAuthenticated`

它不保存表單 input，例如 email/password 的暫存值。這些仍應放在 `SignUp.vue` / `Login.vue` 的 local state。

## 為什麼需要 httpClient 和 mockAdapter

`httpClient.ts` 是未來真 API 的入口。正式 backend 接上後，`api/*.api.ts` 可以改成：

```ts
const response = await httpClient.post<ApiResponse<AuthSession>>('/auth/login', payload)
return response.data
```

`mockAdapter.ts` 是現在 MVP 階段的替身。它讓 mock 回傳也長得像 API response：

```ts
createMockSuccess(session)
```

這樣 service/store/page 不需要知道資料到底來自 mock 還是真 backend。未來替換時，理想狀況是只改 `src/api/*.api.ts`，不要大幅改頁面或 component。

## 未來新增 API 時怎麼做

假設要新增 Moodboard 儲存圖片流程，建議順序是：

1. 在 `src/types/moodboard.ts` 定義型別。
2. 在 `src/api/moodboard.api.ts` 定義 API function。
3. MVP 階段先用 `mockAdapter.ts` 回傳 `ApiResponse<T>`。
4. 在 `src/services/moodboard.service.ts` 呼叫 API 並整理資料。
5. 若資料跨頁共享，再建立 `src/stores/moodboard.store.ts`。
6. Page/component 呼叫 service/store，不直接碰 axios，也不直接組 API response。

## 邊界規則

- `component/page` 不直接 import `axios`。
- `service` 不直接 import `axios`，只呼叫 `api/*.api.ts`。
- `api/*.api.ts` 可以使用 `httpClient` 或 `mockAdapter`。
- `store` 保存跨頁狀態，不保存表單暫存 input。
- `types` 放共用型別，不把型別散落在頁面裡。
- mock flow 也要回傳接近真 API 的 shape，避免未來替換時整個 UI 重寫。

## Image Mock Data 的目前決策

`src/api/image.api.ts` 目前會從 `src/data/style-data.json` 回傳 mock images。這不是第二份資料來源，而是把既有 JSON dataset 包成 `ApiResponse<StyleImage[]>`，讓 image API skeleton 對 Demo 主流程有實際資料可用。

目前邊界如下：

- `style-data.json` 是 MVP image mock data 的 single source of truth。
- `image.api.ts` 只負責回傳 mock image dataset。
- 首頁挑選圖片、related images、排序、補足數量等邏輯仍放在 `image.service.ts`。
- `image.api.ts` 不應該開始保存假收藏狀態、假分頁狀態或假資料庫關聯。

未來如果 image mock 需要分頁、查詢條件、收藏狀態或跨 API 共用資料，再拆到 `src/api/mocks/` 或專門的 mock repository；不要讓 `image.api.ts` 長成假後端。

## 現在仍然不是正式功能的部分

目前還沒有：

- 正式 backend auth
- 正式 JWT refresh token
- Google OAuth
- 真實註冊資料庫
- server session persistence

所以現在的 auth session token 是 mock token，只是為了讓前端 onboarding flow 可以先建立完整資料流與狀態邊界。
