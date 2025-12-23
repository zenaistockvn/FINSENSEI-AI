# -*- coding: utf-8 -*-
"""
Detailed check of stock_prices data
"""

import requests

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

def get_headers():
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }

# Get symbols with counts using RPC or aggregation
# Since Supabase doesn't have direct GROUP BY via REST, we'll use a different approach

VN30 = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
        "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
        "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"]

print("")
print("=" * 60)
print("  VN30 STOCK DATA CHECK")
print("=" * 60)
print("")

total = 0
has_data = 0
no_data = []

for symbol in VN30:
    url = f"{SUPABASE_URL}/rest/v1/stock_prices?select=trading_date,close_price&symbol=eq.{symbol}&order=trading_date.desc&limit=1"
    
    try:
        resp = requests.get(url, headers={**get_headers(), "Prefer": "count=exact"}, timeout=15)
        count_header = resp.headers.get('content-range', '0-0/0')
        count = int(count_header.split('/')[-1]) if '/' in count_header else 0
        
        data = resp.json()
        if data and len(data) > 0:
            latest = data[0]
            print(f"  {symbol}: {count:4d} records | Latest: {latest['trading_date']} - {latest['close_price']:,.0f} VND")
            has_data += 1
            total += count
        else:
            print(f"  {symbol}: NO DATA")
            no_data.append(symbol)
    except Exception as e:
        print(f"  {symbol}: Error - {e}")
        no_data.append(symbol)

print("")
print("-" * 60)
print(f"  Stocks with data: {has_data}/30")
print(f"  Total price records: {total:,}")
if no_data:
    print(f"  Missing: {', '.join(no_data)}")
print("=" * 60)
print("")

# Check indices
print("  MARKET INDICES CHECK")
print("-" * 60)

for idx in ["VNINDEX", "VN30", "HNX"]:
    url = f"{SUPABASE_URL}/rest/v1/market_indices?select=trading_date,close_value&index_code=eq.{idx}&order=trading_date.desc&limit=1"
    
    try:
        resp = requests.get(url, headers={**get_headers(), "Prefer": "count=exact"}, timeout=15)
        count_header = resp.headers.get('content-range', '0-0/0')
        count = int(count_header.split('/')[-1]) if '/' in count_header else 0
        
        data = resp.json()
        if data and len(data) > 0:
            latest = data[0]
            print(f"  {idx}: {count:4d} records | Latest: {latest['trading_date']} - {latest['close_value']:.2f}")
        else:
            print(f"  {idx}: NO DATA")
    except Exception as e:
        print(f"  {idx}: Error - {e}")

print("=" * 60)
