/**
 * Script sync dữ liệu thực từ VCI/Wichart API
 * Đây là nguồn dữ liệu chính của vnstock với source="VCI"
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

// VCI/Wichart API - Stock History (nguồn vnstock VCI)
async function fetchVCIHistory(symbol, days = 100) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    // Wichart API endpoint (VCI source)
    const url = `https://wichart.vn/api/thong-ke/lich-su-gia?symbol=${symbol}&from=${formatDate(startDate)}&to=${formatDate(endDate)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
    const prices = json.data.map(item => ({
      symbol: symbol,
      trading_date: item.date || item.ngay,
      open_price: item.open || item.gia_mo_cua,
      high_price: item.high || item.gia_cao_nhat,
      low_price: item.low || item.gia_thap_nhat,
      close_price: item.close || item.gia_dong_cua,
      volume: item.volume || item.khoi_luong,
      value: item.value || item.gia_tri || null
    }));

    return prices;
  } catch (error) {
    // Try alternative VCI endpoint
    return await fetchVCIAlternative(symbol, days);
  }
}

// Alternative VCI API endpoint
async function fetchVCIAlternative(symbol, days = 100) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // VCI stock API
    const url = `https://api.vietcap.com.vn/data-mt/graphql`;
    
    const query = {
      query: `query stockPrice($symbol: String!, $from: String!, $to: String!) {
        stockPrice(symbol: $symbol, from: $from, to: $to) {
          date
          open
          high
          low
          close
          volume
        }
      }`,
      variables: {
        symbol: symbol,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.data?.stockPrice) {
      return null;
    }

    return json.data.stockPrice.map(item => ({
      symbol: symbol,
      trading_date: item.date,
      open_price: item.open,
      high_price: item.high,
      low_price: item.low,
      close_price: item.close,
      volume: item.volume
    }));
  } catch (error) {
    // Try Cafef as last resort
    return await fetchCafef(symbol, days);
  }
}

// Cafef API (backup source)
async function fetchCafef(symbol, days = 60) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDate = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${symbol}&StartDate=${formatDate(startDate)}&EndDate=${formatDate(endDate)}&PageIndex=1&PageSize=100`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.Data || !json.Data.Data || json.Data.Data.length === 0) {
      return null;
    }

    return json.Data.Data.map(item => {
      // Parse date from "dd/mm/yyyy" format
      const [dd, mm, yyyy] = item.Ngay.split('/');
      return {
        symbol: symbol,
        trading_date: `${yyyy}-${mm}-${dd}`,
        open_price: item.GiaMoCua * 1000,
        high_price: item.GiaCaoNhat * 1000,
        low_price: item.GiaThapNhat * 1000,
        close_price: item.GiaDongCua * 1000,
        volume: item.KhoiLuongKhopLenh,
        value: item.GiaTriKhopLenh
      };
    });
  } catch (error) {
    console.log(`  ⚠️ All sources failed for ${symbol}: ${error.message}`);
    return null;
  }
}

// Fetch index from Cafef
async function fetchCafefIndex(indexCode, days = 60) {
  const indexMap = {
    'VNINDEX': 'VNINDEX',
    'VN30': 'VN30INDEX',
    'HNX': 'HNXINDEX',
    'UPCOM': 'UPCOMINDEX'
  };
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDate = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${indexMap[indexCode]}&StartDate=${formatDate(startDate)}&EndDate=${formatDate(endDate)}&PageIndex=1&PageSize=100`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.Data || !json.Data.Data || json.Data.Data.length === 0) {
      return null;
    }

    return json.Data.Data.map((item, i, arr) => {
      const [dd, mm, yyyy] = item.Ngay.split('/');
      const prevClose = i < arr.length - 1 ? arr[i+1].GiaDongCua : item.GiaMoCua;
      
      return {
        index_code: indexCode,
        trading_date: `${yyyy}-${mm}-${dd}`,
        open_value: item.GiaMoCua,
        high_value: item.GiaCaoNhat,
        low_value: item.GiaThapNhat,
        close_value: item.GiaDongCua,
        volume: item.KhoiLuongKhopLenh,
        value: item.GiaTriKhopLenh,
        change_value: Math.round((item.GiaDongCua - prevClose) * 100) / 100,
        change_percent: Math.round((item.GiaDongCua - prevClose) / prevClose * 10000) / 100
      };
    });
  } catch (error) {
    console.log(`  ⚠️ Cafef Index error for ${indexCode}: ${error.message}`);
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
        console.log(`  ❌ Supabase: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Insert: ${error.message}`);
    }
  }
  
  return inserted;
}

// Clear table
async function clearTable(table) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers: { ...supabaseHeaders, "Prefer": "return=minimal" }
    });
    console.log(`  🗑️ Cleared ${table}`);
  } catch (e) {}
}

// Sync stock prices
async function syncStockPrices() {
  console.log("\n📈 Syncing stock prices from Cafef...\n");
  
  await clearTable("stock_prices");
  
  let totalInserted = 0;
  
  for (let i = 0; i < VN30_SYMBOLS.length; i++) {
    const symbol = VN30_SYMBOLS[i];
    process.stdout.write(`  [${i+1}/${VN30_SYMBOLS.length}] ${symbol}... `);
    
    const prices = await fetchCafef(symbol, 60);
    
    if (prices && prices.length > 0) {
      const inserted = await insertToSupabase("stock_prices", prices);
      totalInserted += inserted;
      console.log(`✅ ${inserted} records`);
    } else {
      console.log(`⚠️ No data`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n✅ Total: ${totalInserted} stock price records`);
  return totalInserted;
}

// Sync indices
async function syncMarketIndices() {
  console.log("\n📊 Syncing market indices from Cafef...\n");
  
  await clearTable("market_indices");
  
  const indexCodes = ["VNINDEX", "VN30", "HNX", "UPCOM"];
  let totalInserted = 0;
  
  for (const indexCode of indexCodes) {
    process.stdout.write(`  ${indexCode}... `);
    
    const indices = await fetchCafefIndex(indexCode, 60);
    
    if (indices && indices.length > 0) {
      const inserted = await insertToSupabase("market_indices", indices);
      totalInserted += inserted;
      console.log(`✅ ${inserted} records`);
    } else {
      console.log(`⚠️ No data`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n✅ Total: ${totalInserted} index records`);
  return totalInserted;
}

// Main
async function main() {
  console.log("=".repeat(50));
  console.log("🚀 FinSensei AI - Sync Real Data (VCI/Cafef)");
  console.log("=".repeat(50));
  
  const stockCount = await syncStockPrices();
  const indexCount = await syncMarketIndices();
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 SYNC SUMMARY:");
  console.log(`  - Stock Prices: ${stockCount} records`);
  console.log(`  - Market Indices: ${indexCount} records`);
  console.log("=".repeat(50));
}

main().catch(console.error);
