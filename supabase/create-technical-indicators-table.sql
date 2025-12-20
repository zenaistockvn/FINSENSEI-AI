-- Create technical_indicators table for AI Screener
-- This table stores calculated technical indicators for all VN100 stocks

CREATE TABLE IF NOT EXISTS technical_indicators (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Price & Performance
  current_price DECIMAL(12, 2),
  price_change_1d DECIMAL(8, 4),      -- % change 1 day
  price_change_5d DECIMAL(8, 4),      -- % change 5 days
  price_change_20d DECIMAL(8, 4),     -- % change 20 days (1 month)
  price_change_60d DECIMAL(8, 4),     -- % change 60 days (3 months)
  
  -- Relative Strength
  rs_rating DECIMAL(5, 2),            -- RS Rating 0-100
  rs_rank INTEGER,                    -- Rank among all stocks
  
  -- Moving Averages
  ma20 DECIMAL(12, 2),
  ma50 DECIMAL(12, 2),
  ma200 DECIMAL(12, 2),
  price_vs_ma20 DECIMAL(8, 4),        -- % above/below MA20
  price_vs_ma50 DECIMAL(8, 4),        -- % above/below MA50
  
  -- Momentum Indicators
  rsi_14 DECIMAL(5, 2),               -- RSI 14-day
  macd DECIMAL(12, 4),                -- MACD line
  macd_signal DECIMAL(12, 4),         -- MACD signal line
  macd_histogram DECIMAL(12, 4),      -- MACD histogram
  
  -- Volatility
  volatility_20d DECIMAL(8, 4),       -- 20-day volatility (annualized %)
  atr_14 DECIMAL(12, 2),              -- Average True Range 14-day
  
  -- Volume
  volume_avg_20d BIGINT,              -- 20-day average volume
  volume_ratio DECIMAL(8, 4),         -- Current volume / Avg volume
  
  -- Price Position
  price_position DECIMAL(5, 2),       -- Position in 52-week range (0-100%)
  high_52w DECIMAL(12, 2),            -- 52-week high
  low_52w DECIMAL(12, 2),             -- 52-week low
  distance_from_high DECIMAL(8, 4),   -- % from 52-week high
  
  -- Trend Signals
  trend_short VARCHAR(10),            -- 'UP', 'DOWN', 'SIDEWAYS'
  trend_medium VARCHAR(10),           -- 'UP', 'DOWN', 'SIDEWAYS'
  ma_cross_signal VARCHAR(20),        -- 'GOLDEN_CROSS', 'DEATH_CROSS', 'NONE'
  
  -- Composite Scores (for AI Screener)
  momentum_score DECIMAL(5, 2),       -- 0-100
  trend_score DECIMAL(5, 2),          -- 0-100
  volume_score DECIMAL(5, 2),         -- 0-100
  overall_technical_score DECIMAL(5, 2), -- 0-100
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(symbol, calculation_date)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_tech_ind_symbol ON technical_indicators(symbol);
CREATE INDEX IF NOT EXISTS idx_tech_ind_date ON technical_indicators(calculation_date);
CREATE INDEX IF NOT EXISTS idx_tech_ind_rs_rating ON technical_indicators(rs_rating DESC);
CREATE INDEX IF NOT EXISTS idx_tech_ind_overall_score ON technical_indicators(overall_technical_score DESC);
CREATE INDEX IF NOT EXISTS idx_tech_ind_rsi ON technical_indicators(rsi_14);

-- Enable RLS
ALTER TABLE technical_indicators ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON technical_indicators
  FOR SELECT USING (true);

-- Create policy for authenticated insert/update
CREATE POLICY "Allow authenticated insert" ON technical_indicators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON technical_indicators
  FOR UPDATE USING (true);

-- Comment on table
COMMENT ON TABLE technical_indicators IS 'Technical indicators calculated daily for AI Screener';
