# 数据库简化迁移 - 快速启动指南

## 🚀 快速开始

### 1. 环境准备
确保你的环境满足以下要求：
- Node.js 16+ 
- PostgreSQL 数据库
- 项目依赖已安装 (`npm install` 或 `pnpm install`)

### 2. 执行迁移

#### 方法一：使用批处理文件（Windows）
```bash
# 双击运行或在命令行执行
run-simplify-migration.bat
```

#### 方法二：直接执行Node脚本
```bash
# 执行迁移
node scripts/migrate-simple-db.js
```

#### 方法三：分步骤执行
```bash
# 1. 备份数据
node -e "require('./scripts/migrate-simple-db.js').backupExistingData()"

# 2. 执行迁移
node scripts/migrate-simple-db.js

# 3. 验证结果
node -e "require('./scripts/migrate-simple-db.js').verifyMigration()"
```

## 📋 迁移过程

### 自动执行的步骤：
1. **备份数据** - 自动备份所有现有数据到 `backups/` 目录
2. **执行SQL迁移** - 运行数据库结构变更
3. **生成客户端** - 更新Prisma客户端
4. **验证结果** - 检查迁移是否成功

### 迁移内容：
- ✅ 删除Tag表
- ✅ 删除LinkTags关联表
- ✅ 移除User-Link关联关系
- ✅ 将标签数据合并到Link表
- ✅ 优化数据库索引

## 🔍 验证迁移

迁移完成后，检查以下内容：

### 1. 数据库结构
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'links');

-- 检查Link表新字段
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'links' AND column_name IN ('tags', 'category', 'color');
```

### 2. 数据完整性
```sql
-- 检查数据数量
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as link_count FROM links;

-- 检查新字段数据
SELECT id, title, tags, category, color FROM links LIMIT 5;
```

### 3. 索引验证
```sql
-- 检查索引
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('users', 'links');
```

## ⚠️ 重要注意事项

### 迁移前：
- 确保数据库连接正常
- 备份重要数据（脚本会自动备份）
- 在测试环境先验证

### 迁移后：
- **必须更新应用代码**适配新的数据库结构
- 移除所有User-Link关联的代码
- 更新Prisma查询语句
- 测试所有功能

## 🛠️ 代码更新示例

### 更新前（有User-Link关联）：
```typescript
// 查询用户的链接
const userLinks = await prisma.link.findMany({
  where: { userId: userId }
});

// 创建链接
const newLink = await prisma.link.create({
  data: {
    title: "My Link",
    url: "https://example.com",
    userId: userId
  }
});
```

### 更新后（无关联）：
```typescript
// 查询所有链接
const allLinks = await prisma.link.findMany({
  where: { isActive: true }
});

// 创建链接
const newLink = await prisma.link.create({
  data: {
    title: "My Link",
    url: "https://example.com",
    tags: JSON.stringify(["tag1", "tag2"]),
    category: "Technology"
  }
});
```

## 🔧 故障排除

### 常见问题：

1. **迁移失败**
   ```bash
   # 检查数据库连接
   npx prisma db pull
   
   # 重新执行迁移
   node scripts/migrate-simple-db.js
   ```

2. **数据丢失**
   ```bash
   # 从备份恢复
   # 备份文件位置: backups/backup-{timestamp}.json
   ```

3. **Prisma客户端错误**
   ```bash
   # 重新生成客户端
   npx prisma generate
   ```

### 回滚方案：
如果迁移出现问题，可以：
1. 停止应用服务
2. 从备份文件恢复数据
3. 重新执行迁移
4. 更新应用代码

## 📞 支持

如果遇到问题：
1. 检查控制台错误信息
2. 查看备份文件是否完整
3. 验证数据库连接
4. 确认环境配置正确

## ✅ 完成检查清单

- [ ] 迁移脚本执行成功
- [ ] 数据备份完成
- [ ] 新字段验证通过
- [ ] Tag表已删除
- [ ] User-Link关联已移除
- [ ] 索引创建成功
- [ ] 应用代码已更新
- [ ] 功能测试通过

---

**恭喜！** 🎉 数据库简化迁移已完成，你的数据库现在更加高效和简洁了！
