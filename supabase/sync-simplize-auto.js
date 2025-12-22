// Auto Sync Simplize Data to Supabase
// Run: node supabase/sync-simplize-auto.js

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const VN30 = ['ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG', 
              'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB', 
              'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'];

const VN100_EXTRA = ['AAA', 'ANV', 'ASM', 'BWE', 'CII', 'CMG', 'DBC', 'DCM', 'DGC', 'DGW',
               'DIG', 'DPM', 'DXG', 'EIB', 'EVF', 'FRT', 'GMD', 'HAG', 'HCM', 'HDC',
               'HDG', 'HNG', 'HSG', 'HT1', 'IMP', 'KBC', 'KDC', 'KDH', 'LPB', 'MSB',
               'NLG', 'NT2', 'NVL', 'OCB', 'PAN', 'PC1', 'PDR', 'PHR', 'PNJ', 'PPC',
               'PVD', 'PVS', 'PVT', 'REE', 'SBT', 'SCR', 'SCS', 'SJS', 'SSC', 'TCH',
               'TLG', 'VCI', 'VGC', 'VHC', 'VND', 'VOS', 'VPI', 'VTP'];

const ALL_STOCKS = [...new Set([...VN30, ...VN100_EXTRA])];

let syncedCount = 0;
let errorCount = 0;

async function fetchSimplize(symbol) {
    const response = await fetch(`https://api.simplize.vn/api/company/summary/${symbol.toLowerCase()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()).data;
}

async function upsertToSupabase(data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/simplize_company_data?on_conflict=symbol`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(await response.text());
    return true;
}

async function syncStock(symbol) {
    try {
        const d = await fetchSimplize(symbol);
        if (!d) throw new Error('No data');

        const stockData = {
            symbol: symbol.toUpperCase(),
            name_vi: d.nameVi || d.name || symbol,
            stock_exchange: d.stockExchange || 'HOSE',
            price_close: d.priceClose || 0,
            price_open: d.priceOpen || 0,
            price_high: d.priceHigh || 0,
            price_low: d.priceLow || 0,
            net_change: d.netChange || 0,
            pct_change: d.pctChange || 0,
            volume: d.volume || 0,
            price_ceiling: d.priceCeiling || 0,
            price_floor: d.priceFloor || 0,
            price_reference: d.priceReferrance || 0,
            market_cap: Math.round(d.marketCap || 0),
            pe_ratio: d.peRatio || 0,
            pb_ratio: d.pbRatio || 0,
            eps: d.epsRatio || 0,
            book_value: d.bookValue || 0,
            roe: d.roe || 0,
            roa: d.roa || 0,
            dividend_yield: d.dividendPoint || 0,
            beta_5y: d.beta5y || 0,
            outstanding_shares: d.outstandingSharesValue || 0,
            free_float_rate: d.freeFloatRate || 0,
            valuation_point: d.valuationPoint || 0,
            growth_point: d.growthPoint || 0,
            performance_point: d.passPerformancePoint || 0,
            financial_health_point: d.financialHealthPoint || 0,
            overall_risk_level: d.overallRiskLevel || null,
            ta_signal_1d: d.taSignal1d || null,
            industry: d.industryActivity || null,
            sector: d.bcEconomicSectorName || null,
            updated_at: new Date().toISOString()
        };

        await upsertToSupabase(stockData);
        syncedCount++;
        const change = stockData.pct_change >= 0 ? `+${stockData.pct_change.toFixed(2)}` : stockData.pct_change.toFixed(2);
        console.log(`✅ ${symbol}: ${stockData.price_close.toLocaleString()} (${change}%) PE:${stockData.pe_ratio}`);
        return true;
    } catch (error) {
        errorCount++;
        console.log(`❌ ${symbol}: ${error.message}`);
        return false;
    }
}

async function syncAll() {
    console.log(`\n🚀 Bắt đầu sync ${ALL_STOCKS.length} mã từ Simplize API...\n`);
    const startTime = Date.now();

    // Sync in batches of 5
    for (let i = 0; i < ALL_STOCKS.length; i += 5) {
        const batch = ALL_STOCKS.slice(i, i + 5);
        await Promise.all(batch.map(syncStock));
        
        // Progress
        const progress = Math.min(i + 5, ALL_STOCKS.length);
        console.log(`--- Progress: ${progress}/${ALL_STOCKS.length} (${Math.round(progress/ALL_STOCKS.length*100)}%) ---\n`);
        
        // Delay between batches
        if (i + 5 < ALL_STOCKS.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ HOÀN THÀNH!`);
    console.log(`📊 Đã sync: ${syncedCount}/${ALL_STOCKS.length} mã`);
    console.log(`❌ Lỗi: ${errorCount} mã`);
    console.log(`⏱️ Thời gian: ${totalTime}s\n`);
}

syncAll();
