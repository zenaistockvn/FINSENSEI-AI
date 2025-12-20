#!/usr/bin/env python3
"""
FinSensei AI - Sync dữ liệu từ vnstock API (nguồn VCI - Vietcap Securities)
Script tối ưu với đầy đủ tính năng

Cài đặt: pip install vnstock3 requests pandas
Chạy: python supabase/sync_vci_optimized.py
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# ============================================
# SUPABASE CONFIGURATION
# ============================================
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

SUPABASE_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# ============================================
# VN100 SYMBOLS - Cập nhật mới nhất
# ============================================
VN100_SYMBOLS = [
    # VN30 - Top 30 blue chips
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB",
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE",
    
    # VN70 - Next 70 stocks
    "ANV", "ASM", "BAF", "BMP", "BSI", "BWE", "CII", "CMG", "CNG", "CTD",
    "DCM", "DGC", "DGW", "DIG", "DPM", "DRC", "DXG", "DXS", "EIB", "EVF",
    "FRT", "GEX", "GMD", "HAG", "HCM", "HDC", "HDG", "HHV", "HSG", "HT1",
    "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MSB", "NAB", "NKG", "NLG",
    "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PET", "PHR", "PNJ", "PPC",
    "PTB", "PVD", "PVS", "PVT", "REE", "SBT", "SCS", "SHI", "SIP", "SJS",
    "SKG", "SZC", "TCH", "TLG", "TNH", "VCG", "VCI", "VGC", "VHC", "VND",
]

# Market indices
MARKET_INDICES = ['VNINDEX', 'VN30', 'HNX', 'UPCOM']

# ============================================
# STATISTICS
# ============================================
stats = {
    "prices_inserted": 0,
    "companies_inserted": 0,
    "ratios_inserted": 0,
    "indices_inserted": 0,
    "success_count": 0,
    "error_count": 0,
    "start_time": None
}

# ============================================
# VNSTOCK INITIALIZATION
# ============================================
def init_vnstock():
    """Initialize vnstock library"""
    try:
        from vnstock3 import Vnstock
        return Vnstock
    except ImportError:
        print("📦 Đang cài đặt vnstock3...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "vnstock3", "-q"])
        from vnstock3 import Vnstock
        return Vnstock

Vnstock = init_vnstock()

# ============================================
# SUPABASE FUNCTIONS
# ============================================
def insert_to_supabase(table: str, data: List[Dict], batch_size: int = 200) -> int:
    """Insert data to Supabase with batch processing"""
    if not data:
        return 0
    
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
                if "duplicate" not in error_text.lower():
                    print(f"    ⚠️ Supabase: {error_text}")
                else:
                    inserted += len(batch)  # Duplicates are OK
                    
        except requests.exceptions.Timeout:
            print(f"    ⚠️ Timeout, retrying...")
            time.sleep(2)
            try:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/{table}",
                    headers=SUPABASE_HEADERS,
                    json=batch,
                    timeout=90
                )
                if response.ok:
                    inserted += len(batch)
            except:
                pass
                
        except Exception as e:
            print(f"    ❌ Insert error: {str(e)[:100]}")
        
        time.sleep(0.1)
    
    return inserted

def clear_table(table: str) -> bool:
    """Clear all data from a table"""
    try:
        response = requests.delete(
            f"{SUPABASE_URL}/rest/v1/{table}?id=neq.00000000-0000-0000-0000-000000000000",
            headers={**SUPABASE_HEADERS, "Prefer": "return=minimal"},
            timeout=30
        )
        return response.ok
    except:
        return False

# ============================================
# SYNC FUNCTIONS
# ============================================
def sync_stock_prices(symbol: str, days: int = 730) -> int:
    """Sync stock prices using vnstock VCI source"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        df = stock.quote.history(start=start_date, end=end_date, interval='1D')
        
        if df is None or df.empty:
            return 0
        
        prices = []
        for _, row in df.iterrows():
            try:
                # Handle different date formats
                if hasattr(row['time'], 'strftime'):
                    trading_date = row['time'].strftime('%Y-%m-%d')
                else:
                    trading_date = str(row['time'])[:10]
                
                prices.append({
                    'symbol': symbol,
                    'trading_date': trading_date,
                    'open_price': float(row['open']) if row['open'] else None,
                    'high_price': float(row['high']) if row['high'] else None,
                    'low_price': float(row['low']) if row['low'] else None,
                    'close_price': float(row['close']) if row['close'] else None,
                    'volume': int(row['volume']) if row['volume'] else 0
                })
            except Exception:
                continue
        
        if prices:
            return insert_to_supabase("stock_prices", prices)
        
        return 0
        
    except Exception as e:
        if "not found" not in str(e).lower():
            print(f"    ⚠️ Price error: {str(e)[:50]}")
        return 0

