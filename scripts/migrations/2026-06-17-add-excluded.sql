-- 圖庫審核工具：新增軟標記排除欄位。在 Supabase 跑一次即可。
ALTER TABLE images ADD COLUMN IF NOT EXISTS excluded BOOLEAN NOT NULL DEFAULT false;
