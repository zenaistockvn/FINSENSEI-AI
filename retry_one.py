# -*- coding: utf-8 -*-
"""
Retry one symbol at a time with very long timeout
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# Remaining failed symbols
SYMBOLS = ["SSB", "STB", "TCB", "VHM"]

def fetch_and_save(symbol):
    print(f"\n[{symbol}] Fetching 15 years data (timeout=300s)...")
    
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": 4000
        }
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json", 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://trading.vietcap.com.vn"
        }
        
        resp = requests.post(url, headers=headers, json=payload, timeout=300)
        
        if not resp.ok:
            print(f"  HTTP Error: {resp.status_code}")
            return 0
        
        data = resp.json()
        if not data or len(data) == 0 or "t" not in data[0]:
            print(f"  No data received")
            return 0
        
        s = data[0]
        print(f"  Received {len(s['t'])} records")
        
        prices = []
        for i in range(len(s["t"])):
            ts = int(s["t"][i])
            prices.append({
                "symbol": symbol,
                "trading_date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
                "open_price": int(s["o"][i]) if s["o"][i] else 0,
                "high_price": int(s["h"][i]) if s["h"][i] else 0,
                "low_price": int(s["l"][i]) if s["l"][i] else 0,
                "close_price": int(s["c"][i]) if s["c"][i] else 0,
                "volume": int(s["v"][i]) if s["v"][i] else 0,
                "value": 0
            })
        
        # Upsert to Supabase
        print(f"  Uploading to Supabase...")
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
        }
        
        inserted = 0
        for i in range(0, len(prices), 500):
            batch = prices[i:i+500]
            try:
                resp = requests.post(f"{SUPABASE_URL}/rest/v1/stock_prices", headers=headers, json=batch, timeout=30)
                if resp.ok or "duplicate" in resp.text.lower():
                    inserted += len(batch)
            except:
                pass
        
        dates = [p["trading_date"] for p in prices]
        print(f"  SUCCESS: {inserted} records ({min(dates)} to {max(dates)})")
        return inserted
        
    except requests.exceptions.Timeout:
        print(f"  TIMEOUT after 300 seconds")
        return 0
    except Exception as e:
        print(f"  ERROR: {e}")
        return 0

print("=" * 50)
print("RETRY REMAINING SYMBOLS")
print("=" * 50)

total = 0
for sym in SYMBOLS:
    count = fetch_and_save(sym)
    total += count
    print(f"\nWaiting 10 seconds before next...")
    time.sleep(10)

print("\n" + "=" * 50)
print(f"DONE! Total new records: {total}")
print("=" * 50)
