/**
 * Sync Outstanding Shares to Supabase
 * Dữ liệu số cổ phiếu lưu hành cho VN100
 * Chạy: node supabase/sync-outstanding-shares.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

// Outstanding shares data (số cổ phiếu lưu hành - đơn vị: cổ phiếu)
// Nguồn: Báo cáo tài chính các công ty, cập nhật Q4/2024
const OUTSTANDING_SHARES = {
  // VN30 - Blue chips
  "ACB": 3800000000,   // Ngân hàng Á Châu
  "BCM": 1200000000,   // Becamex IDC
  "BID": 5100000000,   // BIDV
  "BVH": 740000000,    // Bảo Việt Holdings
  "CTG": 4800000000,   // VietinBank
  "FPT": 1102000000,   // FPT Corporation
  "GAS": 1913000000,   // PV Gas
  "GVR": 4000000000,   // Cao su Việt Nam
  "HDB": 2500000000,   // HDBank
  "HPG": 5600000000,   // Hòa Phát
  "MBB": 5200000000,   // MB Bank
  "MSN": 1180000000,   // Masan Group
  "MWG": 1450000000,   // Thế Giới Di Động
  "PLX": 1300000000,   // Petrolimex
  "POW": 2342000000,   // PV Power
  "SAB": 641000000,    // Sabeco
  "SHB": 3600000000,   // SHB
  "SSB": 1200000000,   // SeABank
  "SSI": 1500000000,   // SSI Securities
  "STB": 2100000000,   // Sacombank
  "TCB": 3500000000,   // Techcombank
  "TPB": 2200000000,   // TPBank
  "VCB": 4729000000,   // Vietcombank
  "VHM": 3350000000,   // Vinhomes
  "VIB": 2500000000,   // VIB
  "VIC": 3900000000,   // Vingroup
  "VJC": 541000000,    // Vietjet Air
  "VNM": 2090000000,   // Vinamilk
  "VPB": 7900000000,   // VPBank
  "VRE": 2300000000,   // Vincom Retail
  
  // VN70 - Mid caps
  "ANV": 92000000,     // Nam Việt
  "ASM": 250000000,    // Sao Mai Group
  "BAF": 150000000,    // BAF Việt Nam
  "BMP": 82000000,     // Nhựa Bình Minh
  "BSI": 150000000,    // BSI
  "BWE": 250000000,    // BWE
  "CII": 270000000,    // CII
  "CMG": 120000000,    // CMC Group
  "CNG": 80000000,     // CNG Việt Nam
  "CTD": 79000000,     // Coteccons
  "DCM": 529000000,    // Đạm Cà Mau
  "DGC": 200000000,    // Hóa chất Đức Giang
  "DGW": 100000000,    // Digiworld
  "DIG": 600000000,    // DIC Corp
  "DPM": 391000000,    // Đạm Phú Mỹ
  "DRC": 145000000,    // Cao su Đà Nẵng
  "DXG": 500000000,    // Đất Xanh
  "DXS": 300000000,    // Đất Xanh Services
  "EIB": 1200000000,   // Eximbank
  "EVF": 300000000,    // EVN Finance
  "FRT": 80000000,     // FPT Retail
  "GEX": 700000000,    // Gelex
  "GMD": 300000000,    // Gemadept
  "HAG": 1100000000,   // HAGL
  "HCM": 350000000,    // HSC
  "HDC": 200000000,    // HDC
  "HDG": 200000000,    // Ha Do Group
  "HHV": 400000000,    // HHV
  "HSG": 500000000,    // Hoa Sen Group
  "HT1": 400000000,    // Xi măng Hà Tiên 1
  "IMP": 70000000,     // Imexpharm
  "KBC": 500000000,    // Kinh Bắc
  "KDC": 280000000,    // Kido Group
  "KDH": 600000000,    // Khang Điền
  "KOS": 200000000,    // KOS
  "LPB": 1500000000,   // LienVietPostBank
  "MSB": 1500000000,   // MSB
  "NAB": 500000000,    // Nam Á Bank
  "NKG": 200000000,    // Thép Nam Kim
  "NLG": 300000000,    // Nam Long
  "NT2": 290000000,    // Nhiệt điện Nhơn Trạch 2
  "NVL": 1900000000,   // Novaland
  "OCB": 1500000000,   // OCB
  "PAN": 200000000,    // PAN Group
  "PC1": 250000000,    // PC1
  "PDR": 600000000,    // Phát Đạt
  "PET": 100000000,    // Petrolimex Gas
  "PHR": 100000000,    // Cao su Phước Hòa
  "PNJ": 230000000,    // PNJ
  "PPC": 330000000,    // Nhiệt điện Phả Lại
  "PTB": 80000000,     // Phú Tài
  "PVD": 500000000,    // PV Drilling
  "PVS": 500000000,    // PV Technical
  "PVT": 350000000,    // PV Trans
  "REE": 310000000,    // REE Corp
  "SBT": 700000000,    // TTC Sugar
  "SCS": 50000000,     // SCS
  "SHI": 150000000,    // SHI
  "SIP": 100000000,    // SIP
  "SJS": 150000000,    // Sudico
  "SKG": 100000000,    // SKG
  "SZC": 200000000,    // Sonadezi Châu Đức
  "TCH": 500000000,    // Hoàng Huy
  "TLG": 100000000,    // Thiên Long
  "TNH": 100000000,    // TNH
  "VCG": 450000000,    // Vinaconex
  "VCI": 300000000,    // Vietcap
  "VGC": 450000000,    // Viglacera
  "VHC": 185000000,    // Vĩnh Hoàn
  "VND": 1400000000    // VNDirect
};


async function updateCompany(symbol, outstandingShares) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?symbol=eq.${symbol}`,
      {
        method: 'PATCH',
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ outstanding_shares: outstandingShares })
      }
    );
    return response.ok;
  } catch (e) {
    console.error(`Error updating ${symbol}:`, e.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Sync Outstanding Shares to Supabase");
  console.log("=" .repeat(50));
  
  const symbols = Object.keys(OUTSTANDING_SHARES);
  let success = 0, failed = 0;
  
  for (const symbol of symbols) {
    const shares = OUTSTANDING_SHARES[symbol];
    const result = await updateCompany(symbol, shares);
    
    if (result) {
      success++;
      console.log(`✅ ${symbol}: ${(shares/1000000).toFixed(0)}M shares`);
    } else {
      failed++;
      console.log(`❌ ${symbol}: Failed`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log("=" .repeat(50));
  console.log(`📊 Results: ${success} success, ${failed} failed`);
  console.log("✅ Done!");
}

main().catch(console.error);
