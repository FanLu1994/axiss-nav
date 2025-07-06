# 🌟 Axiss Nav - 个人智能导航收藏夹

一个现代化的个人网站收藏管理平台，专为个人使用而设计。具有智能推荐、AI解析、数据备份等功能。

## ✨ 功能特性

- 🔐 **单用户设计** - 专为个人使用，数据完全私有
- 🤖 **AI智能解析** - 自动获取网站标题、描述和智能标签
- 📊 **智能推荐** - 基于浏览习惯推荐网站
- 🏷️ **标签管理** - 智能分类和快速筛选
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **现代UI** - 毛玻璃效果和流畅动画
- 💾 **数据备份** - 一键导出/导入所有数据
- 🔍 **实时搜索** - 快速找到想要的网站
- 📋 **多种视图** - 卡片/简约/表格模式切换

## 🚀 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM, PostgreSQL
- **认证**: JWT + bcrypt
- **AI服务**: OpenAI, DeepSeek, Claude, Gemini
- **部署**: Vercel 一键部署

## 📦 快速开始

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
复制 `.env.example` 为 `.env.local`，填写必要信息：
```env
# 数据库配置
DATABASE_URL="your-database-url"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key-here"

# 项目配置完成，无需其他配置

# AI功能配置 (可选 - 用于智能解析URL)
# 至少配置一个AI提供商的API密钥
OPENAI_API_KEY="your-openai-api-key"          # OpenAI GPT
DEEPSEEK_API_KEY="your-deepseek-api-key"      # DeepSeek
CLAUDE_API_KEY="your-claude-api-key"          # Anthropic Claude
GEMINI_API_KEY="your-gemini-api-key"          # Google Gemini
```

4. **初始化数据库**
```bash
pnpm dlx prisma generate
pnpm dlx prisma db push
```

5. **创建示例数据（可选）**
```bash
pnpm run db:seed
```

6. **启动开发服务器**
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

> 💡 **首次访问提示**：首次打开网站时，系统会自动引导您创建管理员账户。

## 🚀 部署

### Vercel 一键部署

**⚠️ 部署前必须先准备数据库！**

#### 1. 创建数据库（选择其一）

**推荐：Supabase**（免费500MB）
1. 访问 [supabase.com](https://supabase.com/) 注册账户
2. 点击 "New project" 创建项目
3. 在 Settings > Database 中找到连接URL
4. 复制类似这样的URL：`postgresql://postgres:[password]@[host]/postgres`

**其他选择：**
- [Neon](https://neon.tech/) - 专门的PostgreSQL服务
- [Railway](https://railway.app/) - 简单易用
- [Vercel Storage](https://vercel.com/storage) - 与Vercel集成最好

#### 2. 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F你的用户名%2Faxiss-nav)

部署时需要添加环境变量：

**必填：**
- `DATABASE_URL`: 上面创建的数据库连接URL
- `JWT_SECRET`: 随机字符串（如：`abc123xyz789`）

**可选（AI功能）：**
- `OPENAI_API_KEY`: OpenAI API密钥
- `DEEPSEEK_API_KEY`: DeepSeek API密钥  
- `CLAUDE_API_KEY`: Claude API密钥
- `GEMINI_API_KEY`: Gemini API密钥

> 💡 **添加环境变量**：在Vercel部署界面中点击 "Environment Variables" 添加，或部署完成后在项目 Settings > Environment Variables 中添加。AI功能可选，至少填一个或全部留空。

#### 3. 初始化数据库

部署完成后，需要初始化数据库表：
1. 在Vercel项目页面，点击 "Functions" 标签
2. 找到并执行数据库初始化（或等待首次访问时自动初始化）

#### 4. 开始使用

访问部署的网站，系统会自动引导您创建管理员账户。

> 💡 **完整部署只需5分钟！**

## 🔧 环境变量

| 变量名 | 描述 | 是否必需 | 示例 |
|--------|------|----------|------|
| `DATABASE_URL` | PostgreSQL数据库连接URL | 必需 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT签名密钥 | 必需 | `your-super-secret-key` |
| `OPENAI_API_KEY` | OpenAI API密钥 | 可选 | `sk-proj-...` |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | 可选 | `sk-...` |
| `CLAUDE_API_KEY` | Anthropic Claude API密钥 | 可选 | `sk-ant-...` |
| `GEMINI_API_KEY` | Google Gemini API密钥 | 可选 | `AIza...` |

## 📖 使用说明

### 初次使用
1. 首次访问时，系统会自动引导您创建管理员账户
2. 创建完成后会自动登录并跳转到主页面

### 添加网站
1. 登录后点击搜索框右侧的"+"按钮
2. 输入网站URL，系统自动获取标题和图标
3. 如果配置了AI，会自动生成智能标签
4. 点击"添加"保存

### 管理功能
- **搜索**: 在搜索框中输入关键词
- **标签筛选**: 点击标签快速过滤
- **视图切换**: 右下角按钮切换显示模式
- **推荐网站**: 系统智能推荐未访问的网站
- **数据备份**: 使用 `pnpm run backup` 命令

## ❓ 常见问题

**如何备份数据？**
```bash
pnpm run backup:export  # 导出数据
pnpm run backup:import  # 导入数据
```

**如何重置管理员密码？**
1. 删除数据库中的用户数据：`DELETE FROM users WHERE role = 'ADMIN';`
2. 重新访问网站，系统会引导您创建新账户

**AI功能如何配置？**
- 获取任一AI服务的API密钥（OpenAI、DeepSeek、Claude、Gemini）
- 添加到环境变量中即可
- 不配置也能正常使用基础功能

## 📄 许可证

MIT License - 可自由使用、修改和分发。

---

<p align="center">
  <strong>专为个人使用设计的智能导航收藏夹</strong><br>
  <small>Version 1.0.0</small>
</p>