def sync_company_info(symbol: str) -> bool:
    """Sync company information using vnstock VCI source"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        overview = stock.company.overview()
        
        if overview is None or overview.empty:
            return False
        
        row = overview.iloc[0]
        
        company_data = {
            'symbol': symbol,
            'company_name': str(row.get('short_name', symbol))[:255],
            'company_name_en': str(row.get('short_name', symbol))[:255],
            'exchange': str(row.get('exchange', 'HOSE'))[:10],
            'industry': str(row.get('industry_name', 'N/A'))[:100],
            'sector': str(row.get('industry_name_en', 'N/A'))[:100],
            'outstanding_shares': int(row.get('outstanding_share', 0)) if row.get('outstanding_share') else None,
            'website': str(row.get('website', ''))[:255] if row.get('website') else None,
            'is_vn100': symbol in VN100_SYMBOLS,
            'is_active': True
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/companies",
            headers=SUPABASE_HEADERS,
            json=[company_data],
            timeout=30
        )
        
        return response.ok or "duplicate" in response.text.lower()
        
    except Exception as e:
        return False

def sync_financial_ratios(symbol: str) -> int:
    """Sync financial ratios using vnstock VCI source"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        ratios = stock.finance.ratio(period='quarter', lang='en')
        
        if ratios is None or ratios.empty:
            return 0
        
        financial_data = []
        for _, row in ratios.head(8).iterrows():  # Last 8 quarters
            try:
                year = int(row.get('year', datetime.now().year))
                quarter = int(row.get('quarter', 1))
                
                # Convert percentages (VCI returns as percentage, not decimal)
                def safe_percent(val):
                    if val is None or val == '' or str(val) == 'nan':
                        return None
                    try:
                        v = float(val)
                        return v / 100 if abs(v) > 1 else v
                    except:
                        return None
                
                def safe_float(val):
                    if val is None or val == '' or str(val) == 'nan':
                        return None
                    try:
                        return float(val)
                    except:
                        return None
                
                financial_data.append({
                    'symbol': symbol,
                    'year': year,
                    'quarter': quarter,
                    'pe_ratio': safe_float(row.get('price_to_earning')),
                    'pb_ratio': safe_float(row.get('price_to_book')),
                    'roe': safe_percent(row.get('roe')),
                    'roa': safe_percent(row.get('roa')),
                    'eps': safe_float(row.get('earning_per_share')),
                    'gross_margin': safe_percent(row.get('gross_profit_margin')),
                    'net_margin': safe_percent(row.get('net_profit_margin')),
                    'debt_to_equity': safe_float(row.get('debt_on_equity'))
                })
            except Exception:
                continue
        
        if financial_data:
            return insert_to_supabase("financial_ratios", financial_data)
        
        return 0
        
    except Exception as e:
        return 0

def sync_market_indices(days: int = 730) -> int:
    """Sync market indices using vnstock VCI source"""
    print("\n📊 Syncing market indices...")
    
    total_inserted = 0
    
    for index_code in MARKET_INDICES:
        try:
            print(f"  {index_code}...", end=" ")
            
            stock = Vnstock().stock(symbol=index_code, source='VCI')
            
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            df = stock.quote.history(start=start_date, end=end_date, interval='1D')
            
            if df is None or df.empty:
                print("⚠️ No data")
                continue
            
            index_data = []
            prev_close = None
            
            for _, row in df.iterrows():
                try:
                    if hasattr(row['time'], 'strftime'):
                        trading_date = row['time'].strftime('%Y-%m-%d')
                    else:
                        trading_date = str(row['time'])[:10]
                    
                    close_value = float(row['close'])
                    
                    change_value = 0
                    change_percent = 0
                    if prev_close and prev_close > 0:
                        change_value = round(close_value - prev_close, 2)
                        change_percent = round((close_value - prev_close) / prev_close * 100, 2)
                    
                    index_data.append({
                        'index_code': index_code,
                        'trading_date': trading_date,
                        'open_value': float(row['open']) if row['open'] else None,
                        'high_value': float(row['high']) if row['high'] else None,
                        'low_value': float(row['low']) if row['low'] else None,
                        'close_value': close_value,
                        'volume': int(row['volume']) if row['volume'] else 0,
                        'change_value': change_value,
                        'change_percent': change_percent
                    })
                    
                    prev_close = close_value
                    
                except Exception:
                    continue
            
            if index_data:
                inserted = insert_to_supabase("market_indices", index_data)
                total_inserted += inserted
                print(f"✅ {inserted} records")
            else:
                print("⚠️ No valid data")
            
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ {str(e)[:50]}")
    
    return total_inserted

