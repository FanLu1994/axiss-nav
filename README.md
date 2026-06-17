# Axiss Nav - 个人智能导航收藏夹

现代化的个人网站收藏管理平台，具有AI解析、智能推荐、自动备份等功能。

## 功能特性

- 🤖 AI智能解析 - 自动获取网站标题、描述和标签
- 📊 智能推荐 - 基于浏览习惯推荐网站
- 🏷️ 标签管理 - 智能分类和快速筛选
- 💾 自动备份 - 支持GitHub自动备份
- 🔍 实时搜索 - 快速找到想要的网站

## 技术栈

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Prisma ORM, PostgreSQL
- JWT认证, AI服务集成

## 快速开始

1. **克隆并安装**

```bash
git clone https://github.com/FanLu1994/axiss-nav.git
cd axiss-nav
pnpm install
```

2. **配置环境变量**
   复制 `env.example` 为 `.env.local`，填写必要信息：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/axiss_nav"
JWT_SECRET="your-super-secret-jwt-key-here"

# AI功能 (可选)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# GitHub自动备份 (可选)
GITHUB_BACKUP_REPO="username/backup-repo"
GITHUB_TOKEN="github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

3. **初始化数据库**

```bash
pnpm dlx prisma generate
pnpm dlx prisma db push
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)，首次访问会自动引导创建管理员账户。

## 部署

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFanLu1994%2Faxiss-nav)

**部署步骤：**

1. 创建数据库（推荐 [Supabase](https://supabase.com/)）
2. 部署时添加环境变量：
   - `DATABASE_URL`: 数据库连接URL
   - `JWT_SECRET`: 随机字符串
   - `GITHUB_BACKUP_REPO`: GitHub备份仓库（可选）
   - `GITHUB_TOKEN`: GitHub Fine-grained Token（可选）
3. 访问部署的网站，自动引导创建管理员账户

## 环境变量

| 变量名               | 描述                      | 必需 | 示例                                  |
| -------------------- | ------------------------- | ---- | ------------------------------------- |
| `DATABASE_URL`       | PostgreSQL数据库连接URL   | ✅   | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`         | JWT签名密钥               | ✅   | `your-super-secret-key`               |
| `OPENAI_API_KEY`     | OpenAI API密钥            | ❌   | `sk-proj-...`                         |
| `GITHUB_BACKUP_REPO` | GitHub备份仓库            | ❌   | `username/backup-repo`                |
| `GITHUB_TOKEN`       | GitHub Fine-grained Token | ❌   | `github_pat_...`                      |

## 使用说明

### 基本使用

1. 首次访问自动引导创建管理员账户
2. 点击"+"按钮添加网站，系统自动获取标题和图标
3. 配置AI后会自动生成智能标签
4. 支持搜索、标签筛选、智能推荐等功能

### 自动备份

配置GitHub环境变量后，系统每天0:00自动备份书签到GitHub仓库：

- 生成Markdown格式备份文件
- 手动触发：访问 `/api/cron/backup` 或运行 `pnpm run auto-backup`

## 常见问题

**如何备份数据？**

```bash
pnpm run simple-backup    # 生成本地备份文件
pnpm run auto-backup      # 自动备份到GitHub
```

**如何配置自动备份？**

1. 在GitHub创建新仓库
2. 生成Fine-grained Personal Access Token（需要Contents权限）
3. 在环境变量中添加 `GITHUB_BACKUP_REPO` 和 `GITHUB_TOKEN`

**如何重置管理员密码？**
删除数据库中的用户数据：`DELETE FROM users WHERE role = 'ADMIN';`

## 许可证

MIT License
