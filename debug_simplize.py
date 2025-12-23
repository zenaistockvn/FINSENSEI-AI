# -*- coding: utf-8 -*-
import requests
import json
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://simplize.vn",
    "Referer": "https://simplize.vn/"
}

url = "https://api.simplize.vn/api/company/summary/hpg"
resp = requests.get(url, headers=headers)
print(f"Status: {resp.status_code}")
if resp.ok:
    print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
else:
    print(resp.text)
