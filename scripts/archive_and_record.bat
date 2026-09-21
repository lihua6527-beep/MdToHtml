@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================
echo   MdToHtml Pro — 归档/收尾/记录 自动化工具
echo ===================================================
echo.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.x
    pause
    exit /b 1
)
echo [OK] Python found
echo.

:: Run the archive and record script
python archive_and_record.py %*

if %errorlevel% neq 0 (
    echo [ERROR] Script execution failed
    pause
    exit /b 1
)

echo.
echo [OK] 归档/收尾/记录 流程完成
echo [INFO] 请检查以下文件确保一致性：
echo        - API接口手册.md（如有接口变更）
echo        - PROJECT_SYSTEM_INDEX.md（如有索引变更）
echo.

pause