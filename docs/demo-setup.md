# Issue #22 支線 A Demo 環境設定

對應設計文件：`docs/superpowers/specs/2026-06-16-issue22-frontend-demo-design.md`

## 路徑 A：從頭跑離線辨識（需要 API key，較久）

1. 啟動本機 PostgreSQL（Docker 或本機安裝）。
2. 建表：
   ```
   psql $DATABASE_URL -f scripts/schema.sql
   ```
3. 複製 `.env.example` 成 `.env`，填入 `PEXELS_API_KEY`、`UNSPLASH_ACCESS_KEY`、`DATABASE_URL`。
4. 跑離線腳本（第一次會下載 CLIP 模型，需要幾分鐘）：
   ```
   npm run enrich:images
   ```
5. 啟動 Express API：
   ```
   npm run server
   ```
6. 啟動前端：
   ```
   npm run dev
   ```
   開 `/images/:imageId`，連續點擊延展體驗。

## 路徑 B：直接灌種子資料（不用申請 API key）

1. 建表（同路徑 A 的 Step 2）。
2. 灌種子資料：
   ```
   psql $DATABASE_URL -f scripts/seed-dump.sql
   ```
3. 接路徑 A 的 Step 5、6。

## 種子資料怎麼來的

`scripts/seed-dump.sql` 是路徑 A 跑完一次之後，用以下指令 dump 出來的：
```
pg_dump --table=images --data-only --inserts $DATABASE_URL > scripts/seed-dump.sql
```
跑完 Task 8 後執行這行指令一次，把產出的 `scripts/seed-dump.sql` 加進 git，組員就可以走路徑 B。
