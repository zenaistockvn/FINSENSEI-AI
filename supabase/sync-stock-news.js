/**
 * Sync Stock News to Supabase
 * Lấy tin tức từ các nguồn: CafeF, Vietstock, VnExpress
 * Chạy: node supabase/sync-stock-news.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const HEADERS = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=minimal"
};

// Sample news data - In production, this would come from RSS feeds or APIs
// Sources: CafeF, Vietstock, VnExpress, ĐTCK
const SAMPLE_NEWS = [
  // General market news
  {
    symbol: null, // null = general market news
    title: "VN-Index vượt mốc 1,280 điểm, thanh khoản tăng mạnh",
    summary: "Thị trường chứng khoán Việt Nam tiếp tục đà tăng với thanh khoản cải thiện đáng kể. Nhóm cổ phiếu ngân hàng và bất động sản dẫn dắt thị trường.",
    source: "CafeF",
    url: "https://cafef.vn/thi-truong-chung-khoan.chn",
    published_at: new Date().toISOString(),
    sentiment: "positive",
    category: "market"
  },
  {
    symbol: null,
    title: "NHNN giữ nguyên lãi suất điều hành, hỗ trợ tăng trưởng kinh tế",
    summary: "Ngân hàng Nhà nước quyết định giữ nguyên các mức lãi suất điều hành nhằm hỗ trợ tăng trưởng kinh tế và ổn định thị trường tài chính.",
    source: "VnExpress",
    url: "https://vnexpress.net/kinh-doanh/chung-khoan",
    published_at: new Date(Date.now() - 3600000).toISOString(),
    sentiment: "positive",
    category: "macro"
  },
  {
    symbol: null,
    title: "Khối ngoại mua ròng hơn 500 tỷ đồng trong phiên giao dịch",
    summary: "Dòng tiền từ các quỹ ETF ngoại tiếp tục chảy vào thị trường Việt Nam, tập trung vào nhóm cổ phiếu vốn hóa lớn.",
    source: "Vietstock",
    url: "https://vietstock.vn/chung-khoan.htm",
    published_at: new Date(Date.now() - 7200000).toISOString(),
    sentiment: "positive",
    category: "market"
  },

  // Stock-specific news
  {
    symbol: "VNM",
    title: "Vinamilk công bố kết quả kinh doanh Q4/2024 vượt kỳ vọng",
    summary: "Doanh thu và lợi nhuận của Vinamilk trong quý 4/2024 đều vượt dự báo của giới phân tích, nhờ chiến lược mở rộng thị trường xuất khẩu.",
    source: "CafeF",
    url: "https://cafef.vn/vnm-ket-qua-kinh-doanh.chn",
    published_at: new Date(Date.now() - 86400000).toISOString(),
    sentiment: "positive",
    category: "earnings"
  },
  {
    symbol: "VNM",
    title: "Vinamilk đẩy mạnh xuất khẩu sang thị trường Trung Quốc",
    summary: "Công ty đang mở rộng kênh phân phối tại Trung Quốc, kỳ vọng tăng trưởng doanh thu xuất khẩu 20% trong năm 2025.",
    source: "VnExpress",
    url: "https://vnexpress.net/vinamilk-xuat-khau.html",
    published_at: new Date(Date.now() - 172800000).toISOString(),
    sentiment: "positive",
    category: "business"
  },
  {
    symbol: "FPT",
    title: "FPT ký hợp đồng AI trị giá 100 triệu USD với đối tác Nhật Bản",
    summary: "FPT Corporation vừa ký kết hợp đồng cung cấp giải pháp AI cho một tập đoàn công nghệ lớn của Nhật Bản, trị giá 100 triệu USD trong 5 năm.",
    source: "ĐTCK",
    url: "https://tinnhanhchungkhoan.vn/fpt-hop-dong-ai.html",
    published_at: new Date(Date.now() - 43200000).toISOString(),
    sentiment: "positive",
    category: "business"
  },
  {
    symbol: "FPT",
    title: "FPT đặt mục tiêu doanh thu 2025 tăng 25%",
    summary: "Ban lãnh đạo FPT đặt kế hoạch tăng trưởng doanh thu 25% trong năm 2025, tập trung vào mảng chuyển đổi số và AI.",
    source: "Vietstock",
    url: "https://vietstock.vn/fpt-ke-hoach-2025.htm",
    published_at: new Date(Date.now() - 259200000).toISOString(),
    sentiment: "positive",
    category: "guidance"
  },
  {
    symbol: "VCB",
    title: "Vietcombank dẫn đầu lợi nhuận ngành ngân hàng năm 2024",
    summary: "Vietcombank tiếp tục giữ vị trí quán quân về lợi nhuận trong ngành ngân hàng với LNTT ước đạt 42,000 tỷ đồng.",
    source: "CafeF",
    url: "https://cafef.vn/vcb-loi-nhuan-2024.chn",
    published_at: new Date(Date.now() - 129600000).toISOString(),
    sentiment: "positive",
    category: "earnings"
  },
  {
    symbol: "HPG",
    title: "Hòa Phát: Sản lượng thép tháng 11 đạt kỷ lục mới",
    summary: "Tập đoàn Hòa Phát ghi nhận sản lượng thép tháng 11/2024 đạt mức cao nhất trong lịch sử, nhờ nhu cầu xây dựng phục hồi.",
    source: "VnExpress",
    url: "https://vnexpress.net/hpg-san-luong-thep.html",
    published_at: new Date(Date.now() - 216000000).toISOString(),
    sentiment: "positive",
    category: "operations"
  },
  {
    symbol: "MBB",
    title: "MB Bank mở rộng mạng lưới chi nhánh tại miền Nam",
    summary: "Ngân hàng Quân đội tiếp tục chiến lược mở rộng với 10 chi nhánh mới tại TP.HCM và các tỉnh miền Nam.",
    source: "ĐTCK",
    url: "https://tinnhanhchungkhoan.vn/mbb-mo-rong.html",
    published_at: new Date(Date.now() - 302400000).toISOString(),
    sentiment: "positive",
    category: "business"
  },
  {
    symbol: "TCB",
    title: "Techcombank: Tỷ lệ CASA duy trì trên 40%",
    summary: "Techcombank tiếp tục duy trì tỷ lệ tiền gửi không kỳ hạn (CASA) ở mức cao nhất ngành, giúp tối ưu chi phí vốn.",
    source: "Vietstock",
    url: "https://vietstock.vn/tcb-casa.htm",
    published_at: new Date(Date.now() - 388800000).toISOString(),
    sentiment: "positive",
    category: "financials"
  },
  {
    symbol: "ACB",
    title: "ACB tăng cường cho vay tiêu dùng, mở rộng thị phần bán lẻ",
    summary: "Ngân hàng ACB đẩy mạnh phân khúc cho vay tiêu dùng với các sản phẩm mới, hướng tới mục tiêu tăng trưởng tín dụng 15%.",
    source: "CafeF",
    url: "https://cafef.vn/acb-cho-vay-tieu-dung.chn",
    published_at: new Date(Date.now() - 432000000).toISOString(),
    sentiment: "positive",
    category: "business"
  },
  {
    symbol: "MSN",
    title: "Masan hoàn tất tái cấu trúc, tập trung vào ngành hàng tiêu dùng",
    summary: "Tập đoàn Masan đã hoàn tất quá trình tái cấu trúc, tập trung nguồn lực vào mảng bán lẻ và hàng tiêu dùng thiết yếu.",
    source: "VnExpress",
    url: "https://vnexpress.net/masan-tai-cau-truc.html",
    published_at: new Date(Date.now() - 518400000).toISOString(),
    sentiment: "neutral",
    category: "business"
  },
  {
    symbol: "VIC",
    title: "Vingroup đẩy mạnh phát triển xe điện VinFast tại Mỹ",
    summary: "VinFast tiếp tục mở rộng mạng lưới đại lý tại Mỹ, đặt mục tiêu bán 50,000 xe trong năm 2025.",
    source: "ĐTCK",
    url: "https://tinnhanhchungkhoan.vn/vinfast-my.html",
    published_at: new Date(Date.now() - 604800000).toISOString(),
    sentiment: "positive",
    category: "business"
  },
  {
    symbol: "GAS",
    title: "PV GAS hưởng lợi từ giá dầu tăng",
    summary: "Giá dầu thế giới tăng giúp PV GAS cải thiện biên lợi nhuận, dự báo LNST năm 2024 vượt kế hoạch.",
    source: "Vietstock",
    url: "https://vietstock.vn/gas-gia-dau.htm",
    published_at: new Date(Date.now() - 691200000).toISOString(),
    sentiment: "positive",
    category: "earnings"
  }
];

// Generate AI summary based on sentiment
function generateAISummary(sentiment) {
  const templates = {
    positive: [
      "Tin tức tích cực, có thể hỗ trợ tâm lý nhà đầu tư.",
      "Thông tin khả quan, tác động tốt đến giá cổ phiếu.",
      "Diễn biến thuận lợi, củng cố niềm tin thị trường."
    ],
    negative: [
      "Cần theo dõi sát diễn biến, có thể tạo áp lực ngắn hạn.",
      "Thông tin cần lưu ý, có thể ảnh hưởng đến tâm lý giao dịch.",
      "Rủi ro ngắn hạn cần cân nhắc khi ra quyết định."
    ],
    neutral: [
      "Thông tin trung tính, cần theo dõi thêm diễn biến.",
      "Tin tức tham khảo, chưa có tác động rõ ràng.",
      "Cập nhật thông tin, chờ xác nhận xu hướng."
    ]
  };
  
  const list = templates[sentiment] || templates.neutral;
  return list[Math.floor(Math.random() * list.length)];
}

// Sync news to Supabase
async function syncNews() {
  console.log("=".repeat(60));
  console.log("🗞️  STOCK NEWS SYNC (Sample Data)");
  console.log("=".repeat(60));
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log();

  // Prepare records with AI summary
  const records = SAMPLE_NEWS.map(news => ({
    ...news,
    ai_summary: generateAISummary(news.sentiment)
  }));

  console.log(`📰 Syncing ${records.length} news articles...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/stock_news`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(records)
    });

    if (response.ok) {
      console.log(`✅ Successfully synced ${records.length} articles`);
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${response.status}`);
      console.log(`   ${error.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }

  console.log();
  console.log("=".repeat(60));
  console.log("✅ SYNC COMPLETED!");
  console.log("=".repeat(60));
}

// Create table SQL (run in Supabase Dashboard)
function printCreateTableSQL() {
  console.log(`
-- Tạo bảng stock_news
CREATE TABLE IF NOT EXISTS stock_news (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20),  -- NULL = general market news
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sentiment VARCHAR(20) DEFAULT 'neutral',  -- positive, negative, neutral
    ai_summary TEXT,
    category VARCHAR(50) DEFAULT 'general',  -- market, stock, event, earnings, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(title, source)  -- Prevent duplicates
);

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_stock_news_symbol ON stock_news(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_news_published ON stock_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_news_sentiment ON stock_news(sentiment);

-- Enable RLS
ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc public
CREATE POLICY "Allow public read" ON stock_news
    FOR SELECT USING (true);
  `);
}

// Main
if (process.argv.includes("--create-table")) {
  printCreateTableSQL();
} else {
  syncNews();
}
