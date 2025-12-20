# Kế Hoạch Xây Dựng Database Supabase cho FinSensei AI

## 1. Tổng Quan về Vnstock API

### 1.1 Giới thiệu
Vnstock là thư viện Python mã nguồn mở, miễn phí, cung cấp dữ liệu thị trường chứng khoán Việt Nam từ các nguồn:
- **TCBS** (Techcom Securities)
- **SSI** (SSI Securities)
- **VCI** (Viet Capital Securities)

### 1.2 Các loại dữ liệu có thể lấy từ Vnstock

| Loại dữ liệu | Mô tả | Tần suất cập nhật |
|--------------|-------|-------------------|
| **Stock Listing** | Danh sách tất cả mã cổ phiếu niêm yết | Hàng tuần |
| **Historical Price** | Giá lịch sử OHLCV | Hàng ngày |
| **Intraday Data** | Dữ liệu giao dịch trong ngày | Real-time |
| **Company Profile** | Thông tin tổng quan công ty | Hàng quý |
| **Financial Statements** | Báo cáo tài chính (Income, Balance, Cashflow) | Hàng quý |
| **Financial Ratios** | Các chỉ số tài chính | Hàng quý |
| **Dividend History** | Lịch sử cổ tức | Khi có sự kiện |
| **Market Indices** | Chỉ số thị trường (VN-Index, VN30...) | Hàng ngày |
| **Industry Analysis** | Phân tích ngành | Hàng quý |
| **Rating & Valuation** | Đánh giá và định giá | Hàng tuần |

---

## 2. Thiết Kế Database Schema

### 2.1 Bảng `companies` - Thông tin công ty
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_name_en VARCHAR(255),
    short_name VARCHAR(100),
    exchange VARCHAR(10) NOT NULL, -- HOSE, HNX, UPCOM
    industry VARCHAR(100),
    sector VARCHAR(100),
    listing_date DATE,
    charter_capital DECIMAL(20, 2),
    outstanding_shares BIGINT,
    website VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_symbol ON companies(symbol);
CREATE INDEX idx_companies_exchange ON companies(exchange);
CREATE INDEX idx_companies_industry ON companies(industry);
```

### 2.2 Bảng `stock_prices` - Giá cổ phiếu lịch sử
```sql
CREATE TABLE stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    trading_date DATE NOT NULL,
    open_price DECIMAL(12, 2),
    high_price DECIMAL(12, 2),
    low_price DECIMAL(12, 2),
    close_price DECIMAL(12, 2),
    adjusted_close DECIMAL(12, 2),
    volume BIGINT,
    value DECIMAL(20, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, trading_date),
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

CREATE INDEX idx_stock_prices_symbol_date ON stock_prices(symbol, trading_date DESC);
CREATE INDEX idx_stock_prices_date ON stock_prices(trading_date DESC);
```

### 2.3 Bảng `intraday_trades` - Giao dịch trong ngày
```sql
CREATE TABLE intraday_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    trading_date DATE NOT NULL,
    trading_time TIME NOT NULL,
    price DECIMAL(12, 2),
    volume BIGINT,
    match_type VARCHAR(20), -- BUY, SELL, ATO, ATC
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

-- Partition by date for better performance
CREATE INDEX idx_intraday_symbol_datetime ON intraday_trades(symbol, trading_date, trading_time);
```

### 2.4 Bảng `financial_statements` - Báo cáo tài chính
```sql
CREATE TABLE financial_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    report_type VARCHAR(20) NOT NULL, -- INCOME, BALANCE, CASHFLOW
    period_type VARCHAR(10) NOT NULL, -- QUARTER, YEAR
    year INTEGER NOT NULL,
    quarter INTEGER, -- 1, 2, 3, 4 (NULL for annual)
    
    -- Income Statement fields
    revenue DECIMAL(20, 2),
    gross_profit DECIMAL(20, 2),
    operating_profit DECIMAL(20, 2),
    net_profit DECIMAL(20, 2),
    ebitda DECIMAL(20, 2),
    
    -- Balance Sheet fields
    total_assets DECIMAL(20, 2),
    total_liabilities DECIMAL(20, 2),
    total_equity DECIMAL(20, 2),
    current_assets DECIMAL(20, 2),
    current_liabilities DECIMAL(20, 2),
    cash_and_equivalents DECIMAL(20, 2),
    short_term_debt DECIMAL(20, 2),
    long_term_debt DECIMAL(20, 2),
    
    -- Cash Flow fields
    operating_cashflow DECIMAL(20, 2),
    investing_cashflow DECIMAL(20, 2),
    financing_cashflow DECIMAL(20, 2),
    free_cashflow DECIMAL(20, 2),
    
    raw_data JSONB, -- Store full raw data from API
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, report_type, period_type, year, quarter),
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

