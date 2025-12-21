"""
Sync VN30 Company Data from Simplize API
API: https://api.simplize.vn/api/company/summary/{symbol}
"""

import requests
import json
from datetime import datetime
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

def create_table():
    """Create simplize_company_data table via SQL"""
    sql = """
    CREATE TABLE IF NOT EXISTS simplize_company_data (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) UNIQUE NOT NULL,
        name_vi TEXT,
        name_en TEXT,
        stock_exchange VARCHAR(10),
        industry TEXT,
        sector TEXT,
        website TEXT,
        logo_url TEXT,
        market_cap BIGINT,
        outstanding_shares BIGINT,
        free_float_rate DECIMAL(10,2),
        
        -- Price data
        price_close DECIMAL(12,2),
        price_open DECIMAL(12,2),
        price_high DECIMAL(12,2),
        price_low DECIMAL(12,2),
        price_ceiling DECIMAL(12,2),
        price_floor DECIMAL(12,2),
        price_reference DECIMAL(12,2),
        net_change DECIMAL(12,2),
        pct_change DECIMAL(10,2),
        volume BIGINT,
        volume_10d_avg BIGINT,
        
        -- Valuation ratios
        pe_ratio DECIMAL(10,2),
        pb_ratio DECIMAL(10,2),
        eps DECIMAL(12,2),
        book_value DECIMAL(12,2),
        dividend_yield DECIMAL(10,2),
        
        -- Financial metrics
        roe DECIMAL(10,2),
        roa DECIMAL(10,2),
        beta_5y DECIMAL(10,2),
        
        -- Growth metrics
        revenue_5y_growth DECIMAL(10,2),
        net_income_5y_growth DECIMAL(10,2),
        revenue_ltm_growth DECIMAL(10,2),
        net_income_ltm_growth DECIMAL(10,2),
        revenue_qoq_growth DECIMAL(10,2),
        net_income_qoq_growth DECIMAL(10,2),
        
        -- Price changes
        price_chg_7d DECIMAL(10,2),
        price_chg_30d DECIMAL(10,2),
        price_chg_ytd DECIMAL(10,2),
        price_chg_1y DECIMAL(10,2),
        price_chg_3y DECIMAL(10,2),
        price_chg_5y DECIMAL(10,2),
        
        -- Simplize scores (0-5)
        valuation_point INTEGER,
        growth_point INTEGER,
        performance_point INTEGER,
        financial_health_point INTEGER,
        dividend_point INTEGER,
        
        -- Signals
        ta_signal_1d VARCHAR(20),
        overall_risk_level VARCHAR(20),
        quality_valuation VARCHAR(10),
        company_quality INTEGER,
        
        -- Business info
        main_service TEXT,
        business_overview TEXT,
        business_strategy TEXT,
        business_risk TEXT,
        
        -- Meta
        watchlist_count INTEGER,
        no_of_recommendations INTEGER,
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_simplize_symbol ON simplize_company_data(symbol);
    """
    print("📋 SQL để tạo bảng đã được chuẩn bị")
    print("⚠️  Chạy SQL trong Supabase Dashboard nếu bảng chưa tồn tại")
    return sql

