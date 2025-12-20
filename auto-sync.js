/**
 * Auto Sync Script - Tự động đồng bộ dữ liệu 2 năm lên Supabase
 * FinSensei AI - Chạy trực tiếp trong Node.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const headers = {
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
};

// Priority symbols for immediate sync
const PRIORITY_SYMBOLS = [
    // VN30 - Most important
    "VNM", "VCB", "FPT", "HPG", "VIC", "MSN", "MWG", "GAS", "TCB", "BID",
    "ACB", "BCM", "BVH", "CTG", "GVR", "HDB", "MBB", "PLX", "POW", "SAB",
    "SHB", "SSB", "SSI", "STB", "TPB", "VHM", "VIB", "VJC", "VPB", "VRE",
    
    // Additional popular stocks
    "AAA", "ACV", "ANV", "APH", "ASM", "BFC", "BMP", "BSI", "BTP", "BWE",
    "CII", "CMG", "CNG", "CRC", "CTD", "CTI", "DCM", "DGC", "DGW", "DHC"
];

let totalInserted = 0;
let successCount = 0;
let errorCount = 0;
let startTime;

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        warning: '\x1b[33m', // Yellow
        highlight: '\x1b[35m' // Magenta
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}[${timestamp}] ${message}${reset}`);
}

async function fetchSSIData(symbol) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 730); // 2 years
        
        const fromTimestamp = Math.floor(startDate.getTime() / 1000);
        const toTimestamp = Math.floor(endDate.getTime() / 1000);
        
        const url = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${symbol}&from=${fromTimestamp}&to=${toTimestamp}`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`SSI API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.s !== 'ok' || !data.t) {
            return [];
        }
        
        // Transform data
        const prices = [];
        for (let i = 0; i < data.t.length; i++) {
            const tradingDate = new Date(data.t[i] * 1000).toISOString().split('T')[0];
            prices.push({
                symbol: symbol,
                trading_date: tradingDate,
                open_price: data.o[i],
                high_price: data.h[i],
                low_price: data.l[i],
                close_price: data.c[i],
                volume: data.v[i]
            });
        }
        
        return prices;
        
    } catch (error) {
        throw error;
    }
}

async function insertToSupabase(data) {
    if (data.length === 0) return 0;
    
    // Split into smaller batches
    const batchSize = 200;
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(batch)
            });
            
            if (response.ok) {
                totalInserted += batch.length;
            } else {
                const error = await response.text();
                log(`Batch insert error: ${error.substring(0, 100)}`, 'error');
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            log(`Batch insert error: ${error.message}`, 'error');
        }
    }
    
    return totalInserted;
}

async function syncSymbol(symbol, index, total) {
    try {
        log(`[${index+1}/${total}] 📈 Fetching ${symbol} (2 years)...`, 'info');
        
        const prices = await fetchSSIData(symbol);
        
        if (prices.length > 0) {
            const inserted = await insertToSupabase(prices);
            totalInserted += inserted;
            successCount++;
            
            const coverage = Math.round((prices.length / 730) * 100);
            log(`✅ ${symbol}: ${inserted} records (${prices.length} days, ${coverage}%)`, 'success');
            
            // Show date range
            if (prices.length > 0) {
                const oldestDate = prices[prices.length - 1].trading_date;
                const newestDate = prices[0].trading_date;
                log(`   📅 Range: ${oldestDate} → ${newestDate}`, 'info');
            }
        } else {
            errorCount++;
            log(`⚠️ ${symbol}: No data from SSI`, 'warning');
        }
        
    } catch (error) {
        errorCount++;
        log(`❌ ${symbol}: ${error.message}`, 'error');
    }
}

async function autoSync() {
    console.clear();
    log("🚀 AUTO SYNC - FinSensei AI", 'highlight');
    log("=" * 50, 'info');
    log(`📊 Syncing ${PRIORITY_SYMBOLS.length} priority symbols`, 'info');
    log("📅 Period: 730 days (2 years)", 'info');
    log("⏱️ Estimated time: 15-20 minutes", 'info');
    log("=" * 50, 'info');
    
    startTime = Date.now();
    
    for (let i = 0; i < PRIORITY_SYMBOLS.length; i++) {
        const symbol = PRIORITY_SYMBOLS[i];
        
        await syncSymbol(symbol, i, PRIORITY_SYMBOLS.length);
        
        // Progress update
        if ((i + 1) % 10 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const avgTime = elapsed / (i + 1);
            const remaining = Math.round((PRIORITY_SYMBOLS.length - i - 1) * avgTime / 60);
            
            log("", 'info');
            log(`📊 Progress: ${i+1}/${PRIORITY_SYMBOLS.length} (${Math.round((i+1)/PRIORITY_SYMBOLS.length*100)}%)`, 'highlight');
            log(`⏱️ Remaining: ~${remaining} minutes`, 'info');
            log(`📈 Records so far: ${totalInserted.toLocaleString('vi-VN')}`, 'success');
            log("-" * 40, 'info');
        }
        
        // Rate limiting - important!
        await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    log("", 'info');
    log("🎉 AUTO SYNC COMPLETE!", 'highlight');
    log("=" * 50, 'info');
    log(`📊 SUMMARY:`, 'highlight');
    log(`  - Total symbols: ${PRIORITY_SYMBOLS.length}`, 'info');
    log(`  - Successful: ${successCount}`, 'success');
    log(`  - Failed: ${errorCount}`, errorCount > 0 ? 'warning' : 'info');
    log(`  - Total records: ${totalInserted.toLocaleString('vi-VN')}`, 'success');
    log(`  - Duration: ${minutes}m ${seconds}s`, 'info');
    log(`  - Data size: ~${Math.round(totalInserted * 0.1 / 1024)}MB`, 'info');
    log("=" * 50, 'info');
    
    if (totalInserted > 0) {
        log("🎯 NEXT STEPS:", 'highlight');
        log("  1. 🚀 Open FinSensei AI: http://localhost:3001", 'info');
        log("  2. 🔄 Hard refresh (Ctrl+F5)", 'info');
        log("  3. 📊 Select any stock symbol", 'info');
        log("  4. ⏰ Test timeframes: 1W, 1M, 3M, 6M, 1Y, 2Y", 'info');
        log("  5. 📈 Analyze long-term trends!", 'success');
    } else {
        log("⚠️ No data was synced. Please check your connection.", 'warning');
    }
    
    return totalInserted;
}

// Run the auto sync
autoSync().catch(error => {
    log(`❌ Auto sync failed: ${error.message}`, 'error');
    process.exit(1);
});

module.exports = { autoSync };