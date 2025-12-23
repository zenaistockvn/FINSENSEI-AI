# -*- coding: utf-8 -*-
"""
FINSENSEI - Complete Data Sync Script
Run this script after VCI API rate limit resets
This will:
1. Fill gaps for remaining stocks (ACB, TPB, VCB, VHM, VIB, VIC, VJC, VNM, VPB, VRE)
2. Sync VNINDEX and VN30 indices
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# Stocks still needing gap data
STOCKS_TO_RETRY = ["ACB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"]

# Indices to sync
INDICES = [("VNINDEX", "VNINDEX"), ("VN30", "VN30")]

stats = {"stocks_ok": 0, "stocks_fail": 0, "stock_records": 0, "index_records": 0}

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn"
    }

def test_api():
    print("Testing VCI API...")
    try:
        url = "https://trading.vietcap.com.vn/api/price/symbols/getByGroup?group=VN30"
        resp = requests.get(url, headers=vci_headers(), timeout=15)
        if resp.status_code == 200:
            print("  API is AVAILABLE!")
            return True
        else:
            print(f"  API returned {resp.status_code} - blocked")
            return False
    except Exception as e:
        print(f"  Error: {e}")
        return False

def fetch_vci_chart(symbol, count_back=500):
    url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
    payload = {"timeFrame": "ONE_DAY", "symbols": [symbol], "to": int(time.time()), "countBack": count_back}
    
    resp = requests.post(url, headers=vci_headers(), json=payload, timeout=180)
    if resp.status_code == 403:
        raise Exception("403 Blocked")
    if not resp.ok:
        raise Exception(f"HTTP {resp.status_code}")
    
    data = resp.json()
    if not data or len(data) == 0 or "t" not in data[0]:
        return None
    return data[0]

def fill_stock_gap(symbol):
    try:
        s = fetch_vci_chart(symbol, 500)
        if not s:
            return 0, "No data"
        
        prices = []
        for i in range(len(s["t"])):
            ts = int(s["t"][i])
            d = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            if "2025-03-07" <= d <= "2025-07-30":
                prices.append({
                    "symbol": symbol, "trading_date": d,
                    "open_price": int(s["o"][i]) if s["o"][i] else 0,
                    "high_price": int(s["h"][i]) if s["h"][i] else 0,
                    "low_price": int(s["l"][i]) if s["l"][i] else 0,
                    "close_price": int(s["c"][i]) if s["c"][i] else 0,
                    "volume": int(s["v"][i]) if s["v"][i] else 0,
                    "value": 0
                })
        
        if not prices:
            return 0, "No gap data"
        
        headers = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                  "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
        
        resp = requests.post(f"{SUPABASE_URL}/rest/v1/stock_prices", headers=headers, json=prices, timeout=30)
        return len(prices) if (resp.ok or "duplicate" in resp.text.lower()) else 0, None
        
    except Exception as e:
        return 0, str(e)[:30]

def sync_index(index_code, vci_code):
    try:
        s = fetch_vci_chart(vci_code, 500)
        if not s:
            return 0, "No data"
        
        records = []
        prev_close = None
        
        for i in range(len(s["t"])):
            ts = int(s["t"][i])
            d = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            close = s["c"][i] if s["c"][i] else 0
            open_val = s["o"][i] if s["o"][i] else 0
            
            if prev_close is None:
                prev_close = open_val
            
            records.append({
                "index_code": index_code, "trading_date": d,
                "open_value": open_val,
                "high_value": s["h"][i] if s["h"][i] else 0,
                "low_value": s["l"][i] if s["l"][i] else 0,
                "close_value": close,
                "volume": int(s["v"][i]) if s["v"][i] else 0,
                "value": 0,
                "change_value": round(close - prev_close, 2) if prev_close else 0,
                "change_percent": round((close - prev_close) / prev_close * 100, 2) if prev_close else 0
            })
            prev_close = close
        
        headers = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                  "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
        
        inserted = 0
        for i in range(0, len(records), 500):
            batch = records[i:i+500]
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/market_indices", headers=headers, json=batch, timeout=30)
            if resp.ok or "duplicate" in resp.text.lower():
                inserted += len(batch)
        
        return inserted, None
        
    except Exception as e:
        return 0, str(e)[:30]

def main():
    print()
    print("=" * 65)
    print("  FINSENSEI - COMPLETE DATA SYNC")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)
    print()
    
    if not test_api():
        print()
        print("VCI API is rate-limited. Please try again in 30-60 minutes.")
        print("Run: python complete_sync.py")
        return
    
    print()
    print("=" * 65)
    print("  PART 1: FILL STOCK GAPS (10 stocks)")
    print("=" * 65)
    print()
    
    for symbol in STOCKS_TO_RETRY:
        print(f"  {symbol}... ", end="", flush=True)
        count, err = fill_stock_gap(symbol)
        
        if err:
            stats["stocks_fail"] += 1
            print(f"FAIL ({err})")
            if "403" in str(err):
                print("\n  API blocked. Stopping...")
                break
        elif count > 0:
            stats["stocks_ok"] += 1
            stats["stock_records"] += count
            print(f"OK (+{count} records)")
        else:
            print("Up to date")
        
        time.sleep(2)
    
    print()
    print("=" * 65)
    print("  PART 2: SYNC MARKET INDICES")
    print("=" * 65)
    print()
    
    for index_code, vci_code in INDICES:
        print(f"  {index_code}... ", end="", flush=True)
        count, err = sync_index(index_code, vci_code)
        
        if err:
            print(f"FAIL ({err})")
        elif count > 0:
            stats["index_records"] += count
            print(f"OK ({count} records)")
        else:
            print("No data")
        
        time.sleep(2)
    
    print()
    print("=" * 65)
    print("  SYNC COMPLETED!")
    print("=" * 65)
    print(f"  Stocks: {stats['stocks_ok']}/{len(STOCKS_TO_RETRY)} success")
    print(f"  Stock records added: {stats['stock_records']}")
    print(f"  Index records added: {stats['index_records']}")
    print("=" * 65)

if __name__ == "__main__":
    main()