CREATE INDEX idx_financial_symbol_period ON financial_statements(symbol, year DESC, quarter DESC);
```

### 2.5 Bảng `financial_ratios` - Chỉ số tài chính
```sql
CREATE TABLE financial_ratios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER,
    
    -- Valuation Ratios
    pe_ratio DECIMAL(10, 2),
    pb_ratio DECIMAL(10, 2),
    ps_ratio DECIMAL(10, 2),
    ev_ebitda DECIMAL(10, 2),
    
    -- Profitability Ratios
    roe DECIMAL(10, 4), -- Return on Equity
    roa DECIMAL(10, 4), -- Return on Assets
    ros DECIMAL(10, 4), -- Return on Sales
    gross_margin DECIMAL(10, 4),
    operating_margin DECIMAL(10, 4),
    net_margin DECIMAL(10, 4),
    
    -- Liquidity Ratios
    current_ratio DECIMAL(10, 2),
    quick_ratio DECIMAL(10, 2),
    cash_ratio DECIMAL(10, 2),
    
    -- Leverage Ratios
    debt_to_equity DECIMAL(10, 2),
    debt_to_assets DECIMAL(10, 4),
    interest_coverage DECIMAL(10, 2),
    
    -- Efficiency Ratios
    asset_turnover DECIMAL(10, 2),
    inventory_turnover DECIMAL(10, 2),
    receivables_turnover DECIMAL(10, 2),
    
    -- Growth Ratios
    revenue_growth DECIMAL(10, 4),
    profit_growth DECIMAL(10, 4),
    eps_growth DECIMAL(10, 4),
    
    -- Per Share Data
    eps DECIMAL(12, 2),
    bvps DECIMAL(12, 2), -- Book Value Per Share
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, year, quarter),
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

CREATE INDEX idx_ratios_symbol_period ON financial_ratios(symbol, year DESC, quarter DESC);
```

### 2.6 Bảng `dividends` - Lịch sử cổ tức
```sql
CREATE TABLE dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    ex_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    dividend_type VARCHAR(20), -- CASH, STOCK, BONUS
    dividend_value DECIMAL(12, 4),
    dividend_ratio VARCHAR(20), -- e.g., "10:1" for stock dividend
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

CREATE INDEX idx_dividends_symbol_date ON dividends(symbol, ex_date DESC);
```

### 2.7 Bảng `market_indices` - Chỉ số thị trường
```sql
CREATE TABLE market_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_code VARCHAR(20) NOT NULL, -- VNINDEX, VN30, HNX, UPCOM
    trading_date DATE NOT NULL,
    open_value DECIMAL(12, 2),
    high_value DECIMAL(12, 2),
    low_value DECIMAL(12, 2),
    close_value DECIMAL(12, 2),
    volume BIGINT,
    value DECIMAL(20, 2),
    change_value DECIMAL(10, 2),
    change_percent DECIMAL(8, 4),
    advance_count INTEGER,
    decline_count INTEGER,
    unchanged_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(index_code, trading_date)
);

CREATE INDEX idx_indices_code_date ON market_indices(index_code, trading_date DESC);
```

### 2.8 Bảng `stock_ratings` - Đánh giá cổ phiếu
```sql
CREATE TABLE stock_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    rating_date DATE NOT NULL,
    
    -- Overall Rating
    overall_score DECIMAL(5, 2),
    overall_rating VARCHAR(20), -- STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    
    -- Component Ratings
    valuation_score DECIMAL(5, 2),
    financial_health_score DECIMAL(5, 2),
    business_model_score DECIMAL(5, 2),
    business_operation_score DECIMAL(5, 2),
    technical_score DECIMAL(5, 2),
    
    -- Target Price
    target_price DECIMAL(12, 2),
    upside_potential DECIMAL(8, 4),
    
    source VARCHAR(50), -- TCBS, SSI, etc.
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);

CREATE INDEX idx_ratings_symbol_date ON stock_ratings(symbol, rating_date DESC);
```

### 2.9 Bảng `industries` - Ngành nghề
```sql
CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_code VARCHAR(20) UNIQUE NOT NULL,
    industry_name VARCHAR(100) NOT NULL,
    industry_name_en VARCHAR(100),
    sector_code VARCHAR(20),
    sector_name VARCHAR(100),
    icb_code VARCHAR(20), -- Industry Classification Benchmark
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_industries_code ON industries(industry_code);
```

### 2.10 Bảng `watchlists` - Danh mục theo dõi (User feature)
```sql
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    added_price DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(watchlist_id, symbol),
    FOREIGN KEY (symbol) REFERENCES companies(symbol)
);
```

### 2.11 Bảng `data_sync_logs` - Log đồng bộ dữ liệu
```sql
CREATE TABLE data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL, -- STOCK_PRICES, FINANCIALS, etc.
    symbol VARCHAR(10),
    status VARCHAR(20) NOT NULL, -- PENDING, RUNNING, SUCCESS, FAILED
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_type_status ON data_sync_logs(sync_type, status);
```

---

## 3. Supabase Edge Functions cho Data Sync

### 3.1 Function: sync-stock-prices
```typescript
// supabase/functions/sync-stock-prices/index.ts
// Đồng bộ giá cổ phiếu hàng ngày từ vnstock API
```

### 3.2 Function: sync-financials
```typescript
// supabase/functions/sync-financials/index.ts
// Đồng bộ báo cáo tài chính hàng quý
```

### 3.3 Function: sync-company-info
```typescript
// supabase/functions/sync-company-info/index.ts
// Cập nhật thông tin công ty
```

---

## 4. Cron Jobs Schedule

| Job | Tần suất | Thời gian | Mô tả |
|-----|----------|-----------|-------|
| sync-stock-prices | Daily | 16:00 (sau đóng cửa) | Cập nhật giá đóng cửa |
| sync-intraday | Every 5 min | 9:00-15:00 | Dữ liệu real-time |
| sync-financials | Weekly | Sunday 00:00 | Báo cáo tài chính |
| sync-ratings | Weekly | Saturday 00:00 | Đánh giá cổ phiếu |
| sync-dividends | Daily | 08:00 | Sự kiện cổ tức |

---

## 5. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Public read access for market data
CREATE POLICY "Public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_indices FOR SELECT USING (true);

-- User-specific access for watchlists
CREATE POLICY "Users can manage own watchlists" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist items" ON watchlist_items
    FOR ALL USING (
        watchlist_id IN (
            SELECT id FROM watchlists WHERE user_id = auth.uid()
        )
    );
```

