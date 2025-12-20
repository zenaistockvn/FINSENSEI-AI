#!/usr/bin/env python3
"""
Sync Stock News từ vnstock API
Nguồn: https://vnstocks.com/docs/vnstock-news/huong-dan-co-ban

Cài đặt: pip install vnstock3 requests
Chạy: python supabase/sync_vnstock_news.py
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# VN30 symbols for news
VN30_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"
]

def init_vnstock_news():
    """Initialize vnstock news module"""
    try:
        from vnstock3 import Vnstock
        return Vnstock
    except ImportError:
        print("📦 Installing vnstock3...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "vnstock3", "-q"])
        from vnstock3 import Vnstock
        return Vnstock

def get_general_news(limit=50):
    """
    Lấy tin tức chung về thị trường chứng khoán
    Sử dụng vnstock news module
    """
    try:
        Vnstock = init_vnstock_news()
        
        # Khởi tạo news reader
        news_reader = Vnstock().news()
        
        # Lấy tin tức chung từ các nguồn
        news_list = []
        
        # Tin tức thị trường chung
        try:
            market_news = news_reader.search(keyword="chứng khoán", limit=limit)
            if market_news is not None and not market_news.empty:
                for _, row in market_news.iterrows():
                    news_list.append({
                        'symbol': None,  # General market news
                        'title': row.get('title', ''),
                        'summary': row.get('description', row.get('summary', '')),
                        'source': row.get('source', 'vnstock'),
                        'url': row.get('url', row.get('link', '')),
                        'published_at': str(row.get('pubDate', row.get('published_at', datetime.now().isoformat()))),
                        'category': 'market'
                    })
        except Exception as e:
            print(f"  ⚠️ Error getting market news: {e}")
        
        return news_list[:limit]
        
    except Exception as e:
        print(f"❌ Error initializing news reader: {e}")
        return []

def get_stock_news(symbol, limit=10):
    """
    Lấy tin tức cho một mã cổ phiếu cụ thể
    """
    try:
        Vnstock = init_vnstock_news()
        
        news_list = []
        
        # Cách 1: Tìm kiếm tin tức theo symbol
        try:
            news_reader = Vnstock().news()
            stock_news = news_reader.search(keyword=symbol, limit=limit)
            
            if stock_news is not None and not stock_news.empty:
                for _, row in stock_news.iterrows():
                    news_list.append({
                        'symbol': symbol,
                        'title': row.get('title', ''),
                        'summary': row.get('description', row.get('summary', '')),
                        'source': row.get('source', 'vnstock'),
                        'url': row.get('url', row.get('link', '')),
                        'published_at': str(row.get('pubDate', row.get('published_at', datetime.now().isoformat()))),
                        'category': 'stock'
                    })
        except Exception as e:
            print(f"  ⚠️ News search error for {symbol}: {e}")
        
        # Cách 2: Lấy events/news từ company profile
        try:
            stock = Vnstock().stock(symbol=symbol, source='VCI')
            
            # Try company events
            try:
                events = stock.company.events()
                if events is not None and not events.empty:
                    for _, row in events.head(5).iterrows():
                        news_list.append({
                            'symbol': symbol,
                            'title': row.get('title', row.get('event_name', f'Sự kiện {symbol}')),
                            'summary': row.get('description', row.get('content', '')),
                            'source': 'VCI',
                            'url': '',
                            'published_at': str(row.get('date', row.get('event_date', datetime.now().isoformat()))),
                            'category': 'event'
                        })
            except:
                pass
                
        except Exception as e:
            print(f"  ⚠️ Company events error for {symbol}: {e}")
        
        return news_list[:limit]
        
    except Exception as e:
        print(f"❌ Error getting news for {symbol}: {e}")
        return []

def analyze_sentiment(title, summary):
    """
    Phân tích sentiment đơn giản dựa trên từ khóa
    """
    text = (title + " " + summary).lower()
    
    positive_keywords = [
        'tăng', 'lãi', 'vượt', 'kỷ lục', 'tích cực', 'khởi sắc', 'bứt phá',
        'mua ròng', 'tăng trưởng', 'lạc quan', 'cơ hội', 'thành công', 'đột phá'
    ]
    
    negative_keywords = [
        'giảm', 'lỗ', 'sụt', 'bán ròng', 'rủi ro', 'lo ngại', 'áp lực',
        'khó khăn', 'suy giảm', 'tiêu cực', 'cảnh báo', 'thua lỗ'
    ]
    
    pos_count = sum(1 for kw in positive_keywords if kw in text)
    neg_count = sum(1 for kw in negative_keywords if kw in text)
    
    if pos_count > neg_count:
        return 'positive'
    elif neg_count > pos_count:
        return 'negative'
    else:
        return 'neutral'

def generate_ai_summary(title, summary, sentiment):
    """
    Tạo AI summary đơn giản dựa trên sentiment
    """
    if sentiment == 'positive':
        templates = [
            "Tin tức tích cực, có thể hỗ trợ tâm lý nhà đầu tư.",
            "Thông tin khả quan, tác động tốt đến giá cổ phiếu.",
            "Diễn biến thuận lợi, củng cố niềm tin thị trường."
        ]
    elif sentiment == 'negative':
        templates = [
            "Cần theo dõi sát diễn biến, có thể tạo áp lực ngắn hạn.",
            "Thông tin cần lưu ý, có thể ảnh hưởng đến tâm lý giao dịch.",
            "Rủi ro ngắn hạn cần cân nhắc khi ra quyết định."
        ]
    else:
        templates = [
            "Thông tin trung tính, cần theo dõi thêm diễn biến.",
            "Tin tức tham khảo, chưa có tác động rõ ràng.",
            "Cập nhật thông tin, chờ xác nhận xu hướng."
        ]
    
    import random
    return random.choice(templates)

def upsert_news_to_supabase(news_list):
    """
    Insert/Update news vào Supabase
    """
    if not news_list:
        print("⚠️ No news to sync")
        return 0
    
    # Chuẩn bị data
    records = []
    for news in news_list:
        sentiment = analyze_sentiment(news.get('title', ''), news.get('summary', ''))
        ai_summary = generate_ai_summary(news.get('title', ''), news.get('summary', ''), sentiment)
        
        # Parse published_at
        published_at = news.get('published_at', datetime.now().isoformat())
        if isinstance(published_at, str):
            try:
                # Try to parse various date formats
                for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d']:
                    try:
                        published_at = datetime.strptime(published_at[:19], fmt).isoformat()
                        break
                    except:
                        continue
            except:
                published_at = datetime.now().isoformat()
        
        records.append({
            'symbol': news.get('symbol'),
            'title': news.get('title', '')[:500],  # Limit title length
            'summary': news.get('summary', '')[:2000],  # Limit summary length
            'source': news.get('source', 'vnstock')[:100],
            'url': news.get('url', '')[:500],
            'published_at': published_at,
            'sentiment': sentiment,
            'ai_summary': ai_summary,
            'category': news.get('category', 'general')[:50]
        })
    
    # Upsert to Supabase
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/stock_news",
            headers=HEADERS,
            json=records
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Synced {len(records)} news articles")
            return len(records)
        else:
            print(f"❌ Error syncing news: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return 0
            
    except Exception as e:
        print(f"❌ Exception syncing news: {e}")
        return 0

def create_news_table():
    """
    Tạo bảng stock_news nếu chưa có (chạy SQL này trong Supabase Dashboard)
    """
    sql = """
    -- Tạo bảng stock_news
    CREATE TABLE IF NOT EXISTS stock_news (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20),  -- NULL = general market news
        title VARCHAR(500) NOT NULL,
        summary TEXT,
        source VARCHAR(100),
        url VARCHAR(500),
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sentiment VARCHAR(20) DEFAULT 'neutral',  -- positive, negative, neutral
        ai_summary TEXT,
        category VARCHAR(50) DEFAULT 'general',  -- market, stock, event, earnings, etc.
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(title, source)  -- Prevent duplicates
    );

    -- Index cho tìm kiếm nhanh
    CREATE INDEX IF NOT EXISTS idx_stock_news_symbol ON stock_news(symbol);
    CREATE INDEX IF NOT EXISTS idx_stock_news_published ON stock_news(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_stock_news_sentiment ON stock_news(sentiment);

    -- Enable RLS
    ALTER TABLE stock_news ENABLE ROW LEVEL SECURITY;

    -- Policy cho phép đọc public
    CREATE POLICY IF NOT EXISTS "Allow public read" ON stock_news
        FOR SELECT USING (true);
    """
    print("📋 SQL để tạo bảng stock_news:")
    print(sql)
    return sql

def sync_all_news():
    """
    Sync tất cả tin tức: general + VN30 stocks
    """
    print("=" * 60)
    print("🗞️  VNSTOCK NEWS SYNC")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    total_synced = 0
    
    # 1. Sync general market news
    print("📰 Fetching general market news...")
    general_news = get_general_news(limit=30)
    print(f"   Found {len(general_news)} general news articles")
    
    if general_news:
        synced = upsert_news_to_supabase(general_news)
        total_synced += synced
    
    time.sleep(2)
    
    # 2. Sync news for VN30 stocks
    print()
    print("📊 Fetching news for VN30 stocks...")
    
    for i, symbol in enumerate(VN30_SYMBOLS):
        print(f"   [{i+1}/{len(VN30_SYMBOLS)}] {symbol}...", end=" ")
        
        stock_news = get_stock_news(symbol, limit=5)
        
        if stock_news:
            synced = upsert_news_to_supabase(stock_news)
            total_synced += synced
            print(f"✅ {len(stock_news)} articles")
        else:
            print("⚠️ No news found")
        
        time.sleep(1.5)  # Rate limiting
    
    print()
    print("=" * 60)
    print(f"✅ SYNC COMPLETED!")
    print(f"   Total articles synced: {total_synced}")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return total_synced

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--create-table":
        create_news_table()
    else:
        sync_all_news()
