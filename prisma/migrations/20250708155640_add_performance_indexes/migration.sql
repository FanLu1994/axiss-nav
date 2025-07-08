-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "links_userId_idx" ON "links"("userId");

-- CreateIndex
CREATE INDEX "links_isActive_idx" ON "links"("isActive");

-- CreateIndex
CREATE INDEX "links_userId_isActive_idx" ON "links"("userId", "isActive");

-- CreateIndex
CREATE INDEX "links_order_idx" ON "links"("order");

-- CreateIndex
CREATE INDEX "links_clickCount_idx" ON "links"("clickCount");

-- CreateIndex
CREATE INDEX "links_createdAt_idx" ON "links"("createdAt");

-- CreateIndex
CREATE INDEX "links_updatedAt_idx" ON "links"("updatedAt");

-- CreateIndex
CREATE INDEX "links_userId_isActive_order_idx" ON "links"("userId", "isActive", "order");

-- CreateIndex
CREATE INDEX "links_title_idx" ON "links"("title");

-- CreateIndex
CREATE INDEX "links_url_idx" ON "links"("url");

-- CreateIndex
CREATE INDEX "tags_userId_idx" ON "tags"("userId");

-- CreateIndex
CREATE INDEX "tags_isActive_idx" ON "tags"("isActive");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_userId_isActive_idx" ON "tags"("userId", "isActive");

-- CreateIndex
CREATE INDEX "tags_order_idx" ON "tags"("order");

-- CreateIndex
CREATE INDEX "tags_createdAt_idx" ON "tags"("createdAt");
