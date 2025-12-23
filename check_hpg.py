# -*- coding: utf-8 -*-
"""
Check HPG data for year 2025
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

# Get HPG data for 2025 only
url = f"{SUPABASE_URL}/rest/v1/stock_prices?select=trading_date,close_price&symbol=eq.HPG&trading_date=gte.2025-01-01&trading_date=lte.2025-12-31&order=trading_date.asc&limit=1000"

print("=" * 60)
print("  HPG DATA - YEAR 2025")
print("=" * 60)
print()

try:
    resp = requests.get(url, headers=get_headers(), timeout=60)
    
    if resp.ok:
        data = resp.json()
        
        if data:
            print(f"Total records in 2025: {len(data)}")
            print()
            
            # Group by month
            months = {}
            for row in data:
                month = row['trading_date'][:7]
                if month not in months:
                    months[month] = []
                months[month].append(row['trading_date'])
            
            print("Records by month:")
            print("-" * 50)
            for month in sorted(months.keys()):
                days = months[month]
                print(f"  {month}: {len(days):2d} days | {days[0]} to {days[-1]}")
            
            # Find gaps
            print()
            print("Gap analysis:")
            print("-" * 50)
            
            from datetime import datetime, timedelta
            
            dates = sorted([row['trading_date'] for row in data])
            
            gaps = []
            for i in range(1, len(dates)):
                prev = datetime.strptime(dates[i-1], '%Y-%m-%d')
                curr = datetime.strptime(dates[i], '%Y-%m-%d')
                diff = (curr - prev).days
                
                if diff > 5:  # More than weekend + holiday
                    gaps.append({
                        'from': dates[i-1],
                        'to': dates[i],
                        'days': diff
                    })
            
            if gaps:
                print(f"Found {len(gaps)} significant gaps:")
                for gap in gaps:
                    print(f"  GAP: {gap['from']} -> {gap['to']} ({gap['days']} days missing)")
            else:
                print("No significant gaps found!")
            
            # Show first and last dates
            print()
            print(f"First date: {dates[0]}")
            print(f"Last date: {dates[-1]}")
                
        else:
            print("NO DATA found for HPG in 2025!")
    else:
        print(f"Error: {resp.status_code}")
        
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 60)
