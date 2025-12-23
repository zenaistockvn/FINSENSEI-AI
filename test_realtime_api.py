# -*- coding: utf-8 -*-
"""
Get realtime stock prices from working APIs
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

print("=" * 60)
print("  GET REALTIME PRICES FOR VN30")
print("=" * 60)
print()

# Try SSI iBoard API
print("[SSI iBoard API]")
try:
    url = "https://iboard-api.ssi.com.vn/statistics/getListStockData"
    payload = {
        "exchange": "hose",
        "top": 30
    }
    
    resp = requests.post(url, headers=get_headers(), json=payload, timeout=15)
    print(f"  Status: {resp.status_code}")
    
    if resp.ok:
        data = resp.json()
        if "data" in data:
            print(f"  Found {len(data['data'])} stocks")
            
            # Find specific stocks
            target = ["HPG", "FPT", "VIC", "VCB", "ACB"]
            print("\n  Key stocks:")
            for stock in data['data']:
                if stock.get('ss', '').upper() in target:
                    sym = stock.get('ss', '')
                    price = stock.get('mp', 0)  # matched price
                    ref = stock.get('r', 0)  # reference
                    print(f"    {sym}: {price:,} VND (ref: {ref:,})")
except Exception as e:
    print(f"  Error: {e}")

print()

# Try TCBS public API
print("[TCBS API]")
try:
    url = "https://apipubaws.tcbs.com.vn/stock-insight/v2/stock/overview?ticker=HPG"
    
    resp = requests.get(url, headers=get_headers(), timeout=15)
    print(f"  Status: {resp.status_code}")
    
    if resp.ok:
        data = resp.json()
        print(f"  HPG Data: {json.dumps(data, ensure_ascii=False)[:500]}...")
except Exception as e:
    print(f"  Error: {e}")

print()

# Try VCI realtime
print("[VCI Realtime]")
try:
    url = "https://trading.vietcap.com.vn/api/price/symbols/getByGroup?group=VN30"
    
    resp = requests.get(url, headers=get_headers(), timeout=15)
    print(f"  Status: {resp.status_code}")
    
    if resp.ok:
        data = resp.json()
        print(f"  Found {len(data)} stocks")
        
        # Show first few
        for stock in data[:5]:
            print(f"    {stock}")
except Exception as e:
    print(f"  Error: {e}")

print()
print("=" * 60)
