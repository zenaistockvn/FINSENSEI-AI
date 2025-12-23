# -*- coding: utf-8 -*-
"""
Fill HPG data gap from VCI API
Target: March 7 - July 30, 2025 (missing ~147 days)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

print("=" * 60)
print("  FILL HPG DATA GAP FROM VCI API")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)
print()

# Fetch HPG data - get recent 500 days to capture the missing period
print("[1] Fetching HPG from VCI API (500 days)...")

try:
    url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
    payload = {
        "timeFrame": "ONE_DAY",
        "symbols": ["HPG"],
        "to": int(time.time()),
        "countBack": 500  # ~2 years to cover missing period
    }
    
    resp = requests.post(url, headers=vci_headers(), json=payload, timeout=120)
    
    print(f"    Status: {resp.status_code}")
    
    if resp.status_code == 403:
        print("    ERROR: API blocked (403 Forbidden)")
        print("    VCI API is rate limiting. Try again in 30-60 minutes.")
        exit(1)
    
    if not resp.ok:
        print(f"    ERROR: HTTP {resp.status_code}")
        exit(1)
    
    data = resp.json()
    
    if not data or len(data) == 0 or "t" not in data[0]:
        print("    ERROR: No data received")
        exit(1)
    
    s = data[0]
    print(f"    Received {len(s['t'])} records from API")
    
    # Convert to list of price records
    prices = []
    for i in range(len(s["t"])):
        ts = int(s["t"][i])
        trading_date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        
        prices.append({
            "symbol": "HPG",
            "trading_date": trading_date,
            "open_price": int(s["o"][i]) if s["o"][i] else 0,
            "high_price": int(s["h"][i]) if s["h"][i] else 0,
            "low_price": int(s["l"][i]) if s["l"][i] else 0,
            "close_price": int(s["c"][i]) if s["c"][i] else 0,
            "volume": int(s["v"][i]) if s["v"][i] else 0,
            "value": 0
        })
    
    # Filter only missing period (March 7 - July 30, 2025)
    missing_start = "2025-03-07"
    missing_end = "2025-07-30"
    
    gap_data = [p for p in prices if missing_start <= p["trading_date"] <= missing_end]
    
    print(f"    Records in gap period ({missing_start} to {missing_end}): {len(gap_data)}")
    
    if gap_data:
        dates = [p["trading_date"] for p in gap_data]
        print(f"    Date range: {min(dates)} to {max(dates)}")
        
        # Show sample
        print()
        print("[2] Sample data from gap period:")
        for p in gap_data[:5]:
            print(f"    {p['trading_date']}: Close = {p['close_price']:,} VND")
        if len(gap_data) > 5:
            print(f"    ... and {len(gap_data) - 5} more records")
        
        # Upload to Supabase
        print()
        print("[3] Uploading to Supabase...")
        
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
            except Exception as e:
                print(f"    Batch error: {e}")
        
        print(f"    Inserted: {inserted} records")
        
    else:
        print("    No data found for the gap period in API response")
        print("    The API may not have historical data for this period")
        
except requests.exceptions.Timeout:
    print("    ERROR: Request timeout (120s)")
except Exception as e:
    print(f"    ERROR: {e}")

print()
print("=" * 60)
print("  DONE!")
print("=" * 60)
