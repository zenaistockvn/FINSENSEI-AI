"""
📊 Sync VN30 Stock Prices to Supabase using vnstock
Uses VCI API (Vietcap Securities) through vnstock library
Run with: python sync_vci_prices.py
"""

import requests
import time
from datetime import datetime, timedelta
from vnstock import Vnstock

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# VN30 symbols (as of Dec 2024)
VN30_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
    "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"
]

INDICES = ["VNINDEX", "VN30"]

# Stats
stats = {
    "price_count": 0,
    "stock_count": 0,
    "index_count": 0,
    "error_count": 0
}

def upsert_to_supabase(table: str, data: list) -> int:
    """Upsert data to Supabase table"""
    if not data:
        return 0
    
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
    }
    
    batch_size = 500
    inserted = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=headers,
                json=batch
            )
            if response.ok or "duplicate" in response.text.lower() or "conflict" in response.text.lower():
                inserted += len(batch)
            else:
                print(f"    ⚠️ Supabase error: {response.text[:100]}")
        except Exception as e:
            print(f"    ❌ Supabase error: {e}")
    
    return inserted

def fetch_stock_prices(symbol: str, days: int = 365) -> list:
    """Fetch stock prices using vnstock VCI source"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        df = stock.quote.history(start=start_date, end=end_date, interval='1D')
        
        if df is None or df.empty:
            return []
        
        # Transform to Supabase format
        prices = []
        for _, row in df.iterrows():
            # Handle datetime conversion
            if hasattr(row['time'], 'strftime'):
                trading_date = row['time'].strftime('%Y-%m-%d')
            else:
                trading_date = str(row['time'])[:10]
                
            prices.append({
                "symbol": symbol,
                "trading_date": trading_date,
                "open_price": int(row['open'] * 1000),
                "high_price": int(row['high'] * 1000),
                "low_price": int(row['low'] * 1000),
                "close_price": int(row['close'] * 1000),
                "volume": int(row['volume']) if row['volume'] else 0,
                "value": int(row['close'] * 1000 * (row['volume'] or 0))
            })
        
        return prices
    except Exception as e:
        print(f"    ❌ VCI error for {symbol}: {e}")
        return []

def fetch_index_prices(index_code: str, days: int = 365) -> list:
    """Fetch index prices using vnstock VCI source"""
    try:
        stock = Vnstock().stock(symbol=index_code, source='VCI')
        
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        df = stock.quote.history(start=start_date, end=end_date, interval='1D')
        
        if df is None or df.empty:
            return []
        
        # Transform to Supabase format
        data = []
        prev_close = None
        for _, row in df.iterrows():
            # Handle datetime conversion
            if hasattr(row['time'], 'strftime'):
                trading_date = row['time'].strftime('%Y-%m-%d')
            else:
                trading_date = str(row['time'])[:10]
            
            close = row['close']
            if prev_close is None:
                prev_close = row['open']
            
            change_value = round(close - prev_close, 2)
            change_percent = round((close - prev_close) / prev_close * 100, 2) if prev_close else 0
            
            data.append({
                "index_code": index_code,
                "trading_date": trading_date,
                "open_value": row['open'],
                "high_value": row['high'],
                "low_value": row['low'],
                "close_value": close,
                "volume": int(row['volume']) if row['volume'] else 0,
                "value": 0,
                "change_value": change_value,
                "change_percent": change_percent
            })
            
            prev_close = close
        
        return data
    except Exception as e:
        print(f"    ❌ VCI Index error for {index_code}: {e}")
        return []

def main():
    print("")
    print("═" * 65)
    print("  📊 SYNC VN30 STOCK PRICES TO DATABASE")
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  📡 Source: VCI API (Vietcap Securities) via vnstock")
    print("═" * 65)
    print("")
    
    start_time = time.time()
    total_items = len(VN30_SYMBOLS) + len(INDICES)
    completed = 0
    
    # Sync stocks
    print("📈 Syncing VN30 stocks (1 year data)...")
    print("")
    
    for symbol in VN30_SYMBOLS:
        completed += 1
        progress = round((completed / total_items) * 100)
        print(f"  [{progress:3d}%] {symbol}... ", end="", flush=True)
        
        try:
            prices = fetch_stock_prices(symbol, 365)
            
            if prices:
                inserted = upsert_to_supabase("stock_prices", prices)
                stats["price_count"] += inserted
                stats["stock_count"] += 1
                print(f"✅ {inserted} records")
            else:
                stats["error_count"] += 1
                print("⚠️ No data")
        except Exception as e:
            stats["error_count"] += 1
            print(f"❌ Error: {e}")
        
        time.sleep(1.5)  # Rate limiting
    
    print("")
    print("📊 Syncing market indices...")
    print("")
    
    # Sync indices
    for index_code in INDICES:
        completed += 1
        progress = round((completed / total_items) * 100)
        print(f"  [{progress:3d}%] {index_code}... ", end="", flush=True)
        
        try:
            index_data = fetch_index_prices(index_code, 365)
            
            if index_data:
                inserted = upsert_to_supabase("market_indices", index_data)
                stats["index_count"] += inserted
                print(f"✅ {inserted} records")
            else:
                print("⚠️ No data")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        time.sleep(1.5)
    
    # Summary
    duration = round(time.time() - start_time)
    
    print("")
    print("═" * 65)
    print("  ✅ SYNC COMPLETED!")
    print("═" * 65)
    print(f"  ⏱️  Duration: {duration} seconds")
    print(f"  📈 Stocks synced: {stats['stock_count']}")
    print(f"  📊 Index records: {stats['index_count']}")
    print(f"  💾 Price records: {stats['price_count']}")
    print(f"  ❌ Errors: {stats['error_count']}")
    print("═" * 65)
    print("")

if __name__ == "__main__":
    main()
