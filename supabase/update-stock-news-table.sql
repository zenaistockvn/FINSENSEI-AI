-- Update stock_news table to add image_url column
-- Run this in Supabase SQL Editor

-- Add image_url column if not exists
ALTER TABLE stock_news ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_news_category ON stock_news(category);

-- Verify table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'stock_news'
ORDER BY ordinal_position;
