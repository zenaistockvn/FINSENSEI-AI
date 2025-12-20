/**
 * Script sync dữ liệu thực từ VCI API (nguồn vnstock)
 * VCI API endpoints được reverse-engineer từ vnstock library
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const supabaseHeaders = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=minimal"
};

// VCI API Base URL (nguồn dữ liệu của vnstock)
const VCI_API = "https://mt.vietcap.com.vn/api";

// VN30 symbols để sync
const VN30_SYMBOLS = [
  "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"
];

// Helper: Format date
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

// Fetch stock history from VCI API
async function fetchStockHistory(symbol, startDate, endDate) {
  try {
    // VCI API endpoint for historical data
    const url = `${VCI_API}/price/symbols/getByDate`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        symbol: symbol,
        fromDate: startDate.replace(/-/g, ''),
        toDate: endDate.replace(/-/g, '')
      })
    });

    if (!response.ok) {
      throw new Error(`VCI API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`  ⚠️ Error fetching ${symbol}: ${error.message}`);
    return null;
  }
}

// Alternative: Fetch from TCBS API
async function fetchFromTCBS(symbol, days = 365) {
  try {
    const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${symbol}&type=stock&resolution=D&countBack=${days}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`TCBS API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.log(`  ⚠️ TCBS error for ${symbol}: ${error.message}`);
    return null;
  }
}

// Fetch from SSI API (alternative source)
async function fetchFromSSI(symbol, days = 100) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const url = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=${symbol}&from=${Math.floor(startDate.getTime()/1000)}&to=${Math.floor(endDate.getTime()/1000)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
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

// Fetch market indices from SSI
async function fetchIndexFromSSI(indexCode, days = 100) {
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
        'User-Agent': 'Mozilla/5.0'
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
        console.log(`  ❌ Supabase error: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Insert error: ${error.message}`);
    }
  }
  
  return inserted;
}

// Clear old data
async function clearTable(table) {
  try {
    // Delete all records
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

// Main sync function
async function syncStockPrices() {
  console.log("\n📈 Syncing real stock prices from SSI API...\n");
  
  // Clear old data first
  await clearTable("stock_prices");
  
  let totalInserted = 0;
  
  for (let i = 0; i < VN30_SYMBOLS.length; i++) {
    const symbol = VN30_SYMBOLS[i];
    console.log(`  [${i+1}/${VN30_SYMBOLS.length}] Fetching ${symbol}...`);
    
    const prices = await fetchFromSSI(symbol, 60); // Last 60 days
    
    if (prices && prices.length > 0) {
      const inserted = await insertToSupabase("stock_prices", prices);
      totalInserted += inserted;
      console.log(`    ✅ ${inserted} records`);
    } else {
      console.log(`    ⚠️ No data`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n✅ Total stock prices: ${totalInserted} records`);
  return totalInserted;
}

async function syncMarketIndices() {
  console.log("\n📊 Syncing market indices from SSI API...\n");
  
  // Clear old data
  await clearTable("market_indices");
  
  const indexCodes = ["VNINDEX", "VN30", "HNX", "UPCOM"];
  let totalInserted = 0;
  
  for (const indexCode of indexCodes) {
    console.log(`  Fetching ${indexCode}...`);
    
    const indices = await fetchIndexFromSSI(indexCode, 60);
    
    if (indices && indices.length > 0) {
      const inserted = await insertToSupabase("market_indices", indices);
      totalInserted += inserted;
      console.log(`    ✅ ${inserted} records`);
    } else {
      console.log(`    ⚠️ No data`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n✅ Total index records: ${totalInserted}`);
  return totalInserted;
}

async function main() {
  console.log("=".repeat(50));
  console.log("🚀 FinSensei AI - Sync Real Data from SSI/VCI");
  console.log("=".repeat(50));
  
  const stockCount = await syncStockPrices();
  const indexCount = await syncMarketIndices();
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 SYNC SUMMARY:");
  console.log(`  - Stock Prices: ${stockCount} records`);
  console.log(`  - Market Indices: ${indexCount} records`);
  console.log("=".repeat(50));
  console.log("✅ Real data sync complete!");
}

main().catch(console.error);
