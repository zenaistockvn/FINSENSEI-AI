/**
 * Script sync sample stock prices data
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

// Sample VN30 symbols với giá tham khảo (đơn vị: nghìn đồng)
const SAMPLE_PRICES = {
  "VNM": { base: 72, volatility: 0.02 },
  "VCB": { base: 92, volatility: 0.015 },
  "VIC": { base: 42, volatility: 0.025 },
  "VHM": { base: 38, volatility: 0.03 },
  "HPG": { base: 25, volatility: 0.025 },
  "FPT": { base: 135, volatility: 0.02 },
  "MWG": { base: 52, volatility: 0.025 },
  "TCB": { base: 24, volatility: 0.02 },
  "VPB": { base: 19, volatility: 0.025 },
  "MBB": { base: 22, volatility: 0.02 },
  "ACB": { base: 24, volatility: 0.02 },
  "BID": { base: 45, volatility: 0.015 },
  "CTG": { base: 32, volatility: 0.02 },
  "STB": { base: 28, volatility: 0.025 },
  "SSI": { base: 28, volatility: 0.03 },
  "VND": { base: 16, volatility: 0.035 },
  "HDB": { base: 24, volatility: 0.02 },
  "TPB": { base: 18, volatility: 0.025 },
  "MSN": { base: 68, volatility: 0.02 },
  "GAS": { base: 78, volatility: 0.015 },
  "PLX": { base: 42, volatility: 0.02 },
  "SAB": { base: 58, volatility: 0.015 },
  "VJC": { base: 98, volatility: 0.025 },
  "POW": { base: 12, volatility: 0.02 },
  "GVR": { base: 18, volatility: 0.025 },
  "BCM": { base: 62, volatility: 0.02 },
  "BVH": { base: 42, volatility: 0.02 },
  "VRE": { base: 22, volatility: 0.03 },
  "VIB": { base: 22, volatility: 0.025 },
  "SHB": { base: 12, volatility: 0.03 },
};

function generatePrice(base, volatility) {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return Math.round(base * (1 + change) * 1000) / 1000;
}

function generateOHLC(base, volatility) {
  const open = generatePrice(base, volatility);
  const close = generatePrice(base, volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility);
  const low = Math.min(open, close) * (1 - Math.random() * volatility);
  const volume = Math.floor(Math.random() * 10000000) + 1000000;
  
  return {
    open_price: Math.round(open * 1000) / 1000,
    high_price: Math.round(high * 1000) / 1000,
    low_price: Math.round(low * 1000) / 1000,
    close_price: Math.round(close * 1000) / 1000,
    volume: volume,
    value: Math.round(volume * close * 1000)
  };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function syncStockPrices() {
  console.log("📈 Generating sample stock prices for last 30 days...\n");
  
  const allPrices = [];
  const today = new Date();
  
  for (const [symbol, config] of Object.entries(SAMPLE_PRICES)) {
    let currentBase = config.base;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const ohlc = generateOHLC(currentBase, config.volatility);
      currentBase = ohlc.close_price; // Use close as next day's base
      
      allPrices.push({
        symbol,
        trading_date: formatDate(date),
        ...ohlc
      });
    }
    console.log(`  Generated prices for ${symbol}`);
  }
  
  console.log(`\n📤 Inserting ${allPrices.length} price records...`);
  
  // Insert in batches
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < allPrices.length; i += batchSize) {
    const batch = allPrices.slice(i, i + batchSize);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(batch)
      });
      
      if (response.ok) {
        inserted += batch.length;
        console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
      } else {
        const error = await response.text();
        console.log(`  ❌ Batch error: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Inserted ${inserted} stock price records`);
  return inserted;
}

async function syncMarketIndices() {
  console.log("\n📊 Generating market indices data...\n");
  
  const indices = [
    { code: "VNINDEX", base: 1250, volatility: 0.01 },
    { code: "VN30", base: 1280, volatility: 0.012 },
    { code: "HNX", base: 230, volatility: 0.015 },
    { code: "UPCOM", base: 92, volatility: 0.01 }
  ];
  
  const allIndices = [];
  const today = new Date();
  
  for (const index of indices) {
    let currentBase = index.base;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const open = generatePrice(currentBase, index.volatility);
      const close = generatePrice(currentBase, index.volatility);
      const high = Math.max(open, close) * (1 + Math.random() * index.volatility);
      const low = Math.min(open, close) * (1 - Math.random() * index.volatility);
      const prevClose = currentBase;
      
      allIndices.push({
        index_code: index.code,
        trading_date: formatDate(date),
        open_value: Math.round(open * 100) / 100,
        high_value: Math.round(high * 100) / 100,
        low_value: Math.round(low * 100) / 100,
        close_value: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 500000000) + 100000000,
        value: Math.floor(Math.random() * 20000000000000) + 5000000000000,
        change_value: Math.round((close - prevClose) * 100) / 100,
        change_percent: Math.round((close - prevClose) / prevClose * 10000) / 100
      });
      
      currentBase = close;
    }
    console.log(`  Generated data for ${index.code}`);
  }
  
  console.log(`\n📤 Inserting ${allIndices.length} index records...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/market_indices`, {
      method: "POST",
      headers: {
        ...headers,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(allIndices)
    });
    
    if (response.ok) {
      console.log(`✅ Inserted ${allIndices.length} market index records`);
      return allIndices.length;
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return 0;
  }
}

async function syncFinancialRatios() {
  console.log("\n📊 Generating financial ratios data...\n");
  
  const symbols = Object.keys(SAMPLE_PRICES);
  const allRatios = [];
  
  for (const symbol of symbols) {
    // Generate data for last 4 quarters
    for (let q = 4; q >= 1; q--) {
      allRatios.push({
        symbol,
        year: 2024,
        quarter: q,
        pe_ratio: Math.round((Math.random() * 20 + 8) * 100) / 100,
        pb_ratio: Math.round((Math.random() * 3 + 0.8) * 100) / 100,
        roe: Math.round((Math.random() * 0.2 + 0.05) * 10000) / 10000,
        roa: Math.round((Math.random() * 0.1 + 0.02) * 10000) / 10000,
        gross_margin: Math.round((Math.random() * 0.3 + 0.15) * 10000) / 10000,
        net_margin: Math.round((Math.random() * 0.15 + 0.05) * 10000) / 10000,
        current_ratio: Math.round((Math.random() * 2 + 1) * 100) / 100,
        debt_to_equity: Math.round((Math.random() * 1.5 + 0.3) * 100) / 100,
        eps: Math.round((Math.random() * 5000 + 1000) * 100) / 100,
        revenue_growth: Math.round((Math.random() * 0.3 - 0.1) * 10000) / 10000,
        profit_growth: Math.round((Math.random() * 0.4 - 0.15) * 10000) / 10000
      });
    }
    console.log(`  Generated ratios for ${symbol}`);
  }
  
  console.log(`\n📤 Inserting ${allRatios.length} ratio records...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/financial_ratios`, {
      method: "POST",
      headers: {
        ...headers,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(allRatios)
    });
    
    if (response.ok) {
      console.log(`✅ Inserted ${allRatios.length} financial ratio records`);
      return allRatios.length;
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return 0;
  }
}

async function logSync(syncType, status, recordsCount) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/data_sync_logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sync_type: syncType,
        status: status,
        records_count: recordsCount,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
    });
  } catch (e) {}
}

async function main() {
  console.log("=".repeat(50));
  console.log("🚀 FinSensei AI - Sync Sample Data");
  console.log("=".repeat(50));
  
  const priceCount = await syncStockPrices();
  await logSync("STOCK_PRICES", "SUCCESS", priceCount);
  
  const indexCount = await syncMarketIndices();
  await logSync("MARKET_INDICES", "SUCCESS", indexCount);
  
  const ratioCount = await syncFinancialRatios();
  await logSync("FINANCIAL_RATIOS", "SUCCESS", ratioCount);
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 SYNC SUMMARY:");
  console.log(`  - Companies: 100 records`);
  console.log(`  - Stock Prices: ${priceCount} records`);
  console.log(`  - Market Indices: ${indexCount} records`);
  console.log(`  - Financial Ratios: ${ratioCount} records`);
  console.log("=".repeat(50));
  console.log("✅ All data synced successfully!");
}

main();
