#!/usr/bin/env python3
"""
Sync dữ liệu từ vnstock API lên Supabase
FinSensei AI - Commercial Version
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import sys

# Cài đặt vnstock nếu chưa có
try:
    from vnstock3 import Vnstock
except ImportError:
    print("📦 Đang cài đặt vnstock3...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "vnstock3"])
    from vnstock3 import Vnstock

# Supabase configuration
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

SUPABASE_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# VN100 symbols
VN100_SYMBOLS = [
    # VN30
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
    
    # VN70
    "AAA", "ACV", "ANV", "APH", "ASM", "BFC", "BMP", "BSI", "BTP", "BWE",
    "CII", "CMG", "CNG", "CRC", "CTD", "CTI", "DCM", "DGC", "DGW", "DHC",
    "DIG", "DPM", "DRC", "DXG", "EIB", "EVF", "FCN", "FRT", "FTS", "GEG",
    "GMD", "GSP", "GTN", "HAG", "HCM", "HDC", "HDG", "HNG", "HQC", "HSG",
    "HTV", "HVN", "IMP", "ITA", "ITD", "JVC", "KBC", "KDC", "KDH", "KHG",
    "LBM", "LCG", "LDG", "LGC", "LHG", "LIX", "LPB", "MCP", "MDG", "MIG",
    "MSB", "MSH", "NAF", "NAV", "NBC", "NCT", "NHA", "NKG", "NLG", "NNC",
    "NSC", "NT2", "NTL", "NVL", "NVT", "OCB", "OGC", "PAN", "PC1", "PDN",
    "PDR", "PET", "PGC", "PGD", "PHR", "PIT", "PLP", "PME", "PNJ", "POM",
    "PPC", "PVD", "PVS", "PVT", "QCG", "RAL", "REE", "SBT", "SCS", "SHI",
    "SKG", "SMA", "SMC", "SSC", "SVC", "SZC", "TCH", "TCM", "TDC", "TDM",
    "THG", "TIP", "TLG", "TLH", "TNG", "TNH", "TRA", "TSC", "TTF", "TYA",
    "VCA", "VCF", "VCI", "VDS", "VGC", "VHC", "VIX", "VND", "VOS", "VPG",
    "VPI", "VPS", "VSC", "VSH", "VTO"
]

# Statistics
stats = {
    "total_inserted": 0,
    "success_count": 0,
    "error_count": 0,
    "start_time": None
}

def insert_to_supabase(table: str, data: List[Dict]) -> int:
    """Insert data to Supabase with batch processing"""
    if not data:
        return 0
    
    batch_size = 200
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
                print(f"  ⚠️ Supabase error: {error_text}")
                
        except Exception as e:
            print(f"  ❌ Insert error: {str(e)}")
        
        time.sleep(0.1)
    
    return inserted

def sync_stock_prices_vnstock(symbol: str, days: int = 730) -> int:
    """Sync stock prices using vnstock API"""
    try:
        # Initialize vnstock
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        # Calculate date range
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        # Get historical data
        df = stock.quote.history(start=start_date, end=end_date, interval='1D')
        
        if df is None or df.empty:
            return 0
        
        # Transform to Supabase format
        prices = []
        for _, row in df.iterrows():
            try:
                trading_date = row['time'].strftime('%Y-%m-%d') if hasattr(row['time'], 'strftime') else str(row['time'])[:10]
                
                prices.append({
                    'symbol': symbol,
                    'trading_date': trading_date,
                    'open_price': float(row['open']),
                    'high_price': float(row['high']),
                    'low_price': float(row['low']),
                    'close_price': float(row['close']),
                    'volume': int(row['volume'])
                })
            except Exception as e:
                continue
        
        if prices:
            inserted = insert_to_supabase("stock_prices", prices)
            return inserted
        
        return 0
        
    except Exception as e:
        print(f"  ⚠️ vnstock error for {symbol}: {str(e)}")
        return 0

def sync_company_info_vnstock(symbol: str) -> bool:
    """Sync company information using vnstock API"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        # Get company overview
        overview = stock.company.overview()
        
        if overview is None or overview.empty:
            return False
        
        row = overview.iloc[0]
        
        company_data = {
            'symbol': symbol,
            'company_name': str(row.get('short_name', symbol)),
            'company_name_en': str(row.get('short_name', symbol)),
            'exchange': str(row.get('exchange', 'HOSE')),
            'industry': str(row.get('industry_name', 'N/A')),
            'sector': str(row.get('industry_name_en', 'N/A')),
            'is_vn100': symbol in VN100_SYMBOLS[:100],
            'is_active': True
        }
        
        # Insert to Supabase
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/companies",
            headers=SUPABASE_HEADERS,
            json=[company_data],
            timeout=30
        )
        
        return response.ok
        
    except Exception as e:
        print(f"  ⚠️ Company info error for {symbol}: {str(e)}")
        return False

