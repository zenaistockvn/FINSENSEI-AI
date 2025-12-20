-- =============================================
-- FINSENSEI AI - Database Schema for VN100
-- =============================================

-- 1. Bảng companies - Thông tin 100 công ty VN100
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_name_en VARCHAR(255),
    exchange VARCHAR(10) NOT NULL,
    industry VARCHAR(100),
    sector VARCHAR(100),
    listing_date DATE,
    outstanding_shares BIGINT,
    website VARCHAR(255),
    description TEXT,
    is_vn100 BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng stock_prices - Giá cổ phiếu lịch sử
CREATE TABLE IF NOT EXISTS stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    trading_date DATE NOT NULL,
    open_price DECIMAL(12, 2),
    high_price DECIMAL(12, 2),
    low_price DECIMAL(12, 2),
    close_price DECIMAL(12, 2),
    volume BIGINT,
    value DECIMAL(20, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, trading_date)
);

-- 3. Bảng financial_ratios - Chỉ số tài chính
CREATE TABLE IF NOT EXISTS financial_ratios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER,
    pe_ratio DECIMAL(10, 2),
    pb_ratio DECIMAL(10, 2),
    ps_ratio DECIMAL(10, 2),
    roe DECIMAL(10, 4),
    roa DECIMAL(10, 4),
    ros DECIMAL(10, 4),
    gross_margin DECIMAL(10, 4),
    operating_margin DECIMAL(10, 4),
    net_margin DECIMAL(10, 4),
    current_ratio DECIMAL(10, 2),
    debt_to_equity DECIMAL(10, 2),
    eps DECIMAL(12, 2),
    bvps DECIMAL(12, 2),
    revenue_growth DECIMAL(10, 4),
    profit_growth DECIMAL(10, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, year, quarter)
);

-- 4. Bảng market_indices - Chỉ số thị trường
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_code VARCHAR(20) NOT NULL,
    trading_date DATE NOT NULL,
    open_value DECIMAL(12, 2),
    high_value DECIMAL(12, 2),
    low_value DECIMAL(12, 2),
    close_value DECIMAL(12, 2),
    volume BIGINT,
    value DECIMAL(20, 2),
    change_value DECIMAL(10, 2),
    change_percent DECIMAL(8, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(index_code, trading_date)
);

-- 5. Bảng dividends - Lịch sử cổ tức
CREATE TABLE IF NOT EXISTS dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    ex_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    dividend_type VARCHAR(20),
    cash_dividend DECIMAL(12, 4),
    stock_dividend_ratio VARCHAR(20),
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng stock_ratings - Đánh giá cổ phiếu
CREATE TABLE IF NOT EXISTS stock_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    rating_date DATE NOT NULL,
    overall_score DECIMAL(5, 2),
    valuation_score DECIMAL(5, 2),
    financial_health_score DECIMAL(5, 2),
    business_model_score DECIMAL(5, 2),
    technical_score DECIMAL(5, 2),
    target_price DECIMAL(12, 2),
    recommendation VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, rating_date)
);

-- 7. Bảng data_sync_logs - Log đồng bộ
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);
CREATE INDEX IF NOT EXISTS idx_companies_exchange ON companies(exchange);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, trading_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(trading_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_symbol ON financial_ratios(symbol, year DESC);
CREATE INDEX IF NOT EXISTS idx_market_indices_code_date ON market_indices(index_code, trading_date DESC);
CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON dividends(symbol, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_symbol ON stock_ratings(symbol, rating_date DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ratings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Public read financial_ratios" ON financial_ratios FOR SELECT USING (true);
CREATE POLICY "Public read market_indices" ON market_indices FOR SELECT USING (true);
CREATE POLICY "Public read dividends" ON dividends FOR SELECT USING (true);
CREATE POLICY "Public read stock_ratings" ON stock_ratings FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service insert companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update companies" ON companies FOR UPDATE USING (true);
CREATE POLICY "Service insert stock_prices" ON stock_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert financial_ratios" ON financial_ratios FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update financial_ratios" ON financial_ratios FOR UPDATE USING (true);
CREATE POLICY "Service insert market_indices" ON market_indices FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert dividends" ON dividends FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert stock_ratings" ON stock_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update stock_ratings" ON stock_ratings FOR UPDATE USING (true);
