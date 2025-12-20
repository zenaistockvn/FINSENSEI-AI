/**
 * Script sync dữ liệu giá cổ phiếu 1 năm gần nhất từ SSI API
 * Dành cho FinSensei AI - Phân tích cổ phiếu
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const supabaseHeaders = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=minimal"
};

// VN100 symbols để sync (mở rộng từ VN30)
const VN100_SYMBOLS = [
  // VN30
  "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
  
  // VN70 (phần còn lại của VN100)
  "AAA", "ABR", "ACV", "AGG", "ANV", "APH", "ASM", "ASP", "BAF", "BFC",
  "BMP", "BSI", "BTP", "BWE", "C32", "C47", "CAV", "CII", "CMG", "CMX",
  "CNG", "CRC", "CSM", "CTD", "CTI", "CTR", "CTS", "DCM", "DGC", "DGW",
  "DHC", "DIG", "DPM", "DRC", "DRH", "DTL", "DXG", "DXS", "EIB", "EVF",
  "EVG", "FCM", "FCN", "FRT", "FTS", "GEG", "GMD", "GSP", "GTN", "HAG",
  "HAH", "HCM", "HDC", "HDG", "HHV", "HNG", "HQC", "HSG", "HT1", "HTN",
  "HTV", "HU1", "HU3", "HVN", "IMP", "ITA", "ITD", "ITC", "JVC", "KBC",
  "KDC", "KDH", "KHG", "KMR", "L10", "LAF", "LBM", "LCG", "LCM", "LDG",
  "LGC", "LHG", "LIX", "LPB", "LSS", "MCP", "MDG", "MIG", "MSB", "MSH",
  "MWG", "NAF", "NAV", "NBC", "NCT", "NHA", "NKG", "NLG", "NNC", "NSC",
  "NT2", "NTL", "NVL", "NVT", "OCB", "OGC", "OPC", "ORS", "PAN", "PC1",
  "PDN", "PDR", "PET", "PGC", "PGD", "PGI", "PHC", "PHR", "PIT", "PLP",
  "PME", "PNJ", "POM", "PPC", "PVD", "PVS", "PVT", "QCG", "RAL", "ROS",
  "S4A", "SAM", "SBT", "SC5", "SCS", "SFI", "SHI", "SII", "SJF", "SKG",
  "SMA", "SMB", "SMC", "SPM", "SRC", "SRF", "SSC", "ST8", "SVC", "SVD",
  "SZC", "SZL", "TCH", "TCM", "TCO", "TCR", "TDC", "TDG", "TDH", "TDM",
  "TDW", "TEG", "TGG", "THG", "TIP", "TIX", "TLD", "TLG", "TLH", "TMT",
  "TNA", "TNG", "TNH", "TNI", "TOP", "TPC", "TRA", "TRC", "TS4", "TSC",
  "TTA", "TTF", "TTP", "TYA", "UIC", "VAF", "VCA", "VCF", "VCI", "VDS",
  "VGC", "VHC", "VHL", "VID", "VIP", "VIS", "VIX", "VND", "VOS", "VPD",
  "VPG", "VPI", "VPS", "VSC", "VSH", "VSI", "VTB", "VTO", "YEG", "YTC"
];

// Fetch stock data from SSI API (1 year = 365 days)
async function fetchFromSSI(symbol, days = 365) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const url = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${symbol}&from=${Math.floor(startDate.getTime()/1000)}&to=${Math.floor(endDate.getTime()/1000)}`;
    
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
    
    if (data.s !== 'ok' || !data.t) return null;
    
    // Transform SSI data format
    const prices = [];
    for (let i = 0; i < data.t.length; i++) {
      prices.push({
        symbol: symbol,
        trading_date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
        open_price: data.o[i],
        high_price: data.h[i],
        low_price: data.l[i],
        close_price: data.c[i],
        volume: data.v[i]
      });
    }
    
    return prices;
  } catch (error) {
    console.log(`  ⚠️ SSI error for ${symbol}: ${error.message}`);
    return null;
  }
}

// Insert to Supabase with batch processing
async function insertToSupabase(table, data) {
  if (!data || data.length === 0) return 0;
  
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify(batch)
      });
      
      if (response.ok) {
        inserted += batch.length;
      } else {
        const error = await response.text();
        console.log(`  ❌ Supabase error: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Insert error: ${error.message}`);
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 100));
  }
  
  return inserted;
}

// Clear old data (optional - comment out if you want to keep existing data)
async function clearTable(table) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers: {
        ...supabaseHeaders,
        "Prefer": "return=minimal"
      }
    });
    
    if (response.ok) {
      console.log(`  🗑️ Cleared ${table}`);
      return true;
    }
  } catch (error) {
    console.log(`  ⚠️ Could not clear ${table}: ${error.message}`);
  }
  return false;
}

// Main sync function for 1 year data
async function sync1YearStockPrices() {
  console.log("\n📈 Syncing 1 YEAR stock prices from SSI API...\n");
  
  // Uncomment to clear old data first
  // await clearTable("stock_prices");
  
  let totalInserted = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < VN100_SYMBOLS.length; i++) {
    const symbol = VN100_SYMBOLS[i];
    console.log(`  [${i+1}/${VN100_SYMBOLS.length}] Fetching ${symbol} (1 year)...`);
    
    const prices = await fetchFromSSI(symbol, 365); // 1 year = 365 days
    
    if (prices && prices.length > 0) {
      const inserted = await insertToSupabase("stock_prices", prices);
      totalInserted += inserted;
      successCount++;
      console.log(`    ✅ ${inserted} records (${prices.length} days)`);
    } else {
      errorCount++;
      console.log(`    ⚠️ No data`);
    }
    
    // Rate limiting - important for SSI API
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n📊 SYNC SUMMARY:`);
  console.log(`  - Total symbols: ${VN100_SYMBOLS.length}`);
  console.log(`  - Successful: ${successCount}`);
  console.log(`  - Failed: ${errorCount}`);
  console.log(`  - Total records: ${totalInserted}`);
  
  return totalInserted;
}

// Sync market indices for 1 year
async function sync1YearMarketIndices() {
  console.log("\n📊 Syncing 1 YEAR market indices from SSI API...\n");
  
  const indexCodes = ["VNINDEX", "VN30", "HNX", "UPCOM"];
  let totalInserted = 0;
  
  for (const indexCode of indexCodes) {
    console.log(`  Fetching ${indexCode} (1 year)...`);
    
    const indices = await fetchIndexFromSSI(indexCode, 365);
    
    if (indices && indices.length > 0) {
      const inserted = await insertToSupabase("market_indices", indices);
      totalInserted += inserted;
      console.log(`    ✅ ${inserted} records`);
    } else {
      console.log(`    ⚠️ No data`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✅ Total index records: ${totalInserted}`);
  return totalInserted;
}

// Fetch market indices from SSI
async function fetchIndexFromSSI(indexCode, days = 365) {
  const indexMap = {
    'VNINDEX': 'VNINDEX',
    'VN30': 'VN30',
    'HNX': 'HNXINDEX',
    'UPCOM': 'UPINDEX'
  };
  
  const ssiCode = indexMap[indexCode] || indexCode;
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const url = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${ssiCode}&from=${Math.floor(startDate.getTime()/1000)}&to=${Math.floor(endDate.getTime()/1000)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`SSI Index API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.s !== 'ok' || !data.t) return null;
    
    const indices = [];
    for (let i = 0; i < data.t.length; i++) {
      const prevClose = i > 0 ? data.c[i-1] : data.o[i];
      indices.push({
        index_code: indexCode,
        trading_date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
        open_value: data.o[i],
        high_value: data.h[i],
        low_value: data.l[i],
        close_value: data.c[i],
        volume: data.v[i],
        change_value: Math.round((data.c[i] - prevClose) * 100) / 100,
        change_percent: Math.round((data.c[i] - prevClose) / prevClose * 10000) / 100
      });
    }
    
    return indices;
  } catch (error) {
    console.log(`  ⚠️ SSI Index error for ${indexCode}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 FinSensei AI - Sync 1 YEAR Data from SSI API");
  console.log("=".repeat(60));
  console.log(`📅 Syncing data for ${VN100_SYMBOLS.length} symbols`);
  console.log(`⏱️ Estimated time: ${Math.ceil(VN100_SYMBOLS.length * 0.5 / 60)} minutes`);
  console.log("=".repeat(60));
  
  const startTime = Date.now();
  
  const stockCount = await sync1YearStockPrices();
  const indexCount = await sync1YearMarketIndices();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 FINAL SUMMARY:");
  console.log(`  - Stock Prices: ${stockCount} records`);
  console.log(`  - Market Indices: ${indexCount} records`);
  console.log(`  - Duration: ${Math.floor(duration/60)}m ${duration%60}s`);
  console.log("=".repeat(60));
  console.log("✅ 1 YEAR data sync complete!");
  console.log("🎯 Ready for FinSensei AI analysis!");
}

// Run the script
main().catch(console.error);