@echo off
cd /d "%~dp0"
echo [INFO] MdToHtml Pro - Dev Server Launcher
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

cd MdToHtml

:: Check dependencies
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

:: Find available port and start dev server
echo [INFO] Starting dev server...
echo [INFO] Browser will open automatically when ready...
echo.

node -e "require('./scripts/setup-port.js')"