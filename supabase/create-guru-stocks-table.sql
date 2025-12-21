-- =============================================
-- BẢNG GURU_STOCKS - Cổ phiếu theo trường phái Guru
-- =============================================

CREATE TABLE IF NOT EXISTS guru_stocks (
  id SERIAL PRIMARY KEY,
  
  -- Thông tin strategy
  strategy_id VARCHAR(20) NOT NULL,  -- buffett, lynch, graham, canslim, minervini, dalio
  strategy_name VARCHAR(100) NOT NULL,
  
  -- Thông tin cổ phiếu
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(200),
  industry VARCHAR(100),
  
  -- Giá và biến động
  current_price DECIMAL(12,2),
  price_change DECIMAL(8,4),  -- % thay đổi
  
  -- Điểm số
  guru_score INTEGER CHECK (guru_score >= 0 AND guru_score <= 100),
  match_reason TEXT,  -- Lý do phù hợp với strategy
  
  -- Metrics theo từng strategy
  metrics JSONB,  -- Lưu các chỉ số tùy theo strategy
  /*
    Buffett: { roe, gross_margin, debt_to_equity, pe_ratio }
    Lynch: { peg_ratio, eps_growth, debt_to_equity }
    Graham: { pe_ratio, pb_ratio, current_ratio, dividend_years }
    CANSLIM: { eps_qoq, eps_yoy, rs_rating, volume_change }
    Minervini: { price_vs_ma50, price_vs_ma200, contraction, rs_rating }
    Dalio: { beta, volatility, sharpe_ratio, dividend_yield }
  */
  
  -- Ranking trong strategy
  rank_in_strategy INTEGER,
  
  -- Metadata
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(strategy_id, symbol, calculation_date)
);

-- =============================================
-- TẠO INDEX
-- =============================================
CREATE INDEX IF NOT EXISTS idx_guru_stocks_strategy ON guru_stocks(strategy_id);
CREATE INDEX IF NOT EXISTS idx_guru_stocks_symbol ON guru_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_guru_stocks_date ON guru_stocks(calculation_date);
CREATE INDEX IF NOT EXISTS idx_guru_stocks_score ON guru_stocks(guru_score DESC);
CREATE INDEX IF NOT EXISTS idx_guru_stocks_rank ON guru_stocks(strategy_id, rank_in_strategy);

-- =============================================
-- BẬT RLS (Row Level Security)
-- =============================================
ALTER TABLE guru_stocks ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc public
DROP POLICY IF EXISTS "Allow public read guru_stocks" ON guru_stocks;
CREATE POLICY "Allow public read guru_stocks" ON guru_stocks FOR SELECT USING (true);

-- Policy cho phép insert/update với service role
DROP POLICY IF EXISTS "Allow service insert guru_stocks" ON guru_stocks;
CREATE POLICY "Allow service insert guru_stocks" ON guru_stocks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service update guru_stocks" ON guru_stocks;
CREATE POLICY "Allow service update guru_stocks" ON guru_stocks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow service delete guru_stocks" ON guru_stocks;
CREATE POLICY "Allow service delete guru_stocks" ON guru_stocks FOR DELETE USING (true);
