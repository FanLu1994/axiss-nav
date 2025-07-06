# Axiss Nav - 个人智能导航收藏夹

一个现代化的个人网站收藏和管理平台，提供智能推荐、多视图模式和专属管理功能。

> 💡 **个人网站设计**：本项目专为个人使用设计，支持单一管理员账户，确保您的收藏数据完全私有和安全。

## ✨ 功能特性

### 🔗 链接管理
- **智能收藏**: 自动获取网站标题、图标和描述
- **标签分类**: 支持多标签管理和分类
- **多视图模式**: 卡片、简约、表格三种展示模式
- **搜索过滤**: 支持标题、URL、描述和标签的全文搜索

### 🎯 智能推荐
- **算法推荐**: 基于点击频率和添加时间的智能推荐算法
- **随机标签**: 动态展示热门标签，快速筛选
- **优雅展示**: 简洁的推荐卡片设计

### 👤 个人管理
- **管理员账户**: 专属个人管理员账户
- **安全登录**: 完整的身份验证系统
- **私人收藏**: 完全私有的个人收藏数据

### 🎨 用户体验
- **响应式设计**: 完美适配桌面和移动设备
- **毛玻璃效果**: 现代化的视觉设计
- **粒子动画**: 动态背景效果
- **虚拟滚动**: 高性能的无限滚动加载

### 💎 个人网站特色
- **零配置**: 开箱即用，无需复杂配置
- **数据私有**: 完全属于您的个人数据
- **性能优化**: 专为个人使用优化的体验
- **自由定制**: 可根据个人需求进行定制
- **简单维护**: 单用户架构，维护简单

## 🛠️ 技术栈

### 前端
- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Radix UI** - 无样式组件库
- **Sonner** - 优雅的Toast通知

### 后端
- **Next.js API Routes** - 服务端API
- **Prisma** - 现代化的数据库ORM
- **PostgreSQL** - 可靠的关系型数据库
- **JWT** - JSON Web Token身份验证
- **bcryptjs** - 密码加密

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **包管理器**: pnpm (推荐) 或 npm/yarn
- **数据库**: PostgreSQL 12 或更高版本
- **操作系统**: Windows、macOS 或 Linux

### 系统依赖
```bash
# 安装 Node.js (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安装 pnpm
npm install -g pnpm

# 安装 PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 或使用 Docker
docker run --name postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres:15
```

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/你的用户名/axiss-nav.git
cd axiss-nav
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/axiss_nav"

# JWT密钥 (请使用强随机字符串)
JWT_SECRET="your-super-secret-jwt-key-here"

# Next.js配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

4. **初始化数据库**
```bash
pnpm dlx prisma generate
pnpm dlx prisma db push
```

5. **创建管理员账户**
```bash
pnpm run init-admin
```
按照提示输入管理员用户名、邮箱和密码。

6. **创建示例数据（可选）**
```bash
pnpm run db:seed
```

7. **启动开发服务器**
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 🚀 快速命令参考

