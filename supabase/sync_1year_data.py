#!/usr/bin/env python3
"""
Script đồng bộ dữ liệu giá cổ phiếu 1 năm gần nhất từ SSI API
Dành cho FinSensei AI - Phân tích cổ phiếu
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Supabase configuration
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

SUPABASE_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# VN100 symbols để sync
VN100_SYMBOLS = [
    # VN30
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
    
    # Top VN70 (chọn lọc)
    "AAA", "ACV", "ANV", "APH", "ASM", "BFC", "BMP", "BSI", "BTP", "BWE",
    "CII", "CMG", "CNG", "CRC", "CTD", "CTI", "DCM", "DGC", "DGW", "DHC",
    "DIG", "DPM", "DRC", "DXG", "EIB", "EVF", "FCN", "FRT", "FTS", "GEG",
    "GMD", "GSP", "GTN", "HAG", "HCM", "HDC", "HDG", "HNG", "HQC", "HSG",
    "HTV", "HVN", "IMP", "ITA", "ITD", "JVC", "KBC", "KDC", "KDH", "KHG",
    "LBM", "LCG", "LDG", "LGC", "LHG", "LIX", "LPB", "MCP", "MDG", "MIG",
    "MSB", "MSH", "NAF", "NAV", "NBC", "NCT", "NHA", "NKG", "NLG", "NNC",
    "NSC", "NT2", "NTL", "NVL", "NVT", "OCB", "OGC", "PAN", "PC1", "PDN",
    "PDR", "PET", "PGC", "PGD", "PHC", "PHR", "PIT", "PLP", "PME", "PNJ",
    "POM", "PPC", "PVD", "PVS", "PVT", "QCG", "RAL", "ROS", "S4A", "SAM",
    "SBT", "SC5", "SCS", "SFI", "SHI", "SII", "SJF", "SKG", "SMA", "SMB",
    "SMC", "SPM", "SRC", "SRF", "SSC", "ST8", "SVC", "SVD", "SZC", "SZL",
    "TCH", "TCM", "TCO", "TCR", "TDC", "TDG", "TDH", "TDM", "TDW", "TEG",
    "TGG", "THG", "TIP", "TIX", "TLD", "TLG", "TLH", "TMT", "TNA", "TNG",
    "TNH", "TNI", "TOP", "TPC", "TRA", "TRC", "TS4", "TSC", "TTA", "TTF",
    "TTP", "TYA", "UIC", "VAF", "VCA", "VCF", "VCI", "VDS", "VGC", "VHC",
    "VHL", "VID", "VIP", "VIS", "VIX", "VND", "VOS", "VPD", "VPG", "VPI",
    "VPS", "VSC", "VSH", "VSI", "VTB", "VTO", "YEG", "YTC"
]

def fetch_from_ssi(symbol: str, days: int = 365) -> Optional[List[Dict]]:
    """Fetch stock data from SSI API"""
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

def insert_to_supabase(table: str, data: List[Dict]) -> int:
    """Insert data to Supabase with batch processing"""
    if not data:
        return 0
    
    batch_size = 100
    inserted = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=SUPABASE_HEADERS,
                json=batch,
                timeout=30
            )
            
            if response.ok:
                inserted += len(batch)
            else:
                error_text = response.text[:100]
                print(f"  ❌ Supabase error: {error_text}")
                
        except Exception as e:
            print(f"  ❌ Insert error: {str(e)}")
        
        # Small delay between batches
        time.sleep(0.1)
    
    return inserted

def clear_table(table: str) -> bool:
    """Clear old data from table"""
    try:
        response = requests.delete(
            f"{SUPABASE_URL}/rest/v1/{table}?id=neq.00000000-0000-0000-0000-000000000000",
            headers={**SUPABASE_HEADERS, "Prefer": "return=minimal"},
            timeout=30
        )
        
        if response.ok:
            print(f"  🗑️ Cleared {table}")
            return True
            
    except Exception as e:
        print(f"  ⚠️ Could not clear {table}: {str(e)}")
    
    return False

def sync_1year_stock_prices():
    """Main sync function for 1 year data"""
    print("\n📈 Syncing 1 YEAR stock prices from SSI API...\n")
    
    # Uncomment to clear old data first
    # clear_table("stock_prices")
    
    total_inserted = 0
    success_count = 0
    error_count = 0
    
    for i, symbol in enumerate(VN100_SYMBOLS):
        print(f"  [{i+1}/{len(VN100_SYMBOLS)}] Fetching {symbol} (1 year)...")
        
        prices = fetch_from_ssi(symbol, 365)  # 1 year = 365 days
        
        if prices and len(prices) > 0:
            inserted = insert_to_supabase("stock_prices", prices)
            total_inserted += inserted
            success_count += 1
            print(f"    ✅ {inserted} records ({len(prices)} days)")
        else:
            error_count += 1
            print(f"    ⚠️ No data")
        
        # Rate limiting - important for SSI API
        time.sleep(0.5)
    
    print(f"\n📊 SYNC SUMMARY:")
    print(f"  - Total symbols: {len(VN100_SYMBOLS)}")
    print(f"  - Successful: {success_count}")
    print(f"  - Failed: {error_count}")
    print(f"  - Total records: {total_inserted}")
    
    return total_inserted

def fetch_index_from_ssi(index_code: str, days: int = 365) -> Optional[List[Dict]]:
    """Fetch market indices from SSI"""
    index_map = {
        'VNINDEX': 'VNINDEX',
        'VN30': 'VN30',
        'HNX': 'HNXINDEX',
        'UPCOM': 'UPINDEX'
    }
    
    ssi_code = index_map.get(index_code, index_code)
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f"https://iboard.ssi.com.vn/dchart/api/history"
        params = {
            'resolution': 'D',
            'symbol': ssi_code,
            'from': int(start_date.timestamp()),
            'to': int(end_date.timestamp())
        }
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        if not response.ok:
            raise Exception(f"SSI Index API error: {response.status_code}")
        
        data = response.json()
        
        if data.get('s') != 'ok' or not data.get('t'):
            return None
        
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
        
        return indices
        
    except Exception as e:
        print(f"  ⚠️ SSI Index error for {index_code}: {str(e)}")
        return None

def sync_1year_market_indices():
    """Sync market indices for 1 year"""
    print("\n📊 Syncing 1 YEAR market indices from SSI API...\n")
    
    index_codes = ["VNINDEX", "VN30", "HNX", "UPCOM"]
    total_inserted = 0
    
    for index_code in index_codes:
        print(f"  Fetching {index_code} (1 year)...")
        
        indices = fetch_index_from_ssi(index_code, 365)
        
        if indices and len(indices) > 0:
            inserted = insert_to_supabase("market_indices", indices)
            total_inserted += inserted
            print(f"    ✅ {inserted} records")
        else:
            print(f"    ⚠️ No data")
        
        time.sleep(0.5)
    
    print(f"\n✅ Total index records: {total_inserted}")
    return total_inserted

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 FinSensei AI - Sync 1 YEAR Data from SSI API")
    print("=" * 60)
    print(f"📅 Syncing data for {len(VN100_SYMBOLS)} symbols")
    print(f"⏱️ Estimated time: {len(VN100_SYMBOLS) * 0.5 / 60:.0f} minutes")
    print("=" * 60)
    
    start_time = time.time()
    
    stock_count = sync_1year_stock_prices()
    index_count = sync_1year_market_indices()
    
    end_time = time.time()
    duration = int(end_time - start_time)
    
    print("\n" + "=" * 60)
    print("📋 FINAL SUMMARY:")
    print(f"  - Stock Prices: {stock_count} records")
    print(f"  - Market Indices: {index_count} records")
    print(f"  - Duration: {duration//60}m {duration%60}s")
    print("=" * 60)
    print("✅ 1 YEAR data sync complete!")
    print("🎯 Ready for FinSensei AI analysis!")

if __name__ == "__main__":
    main()