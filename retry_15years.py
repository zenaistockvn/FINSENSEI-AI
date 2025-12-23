# -*- coding: utf-8 -*-
"""
Retry failed symbols with longer timeout
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# Failed symbols to retry
RETRY_SYMBOLS = ["BVH", "SAB", "SSB", "STB", "TCB", "VHM"]

stats = {"ok": 0, "fail": 0, "records": 0}

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

def fetch_vci(symbol, timeout=180):
    """Fetch with longer timeout"""
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": 4000
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=timeout)
        
        if not resp.ok:
            return None, f"HTTP {resp.status_code}"
        
        data = resp.json()
        if not data or len(data) == 0:
            return None, "Empty"
        
        s = data[0]
        if "t" not in s or not s["t"]:
            return None, "No data"
        
        prices = []
        for i in range(len(s["t"])):
            ts = int(s["t"][i])
            trading_date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            
            volume = s["v"][i] if s["v"][i] is not None else 0
            close = s["c"][i] if s["c"][i] is not None else 0
            
            prices.append({
                "symbol": symbol,
                "trading_date": trading_date,
                "open_price": int(s["o"][i]) if s["o"][i] else 0,
                "high_price": int(s["h"][i]) if s["h"][i] else 0,
                "low_price": int(s["l"][i]) if s["l"][i] else 0,
                "close_price": int(close),
                "volume": int(volume),
                "value": int(close * volume) if close and volume else 0
            })
        
        return prices, None
    except requests.exceptions.Timeout:
        return None, "Timeout"
    except Exception as e:
        return None, str(e)[:50]

def upsert_batch(data):
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
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/stock_prices", headers=headers, json=batch, timeout=30)
            if resp.ok or "duplicate" in resp.text.lower():
                inserted += len(batch)
        except:
            pass
    
    return inserted

def main():
    print("")
    print("=" * 55)
    print("  RETRY FAILED SYMBOLS (15 years)")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Symbols: {', '.join(RETRY_SYMBOLS)}")
    print(f"  Timeout: 180 seconds each")
    print("=" * 55)
    print("")
    
    for symbol in RETRY_SYMBOLS:
        print(f"  {symbol}... ", end="", flush=True)
        
        prices, err = fetch_vci(symbol, timeout=180)
        
        if err:
            stats["fail"] += 1
            print(f"FAIL ({err})")
        elif prices:
            inserted = upsert_batch(prices)
            stats["ok"] += 1
            stats["records"] += inserted
            
            dates = [p["trading_date"] for p in prices]
            print(f"OK - {len(prices)} records ({min(dates)} to {max(dates)})")
        else:
            stats["fail"] += 1
            print("No data")
        
        time.sleep(3)  # Longer delay between requests
    
    print("")
    print("=" * 55)
    print(f"  Success: {stats['ok']}/{len(RETRY_SYMBOLS)}")
    print(f"  Failed: {stats['fail']}")
    print(f"  New records: {stats['records']:,}")
    print("=" * 55)

if __name__ == "__main__":
    main()
