# 链接导入导出工具

这个工具提供了收藏网站的导入导出功能，支持JSON和Markdown格式。

## 导出功能

### 基本用法

```bash
# 导出为JSON格式（默认）
pnpm run export:links

# 导出为Markdown格式
pnpm run export:links -- --format markdown

# 指定输出文件
pnpm run export:links -- --output ./backup/my-bookmarks.json

# 只导出特定分类
pnpm run export:links -- --category "开发工具"

# 或者直接使用node命令
node scripts/export-links.js --format markdown
```

### 导出选项

- `--format, -f`: 导出格式 (json|markdown) [默认: json]
- `--output, -o`: 输出文件路径
- `--category, -c`: 只导出指定分类的链接
- `--help, -h`: 显示帮助信息

### 导出示例

```bash
# 导出所有链接为JSON
pnpm run export:links
# 或
node scripts/export-links.js

# 导出为Markdown格式
pnpm run export:links -- --format markdown
# 或
node scripts/export-links.js --format markdown

# 导出到指定文件
pnpm run export:links -- --format json --output ./backup/bookmarks.json
# 或
node scripts/export-links.js --format json --output ./backup/bookmarks.json

# 只导出"开发工具"分类
pnpm run export:links -- --category "开发工具" --format markdown
# 或
node scripts/export-links.js --category "开发工具" --format markdown
```

## 导入功能

### 基本用法

```bash
# 导入JSON文件
pnpm run import:links -- --file ./bookmarks.json

# 导入Markdown文件
pnpm run import:links -- --file ./bookmarks.md

# 试运行模式（不实际导入）
pnpm run import:links -- --file ./bookmarks.json --dry-run

# 跳过重复URL
pnpm run import:links -- --file ./bookmarks.json --skip-duplicates

# 或者直接使用node命令
node scripts/import-links.js --file ./bookmarks.json
```

### 导入选项

- `--file, -f`: 要导入的文件路径 (必需)
- `--format`: 文件格式 (json|markdown) [自动检测]
- `--dry-run, -d`: 试运行模式，不实际导入数据
- `--skip-duplicates, -s`: 跳过重复的URL
- `--help, -h`: 显示帮助信息

### 导入示例

```bash
# 导入JSON文件
pnpm run import:links -- --file ./bookmarks.json
# 或
node scripts/import-links.js --file ./bookmarks.json

# 导入Markdown文件
pnpm run import:links -- --file ./bookmarks.md
# 或
node scripts/import-links.js --file ./bookmarks.md

# 试运行模式
pnpm run import:links -- --file ./bookmarks.json --dry-run
# 或
node scripts/import-links.js --file ./bookmarks.json --dry-run

# 跳过重复URL
pnpm run import:links -- --file ./bookmarks.json --skip-duplicates
# 或
node scripts/import-links.js --file ./bookmarks.json --skip-duplicates
```

## 文件格式

### JSON格式

```json
{
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "totalLinks": 2,
  "links": [
    {
      "id": "link1",
      "title": "示例网站",
      "url": "https://example.com",
      "description": "这是一个示例网站",
      "icon": "https://example.com/favicon.ico",
      "order": 0,
      "clickCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": ["示例", "测试"],
      "category": "测试",
      "color": null
    }
  ]
}
```

### Markdown格式

```markdown
# 收藏夹导出

导出时间: 2024/1/1 00:00:00
总计链接: 2 个

| 标题 | 链接 | 描述 | 分类 | 标签 | 添加时间 | 点击次数 |
|------|------|------|------|------|----------|----------|
| [示例网站](https://example.com) | https://example.com | 这是一个示例网站 | 测试 | 示例, 测试 | 2024/1/1 00:00:00 | 0 |
| [另一个网站](https://another.com) | https://another.com | 另一个示例网站 | 开发 | 开发, 工具 | 2024/1/1 01:00:00 | 5 |
```

## 注意事项

1. **导入前备份**: 建议在导入前先导出当前数据作为备份
2. **重复URL**: 默认情况下，导入时会检查URL是否已存在，重复的URL会被跳过
3. **数据验证**: 导入时会验证数据的完整性，无效数据会被跳过并显示错误信息
4. **试运行**: 使用 `--dry-run` 选项可以在不实际导入的情况下预览导入结果

## 错误处理

- 如果导入过程中出现错误，脚本会显示详细的错误信息
- 无效的链接数据会被跳过，不会影响其他有效数据的导入
- 建议使用试运行模式先检查数据格式是否正确
