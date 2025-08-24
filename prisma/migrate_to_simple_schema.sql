-- 数据库简化迁移SQL脚本
-- 此脚本将Tag表功能合并到Link表中，删除Tag表，并移除User-Link关联

-- 1. 为Link表添加新字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'tags') THEN
        ALTER TABLE "links" ADD COLUMN "tags" TEXT;
    END IF;
END $$;

-- 2. 迁移标签数据到Link表
UPDATE "links" 
SET 
  "tags" = (
    SELECT json_agg(t."name")
    FROM "_LinkTags" lt
    JOIN "tags" t ON lt."B" = t."id"
    WHERE lt."A" = "links"."id"
  ),
  "category" = (
    SELECT t."name"
    FROM "_LinkTags" lt
    JOIN "tags" t ON lt."B" = t."id"
    WHERE lt."A" = "links"."id"
    LIMIT 1
  ),
  "color" = (
    SELECT t."color"
    FROM "_LinkTags" lt
    JOIN "tags" t ON lt."B" = t."id"
    WHERE lt."A" = "links"."id"
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 FROM "_LinkTags" lt WHERE lt."A" = "links"."id"
);

-- 3. 删除关联表
DROP TABLE IF EXISTS "_LinkTags" CASCADE;

-- 4. 删除Tag表
DROP TABLE IF EXISTS "tags" CASCADE;

-- 5. 移除User-Link关联（删除userId字段）
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'userId') THEN
        ALTER TABLE "links" DROP COLUMN "userId";
    END IF;
END $$;

-- 6. 为新字段创建索引
CREATE INDEX IF NOT EXISTS "links_category_idx" ON "links"("category");
CREATE INDEX IF NOT EXISTS "links_isActive_category_idx" ON "links"("isActive", "category");
CREATE INDEX IF NOT EXISTS "links_isActive_order_idx" ON "links"("isActive", "order");

-- 7. 为User表添加额外索引
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 完成迁移
SELECT 'Database simplification migration completed successfully!' as status;
