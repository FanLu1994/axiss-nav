-- Align the database with the simplified Link model.
ALTER TABLE "links" DROP CONSTRAINT IF EXISTS "links_userId_fkey";
ALTER TABLE "_LinkTags" DROP CONSTRAINT IF EXISTS "_LinkTags_A_fkey";
ALTER TABLE "_LinkTags" DROP CONSTRAINT IF EXISTS "_LinkTags_B_fkey";
ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_userId_fkey";

DROP TABLE IF EXISTS "_LinkTags";
DROP TABLE IF EXISTS "tags";

ALTER TABLE "links"
DROP COLUMN IF EXISTS "userId",
ADD COLUMN IF NOT EXISTS "tags" TEXT,
ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "color" TEXT;

DROP INDEX IF EXISTS "links_userId_idx";
DROP INDEX IF EXISTS "links_userId_isActive_idx";
DROP INDEX IF EXISTS "links_userId_isActive_order_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "links_url_key" ON "links"("url");
CREATE INDEX IF NOT EXISTS "links_category_idx" ON "links"("category");
CREATE INDEX IF NOT EXISTS "links_isActive_category_idx" ON "links"("isActive", "category");
