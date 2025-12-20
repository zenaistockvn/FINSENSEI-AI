"""
Script đồng bộ dữ liệu VN100 từ vnstock vào Supabase
"""
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
from vn100_symbols import VN100_SYMBOLS, VN100_INFO

# Supabase configuration
SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_sync(sync_type: str, status: str, records_count: int = 0, error_message: str = None):
    """Ghi log đồng bộ"""
    try:
        supabase.table("data_sync_logs").insert({
            "sync_type": sync_type,
            "status": status,
            "records_count": records_count,
            "error_message": error_message,
            "started_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat() if status in ["SUCCESS", "FAILED"] else None
        }).execute()
    except Exception as e:
        print(f"Error logging sync: {e}")

def sync_companies():
    """Đồng bộ thông tin công ty VN100"""
    print("🏢 Syncing VN100 companies...")
    
    try:
        from vnstock import Vnstock
        stock = Vnstock()
        
        records = []
        for symbol in VN100_SYMBOLS:
            info = VN100_INFO.get(symbol, {})
            
            # Lấy thêm thông tin từ vnstock nếu có
            try:
                company_data = stock.stock(symbol=symbol, source="TCBS").company.overview()
                if company_data is not None and len(company_data) > 0:
                    row = company_data.iloc[0] if hasattr(company_data, 'iloc') else company_data
                    records.append({
                        "symbol": symbol,
                        "company_name": info.get("name", str(row.get("companyName", symbol))),
                        "company_name_en": str(row.get("companyNameEn", "")),
                        "exchange": info.get("exchange", str(row.get("exchange", "HOSE"))),
                        "industry": info.get("industry", str(row.get("industry", ""))),
                        "sector": str(row.get("sector", "")),
                        "outstanding_shares": int(row.get("outstandingShare", 0)) if row.get("outstandingShare") else None,
                        "website": str(row.get("website", "")),
                        "description": str(row.get("companyProfile", ""))[:1000],
                        "is_vn100": True,
                        "is_active": True
                    })
                else:
                    # Fallback to basic info
                    records.append({
                        "symbol": symbol,
                        "company_name": info.get("name", symbol),
                        "exchange": info.get("exchange", "HOSE"),
                        "industry": info.get("industry", ""),
                        "is_vn100": True,
                        "is_active": True
                    })
            except Exception as e:
                print(f"  Warning: Could not fetch details for {symbol}: {e}")
                records.append({
                    "symbol": symbol,
                    "company_name": info.get("name", symbol),
                    "exchange": info.get("exchange", "HOSE"),
                    "industry": info.get("industry", ""),
                    "is_vn100": True,
                    "is_active": True
                })
        
        # Upsert to Supabase
        if records:
            supabase.table("companies").upsert(records, on_conflict="symbol").execute()
            print(f"✅ Synced {len(records)} companies")
            log_sync("COMPANIES", "SUCCESS", len(records))
        
        return len(records)
        
    except Exception as e:
        print(f"❌ Error syncing companies: {e}")
        log_sync("COMPANIES", "FAILED", 0, str(e))
        return 0

def sync_stock_prices(days: int = 365):
    """Đồng bộ giá cổ phiếu lịch sử"""
    print(f"📈 Syncing stock prices for last {days} days...")
    
    try:
        from vnstock import Vnstock
        
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        total_records = 0
        
        for i, symbol in enumerate(VN100_SYMBOLS):
            try:
                stock = Vnstock().stock(symbol=symbol, source="TCBS")
                df = stock.quote.history(start=start_date, end=end_date)
                
                if df is not None and len(df) > 0:
                    records = []
                    for _, row in df.iterrows():
                        records.append({
                            "symbol": symbol,
                            "trading_date": str(row.get("time", row.name))[:10],
                            "open_price": float(row.get("open", 0)),
                            "high_price": float(row.get("high", 0)),
                            "low_price": float(row.get("low", 0)),
                            "close_price": float(row.get("close", 0)),
                            "volume": int(row.get("volume", 0)),
                            "value": float(row.get("value", 0)) if row.get("value") else None
                        })
                    
                    if records:
                        supabase.table("stock_prices").upsert(
                            records, 
                            on_conflict="symbol,trading_date"
                        ).execute()
                        total_records += len(records)
                
                print(f"  [{i+1}/{len(VN100_SYMBOLS)}] {symbol}: {len(df) if df is not None else 0} records")
                
            except Exception as e:
                print(f"  ⚠️ Error for {symbol}: {e}")
                continue
        
        print(f"✅ Total synced: {total_records} price records")
        log_sync("STOCK_PRICES", "SUCCESS", total_records)
        return total_records
        
    except Exception as e:
        print(f"❌ Error syncing stock prices: {e}")
        log_sync("STOCK_PRICES", "FAILED", 0, str(e))
        return 0

