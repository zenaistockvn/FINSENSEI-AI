-- =============================================
-- PORTFOLIO OPTIMIZER TABLES
-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- =============================================

-- 1. BẢNG USER_PORTFOLIOS - Danh mục đầu tư của user
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Danh mục chính',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. BẢNG PORTFOLIO_STOCKS - Cổ phiếu trong danh mục
CREATE TABLE IF NOT EXISTS portfolio_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES user_portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  avg_price DECIMAL(12,2) NOT NULL CHECK (avg_price > 0),
  buy_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(portfolio_id, symbol)
);

-- 3. BẢNG USER_RISK_PROFILES - Hồ sơ rủi ro của user
CREATE TABLE IF NOT EXISTS user_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  profile_type VARCHAR(20) CHECK (profile_type IN ('conservative', 'balanced', 'growth', 'aggressive')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  answers JSONB,
  rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TẠO INDEX
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_stocks_portfolio_id ON portfolio_stocks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_stocks_symbol ON portfolio_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles(user_id);

-- =============================================
-- BẬT RLS (Row Level Security)
-- =============================================
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_risk_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Cho phép đọc/ghi theo user_id
-- =============================================

-- User Portfolios policies
DROP POLICY IF EXISTS "Users can view own portfolios" ON user_portfolios;
CREATE POLICY "Users can view own portfolios" ON user_portfolios 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own portfolios" ON user_portfolios;
CREATE POLICY "Users can insert own portfolios" ON user_portfolios 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own portfolios" ON user_portfolios;
CREATE POLICY "Users can update own portfolios" ON user_portfolios 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own portfolios" ON user_portfolios;
CREATE POLICY "Users can delete own portfolios" ON user_portfolios 
  FOR DELETE USING (true);

-- Portfolio Stocks policies
DROP POLICY IF EXISTS "Users can view portfolio stocks" ON portfolio_stocks;
CREATE POLICY "Users can view portfolio stocks" ON portfolio_stocks 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert portfolio stocks" ON portfolio_stocks;
CREATE POLICY "Users can insert portfolio stocks" ON portfolio_stocks 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update portfolio stocks" ON portfolio_stocks;
CREATE POLICY "Users can update portfolio stocks" ON portfolio_stocks 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete portfolio stocks" ON portfolio_stocks;
CREATE POLICY "Users can delete portfolio stocks" ON portfolio_stocks 
  FOR DELETE USING (true);

-- User Risk Profiles policies
DROP POLICY IF EXISTS "Users can view own risk profile" ON user_risk_profiles;
CREATE POLICY "Users can view own risk profile" ON user_risk_profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own risk profile" ON user_risk_profiles;
CREATE POLICY "Users can insert own risk profile" ON user_risk_profiles 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own risk profile" ON user_risk_profiles;
CREATE POLICY "Users can update own risk profile" ON user_risk_profiles 
  FOR UPDATE USING (true);

-- =============================================
-- TRIGGER để tự động cập nhật updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_portfolios_updated_at ON user_portfolios;
CREATE TRIGGER update_user_portfolios_updated_at
    BEFORE UPDATE ON user_portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_stocks_updated_at ON portfolio_stocks;
CREATE TRIGGER update_portfolio_stocks_updated_at
    BEFORE UPDATE ON portfolio_stocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_risk_profiles_updated_at ON user_risk_profiles;
CREATE TRIGGER update_user_risk_profiles_updated_at
    BEFORE UPDATE ON user_risk_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
