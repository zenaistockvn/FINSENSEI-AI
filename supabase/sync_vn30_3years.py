"""
Sync VN30 Stock Prices - 3 Years
Sử dụng VCI API (Vietcap Securities)
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Supabase config
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal"
}

# VN30 symbols
VN30_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
    "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB"
]

def fetch_vci_stock(symbol, days=1095):
    """Fetch stock price from VCI GraphQL API"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = "https://api.vietcap.com.vn/data-mt/graphql"
        
        query = {
            "query": """
                query stockPrice($symbol: String!, $from: String!, $to: String!) {
                    stockPrice(symbol: $symbol, from: $from, to: $to) {
                        tradingDate
                        open
                        high
                        low
                        close
                        volume
                        value
                    }
                }
            """,
            "variables": {
                "symbol": symbol,
                "from": start_date.strftime("%Y-%m-%d"),
                "to": end_date.strftime("%Y-%m-%d")
            }
        }
        
        response = requests.post(url, json=query, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        prices = data.get("data", {}).get("stockPrice", [])
        
        if not prices:
            return None
        
        return [{
            "symbol": symbol,
            "trading_date": p["tradingDate"],
            "open_price": p["open"] * 1000,
            "high_price": p["high"] * 1000,
            "low_price": p["low"] * 1000,
            "close_price": p["close"] * 1000,
            "volume": p["volume"] or 0,
            "value": p.get("value") or 0
        } for p in prices]
        
    except Exception as e:
        print(f"  ❌ VCI Error: {e}")
        return None

def fetch_cafef_stock(symbol, days=1095):
    """Fallback: Fetch from Cafef API"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f"https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx"
        params = {
            "Symbol": symbol,
            "StartDate": start_date.strftime("%d/%m/%Y"),
            "EndDate": end_date.strftime("%d/%m/%Y"),
            "PageIndex": 1,
            "PageSize": 2000
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        prices = data.get("Data", {}).get("Data", [])
        
        if not prices:
            return None
        
        result = []
        for p in prices:
            try:
                dd, mm, yyyy = p["Ngay"].split("/")
                result.append({
                    "symbol": symbol,
                    "trading_date": f"{yyyy}-{mm}-{dd}",
                    "open_price": p["GiaMoCua"] * 1000,
                    "high_price": p["GiaCaoNhat"] * 1000,
                    "low_price": p["GiaThapNhat"] * 1000,
                    "close_price": p["GiaDongCua"] * 1000,
                    "volume": p.get("KhoiLuongKhopLenh") or 0
                })
            except:
                continue
        
        return result if result else None
        
    except Exception as e:
        print(f"  ❌ Cafef Error: {e}")
        return None

def fetch_vci_index(index_code, days=1095):
    """Fetch index from VCI GraphQL API"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = "https://api.vietcap.com.vn/data-mt/graphql"
        
        query = {
            "query": """
                query indexPrice($index: String!, $from: String!, $to: String!) {
                    indexPrice(index: $index, from: $from, to: $to) {
                        tradingDate
                        open
                        high
                        low
                        close
                        volume
                        value
                    }
                }
            """,
            "variables": {
                "index": index_code,
                "from": start_date.strftime("%Y-%m-%d"),
                "to": end_date.strftime("%Y-%m-%d")
            }
        }
        
        response = requests.post(url, json=query, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        prices = data.get("data", {}).get("indexPrice", [])
        
        if not prices:
            return None
        
        result = []
        for i, p in enumerate(prices):
            prev_close = prices[i + 1]["close"] if i < len(prices) - 1 else p["open"]
            change = p["close"] - prev_close
            change_pct = (change / prev_close * 100) if prev_close else 0
            
            result.append({
                "index_code": index_code,
                "trading_date": p["tradingDate"],
                "open_value": p["open"],
                "high_value": p["high"],
                "low_value": p["low"],
                "close_value": p["close"],
                "volume": p["volume"] or 0,
                "value": p.get("value") or 0,
                "change_value": round(change, 2),
                "change_percent": round(change_pct, 2)
            })
        
        return result
        
    except Exception as e:
        print(f"  ❌ VCI Index Error: {e}")
        return None

def upsert_to_supabase(table, data):
    """Insert/update data to Supabase"""
    if not data:
        return 0
    
    batch_size = 500
    inserted = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers=headers,
                json=batch,
                timeout=60
            )
            
            if response.ok or "duplicate" in response.text.lower() or "conflict" in response.text.lower():
                inserted += len(batch)
            else:
                print(f"  ⚠️ Supabase: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            print(f"  ❌ Supabase Error: {e}")
    
    return inserted

def main():
    print("=" * 60)
    print("🚀 SYNC VN30 - 3 NĂM DỮ LIỆU")
    print("=" * 60)
    print(f"📅 Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Số mã: {len(VN30_SYMBOLS)} cổ phiếu + VN30 Index")
    print(f"📆 Khoảng thời gian: 3 năm (~1095 ngày)")
    print("=" * 60)
    
    total_prices = 0
    total_stocks = 0
    errors = 0
    
    # Sync stocks
    for i, symbol in enumerate(VN30_SYMBOLS, 1):
        print(f"\n[{i}/{len(VN30_SYMBOLS)}] 📈 {symbol}...")
        
        # Try VCI first
        prices = fetch_vci_stock(symbol, 1095)
        source = "VCI"
        
        # Fallback to Cafef
        if not prices:
            print(f"  ⚠️ VCI failed, trying Cafef...")
            prices = fetch_cafef_stock(symbol, 1095)
            source = "Cafef"
        
        if prices:
            inserted = upsert_to_supabase("stock_prices", prices)
            total_prices += inserted
            total_stocks += 1
            print(f"  ✅ {symbol}: {inserted} bản ghi ({source})")
        else:
            errors += 1
            print(f"  ❌ {symbol}: Không lấy được dữ liệu")
        
        time.sleep(0.3)  # Rate limiting
    
    # Sync VN30 Index
    print(f"\n📊 Đang sync VN30 Index...")
    index_data = fetch_vci_index("VN30", 1095)
    
    if index_data:
        inserted = upsert_to_supabase("market_indices", index_data)
        print(f"  ✅ VN30 Index: {inserted} bản ghi")
    else:
        print(f"  ❌ VN30 Index: Không lấy được dữ liệu")
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH!")
    print("=" * 60)
    print(f"📊 Tổng bản ghi giá: {total_prices:,}")
    print(f"📈 Số cổ phiếu: {total_stocks}/{len(VN30_SYMBOLS)}")
    print(f"❌ Lỗi: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()