def sync_financial_ratios_vnstock(symbol: str) -> int:
    """Sync financial ratios using vnstock API"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        # Get financial ratios
        ratios = stock.finance.ratio(period='quarter', lang='en')
        
        if ratios is None or ratios.empty:
            return 0
        
        financial_data = []
        for _, row in ratios.head(8).iterrows():  # Last 8 quarters
            try:
                year = int(row.get('year', datetime.now().year))
                quarter = int(row.get('quarter', 1))
                
                financial_data.append({
                    'symbol': symbol,
                    'year': year,
                    'quarter': quarter,
                    'pe_ratio': float(row.get('price_to_earning', 0)) if row.get('price_to_earning') else None,
                    'pb_ratio': float(row.get('price_to_book', 0)) if row.get('price_to_book') else None,
                    'roe': float(row.get('roe', 0)) / 100 if row.get('roe') else None,
                    'roa': float(row.get('roa', 0)) / 100 if row.get('roa') else None,
                    'eps': float(row.get('earning_per_share', 0)) if row.get('earning_per_share') else None,
                    'gross_margin': float(row.get('gross_profit_margin', 0)) / 100 if row.get('gross_profit_margin') else None,
                    'net_margin': float(row.get('net_profit_margin', 0)) / 100 if row.get('net_profit_margin') else None,
                    'debt_to_equity': float(row.get('debt_on_equity', 0)) if row.get('debt_on_equity') else None
                })
            except Exception as e:
                continue
        
        if financial_data:
            inserted = insert_to_supabase("financial_ratios", financial_data)
            return inserted
        
        return 0
        
    except Exception as e:
        print(f"  ⚠️ Financial ratios error for {symbol}: {str(e)}")
        return 0

def sync_market_indices_vnstock(days: int = 730) -> int:
    """Sync market indices using vnstock API"""
    print("\n📊 Syncing market indices from vnstock...")
    
    indices = {
        'VNINDEX': 'VNINDEX',
        'VN30': 'VN30',
        'HNX': 'HNX',
        'UPCOM': 'UPCOM'
    }
    
    total_inserted = 0
    
    for index_code, vnstock_code in indices.items():
        try:
            print(f"  Fetching {index_code}...")
            
            stock = Vnstock().stock(symbol=vnstock_code, source='VCI')
            
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            df = stock.quote.history(start=start_date, end=end_date, interval='1D')
            
            if df is None or df.empty:
                print(f"    ⚠️ No data for {index_code}")
                continue
            
            index_data = []
            prev_close = None
            
            for _, row in df.iterrows():
                try:
                    trading_date = row['time'].strftime('%Y-%m-%d') if hasattr(row['time'], 'strftime') else str(row['time'])[:10]
                    close_value = float(row['close'])
                    
                    change_value = 0
                    change_percent = 0
                    if prev_close:
                        change_value = round(close_value - prev_close, 2)
                        change_percent = round((close_value - prev_close) / prev_close * 100, 2)
                    
                    index_data.append({
                        'index_code': index_code,
                        'trading_date': trading_date,
                        'open_value': float(row['open']),
                        'high_value': float(row['high']),
                        'low_value': float(row['low']),
                        'close_value': close_value,
                        'volume': int(row['volume']),
                        'change_value': change_value,
                        'change_percent': change_percent
                    })
                    
                    prev_close = close_value
                    
                except Exception as e:
                    continue
            
            if index_data:
                inserted = insert_to_supabase("market_indices", index_data)
                total_inserted += inserted
                print(f"    ✅ {index_code}: {inserted} records")
            
            time.sleep(1)
            
        except Exception as e:
            print(f"    ❌ {index_code}: {str(e)}")
    
    return total_inserted

def main():
    """Main sync function"""
    global stats
    
    print("=" * 60)
    print("🚀 FinSensei AI - Sync từ vnstock API")
    print("=" * 60)
    print(f"📊 Số mã cổ phiếu: {len(VN100_SYMBOLS)}")
    print(f"📅 Khoảng thời gian: 730 ngày (2 năm)")
    print(f"⏱️ Thời gian ước tính: 30-45 phút")
    print("=" * 60)
    
    stats["start_time"] = time.time()
    
    # Sync stock prices
    print("\n📈 SYNCING STOCK PRICES...")
    print("-" * 40)
    
    for i, symbol in enumerate(VN100_SYMBOLS):
        print(f"[{i+1}/{len(VN100_SYMBOLS)}] Processing {symbol}...")
        
        # Sync prices
        inserted = sync_stock_prices_vnstock(symbol, 730)
        
        if inserted > 0:
            stats["total_inserted"] += inserted
            stats["success_count"] += 1
            print(f"  ✅ {symbol}: {inserted} price records")
            
            # Sync company info
            if sync_company_info_vnstock(symbol):
                print(f"  ✅ {symbol}: Company info synced")
            
            # Sync financial ratios
            ratio_count = sync_financial_ratios_vnstock(symbol)
            if ratio_count > 0:
                print(f"  ✅ {symbol}: {ratio_count} financial records")
        else:
            stats["error_count"] += 1
            print(f"  ⚠️ {symbol}: No data")
        
        # Progress update
        if (i + 1) % 20 == 0:
            elapsed = time.time() - stats["start_time"]
            avg_time = elapsed / (i + 1)
            remaining = (len(VN100_SYMBOLS) - i - 1) * avg_time
            
            print(f"\n📊 Progress: {i+1}/{len(VN100_SYMBOLS)} ({round((i+1)/len(VN100_SYMBOLS)*100)}%)")
            print(f"⏱️ Remaining: ~{int(remaining/60)} minutes")
            print(f"📈 Records: {stats['total_inserted']:,}")
            print("-" * 40)
        
        # Rate limiting
        time.sleep(1.5)
    
    # Sync market indices
    index_count = sync_market_indices_vnstock(730)
    
    # Final summary
    end_time = time.time()
    duration = int(end_time - stats["start_time"])
    
    print("\n" + "=" * 60)
    print("📋 SYNC SUMMARY:")
    print(f"  - Total symbols: {len(VN100_SYMBOLS)}")
    print(f"  - Successful: {stats['success_count']}")
    print(f"  - Failed: {stats['error_count']}")
    print(f"  - Stock records: {stats['total_inserted']:,}")
    print(f"  - Index records: {index_count:,}")
    print(f"  - Total records: {stats['total_inserted'] + index_count:,}")
    print(f"  - Duration: {duration//60}m {duration%60}s")
    print("=" * 60)
    print("✅ vnstock sync complete!")
    print("🎯 Ready for FinSensei AI!")

if __name__ == "__main__":
    main()