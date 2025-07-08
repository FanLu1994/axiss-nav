-- 为经常查询的字段添加索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_user_id ON links(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_is_active ON links(isActive);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_user_active ON links(userId, isActive);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_created_at ON links(createdAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_order ON links("order" ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_click_count ON links(clickCount DESC);

-- 为搜索字段添加索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_title_gin ON links USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_description_gin ON links USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_url_text ON links USING gin(url gin_trgm_ops);

-- 为标签表添加索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_user_id ON tags(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_user_name ON tags(userId, name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_is_active ON tags(isActive);

-- 为用户表添加索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON "User"(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON "User"(email);

-- 为多对多关系表添加索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_tags_link_id ON "_LinkTags"("A");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_tags_tag_id ON "_LinkTags"("B");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_tags_composite ON "_LinkTags"("A", "B");

-- 启用pg_trgm扩展用于模糊搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm; 