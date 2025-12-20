/**
 * Script sync dữ liệu thực từ TCBS API
 * TCBS là nguồn dữ liệu chính của vnstock
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const supabaseHeaders = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=minimal"
};

// VN30 symbols
const VN30_SYMBOLS = [
  "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"
];

// Fetch from TCBS API - Stock History
async function fetchTCBSHistory(symbol, days = 100) {
  try {
    const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${symbol}&type=stock&resolution=D&countBack=${days}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://tcinvest.tcbs.com.vn',
        'Referer': 'https://tcinvest.tcbs.com.vn/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.data || json.data.length === 0) {
      return null;
    }

    // Transform TCBS data format
    const prices = json.data.map(item => ({
      symbol: symbol,
      trading_date: item.tradingDate,
      open_price: item.open,
      high_price: item.high,
      low_price: item.low,
      close_price: item.close,
      volume: item.volume,
      value: item.value || null
    }));

    return prices;
  } catch (error) {
    console.log(`  ⚠️ TCBS error for ${symbol}: ${error.message}`);
    return null;
  }
}

// Fetch TCBS Index Data
async function fetchTCBSIndex(indexCode, days = 100) {
  const indexMap = {
    'VNINDEX': 'VNINDEX',
    'VN30': 'VN30',
    'HNX': 'HNX',
    'UPCOM': 'UPCOM'
  };
  
  try {
    const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${indexMap[indexCode]}&type=index&resolution=D&countBack=${days}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://tcinvest.tcbs.com.vn',
        'Referer': 'https://tcinvest.tcbs.com.vn/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.data || json.data.length === 0) {
      return null;
    }

    // Transform data
    const indices = json.data.map((item, i, arr) => {
      const prevClose = i > 0 ? arr[i-1].close : item.open;
      return {
        index_code: indexCode,
        trading_date: item.tradingDate,
        open_value: item.open,
        high_value: item.high,
        low_value: item.low,
        close_value: item.close,
        volume: item.volume,
        value: item.value || null,
        change_value: Math.round((item.close - prevClose) * 100) / 100,
        change_percent: Math.round((item.close - prevClose) / prevClose * 10000) / 100
      };
    });

    return indices;
  } catch (error) {
    console.log(`  ⚠️ TCBS Index error for ${indexCode}: ${error.message}`);
    return null;
  }
}

// Insert to Supabase
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
        console.log(`  ❌ Supabase error: ${error.substring(0, 150)}`);
      }
    } catch (error) {
      console.log(`  ❌ Insert error: ${error.message}`);
    }
  }
  
  return inserted;
}

// Clear table
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
    console.log(`  ⚠️ Could not clear ${table}`);
  }
  return false;
}

// Sync stock prices
async function syncStockPrices() {
  console.log("\n📈 Syncing real stock prices from TCBS API...\n");
  
  await clearTable("stock_prices");
  
  let totalInserted = 0;
  
  for (let i = 0; i < VN30_SYMBOLS.length; i++) {
    const symbol = VN30_SYMBOLS[i];
    process.stdout.write(`  [${i+1}/${VN30_SYMBOLS.length}] ${symbol}... `);
    
    const prices = await fetchTCBSHistory(symbol, 60);
    
    if (prices && prices.length > 0) {
      const inserted = await insertToSupabase("stock_prices", prices);
      totalInserted += inserted;
      console.log(`✅ ${inserted} records`);
    } else {
      console.log(`⚠️ No data`);
    }
    
    // Rate limiting - 500ms delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✅ Total stock prices: ${totalInserted} records`);
  return totalInserted;
}

// Sync market indices
async function syncMarketIndices() {
  console.log("\n📊 Syncing market indices from TCBS API...\n");
  
  await clearTable("market_indices");
  
  const indexCodes = ["VNINDEX", "VN30", "HNX", "UPCOM"];
  let totalInserted = 0;
  
  for (const indexCode of indexCodes) {
    process.stdout.write(`  ${indexCode}... `);
    
    const indices = await fetchTCBSIndex(indexCode, 60);
    
    if (indices && indices.length > 0) {
      const inserted = await insertToSupabase("market_indices", indices);
      totalInserted += inserted;
      console.log(`✅ ${inserted} records`);
    } else {
      console.log(`⚠️ No data`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✅ Total index records: ${totalInserted}`);
  return totalInserted;
}

// Main
async function main() {
  console.log("=".repeat(50));
  console.log("🚀 FinSensei AI - Sync Real Data from TCBS");
  console.log("=".repeat(50));
  
  const stockCount = await syncStockPrices();
  const indexCount = await syncMarketIndices();
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 SYNC SUMMARY:");
  console.log(`  - Stock Prices: ${stockCount} records (VN30)`);
  console.log(`  - Market Indices: ${indexCount} records`);
  console.log("=".repeat(50));
  console.log("✅ Real data sync complete!");
}

main().catch(console.error);
