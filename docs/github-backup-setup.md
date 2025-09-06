# GitHub自动备份配置指南

## 概述

Axiss Nav 支持每天自动备份书签到GitHub仓库，确保您的数据安全。本指南将详细说明如何配置GitHub自动备份功能。

## 步骤1：创建GitHub仓库

1. 登录GitHub，点击右上角的 "+" 按钮
2. 选择 "New repository"
3. 填写仓库信息：
   - Repository name: `my-bookmarks-backup`（或您喜欢的名称）
   - Description: `Axiss Nav 书签自动备份`
   - 选择 Public 或 Private（推荐Private）
   - **不要**勾选 "Add a README file"
   - **不要**勾选 "Add .gitignore"
   - **不要**勾选 "Choose a license"
4. 点击 "Create repository"

## 步骤2：生成Fine-grained Personal Access Token

1. 在GitHub右上角点击头像，选择 "Settings"
2. 在左侧菜单中找到 "Developer settings"
3. 点击 "Personal access tokens" > "Fine-grained tokens"
4. 点击 "Generate new token"
5. 填写Token信息：
   - Token name: `Axiss Nav Backup`
   - Expiration: 选择适当的过期时间（推荐1年）
   - Resource owner: 选择您的账户或组织
6. 选择仓库权限：
   - Repository access: 选择 "Selected repositories"
   - 选择您的备份仓库
   - Permissions:
     - Contents: Read and write
     - Metadata: Read
7. 点击 "Generate token"
8. **重要**：复制生成的Token并保存，离开页面后将无法再次查看

> 💡 **注意**：本系统只支持Fine-grained Personal Access Token，不支持Classic Token

## 步骤3：配置Vercel环境变量

### 方法1：部署时配置
在Vercel部署界面中：
1. 在 "Environment Variables" 部分添加：
   - `GITHUB_BACKUP_REPO`: `username/my-bookmarks-backup`
   - `GITHUB_TOKEN`: `github_pat_xxxxxxxxxxxx`
   - `BACKUP_BRANCH`: `backup`（可选，默认为backup）

### 方法2：部署后配置
1. 访问Vercel项目页面
2. 点击 "Settings" 标签
3. 在左侧菜单选择 "Environment Variables"
4. 添加以下变量：
   - `GITHUB_BACKUP_REPO`: `username/my-bookmarks-backup`
   - `GITHUB_TOKEN`: `github_pat_xxxxxxxxxxxx`
   - `BACKUP_BRANCH`: `backup`（可选）

## 步骤4：验证配置

配置完成后，系统将：
- 每天0:00（UTC时间）自动执行备份
- 生成Markdown格式的备份文件
- 自动推送到GitHub仓库的指定分支
- 创建README文件显示备份历史

### 手动测试
您可以通过以下方式手动触发备份：

1. **通过API**：访问 `https://your-domain.vercel.app/api/cron/backup`
2. **本地运行**：`pnpm run auto-backup`

## 备份文件说明

### 文件格式
- `bookmarks-YYYY-MM-DD.md`: Markdown表格格式，便于阅读

### 文件内容
- 所有活跃的书签链接
- 完整的元数据（标题、描述、标签、分类等）
- 统计信息（点击次数、创建时间等）

### 仓库结构
```
my-bookmarks-backup/
├── README.md                    # 备份说明和历史
├── bookmarks-2024-01-01.md     # 2024年1月1日备份
├── bookmarks-2024-01-02.md     # 2024年1月2日备份
└── ...
```

## 故障排除

### 常见问题

**Q: 备份没有执行？**
A: 检查以下项目：
- 环境变量是否正确配置
- GitHub Token是否有效且有足够权限
- 仓库名称格式是否正确（username/repo-name）

**Q: 权限错误？**
A: 确保GitHub Token具有以下权限：
- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)

**Q: 如何查看备份日志？**
A: 在Vercel项目页面的 "Functions" 标签中查看执行日志

**Q: 如何恢复数据？**
A: 从GitHub仓库下载备份文件，使用导入功能：
```bash
pnpm run import:links -- --file ./bookmarks-2024-01-01.md
```

## 安全建议

1. **Token安全**：
   - 定期更新GitHub Token
   - 不要将Token提交到代码仓库
   - 使用最小权限原则

2. **仓库权限**：
   - 建议使用Private仓库保护备份数据
   - 定期检查仓库访问权限

3. **备份验证**：
   - 定期检查备份是否正常执行
   - 验证备份文件的完整性

## 高级配置

### 自定义备份时间
修改 `vercel.json` 中的cron表达式：
```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"  // 每天2:00 UTC执行
    }
  ]
}
```

### 多仓库备份
可以配置多个备份仓库，修改API代码支持多个目标。

### 备份保留策略
GitHub仓库会自动保留所有历史备份，如需清理旧备份，可以：
1. 手动删除GitHub仓库中的旧文件
2. 修改备份脚本添加自动清理逻辑
