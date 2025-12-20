@echo off
echo ============================================================
echo 🚀 FinSensei AI - Quick Auto Sync
echo ============================================================
echo.

echo Checking for PowerShell...
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% == 0 (
    echo PowerShell found! Running auto sync...
    powershell -ExecutionPolicy Bypass -File AutoSync.ps1 -MaxSymbols 20 -Days 730
    goto :end
)

echo PowerShell not available. Checking for Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python found! Running sync script...
    python supabase\sync_2years_data.py
    goto :end
)

echo Neither PowerShell nor Python available.
echo.
echo 📋 Manual sync options:
echo 1. Open sync-2years.html in your browser
echo 2. Click "🔥 BẮT ĐẦU SYNC 2 NĂM" button
echo 3. Wait for completion (15-20 minutes)
echo.
echo Alternative: Install Python from python.org/downloads
echo Then run: python supabase\sync_2years_data.py

:end
echo.
echo Press any key to exit...
pause >nul