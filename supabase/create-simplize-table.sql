-- =============================================
-- SIMPLIZE COMPANY DATA TABLE
-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS simplize_company_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name_vi TEXT,
    name_en TEXT,
    stock_exchange VARCHAR(10),
    industry TEXT,
    sector TEXT,
    website TEXT,
    logo_url TEXT,
    market_cap BIGINT,
    outstanding_shares BIGINT,
    free_float_rate DECIMAL(10,2),
    
    -- Price data
    price_close DECIMAL(12,2),
    price_open DECIMAL(12,2),
    price_high DECIMAL(12,2),
    price_low DECIMAL(12,2),
    price_ceiling DECIMAL(12,2),
    price_floor DECIMAL(12,2),
    price_reference DECIMAL(12,2),
    net_change DECIMAL(12,2),
    pct_change DECIMAL(10,2),
    volume BIGINT,
    volume_10d_avg BIGINT,
    
    -- Valuation ratios
    pe_ratio DECIMAL(10,2),
    pb_ratio DECIMAL(10,2),
    eps DECIMAL(12,2),
    book_value DECIMAL(12,2),
    dividend_yield DECIMAL(10,2),
    
    -- Financial metrics
    roe DECIMAL(10,2),
    roa DECIMAL(10,2),
    beta_5y DECIMAL(10,2),
    
    -- Growth metrics
    revenue_5y_growth DECIMAL(10,2),
    net_income_5y_growth DECIMAL(10,2),
    revenue_ltm_growth DECIMAL(10,2),
    net_income_ltm_growth DECIMAL(10,2),
    revenue_qoq_growth DECIMAL(10,2),
    net_income_qoq_growth DECIMAL(10,2),
    
    -- Price changes
    price_chg_7d DECIMAL(10,2),
    price_chg_30d DECIMAL(10,2),
    price_chg_ytd DECIMAL(10,2),
    price_chg_1y DECIMAL(10,2),
    price_chg_3y DECIMAL(10,2),
    price_chg_5y DECIMAL(10,2),
    
    -- Simplize scores (0-5)
    valuation_point INTEGER,
    growth_point INTEGER,
    performance_point INTEGER,
    financial_health_point INTEGER,
    dividend_point INTEGER,
    
    -- Signals
    ta_signal_1d VARCHAR(20),
    overall_risk_level VARCHAR(20),
    quality_valuation VARCHAR(10),
    company_quality INTEGER,
    
    -- Business info
    main_service TEXT,
    business_overview TEXT,
    business_strategy TEXT,
    business_risk TEXT,
    
    -- Meta
    watchlist_count INTEGER,
    no_of_recommendations INTEGER,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_simplize_symbol ON simplize_company_data(symbol);
CREATE INDEX IF NOT EXISTS idx_simplize_sector ON simplize_company_data(sector);
CREATE INDEX IF NOT EXISTS idx_simplize_exchange ON simplize_company_data(stock_exchange);

-- Enable RLS
ALTER TABLE simplize_company_data ENABLE ROW LEVEL SECURITY;

-- Policy - Allow all
DROP POLICY IF EXISTS "Allow all simplize_company_data" ON simplize_company_data;
CREATE POLICY "Allow all simplize_company_data" ON simplize_company_data FOR ALL USING (true) WITH CHECK (true);
