# -*- coding: utf-8 -*-
"""
Test Simplize summary endpoint
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://simplize.vn",
    "Referer": "https://simplize.vn/"
}

print("Testing Simplize Summary API...")
print()

symbols = ["hpg", "fpt", "vic", "vcb"]

for symbol in symbols:
    url = f"https://api.simplize.vn/api/company/summary/{symbol}"
    print(f"[{symbol.upper()}] {url}")
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        print(f"  Status: {resp.status_code}")
        
        if resp.ok:
            data = resp.json()
            if 'data' in data:
                d = data['data']
                print(f"  Price: {d.get('price', 'N/A')}")
                print(f"  Close: {d.get('closePrice', d.get('priceClose', 'N/A'))}")
                print(f"  Change: {d.get('priceChange', d.get('change', 'N/A'))}")
                print(f"  Full data keys: {list(d.keys())[:10]}...")
            else:
                print(f"  Data: {json.dumps(data, ensure_ascii=False)[:300]}")
        else:
            print(f"  Error: {resp.text[:100]}")
    except requests.exceptions.Timeout:
        print("  TIMEOUT")
    except Exception as e:
        print(f"  Error: {e}")
    print()
