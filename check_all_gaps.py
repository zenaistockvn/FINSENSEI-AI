# -*- coding: utf-8 -*-
"""
Check all VN30 stocks for data gaps in 2025
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
from datetime import datetime

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

VN30 = ["ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
        "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
        "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"]

def get_headers():
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }

print("=" * 70)
print("  VN30 DATA GAP ANALYSIS - YEAR 2025")
print("=" * 70)
print()

stocks_with_gaps = []

for symbol in VN30:
    url = f"{SUPABASE_URL}/rest/v1/stock_prices?select=trading_date&symbol=eq.{symbol}&trading_date=gte.2025-01-01&trading_date=lte.2025-12-31&order=trading_date.asc&limit=1000"
    
    try:
        resp = requests.get(url, headers=get_headers(), timeout=30)
        
        if resp.ok:
            data = resp.json()
            
            if data:
                dates = sorted([row['trading_date'] for row in data])
                
                # Find significant gaps (> 10 days - more than Tet holiday)
                gaps = []
                for i in range(1, len(dates)):
                    prev = datetime.strptime(dates[i-1], '%Y-%m-%d')
                    curr = datetime.strptime(dates[i], '%Y-%m-%d')
                    diff = (curr - prev).days
                    
                    if diff > 10:  # More than Tet holiday
                        gaps.append({
                            'from': dates[i-1],
                            'to': dates[i],
                            'days': diff
                        })
                
                # Check for missing months
                months = set()
                for d in dates:
                    months.add(d[:7])
                
                expected_months = [f"2025-{m:02d}" for m in range(1, 13)]
                missing_months = [m for m in expected_months if m not in months]
                
                status = "OK"
                if gaps or missing_months:
                    status = "GAP"
                    stocks_with_gaps.append({
                        'symbol': symbol,
                        'records': len(dates),
                        'gaps': gaps,
                        'missing_months': missing_months
                    })
                
                print(f"  {symbol}: {len(dates):3d} days | ", end="")
                
                if gaps:
                    for gap in gaps[:2]:
                        print(f"GAP: {gap['from']} -> {gap['to']} ({gap['days']}d) ", end="")
                elif missing_months:
                    print(f"Missing: {', '.join(missing_months)} ", end="")
                else:
                    print("OK", end="")
                print()
                
            else:
                print(f"  {symbol}: NO DATA for 2025!")
                stocks_with_gaps.append({'symbol': symbol, 'records': 0, 'gaps': [], 'missing_months': ['ALL']})
                
    except Exception as e:
        print(f"  {symbol}: Error - {e}")

print()
print("=" * 70)
print("  SUMMARY")
print("=" * 70)
print()

if stocks_with_gaps:
    print(f"Stocks with significant gaps: {len(stocks_with_gaps)}")
    print()
    for stock in stocks_with_gaps:
        print(f"  {stock['symbol']}:")
        print(f"    Records: {stock['records']}")
        if stock['gaps']:
            for gap in stock['gaps']:
                print(f"    GAP: {gap['from']} -> {gap['to']} ({gap['days']} days)")
        if stock['missing_months']:
            print(f"    Missing months: {', '.join(stock['missing_months'])}")
        print()
else:
    print("All VN30 stocks have complete data for 2025!")
    
print("=" * 70)
