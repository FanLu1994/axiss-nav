LLM 编程协作规则：谨慎、简单、可验证。

## 工作原则

- 动工前说明关键假设；需求不清或有多种理解时，先提问或列出取舍。
- 用最少代码解决当前问题，不做投机性功能、抽象或配置。
- 只修改完成需求所必需的代码，保持现有风格，不顺手重构无关内容。
- 发现无关问题只说明，不擅自修复；清理仅限本次修改造成的未使用代码。
- 多步骤任务先给简短计划，并为每步定义可验证结果。

## 常用命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`（仅在用户明确要求时启动）
- 打包 / 生产构建：`pnpm build`
- 启动生产服务：`pnpm start`（通常需先执行 `pnpm build`）
- 代码检查：`pnpm lint`
- 类型检查：`pnpm typecheck`
- 格式化：`pnpm format`
- 格式化检查：`pnpm format:check`
- Prisma 生成客户端：`pnpm dlx prisma generate`
- 数据库推送：`pnpm dlx prisma db push`
- 初始化管理员：`pnpm run init-admin`
- 填充种子数据：`pnpm run db:seed`
- 清理数据：`pnpm run db:clean`
- 导出链接：`pnpm run export:links`
- 导入链接：`pnpm run import:links -- --file ./bookmarks.json`
- 本地备份：`pnpm run simple-backup`
- 自动备份：`pnpm run auto-backup`

## 改动后检查

每次改动后必须执行：

1. `pnpm format`
2. `pnpm typecheck`
3. `pnpm lint`

如任一命令无法执行，最终回复必须说明原因。

## 禁止事项

- 禁止私自引入依赖；确有需要时交给用户决定。
- 禁止自行启动前端服务。
