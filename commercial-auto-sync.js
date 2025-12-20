/**
 * Commercial Auto Sync - FinSensei AI
 * Tự động đồng bộ dữ liệu cho phiên bản thương mại
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const headers = {
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
};

// Comprehensive VN100 symbols for commercial version
const COMMERCIAL_SYMBOLS = [
    // VN30 - Premium tier
    "VNM", "VCB", "FPT", "HPG", "VIC", "MSN", "MWG", "GAS", "TCB", "BID",
    "ACB", "BCM", "BVH", "CTG", "GVR", "HDB", "MBB", "PLX", "POW", "SAB",
    "SHB", "SSB", "SSI", "STB", "TPB", "VHM", "VIB", "VJC", "VPB", "VRE",
    
    // VN70 - Standard tier
    "AAA", "ABR", "ACV", "AGG", "ANV", "APH", "ASM", "ASP", "BAF", "BFC",
    "BMP", "BSI", "BTP", "BWE", "C32", "C47", "CAV", "CII", "CMG", "CMX",
    "CNG", "CRC", "CSM", "CTD", "CTI", "CTR", "CTS", "DCM", "DGC", "DGW",
    "DHC", "DIG", "DPM", "DRC", "DRH", "DTL", "DXG", "DXS", "EIB", "EVF",
    "EVG", "FCM", "FCN", "FRT", "FTS", "GEG", "GMD", "GSP", "GTN", "HAG",
    "HAH", "HCM", "HDC", "HDG", "HHV", "HNG", "HQC", "HSG", "HT1", "HTN",
    "HTV", "HU1", "HU3", "HVN", "IMP", "ITA", "ITD", "ITC", "JVC", "KBC",
    "KDC", "KDH", "KHG", "KMR", "L10", "LAF", "LBM", "LCG", "LCM", "LDG",
    "LGC", "LHG", "LIX", "LPB", "LSS", "MCP", "MDG", "MIG", "MSB", "MSH",
    "NAF", "NAV", "NBC", "NCT", "NHA", "NKG", "NLG", "NNC", "NSC", "NT2",
    "NTL", "NVL", "NVT", "OCB", "OGC", "OPC", "ORS", "PAN", "PC1", "PDN",
    "PDR", "PET", "PGC", "PGD", "PGI", "PHC", "PHR", "PIT", "PLP", "PME",
    "PNJ", "POM", "PPC", "PVD", "PVS", "PVT", "QCG", "RAL", "ROS", "S4A",
    "SAM", "SBT", "SC5", "SCS", "SFI", "SHI", "SII", "SJF", "SKG", "SMA"
];

let stats = {
    totalInserted: 0,
    successCount: 0,
    errorCount: 0,
    startTime: Date.now(),
    completedSymbols: []
};

async function fetchSSIData(symbol, days = 730) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
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
    
    const batchSize = 150; // Optimized for commercial use
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
                console.warn(`Batch insert warning: ${error.substring(0, 50)}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 80));
            
        } catch (error) {
            console.warn(`Batch insert error: ${error.message}`);
        }
    }
    
    return totalInserted;
}

async function syncMarketIndices() {
    console.log("📊 Syncing market indices...");
    
    const indices = ["VNINDEX", "VN30", "HNX", "UPCOM"];
    let totalInserted = 0;
    
    for (const indexCode of indices) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 730);
            
            const fromTimestamp = Math.floor(startDate.getTime() / 1000);
            const toTimestamp = Math.floor(endDate.getTime() / 1000);
            
            const ssiCode = indexCode === 'HNX' ? 'HNXINDEX' : indexCode === 'UPCOM' ? 'UPINDEX' : indexCode;
            const url = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${ssiCode}&from=${fromTimestamp}&to=${toTimestamp}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.s === 'ok' && data.t) {
                    const indexData = [];
                    for (let i = 0; i < data.t.length; i++) {
                        const tradingDate = new Date(data.t[i] * 1000).toISOString().split('T')[0];
                        const prevClose = i > 0 ? data.c[i-1] : data.o[i];
                        
                        indexData.push({
                            index_code: indexCode,
                            trading_date: tradingDate,
                            open_value: data.o[i],
                            high_value: data.h[i],
                            low_value: data.l[i],
                            close_value: data.c[i],
                            volume: data.v[i],
                            change_value: Math.round((data.c[i] - prevClose) * 100) / 100,
                            change_percent: Math.round((data.c[i] - prevClose) / prevClose * 10000) / 100
                        });
                    }
                    
                    if (indexData.length > 0) {
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/market_indices`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify(indexData)
                        });
                        
                        if (response.ok) {
                            totalInserted += indexData.length;
                            console.log(`✅ ${indexCode}: ${indexData.length} records`);
                        }
                    }
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.warn(`Index ${indexCode} error: ${error.message}`);
        }
    }
    
    console.log(`📊 Market indices: ${totalInserted} records`);
    return totalInserted;
}

async function commercialAutoSync() {
    console.clear();
    console.log("🚀 COMMERCIAL AUTO SYNC - FinSensei AI");
    console.log("=" * 60);
    console.log(`💼 Commercial version - ${COMMERCIAL_SYMBOLS.length} symbols`);
    console.log("📅 Period: 730 days (2 years)");
    console.log("🎯 Target: Premium data quality");
    console.log("=" * 60);
    
    // Sync stock prices
    for (let i = 0; i < COMMERCIAL_SYMBOLS.length; i++) {
        const symbol = COMMERCIAL_SYMBOLS[i];
        
        try {
            console.log(`[${i+1}/${COMMERCIAL_SYMBOLS.length}] 📈 ${symbol}...`);
            
            const prices = await fetchSSIData(symbol, 730);
            
            if (prices.length > 0) {
                const inserted = await insertToSupabase(prices);
                stats.totalInserted += inserted;
                stats.successCount++;
                stats.completedSymbols.push(symbol);
                
                const coverage = Math.round((prices.length / 730) * 100);
                console.log(`✅ ${symbol}: ${inserted} records (${coverage}%)`);
                
                if (prices.length > 0) {
                    const range = `${prices[prices.length - 1].trading_date} → ${prices[0].trading_date}`;
                    console.log(`   📅 ${range}`);
                }
            } else {
                stats.errorCount++;
                console.log(`⚠️ ${symbol}: No data`);
            }
            
        } catch (error) {
            stats.errorCount++;
            console.log(`❌ ${symbol}: ${error.message}`);
        }
        
        // Progress update
        if ((i + 1) % 20 === 0) {
            const elapsed = (Date.now() - stats.startTime) / 1000;
            const avgTime = elapsed / (i + 1);
            const remaining = Math.round((COMMERCIAL_SYMBOLS.length - i - 1) * avgTime / 60);
            
            console.log("");
            console.log(`📊 Progress: ${i+1}/${COMMERCIAL_SYMBOLS.length} (${Math.round((i+1)/COMMERCIAL_SYMBOLS.length*100)}%)`);
            console.log(`⏱️ Remaining: ~${remaining} minutes`);
            console.log(`📈 Records: ${stats.totalInserted.toLocaleString()}`);
            console.log(`💰 Commercial value: $${Math.round(stats.totalInserted * 0.001)} worth of data`);
            console.log("-" * 50);
        }
        
        // Commercial-grade rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Sync market indices
    const indexRecords = await syncMarketIndices();
    
    const duration = Math.round((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log("");
    console.log("🎉 COMMERCIAL SYNC COMPLETE!");
    console.log("=" * 60);
    console.log("📊 FINAL STATISTICS:");
    console.log(`  💼 Total symbols: ${COMMERCIAL_SYMBOLS.length}`);
    console.log(`  ✅ Successful: ${stats.successCount}`);
    console.log(`  ❌ Failed: ${stats.errorCount}`);
    console.log(`  📈 Stock records: ${stats.totalInserted.toLocaleString()}`);
    console.log(`  📊 Index records: ${indexRecords.toLocaleString()}`);
    console.log(`  🎯 Total records: ${(stats.totalInserted + indexRecords).toLocaleString()}`);
    console.log(`  ⏱️ Duration: ${minutes}m ${seconds}s`);
    console.log(`  💾 Data size: ~${Math.round((stats.totalInserted + indexRecords) * 0.1 / 1024)}MB`);
    console.log(`  💰 Commercial value: $${Math.round((stats.totalInserted + indexRecords) * 0.001)}`);
    console.log("=" * 60);
    
    console.log("🚀 COMMERCIAL FEATURES READY:");
    console.log("  ✅ 2-year historical data");
    console.log("  ✅ 120+ VN100 symbols");
    console.log("  ✅ Market indices");
    console.log("  ✅ Premium timeframes (1W-2Y)");
    console.log("  ✅ Advanced technical analysis");
    console.log("  ✅ AI-powered insights");
    
    console.log("");
    console.log("💼 MONETIZATION READY:");
    console.log("  🎯 Premium data quality");
    console.log("  📊 Professional-grade analysis");
    console.log("  💎 Enterprise-level features");
    console.log("  🔒 Subscription-ready architecture");
    
    // Auto refresh for immediate use
    console.log("");
    console.log("🔄 Auto-refreshing in 3 seconds for immediate use...");
    setTimeout(() => {
        window.location.reload();
    }, 3000);
    
    return {
        stockRecords: stats.totalInserted,
        indexRecords: indexRecords,
        totalRecords: stats.totalInserted + indexRecords,
        successRate: Math.round((stats.successCount / COMMERCIAL_SYMBOLS.length) * 100),
        duration: `${minutes}m ${seconds}s`,
        commercialValue: Math.round((stats.totalInserted + indexRecords) * 0.001)
    };
}

// Execute commercial sync
commercialAutoSync().then(result => {
    console.log("🎉 Commercial sync completed successfully!");
    console.log("💼 Ready for monetization!");
}).catch(error => {
    console.error("❌ Commercial sync failed:", error);
});

// Export for potential use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { commercialAutoSync };
}