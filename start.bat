@echo off
cd /d "%~dp0"
echo [INFO] Starting MdToHtml Local Environment...

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js LTS first.
    pause
    exit /b 1
)

:: Navigate to Core Directory
cd MdToHtml

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Start Development Server with Smart Port
echo [INFO] Launching Editor...
echo [INFO] The application will open in your default browser.
:: usage: node scripts/setup-port.js
:: This script will find a port, update .env.local, and spawn "npm run dev" with the correct PORT env var.
call node scripts/setup-port.js

pause
