#!/usr/bin/env python3
"""
Sync Stock News từ vnstock-news API (Version 2)
Nguồn: https://vnstocks.com/docs/vnstock-news/huong-dan-co-ban

Cài đặt: pip install vnstock-news requests
Chạy: python supabase/sync_vnstock_news_v2.py
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# VN100 symbols for news sync
VN100_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
    "DGC", "DPM", "EIB", "EVF", "GMD", "HAG", "HCM", "HDC", "HSG", "KBC",
    "KDC", "KDH", "LPB", "NLG", "NT2", "NVL", "OCB", "PDR", "PNJ", "REE"
]

def install_vnstock_news():
    """Install vnstock-news package if not available"""
    try:
        from vnstock_news import News
        return News
    except ImportError:
        print("📦 Installing vnstock-news...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "vnstock-news", "-q"])
        from vnstock_news import News
        return News


def analyze_sentiment(title, summary):
    """Phân tích sentiment dựa trên từ khóa tiếng Việt"""
    text = (str(title) + " " + str(summary)).lower()
    
    positive_keywords = [
        'tăng', 'lãi', 'vượt', 'kỷ lục', 'tích cực', 'khởi sắc', 'bứt phá',
        'mua ròng', 'tăng trưởng', 'lạc quan', 'cơ hội', 'thành công', 'đột phá',
        'phục hồi', 'cải thiện', 'thuận lợi', 'khả quan', 'hấp dẫn', 'tiềm năng',
        'dẫn đầu', 'vượt kỳ vọng', 'cao nhất', 'kỷ lục mới', 'tăng mạnh'
    ]
    
    negative_keywords = [
        'giảm', 'lỗ', 'sụt', 'bán ròng', 'rủi ro', 'lo ngại', 'áp lực',
        'khó khăn', 'suy giảm', 'tiêu cực', 'cảnh báo', 'thua lỗ', 'thấp nhất',
        'sụp đổ', 'phá sản', 'nợ xấu', 'vi phạm', 'điều tra', 'xử phạt',
        'giảm mạnh', 'lao dốc', 'bán tháo', 'hoảng loạn'
    ]
    
    pos_count = sum(1 for kw in positive_keywords if kw in text)
    neg_count = sum(1 for kw in negative_keywords if kw in text)
    
    if pos_count > neg_count + 1:
        return 'positive'
    elif neg_count > pos_count + 1:
        return 'negative'
    else:
        return 'neutral'

def generate_ai_summary(title, summary, sentiment, symbol=None):
    """Tạo AI summary dựa trên nội dung và sentiment"""
    import random
    
    if sentiment == 'positive':
        if symbol:
            templates = [
                f"Tin tích cực cho {symbol}, có thể hỗ trợ giá cổ phiếu trong ngắn hạn.",
                f"Thông tin khả quan, tác động tốt đến tâm lý nhà đầu tư {symbol}.",
                f"Diễn biến thuận lợi cho {symbol}, củng cố niềm tin thị trường."
            ]
        else:
            templates = [
                "Tin tức tích cực cho thị trường, hỗ trợ tâm lý nhà đầu tư.",
                "Thông tin khả quan, tác động tốt đến xu hướng chung.",
                "Diễn biến thuận lợi, củng cố niềm tin thị trường."
            ]
    elif sentiment == 'negative':
        if symbol:
            templates = [
                f"Cần theo dõi sát {symbol}, có thể tạo áp lực ngắn hạn.",
                f"Thông tin cần lưu ý cho {symbol}, cân nhắc quản lý rủi ro.",
                f"Rủi ro ngắn hạn cho {symbol}, theo dõi diễn biến tiếp theo."
            ]
        else:
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
    
    return random.choice(templates)

def parse_date(date_str):
    """Parse date string to ISO format"""
    if not date_str:
        return datetime.now().isoformat()
    
    if isinstance(date_str, datetime):
        return date_str.isoformat()
    
    date_str = str(date_str)
    
    # Try various formats
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%d',
        '%d/%m/%Y %H:%M',
        '%d/%m/%Y',
        '%d-%m-%Y %H:%M:%S',
        '%d-%m-%Y'
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str[:19], fmt).isoformat()
        except:
            continue
    
    return datetime.now().isoformat()

def get_market_news(news_client, limit=30):
    """Lấy tin tức thị trường chung"""
    news_list = []
    
    try:
        # Tin tức thị trường
        market_news = news_client.market(limit=limit)
        
        if market_news is not None and len(market_news) > 0:
            for item in market_news.to_dict('records') if hasattr(market_news, 'to_dict') else market_news:
                title = item.get('title', '')
                summary = item.get('description', item.get('summary', ''))
                
                news_list.append({
                    'symbol': None,
                    'title': str(title)[:500],
                    'summary': str(summary)[:2000],
                    'source': item.get('source', 'vnstock'),
                    'url': item.get('url', item.get('link', '')),
                    'published_at': parse_date(item.get('pubDate', item.get('published_at'))),
                    'category': 'market',
                    'image_url': item.get('image', item.get('thumbnail', ''))
                })
                
    except Exception as e:
        print(f"  ⚠️ Error getting market news: {e}")
    
    return news_list

def get_stock_news(news_client, symbol, limit=10):
    """Lấy tin tức cho một mã cổ phiếu"""
    news_list = []
    
    try:
        # Tin tức theo mã
        stock_news = news_client.stock(symbol=symbol, limit=limit)
        
        if stock_news is not None and len(stock_news) > 0:
            for item in stock_news.to_dict('records') if hasattr(stock_news, 'to_dict') else stock_news:
                title = item.get('title', '')
                summary = item.get('description', item.get('summary', ''))
                
                news_list.append({
                    'symbol': symbol,
                    'title': str(title)[:500],
                    'summary': str(summary)[:2000],
                    'source': item.get('source', 'vnstock'),
                    'url': item.get('url', item.get('link', '')),
                    'published_at': parse_date(item.get('pubDate', item.get('published_at'))),
                    'category': 'stock',
                    'image_url': item.get('image', item.get('thumbnail', ''))
                })
                
    except Exception as e:
        print(f"  ⚠️ Error getting news for {symbol}: {e}")
    
    return news_list


def upsert_news_to_supabase(news_list):
    """Insert/Update news vào Supabase"""
    if not news_list:
        return 0
    
    # Chuẩn bị records với sentiment và AI summary
    records = []
    for news in news_list:
        sentiment = analyze_sentiment(news.get('title', ''), news.get('summary', ''))
        ai_summary = generate_ai_summary(
            news.get('title', ''), 
            news.get('summary', ''), 
            sentiment,
            news.get('symbol')
        )
        
        records.append({
            'symbol': news.get('symbol'),
            'title': news.get('title', ''),
            'summary': news.get('summary', ''),
            'source': news.get('source', 'vnstock')[:100],
            'url': news.get('url', '')[:500],
            'published_at': news.get('published_at'),
            'sentiment': sentiment,
            'ai_summary': ai_summary,
            'category': news.get('category', 'general')[:50],
            'image_url': news.get('image_url', '')[:500] if news.get('image_url') else None
        })
    
    # Upsert to Supabase
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/stock_news",
            headers=HEADERS,
            json=records
        )
        
        if response.status_code in [200, 201]:
            return len(records)
        else:
            print(f"  ❌ Error: {response.status_code} - {response.text[:200]}")
            return 0
            
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return 0

def sync_all_news(symbols=None, market_limit=30, stock_limit=5):
    """Sync tất cả tin tức"""
    print("=" * 60)
    print("🗞️  VNSTOCK NEWS SYNC V2")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initialize vnstock-news
    try:
        News = install_vnstock_news()
        news_client = News()
        print("✅ vnstock-news initialized")
    except Exception as e:
        print(f"❌ Failed to initialize vnstock-news: {e}")
        return 0
    
    total_synced = 0
    symbols = symbols or VN100_SYMBOLS[:30]  # Default: top 30
    
    # 1. Sync market news
    print()
    print("📰 Fetching market news...")
    market_news = get_market_news(news_client, limit=market_limit)
    print(f"   Found {len(market_news)} market news articles")
    
    if market_news:
        synced = upsert_news_to_supabase(market_news)
        total_synced += synced
        print(f"   ✅ Synced {synced} market news")
    
    time.sleep(1)
    
    # 2. Sync stock-specific news
    print()
    print(f"📊 Fetching news for {len(symbols)} stocks...")
    
    for i, symbol in enumerate(symbols):
        print(f"   [{i+1}/{len(symbols)}] {symbol}...", end=" ", flush=True)
        
        stock_news = get_stock_news(news_client, symbol, limit=stock_limit)
        
        if stock_news:
            synced = upsert_news_to_supabase(stock_news)
            total_synced += synced
            print(f"✅ {len(stock_news)} articles")
        else:
            print("⚠️ No news")
        
        time.sleep(0.5)  # Rate limiting
    
    print()
    print("=" * 60)
    print(f"✅ SYNC COMPLETED!")
    print(f"   Total articles synced: {total_synced}")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return total_synced

def sync_single_stock(symbol, limit=20):
    """Sync tin tức cho một mã cổ phiếu"""
    print(f"🗞️ Syncing news for {symbol}...")
    
    try:
        News = install_vnstock_news()
        news_client = News()
        
        stock_news = get_stock_news(news_client, symbol, limit=limit)
        
        if stock_news:
            synced = upsert_news_to_supabase(stock_news)
            print(f"✅ Synced {synced} articles for {symbol}")
            return synced
        else:
            print(f"⚠️ No news found for {symbol}")
            return 0
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--stock" and len(sys.argv) > 2:
            # Sync single stock: python sync_vnstock_news_v2.py --stock HPG
            sync_single_stock(sys.argv[2].upper())
        elif sys.argv[1] == "--market":
            # Sync market news only
            News = install_vnstock_news()
            news_client = News()
            market_news = get_market_news(news_client, limit=50)
            synced = upsert_news_to_supabase(market_news)
            print(f"✅ Synced {synced} market news")
        elif sys.argv[1] == "--vn30":
            # Sync VN30 only
            vn30 = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
                    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
                    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"]
            sync_all_news(symbols=vn30)
        else:
            print("Usage:")
            print("  python sync_vnstock_news_v2.py           # Sync all")
            print("  python sync_vnstock_news_v2.py --stock HPG  # Sync single stock")
            print("  python sync_vnstock_news_v2.py --market     # Sync market news only")
            print("  python sync_vnstock_news_v2.py --vn30       # Sync VN30 stocks")
    else:
        sync_all_news()
