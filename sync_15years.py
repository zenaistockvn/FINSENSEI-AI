# -*- coding: utf-8 -*-
"""
Sync 15 Years of VN30 Stock Prices - Fixed version
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

VN30 = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
        "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
        "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"]

stats = {"ok": 0, "fail": 0, "records": 0}

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

def fetch_vci_15years(symbol):
    """Fetch 15 years of data"""
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": 4000
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=90)
        
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
            
            # Safe value extraction - handle None values
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

def upsert_batch(table, data):
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
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers, json=batch, timeout=30)
            if resp.ok or "duplicate" in resp.text.lower():
                inserted += len(batch)
        except:
            pass
    
    return inserted

def main():
    start_time = time.time()
    
    print("")
    print("=" * 60)
    print("  SYNC 15 YEARS VN30 STOCK PRICES")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  Source: VCI API | Target: ~4000 days/stock")
    print("=" * 60)
    print("")
    
    for i, symbol in enumerate(VN30):
        pct = int((i + 1) / len(VN30) * 100)
        print(f"[{pct:3d}%] {symbol}... ", end="", flush=True)
        
        prices, err = fetch_vci_15years(symbol)
        
        if err:
            stats["fail"] += 1
            print(f"FAIL ({err})")
        elif prices:
            inserted = upsert_batch("stock_prices", prices)
            stats["ok"] += 1
            stats["records"] += inserted
            
            dates = [p["trading_date"] for p in prices]
            print(f"OK - {len(prices)} records ({min(dates)} to {max(dates)})")
        else:
            stats["fail"] += 1
            print("No data")
        
        time.sleep(2)
    
    duration = int(time.time() - start_time)
    
    print("")
    print("=" * 60)
    print("  COMPLETED!")
    print(f"  Time: {duration // 60}m {duration % 60}s")
    print(f"  Success: {stats['ok']}/30 | Failed: {stats['fail']}")
    print(f"  Total records: {stats['records']:,}")
    print("=" * 60)

if __name__ == "__main__":
    main()
