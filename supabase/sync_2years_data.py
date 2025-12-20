#!/usr/bin/env python3
"""
Script đồng bộ dữ liệu giá cổ phiếu 2 năm gần nhất từ SSI API
FinSensei AI - Phân tích cổ phiếu với dữ liệu dài hạn
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import concurrent.futures
from threading import Lock

# Supabase configuration
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

SUPABASE_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# Comprehensive VN100 symbols for 2-year sync
VN100_SYMBOLS = [
    # VN30 - Top 30 stocks
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
    
    # VN70 - Additional popular stocks
    "AAA", "ABR", "ACV", "AGG", "ANV", "APH", "ASM", "ASP", "BAF", "BFC",
    "BMP", "BSI", "BTP", "BWE", "C32", "C47", "CAV", "CII", "CMG", "CMX",
    "CNG", "CRC", "CSM", "CTD", "CTI", "CTR", "CTS", "DCM", "DGC", "DGW",
    "DHC", "DIG", "DPM", "DRC", "DRH", "DTL", "DXG", "DXS", "EIB", "EVF",
    "EVG", "FCM", "FCN", "FRT", "FTS", "GEG", "GMD", "GSP", "GTN", "HAG",
    "HAH", "HCM", "HDC", "HDG", "HHV", "HNG", "HQC", "HSG", "HT1", "HTN",
    "HTV", "HU1", "HU3", "HVN", "IMP", "ITA", "ITD", "ITC", "JVC", "KBC",
    "KDC", "KDH", "KHG", "KMR", "L10", "LAF", "LBM", "LCG", "LCM", "LDG",
    "LGC", "LHG", "LIX", "LPB", "LSS", "MCP", "MDG", "MIG", "MSB", "MSH",
    "NAF", "NAV", "NBC", "NCT", "NHA", "NKG", "NLG", "NNC", "NSC", "NT2",
    "NTL", "NVL", "NVT", "OCB", "OGC", "OPC", "ORS", "PAN", "PC1", "PDN",
    "PDR", "PET", "PGC", "PGD", "PGI", "PHC", "PHR", "PIT", "PLP", "PME",
    "PNJ", "POM", "PPC", "PVD", "PVS", "PVT", "QCG", "RAL", "ROS", "S4A"
]

# Thread-safe counters
stats_lock = Lock()
total_inserted = 0
success_count = 0
error_count = 0

def fetch_from_ssi(symbol: str, days: int = 730) -> Optional[List[Dict]]:
    """Fetch 2-year stock data from SSI API"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f"https://iboard.ssi.com.vn/dchart/api/history"
        params = {
            'resolution': 'D',
            'symbol': symbol,
            'from': int(start_date.timestamp()),
            'to': int(end_date.timestamp())
        }
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        if not response.ok:
            raise Exception(f"SSI API error: {response.status_code}")
        
        data = response.json()
        
        if data.get('s') != 'ok' or not data.get('t'):
            return None
        
        # Transform SSI data format
        prices = []
        for i in range(len(data['t'])):
            trading_date = datetime.fromtimestamp(data['t'][i]).strftime('%Y-%m-%d')
            prices.append({
                'symbol': symbol,
                'trading_date': trading_date,
                'open_price': data['o'][i],
                'high_price': data['h'][i],
                'low_price': data['l'][i],
                'close_price': data['c'][i],
                'volume': data['v'][i]
            })
        
        return prices
        
    except Exception as e:
        print(f"  ⚠️ SSI error for {symbol}: {str(e)}")
        return None

def insert_to_supabase_batch(table: str, data: List[Dict]) -> int:
    """Insert data to Supabase with optimized batch processing"""
    if not data:
        return 0
    
    batch_size = 200  # Smaller batches for better reliability
    inserted = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=SUPABASE_HEADERS,
                json=batch,
                timeout=60
            )
            
            if response.ok:
                inserted += len(batch)
            else:
                error_text = response.text[:200]
                print(f"  ❌ Supabase batch error: {error_text}")
                
        except Exception as e:
            print(f"  ❌ Insert batch error: {str(e)}")
        
        # Small delay between batches
        time.sleep(0.1)
    
    return inserted

