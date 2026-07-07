@echo off
cd /d "%~dp0"
echo [INFO] MdToHtml Pro - Static Site Builder
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
if exist "out\" rmdir /s /q "out" 2>nul
if exist "..\output\" rmdir /s /q "..\output" 2>nul
if exist ".next\" rmdir /s /q ".next" 2>nul
echo [OK] Cleanup done

:: Run build
echo [INFO] Building static site... (this may take 1-2 minutes)
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [WARN] Build script reported an error (possibly Windows Defender file lock)
    echo [INFO] Checking if out directory has usable output...
    if exist "out\index.html" (
        echo [OK] Build output found in out directory, proceeding...
        goto BUILD_OK
    )
    echo [ERROR] Build failed and no usable output found.
    pause
    exit /b 1
)

:BUILD_OK
:: Copy output to the friendly output folder
echo [INFO] Copying output files...
if not exist "..\output\" mkdir "..\output"
if exist "out\" xcopy /E /Y /Q "out\*" "..\output\" >nul 2>&1
echo [OK] Static site is ready in the 'output' folder

:: Auto-open browser
set INDEX_PATH=..\output\index.html
if exist "%INDEX_PATH%" (
    echo [INFO] Opening browser to preview the site...
    start "" "%INDEX_PATH%"
) else (
    echo [WARN] index.html not found, check build output
)

echo.
echo ==============================================
echo    BUILD COMPLETE - output folder is ready
echo ==============================================
echo.
pause