def sync_dividends(symbol: str) -> int:
    """Sync dividend history"""
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        dividends = stock.company.dividends()
        
        if dividends is None or dividends.empty:
            return 0
        
        dividend_data = []
        for _, row in dividends.iterrows():
            try:
                dividend_data.append({
                    'symbol': symbol,
                    'ex_date': str(row.get('ex_date', ''))[:10] if row.get('ex_date') else None,
                    'record_date': str(row.get('record_date', ''))[:10] if row.get('record_date') else None,
                    'payment_date': str(row.get('payment_date', ''))[:10] if row.get('payment_date') else None,
                    'dividend_type': str(row.get('dividend_type', 'cash'))[:20],
                    'cash_dividend': float(row.get('cash_dividend', 0)) if row.get('cash_dividend') else None,
                    'stock_dividend_ratio': str(row.get('stock_dividend_ratio', ''))[:20] if row.get('stock_dividend_ratio') else None,
                    'year': int(row.get('year', datetime.now().year)) if row.get('year') else None
                })
            except:
                continue
        
        if dividend_data:
            return insert_to_supabase("dividends", dividend_data)
        
        return 0
        
    except:
        return 0

# ============================================
# MAIN SYNC FUNCTION
# ============================================
def main():
    """Main sync function"""
    global stats
    
    print("=" * 60)
    print("🚀 FinSensei AI - Sync từ vnstock VCI (Vietcap Securities)")
    print("=" * 60)
    print(f"📊 Số mã cổ phiếu: {len(VN100_SYMBOLS)}")
    print(f"📈 Chỉ số thị trường: {', '.join(MARKET_INDICES)}")
    print(f"📅 Khoảng thời gian: 730 ngày (2 năm)")
    print(f"⏱️ Thời gian ước tính: 30-45 phút")
    print("=" * 60)
    
    stats["start_time"] = time.time()
    
    # Sync stock data
    print("\n📈 SYNCING STOCK DATA...")
    print("-" * 40)
    
    for i, symbol in enumerate(VN100_SYMBOLS):
        progress = f"[{i+1}/{len(VN100_SYMBOLS)}]"
        print(f"{progress} {symbol}...", end=" ")
        
        # Sync prices
        price_count = sync_stock_prices(symbol, 730)
        
        if price_count > 0:
            stats["prices_inserted"] += price_count
            stats["success_count"] += 1
            
            # Sync company info
            if sync_company_info(symbol):
                stats["companies_inserted"] += 1
            
            # Sync financial ratios
            ratio_count = sync_financial_ratios(symbol)
            stats["ratios_inserted"] += ratio_count
            
            # Sync dividends
            sync_dividends(symbol)
            
            print(f"✅ {price_count} prices, {ratio_count} ratios")
        else:
            stats["error_count"] += 1
            print("⚠️ No data")
        
        # Progress update every 20 symbols
        if (i + 1) % 20 == 0:
            elapsed = time.time() - stats["start_time"]
            avg_time = elapsed / (i + 1)
            remaining = (len(VN100_SYMBOLS) - i - 1) * avg_time
            
            print(f"\n📊 Progress: {i+1}/{len(VN100_SYMBOLS)} ({round((i+1)/len(VN100_SYMBOLS)*100)}%)")
            print(f"⏱️ Remaining: ~{int(remaining/60)} minutes")
            print(f"📈 Total prices: {stats['prices_inserted']:,}")
            print("-" * 40)
        
        # Rate limiting
        time.sleep(1.5)
    
    # Sync market indices
    stats["indices_inserted"] = sync_market_indices(730)
    
    # Log sync completion
    log_sync_completion()
    
    # Final summary
    print_summary()

def log_sync_completion():
    """Log sync completion to database"""
    try:
        log_data = {
            'sync_type': 'vnstock_vci_full',
            'status': 'completed',
            'records_count': stats["prices_inserted"] + stats["indices_inserted"],
            'started_at': datetime.fromtimestamp(stats["start_time"]).isoformat(),
            'completed_at': datetime.now().isoformat()
        }
        
        requests.post(
            f"{SUPABASE_URL}/rest/v1/data_sync_logs",
            headers=SUPABASE_HEADERS,
            json=[log_data],
            timeout=10
        )
    except:
        pass

def print_summary():
    """Print final summary"""
    end_time = time.time()
    duration = int(end_time - stats["start_time"])
    
    total_records = (
        stats["prices_inserted"] + 
        stats["ratios_inserted"] + 
        stats["indices_inserted"]
    )
    
    print("\n" + "=" * 60)
    print("📋 SYNC SUMMARY:")
    print("-" * 40)
    print(f"  📊 Stock Symbols: {len(VN100_SYMBOLS)}")
    print(f"  ✅ Successful: {stats['success_count']}")
    print(f"  ❌ Failed: {stats['error_count']}")
    print("-" * 40)
    print(f"  📈 Price Records: {stats['prices_inserted']:,}")
    print(f"  🏢 Companies: {stats['companies_inserted']}")
    print(f"  💰 Financial Ratios: {stats['ratios_inserted']:,}")
    print(f"  📊 Index Records: {stats['indices_inserted']:,}")
    print("-" * 40)
    print(f"  📦 Total Records: {total_records:,}")
    print(f"  ⏱️ Duration: {duration//60}m {duration%60}s")
    print("=" * 60)
    print("✅ vnstock VCI sync complete!")
    print("🎯 FinSensei AI is ready with real data!")
    print("=" * 60)

if __name__ == "__main__":
    main()
