# -*- coding: utf-8 -*-
"""
Retry remaining stocks with data gaps
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# Stocks still with gaps
RETRY_STOCKS = ["ACB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"]

stats = {"ok": 0, "fail": 0, "records": 0}

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn"
    }

def fetch_and_fill(symbol):
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": 500
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=180)
        
        if resp.status_code == 403:
            return 0, "403 Blocked"
        if not resp.ok:
            return 0, f"HTTP {resp.status_code}"
        
        data = resp.json()
        if not data or len(data) == 0 or "t" not in data[0]:
            return 0, "No data"
        
        s = data[0]
        prices = []
        for i in range(len(s["t"])):
            ts = int(s["t"][i])
            trading_date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            
            prices.append({
                "symbol": symbol,
                "trading_date": trading_date,
                "open_price": int(s["o"][i]) if s["o"][i] else 0,
                "high_price": int(s["h"][i]) if s["h"][i] else 0,
                "low_price": int(s["l"][i]) if s["l"][i] else 0,
                "close_price": int(s["c"][i]) if s["c"][i] else 0,
                "volume": int(s["v"][i]) if s["v"][i] else 0,
                "value": 0
            })
        
        gap_data = [p for p in prices if "2025-03-07" <= p["trading_date"] <= "2025-07-30"]
        
        if not gap_data:
            return 0, "No gap data"
        
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
        }
        
        inserted = 0
        for i in range(0, len(gap_data), 500):
            batch = gap_data[i:i+500]
            try:
                resp = requests.post(f"{SUPABASE_URL}/rest/v1/stock_prices", headers=headers, json=batch, timeout=30)
                if resp.ok or "duplicate" in resp.text.lower():
                    inserted += len(batch)
            except:
                pass
        
        return inserted, None
        
    except requests.exceptions.Timeout:
        return 0, "Timeout"
    except Exception as e:
        return 0, str(e)[:30]

print("=" * 55)
print("  RETRY REMAINING STOCKS")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  Stocks: {', '.join(RETRY_STOCKS)}")
print("=" * 55)
print()

for symbol in RETRY_STOCKS:
    print(f"  {symbol}... ", end="", flush=True)
    
    count, err = fetch_and_fill(symbol)
    
    if err:
        stats["fail"] += 1
        print(f"FAIL ({err})")
    elif count > 0:
        stats["ok"] += 1
        stats["records"] += count
        print(f"OK (+{count})")
    else:
        print("No new data")
    
    time.sleep(2)

print()
print("=" * 55)
print(f"  Success: {stats['ok']}/{len(RETRY_STOCKS)}")
print(f"  New records: {stats['records']}")
print("=" * 55)
