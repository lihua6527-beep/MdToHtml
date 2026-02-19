@echo off
cd /d "%~dp0"
echo [INFO] Starting Portable Export...
echo [INFO] This will generate self-contained webpage folders in 'portable_dist'.
echo [INFO] You can upload these folders directly to your blog or server.

:: Check if output exists
if not exist "output" (
    echo [ERROR] 'output' folder not found!
    echo [INFO] Please run 'build_static.bat' first to generate the base site.
    pause
    exit /b 1
)

:: Run script
call node MdToHtml/scripts/export_portable.js

pause