---

## 6. Indexes & Performance Optimization

```sql
-- Composite indexes for common queries
CREATE INDEX idx_prices_symbol_date_range ON stock_prices(symbol, trading_date DESC)
    WHERE trading_date >= CURRENT_DATE - INTERVAL '1 year';

-- Partial indexes for active stocks
CREATE INDEX idx_active_companies ON companies(symbol)
    WHERE is_active = true;

-- BRIN index for time-series data
CREATE INDEX idx_prices_date_brin ON stock_prices USING BRIN(trading_date);
```

---

## 7. Views cho Reporting

```sql
-- View: Latest stock prices with company info
CREATE VIEW v_latest_stock_prices AS
SELECT 
    c.symbol,
    c.company_name,
    c.exchange,
    c.industry,
    sp.trading_date,
    sp.close_price,
    sp.volume,
    sp.value,
    LAG(sp.close_price) OVER (PARTITION BY c.symbol ORDER BY sp.trading_date) as prev_close,
    (sp.close_price - LAG(sp.close_price) OVER (PARTITION BY c.symbol ORDER BY sp.trading_date)) / 
        NULLIF(LAG(sp.close_price) OVER (PARTITION BY c.symbol ORDER BY sp.trading_date), 0) * 100 as change_percent
FROM companies c
JOIN stock_prices sp ON c.symbol = sp.symbol
WHERE sp.trading_date >= CURRENT_DATE - INTERVAL '30 days';

-- View: Company financial summary
CREATE VIEW v_company_financial_summary AS
SELECT 
    c.symbol,
    c.company_name,
    fr.year,
    fr.quarter,
    fr.pe_ratio,
    fr.pb_ratio,
    fr.roe,
    fr.roa,
    fr.eps,
    fr.revenue_growth,
    fr.profit_growth
FROM companies c
JOIN financial_ratios fr ON c.symbol = fr.symbol
WHERE fr.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2;
```

---

## 8. Estimated Storage & Costs

| Table | Est. Rows/Year | Est. Size |
|-------|----------------|-----------|
| companies | 2,000 | 5 MB |
| stock_prices | 500,000 | 100 MB |
| intraday_trades | 50,000,000 | 5 GB |
| financial_statements | 32,000 | 50 MB |
| financial_ratios | 32,000 | 30 MB |
| dividends | 5,000 | 2 MB |
| market_indices | 6,000 | 5 MB |

**Total estimated: ~5.2 GB/year**

Supabase Free tier: 500 MB database
Supabase Pro tier: 8 GB database ($25/month)

---

## 9. Implementation Roadmap

### Phase 1: Core Setup (Week 1)
- [ ] Tạo Supabase project
- [ ] Setup database schema (companies, stock_prices, market_indices)
- [ ] Implement basic data sync từ vnstock

### Phase 2: Financial Data (Week 2)
- [ ] Add financial_statements, financial_ratios tables
- [ ] Implement quarterly sync jobs
- [ ] Create financial views

### Phase 3: Advanced Features (Week 3)
- [ ] Add ratings, dividends tables
- [ ] Implement watchlist feature
- [ ] Setup RLS policies

### Phase 4: Optimization (Week 4)
- [ ] Performance tuning
- [ ] Add caching layer
- [ ] Monitoring & alerting

---

## 10. API Endpoints (Supabase Auto-generated)

```
GET /rest/v1/companies
GET /rest/v1/companies?symbol=eq.VNM
GET /rest/v1/stock_prices?symbol=eq.VNM&order=trading_date.desc&limit=30
GET /rest/v1/financial_ratios?symbol=eq.VNM&order=year.desc,quarter.desc
GET /rest/v1/v_latest_stock_prices
GET /rest/v1/v_company_financial_summary?symbol=eq.VNM
```

---

## Ghi chú

- Vnstock API là miễn phí và không giới hạn, nhưng cần tuân thủ rate limiting
- Dữ liệu từ TCBS và SSI có thể khác nhau một chút, nên chọn một nguồn chính
- Cần backup database định kỳ
- Xem xét sử dụng Supabase Realtime cho intraday data
