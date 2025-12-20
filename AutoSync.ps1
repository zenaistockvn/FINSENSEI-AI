# Auto Sync PowerShell Script - FinSensei AI
# Tự động đồng bộ dữ liệu 2 năm lên Supabase

param(
    [int]$MaxSymbols = 50,
    [int]$Days = 730
)

$SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

$headers = @{
    "apikey" = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "resolution=merge-duplicates,return=minimal"
}

# Priority symbols for auto sync
$PRIORITY_SYMBOLS = @(
    # VN30 - Most important
    "VNM", "VCB", "FPT", "HPG", "VIC", "MSN", "MWG", "GAS", "TCB", "BID",
    "ACB", "BCM", "BVH", "CTG", "GVR", "HDB", "MBB", "PLX", "POW", "SAB",
    "SHB", "SSB", "SSI", "STB", "TPB", "VHM", "VIB", "VJC", "VPB", "VRE",
    
    # Additional popular stocks
    "AAA", "ACV", "ANV", "APH", "ASM", "BFC", "BMP", "BSI", "BTP", "BWE",
    "CII", "CMG", "CNG", "CRC", "CTD", "CTI", "DCM", "DGC", "DGW", "DHC"
)

# Limit symbols if specified
if ($MaxSymbols -lt $PRIORITY_SYMBOLS.Count) {
    $PRIORITY_SYMBOLS = $PRIORITY_SYMBOLS[0..($MaxSymbols-1)]
}

$totalInserted = 0
$successCount = 0
$errorCount = 0
$startTime = Get-Date

function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Type) {
        "Success" { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
        "Error" { Write-Host "[$timestamp] $Message" -ForegroundColor Red }
        "Warning" { Write-Host "[$timestamp] $Message" -ForegroundColor Yellow }
        "Highlight" { Write-Host "[$timestamp] $Message" -ForegroundColor Magenta }
        default { Write-Host "[$timestamp] $Message" -ForegroundColor Cyan }
    }
}

function Get-SSIData {
    param([string]$Symbol)
    
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
        
        $response = Invoke-RestMethod -Uri $url -Headers $ssiHeaders -TimeoutSec 30
        
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
            return $prices
        } else {
            return @()
        }
    } catch {
        throw $_.Exception.Message
    }
}

