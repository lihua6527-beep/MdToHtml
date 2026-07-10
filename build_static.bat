@echo off
cd /d "%~dp0"
echo [INFO] MdToHtml Pro - Production Build & Start
echo [INFO] Working directory: %cd%
echo.

cd MdToHtml

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js LTS first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check dependencies
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Check your network connection.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

:: Clean old build artifacts
echo [INFO] Cleaning old build artifacts...
if exist ".next\" rmdir /s /q ".next" 2>nul
echo [OK] Cleanup done

:: Run production build
echo [INFO] Building production bundle... (this may take 1-2 minutes)
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Check the error messages above.
    pause
    exit /b 1
)
echo [OK] Production build complete

:: Start production server
echo [INFO] Starting production server on http://localhost:3000...
start "" http://localhost:3000
call npm start

echo.
echo ==============================================
echo    SERVER STOPPED
echo ==============================================
echo.
pause