def fetch_simplize(symbol):
    """Fetch company data from Simplize API"""
    try:
        url = f"https://api.simplize.vn/api/company/summary/{symbol.lower()}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if result.get("status") != 200:
            return None
        
        data = result.get("data", {})
        if not data:
            return None
        
        # Helper to convert to int safely
        def to_int(val):
            if val is None:
                return None
            try:
                return int(float(val))
            except:
                return None
        
        return {
            "symbol": data.get("ticker", symbol).upper(),
            "name_vi": data.get("nameVi"),
            "name_en": data.get("nameEn"),
            "stock_exchange": data.get("stockExchange"),
            "industry": data.get("industryActivity"),
            "sector": data.get("bcEconomicSectorName"),
            "website": data.get("website"),
            "logo_url": data.get("imageUrl"),
            "market_cap": to_int(data.get("marketCap")),
            "outstanding_shares": to_int(data.get("outstandingSharesValue")),
            "free_float_rate": data.get("freeFloatRate"),
            
            # Price
            "price_close": data.get("priceClose"),
            "price_open": data.get("priceOpen"),
            "price_high": data.get("priceHigh"),
            "price_low": data.get("priceLow"),
            "price_ceiling": data.get("priceCeiling"),
            "price_floor": data.get("priceFloor"),
            "price_reference": data.get("priceReferrance"),
            "net_change": data.get("netChange"),
            "pct_change": data.get("pctChange"),
            "volume": to_int(data.get("volume")),
            "volume_10d_avg": to_int(data.get("volume10dAvg")),
            
            # Valuation
            "pe_ratio": data.get("peRatio"),
            "pb_ratio": data.get("pbRatio"),
            "eps": data.get("epsRatio"),
            "book_value": data.get("bookValue"),
            "dividend_yield": data.get("dividendYieldCurrent"),
            
            # Financial
            "roe": data.get("roe"),
            "roa": data.get("roa"),
            "beta_5y": data.get("beta5y"),
            
            # Growth
            "revenue_5y_growth": data.get("revenue5yGrowth"),
            "net_income_5y_growth": data.get("netIncome5yGrowth"),
            "revenue_ltm_growth": data.get("revenueLtmGrowth"),
            "net_income_ltm_growth": data.get("netIncomeLtmGrowth"),
            "revenue_qoq_growth": data.get("revenueGrowthQoq"),
            "net_income_qoq_growth": data.get("netIncomeGrowthQoq"),
            
            # Price changes
            "price_chg_7d": data.get("pricePctChg7d"),
            "price_chg_30d": data.get("pricePctChg30d"),
            "price_chg_ytd": data.get("pricePctChgYtd"),
            "price_chg_1y": data.get("pricePctChg1y"),
            "price_chg_3y": data.get("pricePctChg3y"),
            "price_chg_5y": data.get("pricePctChg5y"),
            
            # Scores
            "valuation_point": data.get("valuationPoint"),
            "growth_point": data.get("growthPoint"),
            "performance_point": data.get("passPerformancePoint"),
            "financial_health_point": data.get("financialHealthPoint"),
            "dividend_point": data.get("dividendPoint"),
            
            # Signals
            "ta_signal_1d": data.get("taSignal1d"),
            "overall_risk_level": data.get("overallRiskLevel"),
            "quality_valuation": data.get("qualityValuation"),
            "company_quality": data.get("companyQuality"),
            
            # Business
            "main_service": data.get("mainService"),
            "business_overview": data.get("businessOverall"),
            "business_strategy": data.get("businessStrategy"),
            "business_risk": data.get("businessRisk"),
            
            # Meta
            "watchlist_count": data.get("watchlistCount"),
            "no_of_recommendations": data.get("noOfRecommendations"),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def upsert_to_supabase(data):
    """Upsert data to Supabase"""
    if not data:
        return False
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/simplize_company_data",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.ok:
            return True
        elif "duplicate" in response.text.lower() or "conflict" in response.text.lower():
            # Try update
            symbol = data["symbol"]
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/simplize_company_data?symbol=eq.{symbol}",
                headers=headers,
                json=data,
                timeout=30
            )
            return response.ok
        else:
            print(f"  ⚠️ Supabase: {response.status_code} - {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"  ❌ Supabase Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 SYNC VN30 FROM SIMPLIZE API")
    print("=" * 60)
    print(f"📅 Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Số mã: {len(VN30_SYMBOLS)}")
    print(f"🔗 API: https://api.simplize.vn/api/company/summary/{{symbol}}")
    print("=" * 60)
    
    # Show SQL for table creation
    print("\n📋 Tạo bảng nếu chưa có...")
    create_table()
    
    success = 0
    errors = 0
    
    print("\n📥 Bắt đầu sync dữ liệu...\n")
    
    for i, symbol in enumerate(VN30_SYMBOLS, 1):
        print(f"[{i}/{len(VN30_SYMBOLS)}] 📈 {symbol}...", end=" ")
        
        data = fetch_simplize(symbol)
        
        if data:
            if upsert_to_supabase(data):
                success += 1
                print(f"✅ {data.get('name_vi', '')[:30]}...")
            else:
                errors += 1
                print("❌ Lỗi lưu DB")
        else:
            errors += 1
            print("❌ Không có dữ liệu")
        
        time.sleep(0.5)  # Rate limiting
    
    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH!")
    print("=" * 60)
    print(f"✅ Thành công: {success}/{len(VN30_SYMBOLS)}")
    print(f"❌ Lỗi: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()
