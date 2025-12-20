"""
Script khởi tạo database Supabase cho FinSensei AI
Chạy: python init_database.py
"""
import requests
import json

SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def test_connection():
    """Test kết nối Supabase"""
    print("🔗 Testing Supabase connection...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers=headers
        )
        if response.status_code == 200:
            print("✅ Connected to Supabase successfully!")
            return True
        else:
            print(f"❌ Connection failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def insert_vn100_companies():
    """Insert danh sách 100 công ty VN100"""
    print("\n🏢 Inserting VN100 companies...")
    
    from vn100_symbols import VN100_SYMBOLS, VN100_INFO
    
    companies = []
    for symbol in VN100_SYMBOLS:
        info = VN100_INFO.get(symbol, {})
        companies.append({
            "symbol": symbol,
            "company_name": info.get("name", symbol),
            "exchange": info.get("exchange", "HOSE"),
            "industry": info.get("industry", ""),
            "is_vn100": True,
            "is_active": True
        })
    
    # Insert in batches of 50
    batch_size = 50
    total_inserted = 0
    
    for i in range(0, len(companies), batch_size):
        batch = companies[i:i+batch_size]
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/companies",
                headers={**headers, "Prefer": "resolution=merge-duplicates"},
                json=batch
            )
            if response.status_code in [200, 201]:
                total_inserted += len(batch)
                print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} companies")
            else:
                print(f"  ⚠️ Batch {i//batch_size + 1} error: {response.status_code}")
                print(f"     {response.text[:200]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"✅ Total inserted: {total_inserted} companies")
    return total_inserted

def check_tables():
    """Kiểm tra các bảng đã tồn tại"""
    print("\n📋 Checking existing tables...")
    
    tables = ["companies", "stock_prices", "financial_ratios", "market_indices", "dividends", "stock_ratings", "data_sync_logs"]
    
    for table in tables:
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?limit=1",
                headers=headers
            )
            if response.status_code == 200:
                print(f"  ✅ {table} - exists")
            else:
                print(f"  ❌ {table} - not found ({response.status_code})")
        except Exception as e:
            print(f"  ❌ {table} - error: {e}")

def main():
    print("=" * 50)
    print("🚀 FinSensei AI - Database Initialization")
    print("=" * 50)
    
    # Test connection
    if not test_connection():
        print("\n⚠️ Please check your Supabase credentials and try again.")
        return
    
    # Check tables
    check_tables()
    
    # Insert companies
    print("\n" + "=" * 50)
    print("Do you want to insert VN100 companies? (y/n): ", end="")
    
    # Auto yes for script
    insert_vn100_companies()
    
    print("\n" + "=" * 50)
    print("✅ Database initialization complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Run the SQL from supabase/schema.sql to create tables")
    print("3. Run: python sync_data.py to sync stock data")

if __name__ == "__main__":
    main()
