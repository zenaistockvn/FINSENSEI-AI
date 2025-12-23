# -*- coding: utf-8 -*-
"""
Update VN30 Stock Prices - Fixed for VCI API format
"""
import sys
import io
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

def fetch_vci(symbol, count_back=10):
    """Direct VCI API call - Fixed for string timestamps and VND prices"""
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": int(time.time()),
            "countBack": count_back
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=30)
        
        if resp.status_code == 403:
            return None, "403 Forbidden"
        
        if not resp.ok:
            return None, f"HTTP {resp.status_code}"
        
        data = resp.json()
        if not data or len(data) == 0:
            return None, "Empty"
        
        s = data[0]
        if "t" not in s or not s["t"]:
            return None, "No time data"
        
        prices = []
        for i in range(len(s["t"])):
            # t is string, convert to int first
            ts = int(s["t"][i])
            trading_date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            
            # prices are already in VND (not x1000)
            prices.append({
                "symbol": symbol,
                "trading_date": trading_date,
                "open_price": int(s["o"][i]),
                "high_price": int(s["h"][i]),
                "low_price": int(s["l"][i]),
                "close_price": int(s["c"][i]),
                "volume": int(s["v"][i]) if s["v"][i] else 0,
                "value": int(s.get("accumulatedValue", [0]*len(s["t"]))[i] * 1000000) if s.get("accumulatedValue") else 0
            })
        
        # Filter only dates from 20 Dec 2025 onwards
        recent = [p for p in prices if p["trading_date"] >= "2025-12-20"]
        return recent, None
    except Exception as e:
        return None, str(e)

def upsert(table, data):
    if not data:
        return 0
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
            },
            json=data,
            timeout=30
        )
        if resp.ok or "duplicate" in resp.text.lower():
            return len(data)
    except:
        pass
    return 0

def main():
    print("=" * 55)
    print("  UPDATE VN30 PRICES (20-23 Dec 2025)")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 55)
    print()
    
    for i, sym in enumerate(VN30):
        pct = int((i+1) / len(VN30) * 100)
        print(f"[{pct:3d}%] {sym}... ", end="", flush=True)
        
        prices, err = fetch_vci(sym, 10)
        
        if err:
            stats["fail"] += 1
            print(f"FAIL ({err})")
        elif prices:
            count = upsert("stock_prices", prices)
            stats["ok"] += 1
            stats["records"] += count
            dates = [p["trading_date"] for p in prices]
            print(f"OK ({count} new: {', '.join(dates)})")
        else:
            stats["ok"] += 1
            print("Up to date")
        
        time.sleep(1)
    
    print()
    print("=" * 55)
    print(f"  Success: {stats['ok']} | Fail: {stats['fail']}")
    print(f"  New records: {stats['records']}")
    print("=" * 55)

if __name__ == "__main__":
    main()
