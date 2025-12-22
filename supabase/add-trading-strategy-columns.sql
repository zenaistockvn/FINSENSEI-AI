-- Add new columns to trading_strategy table for Vietnam market adaptation
-- Run this in Supabase SQL Editor

-- Buy zone columns
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS buy_zone_optimal DECIMAL(15,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS buy_zone_strength VARCHAR(20);

-- Stop loss columns
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS stop_loss_percent DECIMAL(5,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS stop_loss_type VARCHAR(30);

-- Target columns with R:R
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_1_percent DECIMAL(5,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_1_rr DECIMAL(4,1);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_2_percent DECIMAL(5,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_2_rr DECIMAL(4,1);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_3_percent DECIMAL(5,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS target_3_rr DECIMAL(4,1);

-- Risk and confidence
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS confidence INTEGER;
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20);

-- Trading cost
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS break_even_price DECIMAL(15,2);
ALTER TABLE trading_strategy ADD COLUMN IF NOT EXISTS trading_cost_percent DECIMAL(4,2);

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trading_strategy'
ORDER BY ordinal_position;
