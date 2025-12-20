/**
 * Emergency sync script - Sync dữ liệu ngay lập tức
 * Chạy trong browser console hoặc Node.js
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
const PRIORITY_SYMBOLS = ["VNM", "VCB", "FPT", "HPG", "VIC", "MSN", "MWG", "GAS", "TCB", "BID"];

async function fetchSSIData(symbol) {
    console.log(`🔄 Fetching ${symbol}...`);
    
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365); // 1 year
        
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
            console.log(`⚠️ ${symbol}: No data from SSI`);
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
        
        console.log(`✅ ${symbol}: Got ${prices.length} records`);
        return prices;
        
    } catch (error) {
        console.error(`❌ ${symbol}: ${error.message}`);
        return [];
    }
}

async function insertToSupabase(data) {
    if (data.length === 0) return 0;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log(`✅ Inserted ${data.length} records`);
            return data.length;
        } else {
            const error = await response.text();
            console.error(`❌ Insert error: ${error.substring(0, 100)}`);
            return 0;
        }
    } catch (error) {
        console.error(`❌ Insert error: ${error.message}`);
        return 0;
    }
}

async function emergencySync() {
    console.log("🚀 Starting emergency sync...");
    console.log(`📊 Syncing ${PRIORITY_SYMBOLS.length} priority symbols`);
    
    let totalInserted = 0;
    let successCount = 0;
    
    for (let i = 0; i < PRIORITY_SYMBOLS.length; i++) {
        const symbol = PRIORITY_SYMBOLS[i];
        console.log(`\n[${i+1}/${PRIORITY_SYMBOLS.length}] Processing ${symbol}`);
        
        const prices = await fetchSSIData(symbol);
        
        if (prices.length > 0) {
            const inserted = await insertToSupabase(prices);
            totalInserted += inserted;
            if (inserted > 0) successCount++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n📊 EMERGENCY SYNC SUMMARY:");
    console.log(`✅ Successful: ${successCount}/${PRIORITY_SYMBOLS.length}`);
    console.log(`📈 Total records: ${totalInserted}`);
    
    if (totalInserted > 0) {
        console.log("\n🎉 Emergency sync complete!");
        console.log("🔄 Please refresh your FinSensei AI app and test 1Y timeframe");
    } else {
        console.log("\n⚠️ No data was synced. Check your connection and try again.");
    }
    
    return totalInserted;
}

// Run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    emergencySync().catch(console.error);
} else {
    // Browser environment - expose function
    window.emergencySync = emergencySync;
    console.log("💡 Run emergencySync() in console to start sync");
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { emergencySync };
}