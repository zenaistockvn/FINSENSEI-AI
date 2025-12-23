# -*- coding: utf-8 -*-
"""
Fill data gaps for all VN30 stocks (except HPG which is already fixed)
Target: March 7 - July 30, 2025 (~100 days per stock)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# All VN30 except HPG (already fixed)
VN30_TO_FIX = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB",
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

def fetch_and_fill(symbol):
    """Fetch data and fill gap for one symbol"""
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": 500
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=120)
        
        if resp.status_code == 403:
            return 0, "403 Blocked"
        
        if not resp.ok:
            return 0, f"HTTP {resp.status_code}"
        
        data = resp.json()
        if not data or len(data) == 0 or "t" not in data[0]:
            return 0, "No data"
        
        s = data[0]
        
        # Convert to list of price records
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
        
        # Filter only missing period (March 7 - July 30, 2025)
        gap_data = [p for p in prices if "2025-03-07" <= p["trading_date"] <= "2025-07-30"]
        
        if not gap_data:
            return 0, "No gap data"
        
        # Upload to Supabase
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

print("=" * 60)
print("  FILL DATA GAPS FOR ALL VN30")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  Stocks to fix: {len(VN30_TO_FIX)}")
print(f"  Target period: 2025-03-07 to 2025-07-30")
print("=" * 60)
print()

for i, symbol in enumerate(VN30_TO_FIX):
    pct = int((i + 1) / len(VN30_TO_FIX) * 100)
    print(f"[{pct:3d}%] {symbol}... ", end="", flush=True)
    
    count, err = fetch_and_fill(symbol)
    
    if err:
        stats["fail"] += 1
        print(f"FAIL ({err})")
    elif count > 0:
        stats["ok"] += 1
        stats["records"] += count
        print(f"OK (+{count} records)")
    else:
        print("No new data")
    
    time.sleep(1.5)  # Rate limiting

print()
print("=" * 60)
print("  COMPLETED!")
print(f"  Success: {stats['ok']}/{len(VN30_TO_FIX)}")
print(f"  Failed: {stats['fail']}")
print(f"  Total new records: {stats['records']:,}")
print("=" * 60)