def sync_financial_ratios():
    """Đồng bộ chỉ số tài chính"""
    print("📊 Syncing financial ratios...")
    
    try:
        from vnstock import Vnstock
        
        total_records = 0
        
        for i, symbol in enumerate(VN100_SYMBOLS):
            try:
                stock = Vnstock().stock(symbol=symbol, source="TCBS")
                df = stock.finance.ratio(period="quarter", lang="en")
                
                if df is not None and len(df) > 0:
                    records = []
                    for _, row in df.iterrows():
                        year = int(row.get("year", 0))
                        quarter = int(row.get("quarter", 0))
                        
                        if year > 0:
                            records.append({
                                "symbol": symbol,
                                "year": year,
                                "quarter": quarter if quarter > 0 else None,
                                "pe_ratio": float(row.get("priceToEarning", 0)) if row.get("priceToEarning") else None,
                                "pb_ratio": float(row.get("priceToBook", 0)) if row.get("priceToBook") else None,
                                "roe": float(row.get("roe", 0)) if row.get("roe") else None,
                                "roa": float(row.get("roa", 0)) if row.get("roa") else None,
                                "gross_margin": float(row.get("grossProfitMargin", 0)) if row.get("grossProfitMargin") else None,
                                "operating_margin": float(row.get("operatingProfitMargin", 0)) if row.get("operatingProfitMargin") else None,
                                "net_margin": float(row.get("postTaxMargin", 0)) if row.get("postTaxMargin") else None,
                                "current_ratio": float(row.get("currentPayment", 0)) if row.get("currentPayment") else None,
                                "debt_to_equity": float(row.get("debtOnEquity", 0)) if row.get("debtOnEquity") else None,
                                "eps": float(row.get("earningPerShare", 0)) if row.get("earningPerShare") else None,
                                "bvps": float(row.get("bookValuePerShare", 0)) if row.get("bookValuePerShare") else None,
                                "revenue_growth": float(row.get("revenueGrowth", 0)) if row.get("revenueGrowth") else None,
                                "profit_growth": float(row.get("postTaxProfitGrowth", 0)) if row.get("postTaxProfitGrowth") else None,
                            })
                    
                    if records:
                        supabase.table("financial_ratios").upsert(
                            records,
                            on_conflict="symbol,year,quarter"
                        ).execute()
                        total_records += len(records)
                
                print(f"  [{i+1}/{len(VN100_SYMBOLS)}] {symbol}: {len(df) if df is not None else 0} records")
                
            except Exception as e:
                print(f"  ⚠️ Error for {symbol}: {e}")
                continue
        
        print(f"✅ Total synced: {total_records} ratio records")
        log_sync("FINANCIAL_RATIOS", "SUCCESS", total_records)
        return total_records
        
    except Exception as e:
        print(f"❌ Error syncing financial ratios: {e}")
        log_sync("FINANCIAL_RATIOS", "FAILED", 0, str(e))
        return 0

def sync_market_indices(days: int = 365):
    """Đồng bộ chỉ số thị trường"""
    print(f"📉 Syncing market indices for last {days} days...")
    
    try:
        from vnstock import Vnstock
        
        indices = ["VNINDEX", "VN30", "HNX", "UPCOM"]
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        total_records = 0
        
        for index_code in indices:
            try:
                stock = Vnstock().stock(symbol=index_code, source="TCBS")
                df = stock.quote.history(start=start_date, end=end_date)
                
                if df is not None and len(df) > 0:
                    records = []
                    for _, row in df.iterrows():
                        records.append({
                            "index_code": index_code,
                            "trading_date": str(row.get("time", row.name))[:10],
                            "open_value": float(row.get("open", 0)),
                            "high_value": float(row.get("high", 0)),
                            "low_value": float(row.get("low", 0)),
                            "close_value": float(row.get("close", 0)),
                            "volume": int(row.get("volume", 0)),
                            "value": float(row.get("value", 0)) if row.get("value") else None
                        })
                    
                    if records:
                        supabase.table("market_indices").upsert(
                            records,
                            on_conflict="index_code,trading_date"
                        ).execute()
                        total_records += len(records)
                
                print(f"  {index_code}: {len(df) if df is not None else 0} records")
                
            except Exception as e:
                print(f"  ⚠️ Error for {index_code}: {e}")
                continue
        
        print(f"✅ Total synced: {total_records} index records")
        log_sync("MARKET_INDICES", "SUCCESS", total_records)
        return total_records
        
    except Exception as e:
        print(f"❌ Error syncing market indices: {e}")
        log_sync("MARKET_INDICES", "FAILED", 0, str(e))
        return 0

def sync_all():
    """Đồng bộ tất cả dữ liệu"""
    print("=" * 50)
    print("🚀 Starting full data sync for VN100")
    print("=" * 50)
    
    results = {
        "companies": sync_companies(),
        "stock_prices": sync_stock_prices(365),
        "financial_ratios": sync_financial_ratios(),
        "market_indices": sync_market_indices(365)
    }
    
    print("\n" + "=" * 50)
    print("📋 Sync Summary:")
    for key, value in results.items():
        print(f"  - {key}: {value} records")
    print("=" * 50)
    
    return results

if __name__ == "__main__":
    sync_all()