def process_symbol(symbol: str, index: int, total: int) -> Dict:
    """Process a single symbol with 2-year data"""
    global total_inserted, success_count, error_count
    
    print(f"  [{index+1}/{total}] Processing {symbol} (2 years)...")
    
    try:
        # Fetch 2 years of data
        prices = fetch_from_ssi(symbol, 730)
        
        if prices and len(prices) > 0:
            inserted = insert_to_supabase_batch("stock_prices", prices)
            
            with stats_lock:
                total_inserted += inserted
                success_count += 1
            
            coverage = round((len(prices) / 730) * 100)
            print(f"    ✅ {symbol}: {inserted} records ({len(prices)} days, {coverage}% coverage)")
            
            # Show date range for verification
            if len(prices) > 0:
                oldest_date = prices[-1]['trading_date']
                newest_date = prices[0]['trading_date']
                print(f"    📅 Range: {oldest_date} → {newest_date}")
            
            return {
                'symbol': symbol,
                'success': True,
                'records': inserted,
                'days': len(prices),
                'coverage': coverage
            }
        else:
            with stats_lock:
                error_count += 1
            print(f"    ⚠️ {symbol}: No data")
            return {'symbol': symbol, 'success': False, 'records': 0}
            
    except Exception as e:
        with stats_lock:
            error_count += 1
        print(f"    ❌ {symbol}: {str(e)}")
        return {'symbol': symbol, 'success': False, 'error': str(e)}

def sync_2year_stock_prices():
    """Main sync function for 2 years data with threading"""
    global total_inserted, success_count, error_count
    
    print("\n📈 SYNCING 2 YEARS STOCK PRICES FROM SSI API...\n")
    print("=" * 60)
    print(f"🎯 Target: {len(VN100_SYMBOLS)} symbols")
    print(f"📅 Period: 730 days (2 years)")
    print(f"📊 Expected: ~{len(VN100_SYMBOLS) * 500} records")
    print(f"⏱️ Estimated time: 20-25 minutes")
    print("=" * 60)
    
    start_time = time.time()
    
    # Process symbols sequentially to avoid rate limiting
    results = []
    for i, symbol in enumerate(VN100_SYMBOLS):
        result = process_symbol(symbol, i, len(VN100_SYMBOLS))
        results.append(result)
        
        # Rate limiting - important for 2-year sync
        time.sleep(1.2)
        
        # Progress update every 10 symbols
        if (i + 1) % 10 == 0:
            elapsed = time.time() - start_time
            avg_time = elapsed / (i + 1)
            remaining_time = (len(VN100_SYMBOLS) - i - 1) * avg_time
            print(f"\n📊 Progress: {i+1}/{len(VN100_SYMBOLS)} ({round((i+1)/len(VN100_SYMBOLS)*100)}%)")
            print(f"⏱️ Remaining: ~{int(remaining_time/60)} minutes")
            print(f"📈 Records so far: {total_inserted:,}")
            print("-" * 40)
    
    end_time = time.time()
    duration = int(end_time - start_time)
    
    print(f"\n" + "=" * 60)
    print("📋 2-YEAR SYNC SUMMARY:")
    print(f"  - Total symbols: {len(VN100_SYMBOLS)}")
    print(f"  - Successful: {success_count}")
    print(f"  - Failed: {error_count}")
    print(f"  - Total records: {total_inserted:,}")
    print(f"  - Average per symbol: {total_inserted//max(success_count,1):,}")
    print(f"  - Duration: {duration//60}m {duration%60}s")
    print(f"  - Data size estimate: ~{total_inserted*0.1/1024:.1f}MB")
    print("=" * 60)
    
    # Show top performers
    successful_results = [r for r in results if r.get('success')]
    if successful_results:
        print("\n🏆 TOP PERFORMERS (most data):")
        top_symbols = sorted(successful_results, key=lambda x: x.get('records', 0), reverse=True)[:10]
        for i, result in enumerate(top_symbols):
            print(f"  {i+1}. {result['symbol']}: {result['records']:,} records ({result.get('coverage', 0)}%)")
    
    return total_inserted

