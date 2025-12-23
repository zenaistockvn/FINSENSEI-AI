# -*- coding: utf-8 -*-
"""Retry failed symbols"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

RETRY = ["ACB", "MSN"]

def fetch_vci(symbol):
    url = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart"
    payload = {"timeFrame": "ONE_DAY", "symbols": [symbol], "to": int(time.time()), "countBack": 10}
    headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "Origin": "https://trading.vietcap.com.vn"}
    
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if not resp.ok:
        return None
    
    data = resp.json()
    if not data:
        return None
    
    s = data[0]
    prices = []
    for i in range(len(s["t"])):
        ts = int(s["t"][i])
        d = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        if d >= "2025-12-20":
            prices.append({
                "symbol": symbol, "trading_date": d,
                "open_price": int(s["o"][i]), "high_price": int(s["h"][i]),
                "low_price": int(s["l"][i]), "close_price": int(s["c"][i]),
                "volume": int(s["v"][i]), "value": 0
            })
    return prices

def upsert(data):
    if not data:
        return 0
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/stock_prices",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                 "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=data, timeout=30)
    return len(data) if resp.ok else 0

print("Retrying ACB and MSN...")
for sym in RETRY:
    print(f"  {sym}... ", end="", flush=True)
    try:
        p = fetch_vci(sym)
        if p:
            c = upsert(p)
            print(f"OK ({c} records)")
        else:
            print("No data")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(2)

print("Done!")
