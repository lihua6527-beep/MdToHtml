@echo off
cd /d "%~dp0"
echo [INFO] Starting Static Site Build...
echo [INFO] This will generate static HTML files in the 'output' folder.

cd MdToHtml

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

:: Run build
echo [INFO] Building...
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [SUCCESS] Build completed successfully!
echo [INFO] You can find the static website in the 'output' folder.
pause
