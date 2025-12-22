-- =============================================
-- SENAI ANALYSIS TABLES
-- Bảng lưu kết quả phân tích tự động cho VN30
-- =============================================

-- 1. Bảng Chẩn đoán SenAI
CREATE TABLE IF NOT EXISTS senai_diagnosis (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Điểm số
    senai_score INTEGER NOT NULL, -- 0-100
    technical_score INTEGER, -- 0-40
    fundamental_score INTEGER, -- 0-40
    momentum_score INTEGER, -- 0-20
    
    -- Rating & Signal
    rating INTEGER NOT NULL, -- 1-5 stars
    signal VARCHAR(20) NOT NULL, -- MUA MẠNH, MUA, THEO DÕI, NẮM GIỮ, THẬN TRỌNG, BÁN
    recommendation TEXT,
    confidence INTEGER, -- 0-100%
    
    -- Chi tiết Technical
    rsi_score INTEGER,
    ma_score INTEGER,
    price_position_score INTEGER,
    
    -- Chi tiết Fundamental
    pe_score INTEGER,
    pb_score INTEGER,
    roe_score INTEGER,
    
    -- Input data snapshot
    current_price DECIMAL(12,2),
    rsi_14 DECIMAL(5,2),
    ma20 DECIMAL(12,2),
    ma50 DECIMAL(12,2),
    ma200 DECIMAL(12,2),
    pe_ratio DECIMAL(10,2),
    pb_ratio DECIMAL(10,2),
    roe DECIMAL(10,2),
    price_position DECIMAL(5,2), -- 0-100%
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(symbol, analysis_date)
);

-- 2. Bảng Xác suất & Rủi ro
CREATE TABLE IF NOT EXISTS senai_risk_analysis (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Xác suất
    upside_probability DECIMAL(5,2), -- 0-100%
    downside_risk DECIMAL(5,2), -- 0-100%
    
    -- Rủi ro
    volatility_20d DECIMAL(8,4), -- Annualized %
    volatility_level VARCHAR(20), -- Thấp, Trung bình, Cao, Rất cao
    beta DECIMAL(5,2),
    sharpe_ratio DECIMAL(5,2),
    max_drawdown DECIMAL(5,2), -- %
    
    -- Thời gian nắm giữ
    optimal_holding_days INTEGER,
    holding_strategy VARCHAR(20), -- Scalping, Swing, Position, Đầu tư
    
    -- Risk/Reward
    risk_reward_ratio DECIMAL(5,2),
    risk_level VARCHAR(20), -- Thấp, Trung bình, Cao
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(symbol, analysis_date)
);

-- 3. Bảng Chiến lược giao dịch
CREATE TABLE IF NOT EXISTS senai_trading_strategy (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Vùng mua
    buy_zone_low DECIMAL(12,2),
    buy_zone_high DECIMAL(12,2),
    
    -- Cắt lỗ
    stop_loss DECIMAL(12,2),
    stop_loss_percent DECIMAL(5,2),
    
    -- Mục tiêu
    target_1 DECIMAL(12,2),
    target_2 DECIMAL(12,2),
    target_3 DECIMAL(12,2),
    
    -- Hỗ trợ/Kháng cự
    support_1 DECIMAL(12,2),
    support_2 DECIMAL(12,2),
    resistance_1 DECIMAL(12,2),
    resistance_2 DECIMAL(12,2),
    
    -- Pivot Points
    pivot DECIMAL(12,2),
    pivot_r1 DECIMAL(12,2),
    pivot_r2 DECIMAL(12,2),
    pivot_s1 DECIMAL(12,2),
    pivot_s2 DECIMAL(12,2),
    
    -- Chiến lược
    strategy_type VARCHAR(30), -- Bắt đáy, Chốt lời, Theo xu hướng, Đứng ngoài, Tích lũy, Breakout
    strategy_note TEXT,
    entry_condition TEXT,
    exit_condition TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(symbol, analysis_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_senai_diagnosis_symbol ON senai_diagnosis(symbol);
CREATE INDEX IF NOT EXISTS idx_senai_diagnosis_date ON senai_diagnosis(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_senai_diagnosis_score ON senai_diagnosis(senai_score DESC);
CREATE INDEX IF NOT EXISTS idx_senai_diagnosis_signal ON senai_diagnosis(signal);

CREATE INDEX IF NOT EXISTS idx_senai_risk_symbol ON senai_risk_analysis(symbol);
CREATE INDEX IF NOT EXISTS idx_senai_risk_date ON senai_risk_analysis(analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_senai_strategy_symbol ON senai_trading_strategy(symbol);
CREATE INDEX IF NOT EXISTS idx_senai_strategy_date ON senai_trading_strategy(analysis_date DESC);

-- Enable RLS
ALTER TABLE senai_diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE senai_risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE senai_trading_strategy ENABLE ROW LEVEL SECURITY;

-- Policies - Allow all
CREATE POLICY "Allow all senai_diagnosis" ON senai_diagnosis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all senai_risk_analysis" ON senai_risk_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all senai_trading_strategy" ON senai_trading_strategy FOR ALL USING (true) WITH CHECK (true);

-- View tổng hợp VN30
CREATE OR REPLACE VIEW vn30_senai_analysis AS
SELECT 
    d.symbol,
    d.analysis_date,
    -- Diagnosis
    d.senai_score,
    d.rating,
    d.signal,
    d.confidence,
    d.current_price,
    d.rsi_14,
    d.pe_ratio,
    d.roe,
    -- Risk
    r.upside_probability,
    r.downside_risk,
    r.volatility_20d,
    r.volatility_level,
    r.optimal_holding_days,
    r.sharpe_ratio,
    -- Strategy
    s.buy_zone_low,
    s.buy_zone_high,
    s.stop_loss,
    s.target_1,
    s.target_2,
    s.target_3,
    s.strategy_type,
    s.strategy_note
FROM senai_diagnosis d
LEFT JOIN senai_risk_analysis r ON d.symbol = r.symbol AND d.analysis_date = r.analysis_date
LEFT JOIN senai_trading_strategy s ON d.symbol = s.symbol AND d.analysis_date = s.analysis_date
WHERE d.analysis_date = CURRENT_DATE
ORDER BY d.senai_score DESC;

COMMENT ON TABLE senai_diagnosis IS 'Chẩn đoán SenAI - Điểm số và tín hiệu giao dịch';
COMMENT ON TABLE senai_risk_analysis IS 'Phân tích xác suất và rủi ro';
COMMENT ON TABLE senai_trading_strategy IS 'Chiến lược giao dịch với các mức giá cụ thể';
