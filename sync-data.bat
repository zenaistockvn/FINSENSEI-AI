@echo off
echo ============================================================
echo FinSensei AI - Data Sync Helper
echo ============================================================
echo.

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python found! Running sync script...
    python supabase\sync_1year_data.py
    goto :end
)

echo Python not found. Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js found! Running sync script...
    node supabase\sync-1year-data.js
    goto :end
)

echo Neither Python nor Node.js found.
echo.
echo Please install one of the following:
echo 1. Python: https://www.python.org/downloads/
echo 2. Node.js: https://nodejs.org/
echo.
echo Then run this script again to sync 1-year data.
echo.
echo Alternative: Open test-data-sync.html in your browser
echo to check current data and get manual sync instructions.

:end
echo.
echo Press any key to exit...
pause >nul