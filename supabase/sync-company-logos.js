/**
 * Sync Company Logos to Supabase
 * Logo URLs cho VN100 companies
 * Chạy: node supabase/sync-company-logos.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

// Logo URLs từ các nguồn uy tín (Vietstock, CafeF, SimpliZe)
// Format: https://finance.vietstock.vn/image/{symbol}
// Hoặc: https://s.cafef.vn/images/logo/{symbol}.png
const getLogoUrl = (symbol) => {
  // Primary source: Vietstock
  return `https://finance.vietstock.vn/image/${symbol}`;
};

// Alternative logo sources
const LOGO_SOURCES = {
  vietstock: (s) => `https://finance.vietstock.vn/image/${s}`,
  cafef: (s) => `https://s.cafef.vn/images/logo/${s}.png`,
  simplize: (s) => `https://simplize.vn/api/company/logo/${s}`,
  fireant: (s) => `https://ra.fireant.vn/api/Data/Companies/CompanyInfo?symbol=${s}`,
};

// VN100 symbols
const VN100 = [
  "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
  "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
  "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
  "ANV", "ASM", "BAF", "BMP", "BSI", "BWE", "CII", "CMG", "CNG", "CTD",
  "DCM", "DGC", "DGW", "DIG", "DPM", "DRC", "DXG", "DXS", "EIB", "EVF",
  "FRT", "GEX", "GMD", "HAG", "HCM", "HDC", "HDG", "HHV", "HSG", "HT1",
  "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MSB", "NAB", "NKG", "NLG",
  "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PET", "PHR", "PNJ", "PPC",
  "PTB", "PVD", "PVS", "PVT", "REE", "SBT", "SCS", "SHI", "SIP", "SJS",
  "SKG", "SZC", "TCH", "TLG", "TNH", "VCG", "VCI", "VGC", "VHC", "VND"
];


async function updateCompanyLogo(symbol, logoUrl) {
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
        body: JSON.stringify({ logo_url: logoUrl })
      }
    );
    return response.ok;
  } catch (e) {
    console.error(`Error updating ${symbol}:`, e.message);
    return false;
  }
}

async function checkLogoExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🖼️  Sync Company Logos to Supabase");
  console.log("=" .repeat(50));
  
  let success = 0, failed = 0;
  
  for (const symbol of VN100) {
    // Use Vietstock as primary source
    const logoUrl = getLogoUrl(symbol);
    
    const result = await updateCompanyLogo(symbol, logoUrl);
    
    if (result) {
      success++;
      console.log(`✅ ${symbol}: ${logoUrl}`);
    } else {
      failed++;
      console.log(`❌ ${symbol}: Failed`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 30));
  }
  
  console.log("=" .repeat(50));
  console.log(`📊 Results: ${success} success, ${failed} failed`);
  console.log("✅ Done!");
}

main().catch(console.error);