def sync_2year_market_indices():
    """Sync market indices for 2 years"""
    print("\n📊 Syncing 2 YEAR market indices from SSI API...\n")
    
    index_codes = ["VNINDEX", "VN30", "HNX", "UPCOM"]
    total_inserted = 0
    
    for index_code in index_codes:
        print(f"  Fetching {index_code} (2 years)...")
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=730)
            
            url = f"https://iboard.ssi.com.vn/dchart/api/history"
            params = {
                'resolution': 'D',
                'symbol': index_code if index_code != 'HNX' else 'HNXINDEX',
                'from': int(start_date.timestamp()),
                'to': int(end_date.timestamp())
            }
            
            headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.ok:
                data = response.json()
                
                if data.get('s') == 'ok' and data.get('t'):
                    indices = []
                    for i in range(len(data['t'])):
                        trading_date = datetime.fromtimestamp(data['t'][i]).strftime('%Y-%m-%d')
                        prev_close = data['c'][i-1] if i > 0 else data['o'][i]
                        change_value = round((data['c'][i] - prev_close) * 100) / 100
                        change_percent = round((data['c'][i] - prev_close) / prev_close * 10000) / 100
                        
                        indices.append({
                            'index_code': index_code,
                            'trading_date': trading_date,
                            'open_value': data['o'][i],
                            'high_value': data['h'][i],
                            'low_value': data['l'][i],
                            'close_value': data['c'][i],
                            'volume': data['v'][i],
                            'change_value': change_value,
                            'change_percent': change_percent
                        })
                    
                    if indices:
                        inserted = insert_to_supabase_batch("market_indices", indices)
                        total_inserted += inserted
                        print(f"    ✅ {index_code}: {inserted} records")
                    else:
                        print(f"    ⚠️ {index_code}: No data")
                else:
                    print(f"    ⚠️ {index_code}: Invalid response")
            else:
                print(f"    ❌ {index_code}: API error {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ {index_code}: {str(e)}")
        
        time.sleep(1)
    
    print(f"\n✅ Total index records: {total_inserted}")
    return total_inserted

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 FinSensei AI - Sync 2 YEARS Data from SSI API")
    print("=" * 60)
    print(f"📅 Syncing 730 days for {len(VN100_SYMBOLS)} symbols")
    print(f"⏱️ Estimated time: 20-25 minutes")
    print(f"🎯 Expected records: ~{len(VN100_SYMBOLS) * 500:,}")
    print("=" * 60)
    
    start_time = time.time()
    
    stock_count = sync_2year_stock_prices()
    index_count = sync_2year_market_indices()
    
    end_time = time.time()
    duration = int(end_time - start_time)
    
    print("\n" + "=" * 60)
    print("📋 FINAL SUMMARY:")
    print(f"  - Stock Prices: {stock_count:,} records")
    print(f"  - Market Indices: {index_count:,} records")
    print(f"  - Total Records: {stock_count + index_count:,}")
    print(f"  - Duration: {duration//60}m {duration%60}s")
    print(f"  - Data Size: ~{(stock_count + index_count)*0.1/1024:.1f}MB")
    print("=" * 60)
    print("✅ 2 YEARS data sync complete!")
    print("🎯 Ready for FinSensei AI long-term analysis!")
    print("\n🚀 Next steps:")
    print("  1. Open FinSensei AI: http://localhost:3001")
    print("  2. Hard refresh (Ctrl+F5)")
    print("  3. Select any stock symbol")
    print("  4. Test timeframes: 1W, 1M, 3M, 6M, 1Y, 2Y")
    print("  5. Analyze long-term trends!")

if __name__ == "__main__":
    main()