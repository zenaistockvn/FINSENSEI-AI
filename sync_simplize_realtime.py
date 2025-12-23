# -*- coding: utf-8 -*-
"""
Update VN30 prices from Simplize API (realtime intraday)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import time
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

VN30 = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
        "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
        "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"]

stats = {"ok": 0, "fail": 0}

def simplize_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://simplize.vn",
        "Referer": "https://simplize.vn/"
    }

def get_simplize_price(symbol):
    """Get realtime price from Simplize"""
    try:
        url = f"https://api.simplize.vn/api/company/summary/{symbol.lower()}"
        resp = requests.get(url, headers=simplize_headers(), timeout=10)
        
        if resp.ok:
            data = resp.json()
            if 'data' in data:
                d = data['data']
                return {
                    "close_price": d.get('priceClose') or d.get('closePrice') or d.get('price') or 0,
                    "open_price": d.get('priceOpen') or d.get('openPrice') or d.get('open') or 0,
                    "high_price": d.get('priceHigh') or d.get('highPrice') or d.get('high') or 0,
                    "low_price": d.get('priceLow') or d.get('lowPrice') or d.get('low') or 0,
                    "volume": d.get('volume') or 0,
                    "price_change": d.get('netChange') or d.get('priceChange') or d.get('change') or 0,
                    "price_change_pct": d.get('pctChange') or d.get('priceChangePercent') or d.get('percentChange') or 0
                }
            else:
                print(f"  Warning: No 'data' key in response for {symbol}")
        else:
            print(f"  Error: API returned {resp.status_code} for {symbol}")
        return None
    except Exception as e:
        print(f"  Error fetching {symbol}: {e}")
        return None

def update_supabase(symbol, price_data):
    """Update price in Supabase for today"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    record = {
        "symbol": symbol,
        "trading_date": today,
        "open_price": int(price_data['open_price']),
        "high_price": int(price_data['high_price']),
        "low_price": int(price_data['low_price']),
        "close_price": int(price_data['close_price']),
        "volume": int(price_data['volume']),
        "value": 0
    }
    
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/stock_prices",
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
            },
            json=record,
            timeout=10
        )
        return resp.ok or "duplicate" in resp.text.lower()
    except:
        return False

def main():
    print("=" * 60)
    print("  UPDATE VN30 PRICES FROM SIMPLIZE (REALTIME)")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    for i, symbol in enumerate(VN30):
        pct = int((i + 1) / len(VN30) * 100)
        print(f"[{pct:3d}%] {symbol}... ", end="", flush=True)
        
        price = get_simplize_price(symbol)
        
        if price and price['close_price'] > 0:
            success = update_supabase(symbol, price)
            if success:
                stats["ok"] += 1
                print(f"OK - {price['close_price']:,.0f} VND")
            else:
                stats["fail"] += 1
                print(f"DB Error")
        else:
            stats["fail"] += 1
            print("No price data")
        
        time.sleep(0.3)
    
    print()
    print("=" * 60)
    print(f"  Success: {stats['ok']}/{len(VN30)}")
    print(f"  Failed: {stats['fail']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
