/**
 * Tạo các bảng phân tích AI trên Supabase
 * Chạy: node supabase/create-analysis-tables.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.GFljmic0Cbpn-IC8qvlJBxp3Y5O7gBsLOqzPT-JROHA";

async function executeSql(sql, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      // Try direct SQL via pg
      const pgResponse = await fetch(`${SUPABASE_URL}/pg`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!pgResponse.ok) {
        console.log(`⚠️ Không thể chạy SQL trực tiếp. Vui lòng chạy SQL trong Supabase Dashboard.`);
        return false;
      }
    }
    
    console.log(`✅ ${description} - Thành công!`);
    return true;
  } catch (error) {
    console.log(`⚠️ Cần chạy SQL trong Supabase Dashboard`);
    return false;
  }
}

// SQL để tạo các bảng
const createTablesSql = `
-- =============================================
-- 1. BẢNG AI_ANALYSIS - Chẩn đoán SenAI
-- =============================================
CREATE TABLE IF NOT EXISTS ai_analysis (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Điểm số AI
  rating INTEGER CHECK (rating >= 0 AND rating <= 100),           -- Điểm Rating (0-100)
  score INTEGER CHECK (score >= 0 AND score <= 100),              -- Điểm Score (0-100)
  signal INTEGER CHECK (signal >= 0 AND signal <= 100),           -- Điểm Signal (0-100)
  
  -- Khuyến nghị
  recommendation VARCHAR(20) CHECK (recommendation IN ('MUA', 'BÁN', 'NẮM GIỮ', 'THEO DÕI')),
  confidence DECIMAL(5,2),                                         -- Độ tin cậy (%)
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, analysis_date)
);

-- =============================================
-- 2. BẢNG RISK_ANALYSIS - Xác suất & Rủi ro
-- =============================================
CREATE TABLE IF NOT EXISTS risk_analysis (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Thời gian nắm giữ
  optimal_holding_days INTEGER,                                    -- Nắm giữ tối ưu (ngày)
  
  -- Xác suất
  upside_probability DECIMAL(5,2),                                 -- Xác suất tăng ngắn hạn (%)
  downside_risk DECIMAL(5,2),                                      -- Rủi ro điều chỉnh (%)
  
  -- Phân tích rủi ro
  volatility DECIMAL(5,2),                                         -- Độ biến động
  beta DECIMAL(5,2),                                               -- Beta so với VN-Index
  sharpe_ratio DECIMAL(5,2),                                       -- Sharpe Ratio
  max_drawdown DECIMAL(5,2),                                       -- Max Drawdown (%)
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, analysis_date)
);

-- =============================================
-- 3. BẢNG TRADING_STRATEGY - Chiến lược giao dịch
-- =============================================
CREATE TABLE IF NOT EXISTS trading_strategy (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vùng giá
  buy_zone_low DECIMAL(12,2),                                      -- Vùng mua - thấp
  buy_zone_high DECIMAL(12,2),                                     -- Vùng mua - cao
  stop_loss DECIMAL(12,2),                                         -- Cắt lỗ
  target_1 DECIMAL(12,2),                                          -- Mục tiêu 1
  target_2 DECIMAL(12,2),                                          -- Mục tiêu 2
  target_3 DECIMAL(12,2),                                          -- Mục tiêu 3
  
  -- Hỗ trợ / Kháng cự
  support_1 DECIMAL(12,2),
  support_2 DECIMAL(12,2),
  resistance_1 DECIMAL(12,2),
  resistance_2 DECIMAL(12,2),
  
  -- Chiến lược
  strategy_type VARCHAR(50),                                       -- Loại chiến lược
  strategy_note TEXT,                                              -- Ghi chú chiến lược
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, analysis_date)
);

-- =============================================
-- 4. BẢNG BROKER_RECOMMENDATIONS - Đồng thuận CTCK
-- =============================================
CREATE TABLE IF NOT EXISTS broker_recommendations (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  recommendation_date DATE NOT NULL,
  
  -- Thông tin CTCK
  broker_code VARCHAR(20) NOT NULL,                                -- Mã CTCK (HSC, SSI, VCSC, FSC...)
  broker_name VARCHAR(100),                                        -- Tên đầy đủ CTCK
  
  -- Khuyến nghị
  action VARCHAR(20) CHECK (action IN ('MUA', 'BÁN', 'NẮM GIỮ', 'KHẢ QUAN', 'TRUNG LẬP', 'TIÊU CỰC')),
  target_price DECIMAL(12,2),                                      -- Giá mục tiêu
  previous_target DECIMAL(12,2),                                   -- Giá mục tiêu trước đó
  
  -- Luận điểm
  rationale TEXT,                                                  -- Luận điểm chính
  report_url VARCHAR(500),                                         -- Link báo cáo
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, recommendation_date, broker_code)
);

-- =============================================
-- TẠO INDEX
-- =============================================
CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_date ON ai_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_risk_analysis_symbol ON risk_analysis(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_strategy_symbol ON trading_strategy(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_recommendations_symbol ON broker_recommendations(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_recommendations_date ON broker_recommendations(recommendation_date);

-- =============================================
-- BẬT RLS (Row Level Security)
-- =============================================
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc public
CREATE POLICY "Allow public read ai_analysis" ON ai_analysis FOR SELECT USING (true);
CREATE POLICY "Allow public read risk_analysis" ON risk_analysis FOR SELECT USING (true);
CREATE POLICY "Allow public read trading_strategy" ON trading_strategy FOR SELECT USING (true);
CREATE POLICY "Allow public read broker_recommendations" ON broker_recommendations FOR SELECT USING (true);
`;

// In ra SQL để copy vào Supabase Dashboard
console.log('='.repeat(60));
console.log('📋 SQL TẠO BẢNG PHÂN TÍCH AI');
console.log('='.repeat(60));
console.log('\n👉 Copy SQL bên dưới và chạy trong Supabase Dashboard > SQL Editor:\n');
console.log(createTablesSql);
console.log('\n' + '='.repeat(60));
console.log('📌 HƯỚNG DẪN:');
console.log('1. Mở Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Chọn project của bạn');
console.log('3. Vào SQL Editor (biểu tượng database)');
console.log('4. Paste SQL ở trên và nhấn Run');
console.log('='.repeat(60));

// Thử tạo bảng qua API
async function main() {
  console.log('\n🔄 Đang thử tạo bảng qua API...\n');
  
  // Test connection
  try {
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/companies?limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Kết nối Supabase thành công!');
    }
  } catch (error) {
    console.log('❌ Không thể kết nối Supabase');
  }
  
  console.log('\n⚠️ Supabase REST API không hỗ trợ CREATE TABLE.');
  console.log('👉 Vui lòng copy SQL ở trên và chạy trong Supabase Dashboard > SQL Editor');
}

main();
