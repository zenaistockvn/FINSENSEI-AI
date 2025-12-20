# 📊 Nghiên cứu vnstock API - Nguồn VCI (Vietcap Securities)

## 🎯 Tổng quan về vnstock

**vnstock** là thư viện Python mã nguồn mở để lấy dữ liệu chứng khoán Việt Nam. Phiên bản mới nhất là **vnstock3**.

### Các nguồn dữ liệu hỗ trợ:
| Nguồn | Mô tả | Chất lượng | Khuyến nghị |
|-------|-------|------------|-------------|
| **VCI** | Vietcap Securities | ⭐⭐⭐⭐⭐ | ✅ Khuyến nghị |
| SSI | SSI Securities | ⭐⭐⭐⭐ | Backup |
| TCBS | Techcombank Securities | ⭐⭐⭐ | Backup |

---

## 🔥 Tại sao chọn VCI?

### 1. Dữ liệu chất lượng cao
- Dữ liệu từ Vietcap Securities - công ty chứng khoán uy tín
- Cập nhật real-time trong giờ giao dịch
- Độ chính xác cao, ít lỗi

### 2. API ổn định
- Endpoint ổn định, ít downtime
- Rate limit hợp lý
- Response time nhanh

### 3. Dữ liệu đầy đủ
- Giá lịch sử (OHLCV)
- Thông tin công ty
- Chỉ số tài chính
- Báo cáo tài chính
- Cổ tức
- Sự kiện doanh nghiệp

---

## 📦 Cài đặt vnstock3

```bash
# Cài đặt cơ bản
pip install vnstock3

# Cài đặt với dependencies đầy đủ
pip install vnstock3 pandas requests

# Upgrade lên phiên bản mới nhất
pip install --upgrade vnstock3
```

---

## 🚀 Sử dụng vnstock với nguồn VCI

### 1. Khởi tạo

```python
from vnstock3 import Vnstock

# Khởi tạo với nguồn VCI
stock = Vnstock().stock(symbol='VNM', source='VCI')
```

### 2. Lấy giá lịch sử (Historical Prices)

```python
# Lấy giá 2 năm gần nhất
df = stock.quote.history(
    start='2022-01-01',
    end='2024-12-20',
    interval='1D'  # 1D = daily, 1W = weekly, 1M = monthly
)

# Kết quả DataFrame:
# | time       | open   | high   | low    | close  | volume    |
# |------------|--------|--------|--------|--------|-----------|
# | 2024-12-20 | 75000  | 76500  | 74800  | 76200  | 1234567   |
```

**Các interval hỗ trợ:**
- `1D` - Daily (hàng ngày)
- `1W` - Weekly (hàng tuần)
- `1M` - Monthly (hàng tháng)

### 3. Thông tin công ty (Company Overview)

```python
# Lấy thông tin tổng quan
overview = stock.company.overview()

# Kết quả:
# - symbol: Mã cổ phiếu
# - short_name: Tên ngắn
# - exchange: Sàn giao dịch (HOSE, HNX, UPCOM)
# - industry_name: Ngành nghề
# - industry_name_en: Ngành nghề (tiếng Anh)
# - established_year: Năm thành lập
# - no_employees: Số nhân viên
# - outstanding_share: Số cổ phiếu lưu hành
# - website: Website công ty
```

### 4. Chỉ số tài chính (Financial Ratios)

```python
# Lấy chỉ số tài chính theo quý
ratios = stock.finance.ratio(period='quarter', lang='en')

# Các chỉ số quan trọng:
# - price_to_earning (P/E)
# - price_to_book (P/B)
# - roe (Return on Equity)
# - roa (Return on Assets)
# - earning_per_share (EPS)
# - gross_profit_margin
# - net_profit_margin
# - debt_on_equity (D/E)
```

### 5. Báo cáo tài chính (Financial Statements)

```python
# Bảng cân đối kế toán
balance_sheet = stock.finance.balance_sheet(period='quarter')

# Báo cáo kết quả kinh doanh
income_statement = stock.finance.income_statement(period='quarter')

# Báo cáo lưu chuyển tiền tệ
cash_flow = stock.finance.cash_flow(period='quarter')
```

### 6. Cổ tức (Dividends)

