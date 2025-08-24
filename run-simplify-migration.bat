@echo off
echo ========================================
echo 数据库简化迁移脚本
echo ========================================
echo.

echo 正在检查环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 正在检查Prisma...
npx prisma --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Prisma，请先安装依赖
    pause
    exit /b 1
)

echo.
echo 警告: 此操作将删除Tag表并简化数据库结构
echo 请确保已备份重要数据！
echo.
set /p confirm="确认继续吗? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 开始执行数据库简化迁移...
echo.

node scripts/migrate-simple-db-safe.js

if errorlevel 1 (
    echo.
    echo 迁移失败！请检查错误信息
    pause
    exit /b 1
) else (
    echo.
    echo 迁移成功完成！
    echo 数据库已简化为只包含User和Link表
)

pause
