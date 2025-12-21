-- Bảng lưu AI Stock Insights (cache trong ngày)
CREATE TABLE IF NOT EXISTS ai_stock_insights (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Sentiment & Score
  overall_sentiment VARCHAR(20) NOT NULL, -- BULLISH, BEARISH, NEUTRAL
  confidence_score INTEGER NOT NULL DEFAULT 70,
  recommendation VARCHAR(20) NOT NULL, -- MUA, BÁN, NẮM GIỮ, THEO DÕI
  
  -- Technical Analysis
  tech_trend TEXT,
  tech_support TEXT,
  tech_resistance TEXT,
  tech_pattern TEXT,
  tech_signal TEXT,
  
  -- Fundamental Analysis
  fund_valuation TEXT,
  fund_growth TEXT,
  fund_financial TEXT,
  
  -- Summary
  short_summary TEXT NOT NULL,
  
  -- Strengths & Risks (JSON arrays)
  strengths JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  
  -- Target Price
  target_low DECIMAL(15,2),
  target_mid DECIMAL(15,2),
  target_high DECIMAL(15,2),
  
  -- Input data snapshot
  input_price DECIMAL(15,2),
  input_pe DECIMAL(10,2),
  input_pb DECIMAL(10,2),
  input_roe DECIMAL(10,2),
  input_rsi DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: 1 analysis per symbol per day
  UNIQUE(symbol, analysis_date)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_stock_insights_symbol_date 
ON ai_stock_insights(symbol, analysis_date DESC);

-- Enable RLS
ALTER TABLE ai_stock_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read ai_stock_insights" 
ON ai_stock_insights FOR SELECT 
USING (true);

-- Policy: Anyone can insert (for now, can restrict later)
CREATE POLICY "Anyone can insert ai_stock_insights" 
ON ai_stock_insights FOR INSERT 
WITH CHECK (true);

-- Policy: Anyone can update today's insights
CREATE POLICY "Anyone can update today ai_stock_insights" 
ON ai_stock_insights FOR UPDATE 
USING (analysis_date = CURRENT_DATE);
