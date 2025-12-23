# -*- coding: utf-8 -*-
"""
Debug VCI API response
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
import json

def vci_headers():
    return {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://trading.vietcap.com.vn",
        "Referer": "https://trading.vietcap.com.vn/"
    }

url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
payload = {
    "timeFrame": "ONE_DAY",
    "symbols": ["FPT"],
    "to": int(time.time()),
    "countBack": 5
}

print("Request:")
print(f"  URL: {url}")
print(f"  Payload: {json.dumps(payload)}")
print()

try:
    resp = requests.post(url, headers=vci_headers(), json=payload, timeout=30)
    print(f"Status: {resp.status_code}")
    print()
    
    if resp.ok:
        print("Response:")
        print(json.dumps(resp.json(), indent=2, default=str)[:1500])
    else:
        print(f"Error response: {resp.text[:500]}")
except Exception as e:
    print(f"Exception: {e}")
