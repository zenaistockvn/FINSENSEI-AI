# -*- coding: utf-8 -*-
"""
Sync VN30 Stock Prices to Supabase
Direct VCI API call (no vnstock wrapper)
Run with: python sync_vci_direct.py
"""

import requests
import time
from datetime import datetime, timedelta
import json

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

# VCI API config
VCI_BASE_URL = "https://trading.vietcap.com.vn/api"
VCI_CHART_ENDPOINT = f"{VCI_BASE_URL}/chart/OHLCChart/gap-chart"

# VN30 symbols
VN30_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
    "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"
]

INDICES = [
    {"code": "VNINDEX", "vci": "VNINDEX"},
    {"code": "VN30", "vci": "VN30"}
]

stats = {
    "price_count": 0,
    "stock_count": 0,
    "index_count": 0,
    "error_count": 0
}

def get_vci_headers():
    """Get headers for VCI API"""
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

def fetch_vci_stock_prices(symbol, count_back=365):
    """Fetch stock prices directly from VCI API"""
    try:
        end_timestamp = int(time.time())
        
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [symbol],
            "to": end_timestamp,
            "countBack": count_back
        }
        
        response = requests.post(
            VCI_CHART_ENDPOINT,
            headers=get_vci_headers(),
            json=payload,
            timeout=30
        )
        
        if not response.ok:
            print(f"    HTTP {response.status_code}")
            return []
        
        data = response.json()
        
        if not data or not isinstance(data, list) or len(data) == 0:
            return []
        
        symbol_data = data[0]
        
        if "t" not in symbol_data or not symbol_data["t"]:
            return []
        
        prices = []
        for i in range(len(symbol_data["t"])):
            trading_date = datetime.fromtimestamp(symbol_data["t"][i]).strftime("%Y-%m-%d")
            prices.append({
                "symbol": symbol,
                "trading_date": trading_date,
                "open_price": int(symbol_data["o"][i] * 1000),
                "high_price": int(symbol_data["h"][i] * 1000),
                "low_price": int(symbol_data["l"][i] * 1000),
                "close_price": int(symbol_data["c"][i] * 1000),
                "volume": int(symbol_data["v"][i]) if symbol_data["v"][i] else 0,
                "value": int(symbol_data["c"][i] * 1000 * (symbol_data["v"][i] or 0))
            })
        
        return prices
    except Exception as e:
        print(f"    Error: {e}")
        return []

def fetch_vci_index_prices(index_code, vci_code, count_back=365):
    """Fetch index prices directly from VCI API"""
    try:
        end_timestamp = int(time.time())
        
        payload = {
            "timeFrame": "ONE_DAY",
            "symbols": [vci_code],
            "to": end_timestamp,
            "countBack": count_back
        }
        
        response = requests.post(
            VCI_CHART_ENDPOINT,
            headers=get_vci_headers(),
            json=payload,
            timeout=30
        )
        
        if not response.ok:
            return []
        
        data = response.json()
        
        if not data or not isinstance(data, list) or len(data) == 0:
            return []
        
        symbol_data = data[0]
        
        if "t" not in symbol_data or not symbol_data["t"]:
            return []
        
        result = []
        prev_close = None
        
        for i in range(len(symbol_data["t"])):
            trading_date = datetime.fromtimestamp(symbol_data["t"][i]).strftime("%Y-%m-%d")
            close = symbol_data["c"][i]
            
            if prev_close is None:
                prev_close = symbol_data["o"][i]
            
            change_value = round(close - prev_close, 2)
            change_percent = round((close - prev_close) / prev_close * 100, 2) if prev_close else 0
            
            result.append({
                "index_code": index_code,
                "trading_date": trading_date,
                "open_value": symbol_data["o"][i],
                "high_value": symbol_data["h"][i],
                "low_value": symbol_data["l"][i],
                "close_value": close,
                "volume": int(symbol_data["v"][i]) if symbol_data["v"][i] else 0,
                "value": 0,
                "change_value": change_value,
                "change_percent": change_percent
            })
            
            prev_close = close
        
        return result
    except Exception as e:
        print(f"    Error: {e}")
        return []

def upsert_to_supabase(table, data):
    """Upsert data to Supabase"""
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
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=headers,
                json=batch
            )
            if response.ok or "duplicate" in response.text.lower() or "conflict" in response.text.lower():
                inserted += len(batch)
            else:
                print(f"    Supabase: {response.text[:80]}")
        except Exception as e:
            print(f"    Supabase error: {e}")
    
    return inserted

def main():
    print("")
    print("=" * 65)
    print("  SYNC VN30 STOCK PRICES TO DATABASE")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  Source: VCI API (trading.vietcap.com.vn)")
    print("=" * 65)
    print("")
    
    start_time = time.time()
    total_items = len(VN30_SYMBOLS) + len(INDICES)
    completed = 0
    
    print("Syncing VN30 stocks (1 year data)...")
    print("")
    
    for symbol in VN30_SYMBOLS:
        completed += 1
        progress = round((completed / total_items) * 100)
        print(f"  [{progress:3d}%] {symbol}... ", end="", flush=True)
        
        try:
            prices = fetch_vci_stock_prices(symbol, 365)
            
            if prices:
                inserted = upsert_to_supabase("stock_prices", prices)
                stats["price_count"] += inserted
                stats["stock_count"] += 1
                print(f"OK - {inserted} records")
            else:
                stats["error_count"] += 1
                print("No data")
        except Exception as e:
            stats["error_count"] += 1
            print(f"Error: {e}")
        
        time.sleep(1.5)
    
    print("")
    print("Syncing market indices...")
    print("")
    
    for index in INDICES:
        completed += 1
        progress = round((completed / total_items) * 100)
        print(f"  [{progress:3d}%] {index['code']}... ", end="", flush=True)
        
        try:
            index_data = fetch_vci_index_prices(index["code"], index["vci"], 365)
            
            if index_data:
                inserted = upsert_to_supabase("market_indices", index_data)
                stats["index_count"] += inserted
                print(f"OK - {inserted} records")
            else:
                print("No data")
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(1.5)
    
    duration = round(time.time() - start_time)
    
    print("")
    print("=" * 65)
    print("  SYNC COMPLETED!")
    print("=" * 65)
    print(f"  Duration: {duration} seconds")
    print(f"  Stocks synced: {stats['stock_count']}")
    print(f"  Index records: {stats['index_count']}")
    print(f"  Price records: {stats['price_count']}")
    print(f"  Errors: {stats['error_count']}")
    print("=" * 65)
    print("")

if __name__ == "__main__":
    main()
