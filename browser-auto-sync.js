/**
 * Browser Auto Sync - Chạy trực tiếp trong browser console
 * Copy và paste code này vào Console của FinSensei AI
 */

(async function autoSyncFinSensei() {
    const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
    const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

    const headers = {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
    };

    // Priority symbols for quick sync
    const SYMBOLS = [
        "VNM", "VCB", "FPT", "HPG", "VIC", "MSN", "MWG", "GAS", "TCB", "BID",
        "ACB", "BCM", "BVH", "CTG", "GVR", "HDB", "MBB", "PLX", "POW", "SAB",
        "SHB", "SSB", "SSI", "STB", "TPB", "VHM", "VIB", "VJC", "VPB", "VRE"
    ];

    let totalInserted = 0;
    let successCount = 0;
    let errorCount = 0;

    console.clear();
    console.log("🚀 AUTO SYNC STARTING - FinSensei AI");
    console.log("=" * 50);
    console.log(`📊 Syncing ${SYMBOLS.length} symbols (2 years each)`);
    console.log("⏱️ Estimated time: 15-20 minutes");
    console.log("=" * 50);

    const startTime = Date.now();

    for (let i = 0; i < SYMBOLS.length; i++) {
        const symbol = SYMBOLS[i];
        
        try {
            console.log(`[${i+1}/${SYMBOLS.length}] 📈 Fetching ${symbol}...`);
            
            // Get 2 years of data from SSI
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 730);
            
            const fromTimestamp = Math.floor(startDate.getTime() / 1000);
            const toTimestamp = Math.floor(endDate.getTime() / 1000);
            
            const ssiUrl = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${symbol}&from=${fromTimestamp}&to=${toTimestamp}`;
            
            const ssiResponse = await fetch(ssiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!ssiResponse.ok) {
                throw new Error(`SSI API error: ${ssiResponse.status}`);
            }
            
            const ssiData = await ssiResponse.json();
            
            if (ssiData.s !== 'ok' || !ssiData.t) {
                console.log(`⚠️ ${symbol}: No data from SSI`);
                errorCount++;
                continue;
            }
            
            // Transform data
            const prices = [];
            for (let j = 0; j < ssiData.t.length; j++) {
                const tradingDate = new Date(ssiData.t[j] * 1000).toISOString().split('T')[0];
                prices.push({
                    symbol: symbol,
                    trading_date: tradingDate,
                    open_price: ssiData.o[j],
                    high_price: ssiData.h[j],
                    low_price: ssiData.l[j],
                    close_price: ssiData.c[j],
                    volume: ssiData.v[j]
                });
            }
            
            // Insert to Supabase in batches
            const batchSize = 200;
            let inserted = 0;
            
            for (let k = 0; k < prices.length; k += batchSize) {
                const batch = prices.slice(k, k + batchSize);
                
                try {
                    const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(batch)
                    });
                    
                    if (response.ok) {
                        inserted += batch.length;
                    }
                    
                    // Small delay between batches
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.log(`❌ Batch error: ${error.message}`);
                }
            }
            
            totalInserted += inserted;
            successCount++;
            
            const coverage = Math.round((prices.length / 730) * 100);
            console.log(`✅ ${symbol}: ${inserted} records (${prices.length} days, ${coverage}%)`);
            
            // Show date range
            if (prices.length > 0) {
                const oldestDate = prices[prices.length - 1].trading_date;
                const newestDate = prices[0].trading_date;
                console.log(`   📅 Range: ${oldestDate} → ${newestDate}`);
            }
            
        } catch (error) {
            errorCount++;
            console.log(`❌ ${symbol}: ${error.message}`);
        }
        
        // Progress update every 10 symbols
        if ((i + 1) % 10 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const avgTime = elapsed / (i + 1);
            const remaining = Math.round((SYMBOLS.length - i - 1) * avgTime / 60);
            
            console.log("");
            console.log(`📊 Progress: ${i+1}/${SYMBOLS.length} (${Math.round((i+1)/SYMBOLS.length*100)}%)`);
            console.log(`⏱️ Remaining: ~${remaining} minutes`);
            console.log(`📈 Records so far: ${totalInserted.toLocaleString()}`);
            console.log("-" * 40);
        }
        
        // Rate limiting - important!
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log("");
    console.log("🎉 AUTO SYNC COMPLETE!");
    console.log("=" * 50);
    console.log("📊 SUMMARY:");
    console.log(`  - Total symbols: ${SYMBOLS.length}`);
    console.log(`  - Successful: ${successCount}`);
    console.log(`  - Failed: ${errorCount}`);
    console.log(`  - Total records: ${totalInserted.toLocaleString()}`);
    console.log(`  - Duration: ${minutes}m ${seconds}s`);
    console.log(`  - Data size: ~${Math.round(totalInserted * 0.1 / 1024)}MB`);
    console.log("=" * 50);
    
    if (totalInserted > 0) {
        console.log("🎯 SUCCESS! Now you can:");
        console.log("  1. 🔄 Hard refresh this page (Ctrl+F5)");
        console.log("  2. 📊 Select any stock symbol");
        console.log("  3. ⏰ Test timeframes: 1W, 1M, 3M, 6M, 1Y, 2Y");
        console.log("  4. 📈 Analyze long-term trends!");
        
        // Auto refresh the page after sync
        console.log("");
        console.log("🔄 Auto-refreshing page in 5 seconds...");
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    } else {
        console.log("⚠️ No data was synced. Please check your connection.");
    }
    
    return {
        totalInserted,
        successCount,
        errorCount,
        duration: `${minutes}m ${seconds}s`
    };
})();