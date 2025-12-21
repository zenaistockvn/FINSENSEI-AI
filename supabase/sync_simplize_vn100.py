"""
Sync VN100 Company Data from Simplize API
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

# VN100 symbols
VN100_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSB", "SSI", "STB", "TCB",
    "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "SHB",
    "ANV", "ASM", "BAF", "BMP", "BSI", "BWE", "CII", "CMG", "CNG", "CTD",
    "DCM", "DGC", "DGW", "DIG", "DPM", "DRC", "DXG", "DXS", "EIB", "EVF",
    "FRT", "GEX", "GMD", "HAG", "HCM", "HDC", "HDG", "HHV", "HSG", "HT1",
    "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MSB", "NAB", "NKG", "NLG",
    "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PET", "PHR", "PNJ", "PPC",
    "PTB", "PVD", "PVS", "PVT", "REE", "SBT", "SCS", "SHI", "SIP", "SJS",
    "SKG", "SZC", "TCH", "TLG", "TNH", "VCG", "VCI", "VGC", "VHC", "VND"
]

def to_int(val):
    """Convert to int safely"""
    if val is None:
        return None
    try:
        return int(float(val))
    except:
        return None

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
            print(f"  ⚠️ Supabase: {response.status_code} - {response.text[:100]}")
            return False
            
    except Exception as e:
        print(f"  ❌ Supabase Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 SYNC VN100 FROM SIMPLIZE API")
    print("=" * 60)
    print(f"📅 Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Số mã: {len(VN100_SYMBOLS)}")
    print("=" * 60)
    
    success = 0
    errors = 0
    
    for i, symbol in enumerate(VN100_SYMBOLS, 1):
        print(f"[{i}/{len(VN100_SYMBOLS)}] 📈 {symbol}...", end=" ")
        
        data = fetch_simplize(symbol)
        
        if data:
            if upsert_to_supabase(data):
                success += 1
                name = data.get('name_vi', '')[:35] if data.get('name_vi') else ''
                print(f"✅ {name}...")
            else:
                errors += 1
                print("❌ Lỗi DB")
        else:
            errors += 1
            print("❌ Không có dữ liệu")
        
        time.sleep(0.3)
    
    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH!")
    print("=" * 60)
    print(f"✅ Thành công: {success}/{len(VN100_SYMBOLS)}")
    print(f"❌ Lỗi: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()