```python
# Lịch sử cổ tức
dividends = stock.company.dividends()

# Kết quả:
# - ex_date: Ngày GDKHQ
# - record_date: Ngày chốt quyền
# - payment_date: Ngày thanh toán
# - cash_dividend: Cổ tức tiền mặt
# - stock_dividend_ratio: Tỷ lệ cổ tức cổ phiếu
```

### 7. Sự kiện doanh nghiệp (Events)

```python
# Các sự kiện sắp tới
events = stock.company.events()
```

---

## 📊 Lấy dữ liệu chỉ số thị trường

```python
# Khởi tạo cho index
vnindex = Vnstock().stock(symbol='VNINDEX', source='VCI')

# Lấy giá lịch sử VNINDEX
df = vnindex.quote.history(
    start='2022-01-01',
    end='2024-12-20',
    interval='1D'
)

# Các index hỗ trợ:
# - VNINDEX
# - VN30
# - HNX
# - UPCOM
# - VN100
```

---

## 🔄 Rate Limiting & Best Practices

### Rate Limits
- **Khuyến nghị:** 1-2 requests/giây
- **Tối đa:** 5 requests/giây (có thể bị block)
- **Delay giữa các mã:** 1-1.5 giây

### Best Practices

```python
import time

symbols = ['VNM', 'VCB', 'FPT', 'HPG']

for symbol in symbols:
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        df = stock.quote.history(start='2023-01-01', end='2024-12-20')
        
        # Xử lý dữ liệu...
        
        time.sleep(1.5)  # Delay 1.5 giây
        
    except Exception as e:
        print(f"Error {symbol}: {e}")
        time.sleep(3)  # Delay lâu hơn nếu lỗi
```

---

## 🗄️ Mapping dữ liệu VCI → Supabase

### stock_prices table

| VCI Field | Supabase Field | Type |
|-----------|----------------|------|
| time | trading_date | DATE |
| open | open_price | DECIMAL |
| high | high_price | DECIMAL |
| low | low_price | DECIMAL |
| close | close_price | DECIMAL |
| volume | volume | BIGINT |

### companies table

| VCI Field | Supabase Field | Type |
|-----------|----------------|------|
| symbol | symbol | VARCHAR |
| short_name | company_name | VARCHAR |
| exchange | exchange | VARCHAR |
| industry_name | industry | VARCHAR |
| industry_name_en | sector | VARCHAR |

### financial_ratios table

| VCI Field | Supabase Field | Type |
|-----------|----------------|------|
| year | year | INTEGER |
| quarter | quarter | INTEGER |
| price_to_earning | pe_ratio | DECIMAL |
| price_to_book | pb_ratio | DECIMAL |
| roe | roe | DECIMAL |
| roa | roa | DECIMAL |
| earning_per_share | eps | DECIMAL |
| gross_profit_margin | gross_margin | DECIMAL |
| net_profit_margin | net_margin | DECIMAL |
| debt_on_equity | debt_to_equity | DECIMAL |

---

## ⚠️ Xử lý lỗi thường gặp

### 1. SSL Certificate Error
```bash
pip install --upgrade certifi
```

### 2. Import Error
```bash
pip install --upgrade vnstock3
```

### 3. Timeout Error
```python
# Tăng timeout và retry
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=1)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

### 4. No Data Error
```python
# Kiểm tra symbol có hợp lệ không
# Một số mã có thể đã bị hủy niêm yết
```

---

## 📈 Dữ liệu mong đợi cho FinSensei AI

### Sau khi sync đầy đủ:
- **100+ mã VN100** với dữ liệu 2 năm
- **50,000+ bản ghi** giá cổ phiếu
- **800+ bản ghi** chỉ số tài chính
- **2,000+ bản ghi** chỉ số thị trường
- **Cập nhật hàng ngày** sau 15:00

### Tính năng sẵn sàng:
- ✅ Biểu đồ nến chuyên nghiệp
- ✅ Chỉ số kỹ thuật (MA, RSI, MACD, Bollinger)
- ✅ Phân tích AI với dữ liệu thực
- ✅ So sánh cổ phiếu
- ✅ Screening theo chỉ số tài chính

---

## 🔗 Tài liệu tham khảo

- **vnstock GitHub:** https://github.com/thinh-vu/vnstock
- **vnstock Docs:** https://docs.vnstock.site/
- **VCI API:** https://www.vietcap.com.vn/
- **Supabase:** https://supabase.com/docs

