# -*- coding: utf-8 -*-
"""
Check stock prices - verify if data is correct
Compare with expected market prices
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

def get_headers():
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }

# Get latest prices for some key stocks
STOCKS = ["FPT", "VIC", "VHM", "HPG", "VCB", "ACB", "MBB", "TCB"]

print("=" * 70)
print("  VERIFY STOCK PRICES IN DATABASE")
print("=" * 70)
print()

# Expected approximate prices (as of 23/12/2025 from market)
expected = {
    "FPT": 94000,   # ~94,000 VND
    "VIC": 170000,  # ~170,000 VND
    "VHM": 115000,  # ~115,000 VND
    "HPG": 27000,   # ~27,000 VND
    "VCB": 58000,   # ~58,000 VND
    "ACB": 24000,   # ~24,000 VND
    "MBB": 25000,   # ~25,000 VND
    "TCB": 35000,   # ~35,000 VND
}

print(f"{'Stock':<8} {'DB Price':>15} {'Expected':>15} {'Difference':>12} {'Status':<10}")
print("-" * 70)

for symbol in STOCKS:
    url = f"{SUPABASE_URL}/rest/v1/stock_prices?select=trading_date,close_price,open_price&symbol=eq.{symbol}&order=trading_date.desc&limit=5"
    
    try:
        resp = requests.get(url, headers=get_headers(), timeout=30)
        
        if resp.ok:
            data = resp.json()
            if data:
                latest = data[0]
                db_price = latest['close_price']
                exp_price = expected.get(symbol, 0)
                diff = db_price - exp_price if exp_price else 0
                diff_pct = (diff / exp_price * 100) if exp_price else 0
                
                status = "OK" if abs(diff_pct) < 10 else "CHECK!"
                
                print(f"{symbol:<8} {db_price:>15,.0f} {exp_price:>15,} {diff:>+12,.0f} {status:<10}")
                
                # Show last 3 days
                print(f"         Last 3 days:")
                for row in data[:3]:
                    print(f"           {row['trading_date']}: O={row['open_price']:,.0f} C={row['close_price']:,.0f}")
            else:
                print(f"{symbol:<8} {'NO DATA':>15}")
    except Exception as e:
        print(f"{symbol:<8} Error: {e}")

print()
print("=" * 70)
print("  NOTE: DB Price should match Expected (market price)")
print("  If prices are off by 1000x, data may have wrong unit conversion")
print("=" * 70)
