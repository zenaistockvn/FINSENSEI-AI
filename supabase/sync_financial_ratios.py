"""
Sync Financial Ratios từ Simplize API
Chạy: python sync_financial_ratios.py
"""

import requests
import time
import os
from datetime import datetime

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# VN100 symbols
VN100_SYMBOLS = [
    'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
    'MBB', 'MSN', 'MWG', 'NVL', 'PDR', 'PLX', 'POW', 'SAB', 'SSI', 'STB',
    'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE',
    'BSR', 'BMP', 'BWE', 'CII', 'CMG', 'DBC', 'DCM', 'DGC', 'DGW', 'DIG',
    'DPM', 'DXG', 'EIB', 'EVF', 'FRT', 'GEX', 'GMD', 'HAG', 'HCM', 'HDC',
    'HDG', 'HNG', 'HSG', 'HT1', 'IMP', 'KBC', 'KDC', 'KDH', 'KOS', 'LPB',
    'MSB', 'NAB', 'NLG', 'NT2', 'OCB', 'PAN', 'PC1', 'PHR', 'PNJ', 'PPC',
    'PVD', 'PVS', 'PVT', 'REE', 'SBT', 'SCS', 'SHB', 'SHS', 'SSB', 'TCH',
    'VCI', 'VGC', 'VHC', 'VIX', 'VND', 'VOS', 'VPI', 'VTP', 'ANV', 'APH',
    'ASM', 'BAF', 'CTR', 'CSV', 'DHC', 'DRC', 'FCN', 'FTS', 'HAH', 'HHV'
]

def fetch_from_simplize(symbol):
    """Fetch từ Simplize API"""
    try:
        url = f"https://api.simplize.vn/api/company/summary/{symbol.lower()}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 200 and data.get('data'):
                return data['data'], 'Simplize'
    except Exception as e:
        pass
    return None, None

def fetch_from_vndirect(symbol):
    """Fetch từ VNDirect API"""
    try:
        url = f"https://finfo-api.vndirect.com.vn/v4/ratios?q=code:{symbol}~reportType:QUARTER&size=1&sort=reportDate"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('data') and len(data['data']) > 0:
                return data['data'][0], 'VNDirect'
    except Exception as e:
        pass
    return None, None

def fetch_financial_data(symbol):
    """Fetch từ nhiều nguồn"""
    current_year = datetime.now().year
    current_quarter = (datetime.now().month - 1) // 3 + 1
    
    # Try Simplize first
    data, source = fetch_from_simplize(symbol)
    if data:
        return {
            'symbol': symbol,
            'year': current_year,
            'quarter': current_quarter,
            'pe_ratio': data.get('pe') or data.get('PE'),
            'pb_ratio': data.get('pb') or data.get('PB'),
            'roe': data.get('roe') or data.get('ROE'),
            'roa': data.get('roa') or data.get('ROA'),
            'eps': data.get('eps') or data.get('EPS'),
            'bvps': data.get('bvps') or data.get('bookValue'),
            'debt_to_equity': data.get('debtOnEquity') or data.get('de') or data.get('DE'),
            'revenue_growth': data.get('revenueGrowth'),
            'profit_growth': data.get('netProfitGrowth') or data.get('profitGrowth'),
            'gross_margin': data.get('grossProfitMargin'),
            'net_margin': data.get('netProfitMargin'),
            'source': source
        }
    
    # Try VNDirect
    data, source = fetch_from_vndirect(symbol)
    if data:
        return {
            'symbol': symbol,
            'year': current_year,
            'quarter': current_quarter,
            'pe_ratio': data.get('priceToEarning'),
            'pb_ratio': data.get('priceToBook'),
            'roe': data.get('roe'),
            'roa': data.get('roa'),
            'eps': data.get('earningPerShare'),
            'debt_to_equity': data.get('debtOnEquity'),
            'revenue_growth': data.get('revenueGrowth'),
            'profit_growth': data.get('postTaxProfitGrowth'),
            'gross_margin': data.get('grossProfitMargin'),
            'net_margin': data.get('netProfitMargin'),
            'source': source
        }
    
    return None

def save_to_supabase(record):
    """Lưu vào Supabase"""
    if not record or not SUPABASE_KEY:
        return False
    
    # Clean data - convert to proper format
    payload = {
        'symbol': record['symbol'],
        'year': record['year'],
        'quarter': record['quarter'],
        'pe_ratio': float(record['pe_ratio']) if record.get('pe_ratio') else None,
        'pb_ratio': float(record['pb_ratio']) if record.get('pb_ratio') else None,
        'roe': float(record['roe']) / 100 if record.get('roe') and record['roe'] > 1 else record.get('roe'),
        'roa': float(record['roa']) / 100 if record.get('roa') and record['roa'] > 1 else record.get('roa'),
        'eps': float(record['eps']) if record.get('eps') else None,
        'bvps': float(record['bvps']) if record.get('bvps') else None,
        'debt_to_equity': float(record['debt_to_equity']) if record.get('debt_to_equity') else None,
        'revenue_growth': float(record['revenue_growth']) / 100 if record.get('revenue_growth') and abs(record['revenue_growth']) > 1 else record.get('revenue_growth'),
        'profit_growth': float(record['profit_growth']) / 100 if record.get('profit_growth') and abs(record['profit_growth']) > 1 else record.get('profit_growth'),
        'gross_margin': float(record['gross_margin']) / 100 if record.get('gross_margin') and record['gross_margin'] > 1 else record.get('gross_margin'),
        'net_margin': float(record['net_margin']) / 100 if record.get('net_margin') and record['net_margin'] > 1 else record.get('net_margin'),
        'updated_at': datetime.now().isoformat()
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/financial_ratios",
            json=payload,
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            }
        )
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"  ❌ Save error: {e}")
        return False

def main():
    print("=" * 50)
    print("📊 SYNC FINANCIAL RATIOS - VN100")
    print("=" * 50)
    
    if not SUPABASE_KEY:
        print("\n⚠️  Chưa có SUPABASE_SERVICE_KEY!")
        print("Chạy: set SUPABASE_SERVICE_KEY=your_key (Windows)")
        print("Hoặc: export SUPABASE_SERVICE_KEY=your_key (Linux/Mac)")
        return
    
    print(f"\n📡 Nguồn: Simplize → VNDirect")
    print(f"📊 Tổng: {len(VN100_SYMBOLS)} mã\n")
    
    success = 0
    errors = 0
    
    for i, symbol in enumerate(VN100_SYMBOLS, 1):
        print(f"[{i}/{len(VN100_SYMBOLS)}] {symbol}...", end=" ")
        
        data = fetch_financial_data(symbol)
        
        if data:
            if save_to_supabase(data):
                success += 1
                pe = f"{data['pe_ratio']:.1f}" if data.get('pe_ratio') else "-"
                pb = f"{data['pb_ratio']:.1f}" if data.get('pb_ratio') else "-"
                roe = f"{data['roe']:.1f}%" if data.get('roe') else "-"
                print(f"✅ P/E={pe}, P/B={pb}, ROE={roe} [{data['source']}]")
            else:
                errors += 1
                print("❌ Lỗi lưu DB")
        else:
            errors += 1
            print("⚠️ Không có dữ liệu")
        
        time.sleep(0.3)  # Rate limit
    
    print("\n" + "=" * 50)
    print(f"🎉 Hoàn thành! ✅ {success} | ❌ {errors}")
    print("=" * 50)

if __name__ == "__main__":
    main()
