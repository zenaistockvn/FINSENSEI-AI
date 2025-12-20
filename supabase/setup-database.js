/**
 * Script tự động setup database và sync dữ liệu VN100
 * Chạy: node setup-database.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

// Danh sách 100 mã VN100
const VN100_COMPANIES = [
  { symbol: "ACB", company_name: "Ngân hàng TMCP Á Châu", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "BCM", company_name: "Tổng Công ty Đầu tư và Phát triển Công nghiệp", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "BID", company_name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "BVH", company_name: "Tập đoàn Bảo Việt", exchange: "HOSE", industry: "Bảo hiểm" },
  { symbol: "CTG", company_name: "Ngân hàng TMCP Công Thương Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "FPT", company_name: "Công ty Cổ phần FPT", exchange: "HOSE", industry: "Công nghệ" },
  { symbol: "GAS", company_name: "Tổng Công ty Khí Việt Nam", exchange: "HOSE", industry: "Dầu khí" },
  { symbol: "GVR", company_name: "Tập đoàn Công nghiệp Cao su Việt Nam", exchange: "HOSE", industry: "Cao su" },
  { symbol: "HDB", company_name: "Ngân hàng TMCP Phát triển TP.HCM", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "HPG", company_name: "Công ty Cổ phần Tập đoàn Hòa Phát", exchange: "HOSE", industry: "Thép" },
  { symbol: "MBB", company_name: "Ngân hàng TMCP Quân đội", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "MSN", company_name: "Công ty Cổ phần Tập đoàn Masan", exchange: "HOSE", industry: "Hàng tiêu dùng" },
  { symbol: "MWG", company_name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", exchange: "HOSE", industry: "Bán lẻ" },
  { symbol: "PLX", company_name: "Tập đoàn Xăng Dầu Việt Nam", exchange: "HOSE", industry: "Dầu khí" },
  { symbol: "POW", company_name: "Tổng Công ty Điện lực Dầu khí Việt Nam", exchange: "HOSE", industry: "Điện" },
  { symbol: "SAB", company_name: "Tổng Công ty Bia - Rượu - Nước giải khát Sài Gòn", exchange: "HOSE", industry: "Đồ uống" },
  { symbol: "SHB", company_name: "Ngân hàng TMCP Sài Gòn - Hà Nội", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "SSB", company_name: "Ngân hàng TMCP Đông Nam Á", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "SSI", company_name: "Công ty Cổ phần Chứng khoán SSI", exchange: "HOSE", industry: "Chứng khoán" },
  { symbol: "STB", company_name: "Ngân hàng TMCP Sài Gòn Thương Tín", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "TCB", company_name: "Ngân hàng TMCP Kỹ Thương Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "TPB", company_name: "Ngân hàng TMCP Tiên Phong", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "VCB", company_name: "Ngân hàng TMCP Ngoại thương Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "VHM", company_name: "Công ty Cổ phần Vinhomes", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "VIB", company_name: "Ngân hàng TMCP Quốc tế Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "VIC", company_name: "Tập đoàn Vingroup", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "VJC", company_name: "Công ty Cổ phần Hàng không Vietjet", exchange: "HOSE", industry: "Hàng không" },
  { symbol: "VNM", company_name: "Công ty Cổ phần Sữa Việt Nam", exchange: "HOSE", industry: "Thực phẩm" },
  { symbol: "VPB", company_name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "VRE", company_name: "Công ty Cổ phần Vincom Retail", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "ANV", company_name: "Công ty Cổ phần Nam Việt", exchange: "HOSE", industry: "Thủy sản" },
  { symbol: "ASM", company_name: "Công ty Cổ phần Tập đoàn Sao Mai", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "BAF", company_name: "Công ty Cổ phần Nông nghiệp BaF Việt Nam", exchange: "HOSE", industry: "Nông nghiệp" },
  { symbol: "BMP", company_name: "Công ty Cổ phần Nhựa Bình Minh", exchange: "HOSE", industry: "Nhựa" },
  { symbol: "BSI", company_name: "Công ty Cổ phần Chứng khoán BIDV", exchange: "HOSE", industry: "Chứng khoán" },
  { symbol: "BWE", company_name: "Công ty Cổ phần Nước - Môi trường Bình Dương", exchange: "HOSE", industry: "Tiện ích" },
  { symbol: "CII", company_name: "Công ty Cổ phần Đầu tư Hạ tầng Kỹ thuật TP.HCM", exchange: "HOSE", industry: "Hạ tầng" },
  { symbol: "CMG", company_name: "Công ty Cổ phần Tập đoàn Công nghệ CMC", exchange: "HOSE", industry: "Công nghệ" },
  { symbol: "CNG", company_name: "Công ty Cổ phần CNG Việt Nam", exchange: "HOSE", industry: "Dầu khí" },
  { symbol: "CTD", company_name: "Công ty Cổ phần Xây dựng Coteccons", exchange: "HOSE", industry: "Xây dựng" },
  { symbol: "DCM", company_name: "Công ty Cổ phần Phân bón Dầu khí Cà Mau", exchange: "HOSE", industry: "Hóa chất" },
  { symbol: "DGC", company_name: "Công ty Cổ phần Tập đoàn Hóa chất Đức Giang", exchange: "HOSE", industry: "Hóa chất" },
  { symbol: "DGW", company_name: "Công ty Cổ phần Thế Giới Số", exchange: "HOSE", industry: "Công nghệ" },
  { symbol: "DIG", company_name: "Tổng Công ty Đầu tư Phát triển Xây dựng", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "DPM", company_name: "Tổng Công ty Phân bón và Hóa chất Dầu khí", exchange: "HOSE", industry: "Hóa chất" },
  { symbol: "DRC", company_name: "Công ty Cổ phần Cao su Đà Nẵng", exchange: "HOSE", industry: "Cao su" },
  { symbol: "DXG", company_name: "Công ty Cổ phần Tập đoàn Đất Xanh", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "DXS", company_name: "Công ty Cổ phần Dịch vụ Bất động sản Đất Xanh", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "EIB", company_name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "EVF", company_name: "Công ty Tài chính Cổ phần Điện lực", exchange: "HOSE", industry: "Tài chính" },
];

const VN100_COMPANIES_2 = [
  { symbol: "FRT", company_name: "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT", exchange: "HOSE", industry: "Bán lẻ" },
  { symbol: "GEX", company_name: "Tổng Công ty Thiết bị Điện Việt Nam", exchange: "HOSE", industry: "Điện" },
  { symbol: "GMD", company_name: "Công ty Cổ phần Gemadept", exchange: "HOSE", industry: "Logistics" },
  { symbol: "HAG", company_name: "Công ty Cổ phần Hoàng Anh Gia Lai", exchange: "HOSE", industry: "Nông nghiệp" },
  { symbol: "HCM", company_name: "Công ty Cổ phần Chứng khoán TP.HCM", exchange: "HOSE", industry: "Chứng khoán" },
  { symbol: "HDC", company_name: "Công ty Cổ phần Phát triển Nhà Bà Rịa - Vũng Tàu", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "HDG", company_name: "Công ty Cổ phần Tập đoàn Hà Đô", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "HHV", company_name: "Công ty Cổ phần Đầu tư Hạ tầng Giao thông Đèo Cả", exchange: "HOSE", industry: "Hạ tầng" },
  { symbol: "HSG", company_name: "Công ty Cổ phần Tập đoàn Hoa Sen", exchange: "HOSE", industry: "Thép" },
  { symbol: "HT1", company_name: "Công ty Cổ phần Xi măng Hà Tiên 1", exchange: "HOSE", industry: "Vật liệu xây dựng" },
  { symbol: "IMP", company_name: "Công ty Cổ phần Dược phẩm Imexpharm", exchange: "HOSE", industry: "Dược phẩm" },
  { symbol: "KBC", company_name: "Tổng Công ty Phát triển Đô thị Kinh Bắc", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "KDC", company_name: "Công ty Cổ phần Tập đoàn KIDO", exchange: "HOSE", industry: "Thực phẩm" },
  { symbol: "KDH", company_name: "Công ty Cổ phần Đầu tư Kinh doanh Nhà Khang Điền", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "KOS", company_name: "Công ty Cổ phần KOSY", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "LPB", company_name: "Ngân hàng TMCP Bưu điện Liên Việt", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "MSB", company_name: "Ngân hàng TMCP Hàng Hải Việt Nam", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "NAB", company_name: "Ngân hàng TMCP Nam Á", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "NKG", company_name: "Công ty Cổ phần Thép Nam Kim", exchange: "HOSE", industry: "Thép" },
  { symbol: "NLG", company_name: "Công ty Cổ phần Đầu tư Nam Long", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "NT2", company_name: "Công ty Cổ phần Điện lực Dầu khí Nhơn Trạch 2", exchange: "HOSE", industry: "Điện" },
  { symbol: "NVL", company_name: "Công ty Cổ phần Tập đoàn Đầu tư Địa ốc No Va", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "OCB", company_name: "Ngân hàng TMCP Phương Đông", exchange: "HOSE", industry: "Ngân hàng" },
  { symbol: "PAN", company_name: "Công ty Cổ phần Tập đoàn PAN", exchange: "HOSE", industry: "Nông nghiệp" },
  { symbol: "PC1", company_name: "Công ty Cổ phần Tập đoàn PC1", exchange: "HOSE", industry: "Điện" },
  { symbol: "PDR", company_name: "Công ty Cổ phần Phát triển Bất động sản Phát Đạt", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "PET", company_name: "Tổng Công ty Dịch vụ Tổng hợp Dầu khí", exchange: "HOSE", industry: "Dầu khí" },
  { symbol: "PHR", company_name: "Công ty Cổ phần Cao su Phước Hòa", exchange: "HOSE", industry: "Cao su" },
  { symbol: "PNJ", company_name: "Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận", exchange: "HOSE", industry: "Bán lẻ" },
  { symbol: "PPC", company_name: "Công ty Cổ phần Nhiệt điện Phả Lại", exchange: "HOSE", industry: "Điện" },
  { symbol: "PTB", company_name: "Công ty Cổ phần Phú Tài", exchange: "HOSE", industry: "Vật liệu xây dựng" },
  { symbol: "PVD", company_name: "Tổng Công ty Khoan và Dịch vụ Khoan Dầu khí", exchange: "HOSE", industry: "Dầu khí" },
  { symbol: "PVS", company_name: "Tổng Công ty Dịch vụ Kỹ thuật Dầu khí Việt Nam", exchange: "HNX", industry: "Dầu khí" },
  { symbol: "PVT", company_name: "Tổng Công ty Vận tải Dầu khí", exchange: "HOSE", industry: "Vận tải" },
  { symbol: "REE", company_name: "Công ty Cổ phần Cơ Điện Lạnh", exchange: "HOSE", industry: "Điện" },
  { symbol: "SBT", company_name: "Công ty Cổ phần Thành Thành Công - Biên Hòa", exchange: "HOSE", industry: "Thực phẩm" },
  { symbol: "SCS", company_name: "Công ty Cổ phần Dịch vụ Hàng hóa Sài Gòn", exchange: "HOSE", industry: "Logistics" },
  { symbol: "SHI", company_name: "Công ty Cổ phần Quốc tế Sơn Hà", exchange: "HOSE", industry: "Sản xuất" },
  { symbol: "SIP", company_name: "Công ty Cổ phần Đầu tư Sài Gòn VRG", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "SJS", company_name: "Công ty Cổ phần Đầu tư Phát triển Đô thị và KCN Sông Đà", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "SKG", company_name: "Công ty Cổ phần Tập đoàn Superdong - Kiên Giang", exchange: "HOSE", industry: "Vận tải" },
  { symbol: "SZC", company_name: "Công ty Cổ phần Sonadezi Châu Đức", exchange: "HOSE", industry: "Bất động sản" },
  { symbol: "TCH", company_name: "Công ty Cổ phần Đầu tư Dịch vụ Tài chính Hoàng Huy", exchange: "HOSE", industry: "Tài chính" },
  { symbol: "TLG", company_name: "Công ty Cổ phần Tập đoàn Thiên Long", exchange: "HOSE", industry: "Sản xuất" },
  { symbol: "TNH", company_name: "Công ty Cổ phần Bệnh viện Quốc tế Thái Nguyên", exchange: "HOSE", industry: "Y tế" },
  { symbol: "VCG", company_name: "Tổng Công ty Xuất nhập khẩu và Xây dựng Việt Nam", exchange: "HOSE", industry: "Xây dựng" },
  { symbol: "VCI", company_name: "Công ty Cổ phần Chứng khoán Bản Việt", exchange: "HOSE", industry: "Chứng khoán" },
  { symbol: "VGC", company_name: "Tổng Công ty Viglacera", exchange: "HOSE", industry: "Vật liệu xây dựng" },
  { symbol: "VHC", company_name: "Công ty Cổ phần Vĩnh Hoàn", exchange: "HOSE", industry: "Thủy sản" },
  { symbol: "VND", company_name: "Công ty Cổ phần Chứng khoán VNDirect", exchange: "HOSE", industry: "Chứng khoán" },
];

async function testConnection() {
  console.log("🔗 Testing Supabase connection...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
    if (response.ok) {
      console.log("✅ Connected to Supabase successfully!");
      return true;
    } else {
      console.log(`❌ Connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
    return false;
  }
}

async function insertCompanies() {
  console.log("\n🏢 Inserting VN100 companies...");
  
  const allCompanies = [...VN100_COMPANIES, ...VN100_COMPANIES_2].map(c => ({
    ...c,
    is_vn100: true,
    is_active: true
  }));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
      method: "POST",
      headers: {
        ...headers,
        "Prefer": "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(allCompanies)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Inserted ${data.length} companies`);
      return data.length;
    } else {
      const error = await response.text();
      console.log(`❌ Insert failed: ${response.status}`);
      console.log(error);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return 0;
  }
}

async function checkTables() {
  console.log("\n📋 Checking tables...");
  const tables = ["companies", "stock_prices", "financial_ratios", "market_indices"];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, { headers });
      if (response.ok) {
        console.log(`  ✅ ${table} - exists`);
      } else {
        console.log(`  ❌ ${table} - not found (${response.status})`);
      }
    } catch (error) {
      console.log(`  ❌ ${table} - error`);
    }
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("🚀 FinSensei AI - Database Setup");
  console.log("=".repeat(50));
  
  const connected = await testConnection();
  if (!connected) {
    console.log("\n⚠️ Cannot connect to Supabase. Please create tables first.");
    return;
  }
  
  await checkTables();
  await insertCompanies();
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Setup complete!");
  console.log("=".repeat(50));
}

main();
