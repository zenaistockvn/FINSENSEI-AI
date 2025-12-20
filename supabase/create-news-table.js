/**
 * Create stock_news table and sync sample news
 * Run: node supabase/create-news-table.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

console.log("=".repeat(60));
console.log("📰 CREATE STOCK_NEWS TABLE");
console.log("=".repeat(60));
console.log("");
console.log("⚠️  Bạn cần tạo bảng stock_news trong Supabase Dashboard:");
console.log("");
console.log("1. Vào https://supabase.com/dashboard");
console.log("2. Chọn project của bạn");
console.log("3. Vào SQL Editor");
console.log("4. Chạy SQL sau:");
console.log("");
console.log("-".repeat(60));
console.log(`
CREATE TABLE IF NOT EXISTS stock_news (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url VARCHAR(500),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    sentiment VARCHAR(20) DEFAULT 'neutral',
    ai_summary TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(title, source)
);

CREATE INDEX IF NOT EXISTS idx_stock_news_symbol ON stock_news(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_news_published ON stock_news(published_at DESC);

ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON stock_news FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON stock_news FOR INSERT WITH CHECK (true);
`);
console.log("-".repeat(60));
console.log("");
console.log("5. Sau khi tạo bảng, chạy: node supabase/sync-stock-news.js");
console.log("");
console.log("=".repeat(60));
