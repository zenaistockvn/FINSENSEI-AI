# PowerShell script to sync 1 year stock data from SSI API
# FinSensei AI - Stock Analysis Data Sync

$SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

$headers = @{
    "apikey" = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "resolution=merge-duplicates,return=minimal"
}

# VN30 symbols for testing (smaller set first)
$VN30_SYMBOLS = @(
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"
)

function Get-StockDataFromSSI {
    param(
        [string]$Symbol,
        [int]$Days = 365
    )
    
    try {
        $endDate = Get-Date
        $startDate = $endDate.AddDays(-$Days)
        
        $fromTimestamp = [int][double]::Parse((Get-Date $startDate -UFormat %s))
        $toTimestamp = [int][double]::Parse((Get-Date $endDate -UFormat %s))
        
        $url = "https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=$Symbol&from=$fromTimestamp&to=$toTimestamp"
        
        $ssiHeaders = @{
            "Accept" = "application/json"
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        Write-Host "    Fetching $Symbol from SSI API..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri $url -Headers $ssiHeaders -TimeoutSec 30
        
        if ($response.s -ne "ok" -or !$response.t) {
            Write-Host "    ⚠️ No data for $Symbol" -ForegroundColor Yellow
            return $null
        }
        
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
        
        Write-Host "    ✅ Got $($prices.Count) records for $Symbol" -ForegroundColor Green
        return $prices
        
    } catch {
        Write-Host "    ❌ Error fetching $Symbol`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Send-ToSupabase {
    param(
        [string]$Table,
        [array]$Data
    )
    
    if (!$Data -or $Data.Count -eq 0) {
        return 0
    }
    
    try {
        $url = "$SUPABASE_URL/rest/v1/$Table"
        $json = $Data | ConvertTo-Json -Depth 10
        
        Write-Host "    Inserting $($Data.Count) records to $Table..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $json -TimeoutSec 30
        
        Write-Host "    ✅ Inserted $($Data.Count) records" -ForegroundColor Green
        return $Data.Count
        
    } catch {
        Write-Host "    ❌ Supabase error: $($_.Exception.Message)" -ForegroundColor Red
        return 0
    }
}

function Sync-StockPrices {
    Write-Host "`n📈 Syncing 1 YEAR stock prices from SSI API...`n" -ForegroundColor Cyan
    
    $totalInserted = 0
    $successCount = 0
    $errorCount = 0
    
    for ($i = 0; $i -lt $VN30_SYMBOLS.Count; $i++) {
        $symbol = $VN30_SYMBOLS[$i]
        Write-Host "[$($i+1)/$($VN30_SYMBOLS.Count)] Processing $symbol (1 year)..." -ForegroundColor White
        
        $prices = Get-StockDataFromSSI -Symbol $symbol -Days 365
        
        if ($prices -and $prices.Count -gt 0) {
            $inserted = Send-ToSupabase -Table "stock_prices" -Data $prices
            $totalInserted += $inserted
            $successCount++
        } else {
            $errorCount++
        }
        
        # Rate limiting
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "`n📊 SYNC SUMMARY:" -ForegroundColor Cyan
    Write-Host "  - Total symbols: $($VN30_SYMBOLS.Count)" -ForegroundColor White
    Write-Host "  - Successful: $successCount" -ForegroundColor Green
    Write-Host "  - Failed: $errorCount" -ForegroundColor Red
    Write-Host "  - Total records: $totalInserted" -ForegroundColor Yellow
    
    return $totalInserted
}

# Main execution
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🚀 FinSensei AI - Sync 1 YEAR Data from SSI API" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📅 Syncing data for $($VN30_SYMBOLS.Count) VN30 symbols" -ForegroundColor White
Write-Host "⏱️ Estimated time: $([math]::Ceiling($VN30_SYMBOLS.Count * 0.5 / 60)) minutes" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Cyan

$startTime = Get-Date

$stockCount = Sync-StockPrices

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📋 FINAL SUMMARY:" -ForegroundColor Cyan
Write-Host "  - Stock Prices: $stockCount records" -ForegroundColor Yellow
Write-Host "  - Duration: $([math]::Floor($duration/60))m $([math]::Floor($duration%60))s" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ 1 YEAR data sync complete!" -ForegroundColor Green
Write-Host "🎯 Ready for FinSensei AI analysis!" -ForegroundColor Green