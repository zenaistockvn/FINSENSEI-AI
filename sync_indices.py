# -*- coding: utf-8 -*-
"""
Sync VNINDEX and VN30 indices from VCI API
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# Index mapping: (our_code, vci_code)
INDICES = [
    ("VNINDEX", "VNINDEX"),
    ("VN30", "VN30"),
    ("HNX", "HNXIndex"),
    ("UPCOM", "HNXUpcomIndex")
]

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/ho-tro/bieu-do-ky-thuat"
    }

def fetch_index(vci_code, count_back=500):
    """Fetch index data from VCI API"""
    try:
        url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [vci_code],
            "to": int(time.time()),
            "countBack": count_back
        }
        
        resp = requests.post(url, headers=vci_headers(), json=payload, timeout=120)
        
        if resp.status_code == 403:
            return None, "403 Blocked"
        if not resp.ok:
            return None, f"HTTP {resp.status_code}"
        
        data = resp.json()
        if not data or len(data) == 0 or "t" not in data[0]:
            return None, "No data"
        
        return data[0], None
        
    except requests.exceptions.Timeout:
        return None, "Timeout"
    except Exception as e:
        return None, str(e)[:50]

def save_index(index_code, vci_data):
    """Convert and save index data to Supabase"""
    if not vci_data or "t" not in vci_data:
        return 0
    
    records = []
    prev_close = None
    
    for i in range(len(vci_data["t"])):
        ts = int(vci_data["t"][i])
        trading_date = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        
        close = vci_data["c"][i] if vci_data["c"][i] else 0
        open_val = vci_data["o"][i] if vci_data["o"][i] else 0
        
        if prev_close is None:
            prev_close = open_val
        
        change_value = round(close - prev_close, 2) if prev_close else 0
        change_percent = round((close - prev_close) / prev_close * 100, 2) if prev_close else 0
        
        records.append({
            "index_code": index_code,
            "trading_date": trading_date,
            "open_value": open_val,
            "high_value": vci_data["h"][i] if vci_data["h"][i] else 0,
            "low_value": vci_data["l"][i] if vci_data["l"][i] else 0,
            "close_value": close,
            "volume": int(vci_data["v"][i]) if vci_data["v"][i] else 0,
            "value": 0,
            "change_value": change_value,
            "change_percent": change_percent
        })
        
        prev_close = close
    
    # Upsert to Supabase
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
    }
    
    inserted = 0
    for i in range(0, len(records), 500):
        batch = records[i:i+500]
        try:
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/market_indices", headers=headers, json=batch, timeout=30)
            if resp.ok or "duplicate" in resp.text.lower():
                inserted += len(batch)
        except:
            pass
    
    return inserted

def main():
    print("=" * 60)
    print("  SYNC MARKET INDICES FROM VCI API")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    total_records = 0
    
    for index_code, vci_code in INDICES:
        print(f"[{index_code}] Fetching from VCI (4000 days)...")
        
        vci_data, err = fetch_index(vci_code, 4000)
        
        if err:
            print(f"  ERROR: {err}")
            continue
        
        if vci_data:
            print(f"  Received {len(vci_data['t'])} records")
            
            # Get date range
            dates = [datetime.fromtimestamp(int(t)).strftime("%Y-%m-%d") for t in vci_data["t"]]
            print(f"  Date range: {min(dates)} to {max(dates)}")
            
            # Save to Supabase
            print(f"  Saving to Supabase...")
            count = save_index(index_code, vci_data)
            total_records += count
            print(f"  SAVED: {count} records")
        else:
            print(f"  No data received")
        
        print()
        time.sleep(2)
    
    print("=" * 60)
    print(f"  COMPLETED! Total records: {total_records}")
    print("=" * 60)

if __name__ == "__main__":
    main()
