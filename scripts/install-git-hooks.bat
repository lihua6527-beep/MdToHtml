@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo ===================================================
echo   MdToHtml Pro — 安装 Git 钩子（推送前门禁）
echo ===================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 git，请先安装 Git for Windows
    pause
    exit /b 1
)

if not exist ".githooks\pre-push" (
    echo [ERROR] 未找到 .githooks\pre-push
    pause
    exit /b 1
)

git config core.hooksPath .githooks
if %errorlevel% neq 0 (
    echo [ERROR] 设置 core.hooksPath 失败
    pause
    exit /b 1
)

echo [OK] 已设置 core.hooksPath = .githooks
echo [OK] 之后每次 git push 会先跑：cd MdToHtml ^&^& npm run verify
echo.
echo [INFO] 跳过本次检查（不推荐）：git push --no-verify
echo [INFO] 取消该钩子：          git config --unset core.hooksPath
echo.
pause
