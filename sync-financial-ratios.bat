@echo off
echo ========================================
echo   SYNC FINANCIAL RATIOS - VN100
echo ========================================
echo.

REM Set your Supabase service key here
set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.YOUR_SERVICE_KEY_HERE

echo Dang chay sync...
echo.

cd supabase
python sync_financial_ratios.py

echo.
pause
