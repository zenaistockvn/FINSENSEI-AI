/**
 * FinSensei AI - Sync VN100 2 Years Data
 * Nguồn: Cafef API (tương thích VCI)
 * 
 * Chạy: node supabase/sync-vn100-2years.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const supabaseHeaders = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=minimal"
};

// VN100 symbols
const VN100_SYMBOLS = [
  // VN30
  "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
  // VN70
  "ANV", "ASM", "BAF", "BMP", "BSI", "BWE", "CII", "CMG", "CNG", "CTD",
  "DCM", "DGC", "DGW", "DIG", "DPM", "DRC", "DXG", "DXS", "EIB", "EVF",
  "FRT", "GEX", "GMD", "HAG", "HCM", "HDC", "HDG", "HHV", "HSG", "HT1",
  "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MSB", "NAB", "NKG", "NLG",
  "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PET", "PHR", "PNJ", "PPC",
  "PTB", "PVD", "PVS", "PVT", "REE", "SBT", "SCS", "SHI", "SIP", "SJS",
  "SKG", "SZC", "TCH", "TLG", "TNH", "VCG", "VCI", "VGC", "VHC", "VND"
];

const MARKET_INDICES = ['VNINDEX', 'VN30', 'HNX', 'UPCOM'];

// Company info mapping
const COMPANY_INFO = {
  "ACB": { name: "Ngân hàng TMCP Á Châu", industry: "Ngân hàng" },
  "BCM": { name: "Tổng Công ty Đầu tư và Phát triển Công nghiệp", industry: "Bất động sản" },
  "BID": { name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", industry: "Ngân hàng" },
  "BVH": { name: "Tập đoàn Bảo Việt", industry: "Bảo hiểm" },
  "CTG": { name: "Ngân hàng TMCP Công Thương Việt Nam", industry: "Ngân hàng" },
  "FPT": { name: "Công ty Cổ phần FPT", industry: "Công nghệ" },
  "GAS": { name: "Tổng Công ty Khí Việt Nam", industry: "Dầu khí" },
  "GVR": { name: "Tập đoàn Công nghiệp Cao su Việt Nam", industry: "Cao su" },
  "HDB": { name: "Ngân hàng TMCP Phát triển TP.HCM", industry: "Ngân hàng" },
  "HPG": { name: "Công ty Cổ phần Tập đoàn Hòa Phát", industry: "Thép" },
  "MBB": { name: "Ngân hàng TMCP Quân đội", industry: "Ngân hàng" },
  "MSN": { name: "Công ty Cổ phần Tập đoàn Masan", industry: "Hàng tiêu dùng" },
  "MWG": { name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", industry: "Bán lẻ" },
  "PLX": { name: "Tập đoàn Xăng Dầu Việt Nam", industry: "Dầu khí" },
  "POW": { name: "Tổng Công ty Điện lực Dầu khí Việt Nam", industry: "Điện" },
  "SAB": { name: "Tổng Công ty Bia - Rượu - Nước giải khát Sài Gòn", industry: "Đồ uống" },
  "SHB": { name: "Ngân hàng TMCP Sài Gòn - Hà Nội", industry: "Ngân hàng" },
  "SSB": { name: "Ngân hàng TMCP Đông Nam Á", industry: "Ngân hàng" },
  "SSI": { name: "Công ty Cổ phần Chứng khoán SSI", industry: "Chứng khoán" },
  "STB": { name: "Ngân hàng TMCP Sài Gòn Thương Tín", industry: "Ngân hàng" },
  "TCB": { name: "Ngân hàng TMCP Kỹ Thương Việt Nam", industry: "Ngân hàng" },
  "TPB": { name: "Ngân hàng TMCP Tiên Phong", industry: "Ngân hàng" },
  "VCB": { name: "Ngân hàng TMCP Ngoại thương Việt Nam", industry: "Ngân hàng" },
  "VHM": { name: "Công ty Cổ phần Vinhomes", industry: "Bất động sản" },
  "VIB": { name: "Ngân hàng TMCP Quốc tế Việt Nam", industry: "Ngân hàng" },
  "VIC": { name: "Tập đoàn Vingroup", industry: "Bất động sản" },
  "VJC": { name: "Công ty Cổ phần Hàng không Vietjet", industry: "Hàng không" },
  "VNM": { name: "Công ty Cổ phần Sữa Việt Nam", industry: "Thực phẩm" },
  "VPB": { name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", industry: "Ngân hàng" },
  "VRE": { name: "Công ty Cổ phần Vincom Retail", industry: "Bất động sản" }
};

// Stats
let stats = {
  priceCount: 0,
  companyCount: 0,
  indexCount: 0,
  errorCount: 0,
  startTime: Date.now()
};

// Helper: delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: format date for Cafef
function formatDateCafef(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Fetch stock history from Cafef
async function fetchCafefHistory(symbol, days = 730) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${symbol}&StartDate=${formatDateCafef(startDate)}&EndDate=${formatDateCafef(endDate)}&PageIndex=1&PageSize=1000`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();
    
    if (!json.Data?.Data?.length) return null;
    
    return json.Data.Data.map(item => {
      const [dd, mm, yyyy] = item.Ngay.split('/');
      return {
        symbol: symbol,
        trading_date: `${yyyy}-${mm}-${dd}`,
        open_price: Math.round(item.GiaMoCua * 1000),
        high_price: Math.round(item.GiaCaoNhat * 1000),
        low_price: Math.round(item.GiaThapNhat * 1000),
        close_price: Math.round(item.GiaDongCua * 1000),
        volume: item.KhoiLuongKhopLenh || 0
      };
    });
  } catch (error) {
    return null;
  }
}

// Fetch index history from Cafef
async function fetchCafefIndex(indexCode, days = 730) {
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
    
    const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${indexMap[indexCode]}&StartDate=${formatDateCafef(startDate)}&EndDate=${formatDateCafef(endDate)}&PageIndex=1&PageSize=1000`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();
    
    if (!json.Data?.Data?.length) return null;
    
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
        volume: item.KhoiLuongKhopLenh || 0,
        change_value: Math.round((item.GiaDongCua - prevClose) * 100) / 100,
        change_percent: Math.round((item.GiaDongCua - prevClose) / prevClose * 10000) / 100
      };
    });
  } catch (error) {
    return null;
  }
}

// Insert to Supabase
async function insertToSupabase(table, data) {
  if (!data?.length) return 0;
  
  const batchSize = 200;
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
        const text = await response.text();
        if (text.includes('duplicate')) {
          inserted += batch.length;
        }
      }
    } catch (error) {
      // Continue on error
    }
    
    await delay(50);
  }
  
  return inserted;
}

// Insert company info
async function insertCompany(symbol) {
  const info = COMPANY_INFO[symbol] || { name: symbol, industry: "Khác" };
  
  const companyData = {
    symbol: symbol,
    company_name: info.name,
    company_name_en: info.name,
    exchange: "HOSE",
    industry: info.industry,
    sector: info.industry,
    is_vn100: true,
    is_active: true
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify([companyData])
    });
    
    return response.ok || (await response.text()).includes('duplicate');
  } catch {
    return false;
  }
}

// Main sync function
async function main() {
  console.log("=".repeat(60));
  console.log("🚀 FinSensei AI - Sync VN100 2 Years Data");
  console.log("=".repeat(60));
  console.log(`📊 Số mã: ${VN100_SYMBOLS.length}`);
  console.log(`📈 Chỉ số: ${MARKET_INDICES.join(', ')}`);
  console.log(`📅 Khoảng thời gian: 730 ngày (2 năm)`);
  console.log("=".repeat(60));
  
  // Sync stocks
  console.log("\n📈 SYNCING STOCK PRICES...\n");
  
  for (let i = 0; i < VN100_SYMBOLS.length; i++) {
    const symbol = VN100_SYMBOLS[i];
    const progress = `[${i+1}/${VN100_SYMBOLS.length}]`;
    
    process.stdout.write(`${progress} ${symbol}... `);
    
    try {
      const prices = await fetchCafefHistory(symbol, 730);
      
      if (prices?.length) {
        const inserted = await insertToSupabase('stock_prices', prices);
        stats.priceCount += inserted;
        
        // Insert company info
        if (await insertCompany(symbol)) {
          stats.companyCount++;
        }
        
        console.log(`✅ ${inserted} records`);
      } else {
        stats.errorCount++;
        console.log(`⚠️ No data`);
      }
    } catch (error) {
      stats.errorCount++;
      console.log(`❌ Error`);
    }
    
    // Progress update every 20 symbols
    if ((i + 1) % 20 === 0) {
      const elapsed = (Date.now() - stats.startTime) / 1000;
      const avgTime = elapsed / (i + 1);
      const remaining = Math.round((VN100_SYMBOLS.length - i - 1) * avgTime / 60);
      
      console.log(`\n📊 Progress: ${i+1}/${VN100_SYMBOLS.length} (${Math.round((i+1)/VN100_SYMBOLS.length*100)}%)`);
      console.log(`⏱️ Remaining: ~${remaining} minutes`);
      console.log(`📈 Total prices: ${stats.priceCount.toLocaleString()}\n`);
    }
    
    await delay(300);
  }
  
  // Sync indices
  console.log("\n📊 SYNCING MARKET INDICES...\n");
  
  for (const indexCode of MARKET_INDICES) {
    process.stdout.write(`  ${indexCode}... `);
    
    try {
      const indices = await fetchCafefIndex(indexCode, 730);
      
      if (indices?.length) {
        const inserted = await insertToSupabase('market_indices', indices);
        stats.indexCount += inserted;
        console.log(`✅ ${inserted} records`);
      } else {
        console.log(`⚠️ No data`);
      }
    } catch (error) {
      console.log(`❌ Error`);
    }
    
    await delay(300);
  }
  
  // Summary
  const duration = Math.round((Date.now() - stats.startTime) / 1000);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 SYNC SUMMARY:");
  console.log("-".repeat(40));
  console.log(`  📈 Stock Prices: ${stats.priceCount.toLocaleString()} records`);
  console.log(`  🏢 Companies: ${stats.companyCount}`);
  console.log(`  📊 Index Records: ${stats.indexCount.toLocaleString()}`);
  console.log(`  ❌ Errors: ${stats.errorCount}`);
  console.log("-".repeat(40));
  console.log(`  📦 Total: ${(stats.priceCount + stats.indexCount).toLocaleString()} records`);
  console.log(`  ⏱️ Duration: ${Math.floor(duration/60)}m ${duration%60}s`);
  console.log("=".repeat(60));
  console.log("✅ Sync complete! FinSensei AI is ready!");
  console.log("=".repeat(60));
}

main().catch(console.error);
