# Quick sync script for FinSensei AI
# Syncs sample 1-year data using PowerShell

$SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

$headers = @{
    "apikey" = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "resolution=merge-duplicates,return=minimal"
}

Write-Host "🚀 FinSensei AI - Quick Data Sync" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test symbols (VN30 subset)
$testSymbols = @("VNM", "VCB", "FPT", "HPG", "VIC")

function Get-SSIData {
    param([string]$Symbol)
    
    try {
        $endDate = Get-Date
        $startDate = $endDate.AddDays(-365)
        
        $fromTimestamp = [int][double]::Parse((Get-Date $startDate -UFormat %s))
        $toTimestamp = [int][double]::Parse((Get-Date $endDate -UFormat %s))
        
        $url = "https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=$Symbol&from=$fromTimestamp&to=$toTimestamp"
        
        Write-Host "  Fetching $Symbol..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri $url -Headers @{
            "Accept" = "application/json"
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        } -TimeoutSec 30
        
        if ($response.s -eq "ok" -and $response.t) {
            $prices = @()
            for ($i = 0; $i -lt $response.t.Count; $i++) {
                $tradingDate = (Get-Date "1970-01-01 00:00:00").AddSeconds($response.t[$i]).ToString("yyyy-MM-dd")
                
                $prices += @{
                    symbol = $Symbol
                    trading_date = $tradingDate
                    open_price = $response.o[$i]
                    high_price = $response.h[$i]
                    low_price = $response.l[$i]
                    close_price = $response.c[$i]
                    volume = $response.v[$i]
                }
            }
            
            Write-Host "  ✅ Got $($prices.Count) records" -ForegroundColor Green
            return $prices
        } else {
            Write-Host "  ⚠️ No data" -ForegroundColor Yellow
            return @()
        }
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

function Send-ToSupabase {
    param([array]$Data)
    
    if ($Data.Count -eq 0) { return 0 }
    
    try {
        $url = "$SUPABASE_URL/rest/v1/stock_prices"
        $json = $Data | ConvertTo-Json -Depth 10
        
        Write-Host "  Inserting $($Data.Count) records..." -ForegroundColor Cyan
        
        Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $json -TimeoutSec 30 | Out-Null
        
        Write-Host "  ✅ Success!" -ForegroundColor Green
        return $Data.Count
    } catch {
        Write-Host "  ❌ Insert error: $($_.Exception.Message)" -ForegroundColor Red
        return 0
    }
}

# Main sync
$totalInserted = 0
$successCount = 0

foreach ($symbol in $testSymbols) {
    Write-Host "`n[$($testSymbols.IndexOf($symbol) + 1)/$($testSymbols.Count)] Processing $symbol" -ForegroundColor White
    
    $prices = Get-SSIData -Symbol $symbol
    
    if ($prices.Count -gt 0) {
        $inserted = Send-ToSupabase -Data $prices
        $totalInserted += $inserted
        $successCount++
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "  - Processed: $($testSymbols.Count) symbols" -ForegroundColor White
Write-Host "  - Successful: $successCount" -ForegroundColor Green
Write-Host "  - Total records: $totalInserted" -ForegroundColor Yellow

if ($totalInserted -gt 0) {
    Write-Host "`n✅ Data sync complete!" -ForegroundColor Green
    Write-Host "🎯 You can now test 1Y timeframe in FinSensei AI" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ No data was synced. Check your internet connection." -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")