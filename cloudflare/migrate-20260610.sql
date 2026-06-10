-- 迁移脚本：添加 client_city 字段
-- 执行命令：wrangler d1 execute who_clicked_clock_db --remote --file=./cloudflare/migrate-20260610.sql

ALTER TABLE click_events ADD COLUMN client_city TEXT;