```bash
# 创建管理员账户
pnpm run init-admin

# 创建示例数据
pnpm run db:seed

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 📦 部署

### Vercel 一键部署

点击下方按钮即可快速部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F你的用户名%2Faxiss-nav&env=DATABASE_URL,JWT_SECRET,NEXTAUTH_URL,NEXTAUTH_SECRET&envDescription=环境变量配置&envLink=https%3A%2F%2Fgithub.com%2F你的用户名%2Faxiss-nav%23环境变量)

> ⚠️ **重要提醒**：部署完成后，请立即通过Vercel控制台或SSH连接到服务器运行 `pnpm run init-admin` 创建管理员账户。

### 手动部署

1. **构建项目**
```bash
pnpm build
```

2. **启动生产服务器**
```bash
pnpm start
```

### 性能优化建议

生产环境建议：
- 使用 CDN 加速静态资源
- 启用 gzip 压缩
- 配置适当的缓存策略
- 使用 PM2 进行进程管理
- 监控数据库性能

```bash
# 使用 PM2 部署
npm install -g pm2
pm2 start npm --name "axiss-nav" -- start
pm2 save
pm2 startup
```

### 环境变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL数据库连接URL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT签名密钥 | `your-super-secret-key` |
| `NEXTAUTH_URL` | 应用基础URL | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth密钥 | `your-nextauth-secret` |

### 数据库支持

本项目使用PostgreSQL数据库，支持以下部署方式：

- **本地PostgreSQL**: 安装PostgreSQL服务器
- **云数据库**: 
  - [Supabase](https://supabase.com/) (推荐)
  - [Neon](https://neon.tech/)
  - [PlanetScale](https://planetscale.com/)
  - [Railway](https://railway.app/)

## 📖 使用说明

### 管理员登录
1. 首次访问时点击右上角"登录"按钮
2. 使用初始化时创建的管理员账户登录
3. 开始管理您的个人收藏夹

### 添加收藏
1. 登录后点击搜索框右侧的"+"按钮
2. 输入网站URL，系统自动获取标题和图标
3. 添加标签进行分类管理
4. 点击"添加"保存收藏

### 浏览和管理
- **搜索**: 在搜索框中输入关键词筛选
- **标签筛选**: 点击随机标签快速过滤
- **视图切换**: 使用右下角按钮切换显示模式
- **推荐发现**: 查看智能推荐的网站
- **删除收藏**: 悬停在卡片上点击删除按钮

### 管理员账户管理
- **创建管理员**: 首次部署时运行 `pnpm run init-admin`
- **重置密码**: 删除数据库用户数据后重新运行初始化
- **账户安全**: 定期更换密码，保护个人数据安全

## 📁 项目结构

```
axiss-nav/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API路由
│   │   ├── login/          # 登录页面
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React组件
│   │   ├── ui/            # 基础UI组件
│   │   ├── link-card.tsx  # 链接卡片组件
│   │   ├── recommended-links.tsx  # 推荐组件
│   │   └── ...
│   ├── lib/               # 工具函数
│   └── middleware.ts      # 中间件
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   ├── seed.ts           # 数据库种子
│   ├── init-admin.ts     # 管理员账户初始化
│   └── migrations/       # 数据库迁移
├── public/               # 静态资源
├── package.json
└── README.md
```

## ❓ 常见问题

### 如何重置管理员密码？
1. 停止应用服务器
2. 删除数据库中的用户数据：`DELETE FROM users WHERE role = 'ADMIN';`
3. 重新运行：`pnpm run init-admin`

### 如何备份数据？
使用PostgreSQL的pg_dump工具：
```bash
# 备份数据库
pg_dump -U username -h hostname -p port database_name > backup.sql

# 恢复数据库
psql -U username -h hostname -p port database_name < backup.sql

# 自动化备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U username -h hostname -p port database_name > "backup_${DATE}.sql"
```

### 如何更换数据库？
1. 更新 `DATABASE_URL` 环境变量
2. 运行数据库迁移：`pnpm dlx prisma db push`
3. 重新创建管理员账户和数据

### 部署后无法访问？
检查以下配置：
- 确认 `NEXTAUTH_URL` 设置正确
- 确认数据库连接正常
- 确认已创建管理员账户

### 如何更新系统？
1. 备份数据库
2. 拉取最新代码：`git pull origin main`
3. 安装依赖：`pnpm install`
4. 运行数据库迁移：`pnpm dlx prisma db push`
5. 重新构建：`pnpm build`
6. 重启服务：`pm2 restart axiss-nav`

## 🎯 路线图

- [ ] 导入/导出功能
- [ ] 网站截图预览
- [ ] 高级搜索过滤
- [ ] 主题定制
- [ ] 移动端PWA支持
- [ ] 数据统计面板
- [ ] 批量操作功能
- [ ] 备份与恢复
- [ ] API接口

## 🔒 数据隐私与安全

### 数据保护
- **单用户设计**: 确保数据完全私有，只有您能访问
- **密码加密**: 使用bcrypt进行密码哈希加密
- **JWT认证**: 安全的身份验证机制
- **HTTPS支持**: 生产环境强制使用HTTPS

### 安全建议
1. 使用强密码作为管理员账户密码
2. 定期更换JWT密钥
3. 使用可靠的数据库服务商
4. 定期备份数据
5. 保持系统更新

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。查看 [LICENSE](LICENSE) 文件了解更多信息。

您可以自由地：
- ✅ 个人使用
- ✅ 商业使用
- ✅ 修改代码
- ✅ 分发副本

但请保留原始许可证和版权声明。

## 💬 支持与反馈

如果您遇到问题或有建议，请通过以下方式联系：

- 🐛 **报告问题**: [GitHub Issues](https://github.com/你的用户名/axiss-nav/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/你的用户名/axiss-nav/discussions)
- ⭐ **给个星星**: 如果这个项目对您有帮助，请给个Star支持一下！

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 优秀的React框架
- [Prisma](https://prisma.io/) - 现代化的数据库工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [Radix UI](https://www.radix-ui.com/) - 无样式组件库
- [Vercel](https://vercel.com/) - 部署平台

---

<p align="center">
  <strong>用 ❤️ 和 ☕ 制作</strong><br>
  <small>Version 1.0.0 | Made for Personal Use</small>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#部署">部署指南</a> •
  <a href="#常见问题">常见问题</a> •
  <a href="#贡献指南">贡献代码</a>
</p>