function Send-ToSupabase {
    param([array]$Data)
    
    if ($Data.Count -eq 0) { return 0 }
    
    # Split into batches
    $batchSize = 200
    $totalInserted = 0
    
    for ($i = 0; $i -lt $Data.Count; $i += $batchSize) {
        $endIndex = [Math]::Min($i + $batchSize - 1, $Data.Count - 1)
        $batch = $Data[$i..$endIndex]
        
        try {
            $url = "$SUPABASE_URL/rest/v1/stock_prices"
            $json = $batch | ConvertTo-Json -Depth 10 -Compress
            
            $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $json -TimeoutSec 60
            $totalInserted += $batch.Count
            
        } catch {
            Write-ColorLog "Batch insert error: $($_.Exception.Message)" "Error"
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    return $totalInserted
}

function Sync-Symbol {
    param(
        [string]$Symbol,
        [int]$Index,
        [int]$Total
    )
    
    try {
        Write-ColorLog "[$($Index+1)/$Total] 📈 Fetching $Symbol ($Days days)..." "Info"
        
        $prices = Get-SSIData -Symbol $Symbol
        
        if ($prices.Count -gt 0) {
            $inserted = Send-ToSupabase -Data $prices
            $script:totalInserted += $inserted
            $script:successCount++
            
            $coverage = [Math]::Round(($prices.Count / $Days) * 100)
            Write-ColorLog "✅ $Symbol`: $inserted records ($($prices.Count) days, $coverage%)" "Success"
            
            # Show date range
            if ($prices.Count -gt 0) {
                $oldestDate = $prices[-1].trading_date
                $newestDate = $prices[0].trading_date
                Write-ColorLog "   📅 Range: $oldestDate → $newestDate" "Info"
            }
        } else {
            $script:errorCount++
            Write-ColorLog "⚠️ $Symbol`: No data from SSI" "Warning"
        }
        
    } catch {
        $script:errorCount++
        Write-ColorLog "❌ $Symbol`: $($_.Exception.Message)" "Error"
    }
}

# Main execution
Clear-Host
Write-ColorLog "🚀 AUTO SYNC - FinSensei AI" "Highlight"
Write-ColorLog ("=" * 50) "Info"
Write-ColorLog "📊 Syncing $($PRIORITY_SYMBOLS.Count) priority symbols" "Info"
Write-ColorLog "📅 Period: $Days days ($(($Days/365).ToString('F1')) years)" "Info"
Write-ColorLog "⏱️ Estimated time: $([Math]::Ceiling($PRIORITY_SYMBOLS.Count * 1.5 / 60)) minutes" "Info"
Write-ColorLog ("=" * 50) "Info"

for ($i = 0; $i -lt $PRIORITY_SYMBOLS.Count; $i++) {
    $symbol = $PRIORITY_SYMBOLS[$i]
    
    Sync-Symbol -Symbol $symbol -Index $i -Total $PRIORITY_SYMBOLS.Count
    
    # Progress update every 10 symbols
    if (($i + 1) % 10 -eq 0) {
        $elapsed = (Get-Date) - $startTime
        $avgTime = $elapsed.TotalSeconds / ($i + 1)
        $remaining = [Math]::Round(($PRIORITY_SYMBOLS.Count - $i - 1) * $avgTime / 60)
        
        Write-ColorLog "" "Info"
        Write-ColorLog "📊 Progress: $($i+1)/$($PRIORITY_SYMBOLS.Count) ($([Math]::Round(($i+1)/$PRIORITY_SYMBOLS.Count*100))%)" "Highlight"
        Write-ColorLog "⏱️ Remaining: ~$remaining minutes" "Info"
        Write-ColorLog "📈 Records so far: $($totalInserted.ToString('N0'))" "Success"
        Write-ColorLog ("-" * 40) "Info"
    }
    
    # Rate limiting
    Start-Sleep -Seconds 1.5
}

$duration = (Get-Date) - $startTime
$minutes = [Math]::Floor($duration.TotalMinutes)
$seconds = [Math]::Floor($duration.TotalSeconds % 60)

Write-ColorLog "" "Info"
Write-ColorLog "🎉 AUTO SYNC COMPLETE!" "Highlight"
Write-ColorLog ("=" * 50) "Info"
Write-ColorLog "📊 SUMMARY:" "Highlight"
Write-ColorLog "  - Total symbols: $($PRIORITY_SYMBOLS.Count)" "Info"
Write-ColorLog "  - Successful: $successCount" "Success"
Write-ColorLog "  - Failed: $errorCount" $(if ($errorCount -gt 0) { "Warning" } else { "Info" })
Write-ColorLog "  - Total records: $($totalInserted.ToString('N0'))" "Success"
Write-ColorLog "  - Duration: ${minutes}m ${seconds}s" "Info"
Write-ColorLog "  - Data size: ~$([Math]::Round($totalInserted * 0.1 / 1024))MB" "Info"
Write-ColorLog ("=" * 50) "Info"

if ($totalInserted -gt 0) {
    Write-ColorLog "🎯 NEXT STEPS:" "Highlight"
    Write-ColorLog "  1. 🚀 Open FinSensei AI: http://localhost:3001" "Info"
    Write-ColorLog "  2. 🔄 Hard refresh (Ctrl+F5)" "Info"
    Write-ColorLog "  3. 📊 Select any stock symbol" "Info"
    Write-ColorLog "  4. ⏰ Test timeframes: 1W, 1M, 3M, 6M, 1Y, 2Y" "Info"
    Write-ColorLog "  5. 📈 Analyze long-term trends!" "Success"
} else {
    Write-ColorLog "⚠️ No data was synced. Please check your connection." "Warning"
}

Write-ColorLog "" "Info"
Write-ColorLog "Press any key to exit..." "Info"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")