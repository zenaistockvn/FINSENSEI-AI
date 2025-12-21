# 📊 NGHIÊN CỨU TOÀN DIỆN API CHỨNG KHOÁN VIỆT NAM

> Cập nhật: 21/12/2024
> Mục đích: Xây dựng database đầy đủ cho FinSensei

---

## 📋 TỔNG QUAN CÁC NGUỒN DỮ LIỆU

### Phân loại theo loại nguồn

| Loại | Nguồn | Ưu điểm | Nhược điểm |
|------|-------|---------|------------|
| **API Công ty CK** | TCBS, SSI, VNDirect, VCI, FPTS | Miễn phí, CORS | Có thể thay đổi |
| **Thư viện Python** | vnstock, vnquant | Dễ dùng | Phụ thuộc API gốc |
| **Phần mềm Desktop** | AmiBroker, Amibroker | Data đầy đủ | Cần export |
| **API Trả phí** | Simplize, Entrade | Ổn định, SLA | Tốn phí |
| **Nguồn chính thức** | HOSE, HNX, VSD | Chính xác | Khó truy cập |

---

## 🏆 BẢNG XẾP HẠNG TỔNG HỢP

| # | Nguồn | Giá lịch sử | Tài chính | Tin tức | Realtime | Độ ổn định | Chi phí |
|---|-------|-------------|-----------|---------|----------|------------|---------|
| 1 | **TCBS** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Miễn phí |
| 2 | **VCI (vnstock)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Miễn phí |
| 3 | **SSI iBoard** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Miễn phí |
| 4 | **VNDirect** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Miễn phí |
| 5 | **Simplize** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Trả phí |
| 6 | **AmiBroker** | ⭐⭐⭐⭐⭐ | ❌ | ❌ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | License |
| 7 | **Fireant** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Miễn phí |
| 8 | **Cafef** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Miễn phí |
| 9 | **Wichart** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Miễn phí |

---

## 1️⃣ TCBS API (Techcombank Securities)

### Thông tin chung
- **Base URL:** `https://apipubaws.tcbs.com.vn`
- **Authentication:** Không cần
- **CORS:** ✅ Hỗ trợ
- **Rate Limit:** ~100 req/phút
- **Dữ liệu từ:** 2015+

### Endpoints chi tiết

```javascript
// 1. Thông tin tổng quan cổ phiếu
GET /tcanalysis/v1/ticker/{symbol}/overview

// 2. Giá lịch sử (từ 2015)
GET /stock-insight/v1/stock/bars-long-term
  ?ticker={symbol}
  &type=stock
  &resolution=D  // D, W, M
  &from={unix_timestamp}
  &to={unix_timestamp}

// 3. Báo cáo tài chính
GET /tcanalysis/v1/finance/{symbol}/incomestatement?yearly=0&isAll=true
GET /tcanalysis/v1/finance/{symbol}/balancesheet?yearly=0&isAll=true
GET /tcanalysis/v1/finance/{symbol}/cashflow?yearly=0&isAll=true

// 4. Chỉ số tài chính
GET /tcanalysis/v1/finance/{symbol}/financialratio?yearly=0&isAll=true

// 5. Tin tức
GET /tcanalysis/v1/ticker/{symbol}/activity-news?page=0&size=20

// 6. Danh sách cổ phiếu theo ngành
GET /tcanalysis/v1/rating/detail/council?fType=INDUSTRY&len=100

// 7. Giá intraday
GET /stock-insight/v1/intraday/{symbol}/his/paging?page=0&size=100

// 8. Cổ tức
GET /tcanalysis/v1/ticker/{symbol}/dividend-payment-histories?page=0&size=20

// 9. Giao dịch nước ngoài
GET /tcanalysis/v1/ticker/{symbol}/foreign-trading?page=0&size=100

// 10. Cổ đông lớn
GET /tcanalysis/v1/ticker/{symbol}/large-share-holders
```

### Dữ liệu trả về mẫu
```json
// Overview
{
  "ticker": "VNM",
  "exchange": "HOSE",
  "shortName": "VINAMILK",
  "industryName": "Thực phẩm & Đồ uống",
  "pe": 18.5,
  "pb": 4.2,
  "roe": 0.28,
  "roa": 0.18,
  "eps": 4250,
  "bvps": 18500,
  "marketCap": 185000000000000,
  "sharesOutstanding": 2089955000,
  "dividend": 0.045,
  "revenueGrowth": 0.08,
  "netProfitGrowth": 0.12,
  "debtOnEquity": 0.35
}
```

---

## 2️⃣ VCI API (Vietcap Securities) - qua vnstock

### Thông tin chung
- **Truy cập qua:** vnstock3 Python library
- **Base URL:** `https://api.vietcap.com.vn` (internal)
- **Authentication:** Không cần
- **Rate Limit:** ~60 req/phút
- **Dữ liệu từ:** 2012+

### Cài đặt và sử dụng
```python
pip install vnstock3

from vnstock3 import Vnstock

# Khởi tạo
stock = Vnstock().stock(symbol='VNM', source='VCI')

# 1. Giá lịch sử
df = stock.quote.history(start='2015-01-01', end='2024-12-20', interval='1D')

# 2. Thông tin công ty
overview = stock.company.overview()

# 3. Chỉ số tài chính
ratios = stock.finance.ratio(period='quarter', lang='en')

# 4. Báo cáo tài chính
balance = stock.finance.balance_sheet(period='quarter')
income = stock.finance.income_statement(period='quarter')
cashflow = stock.finance.cash_flow(period='quarter')

# 5. Cổ tức
dividends = stock.company.dividends()

# 6. Sự kiện
events = stock.company.events()
```

### Ưu điểm VCI
- ✅ Dữ liệu chất lượng cao, ít lỗi
- ✅ API ổn định nhất trong các nguồn miễn phí
- ✅ Hỗ trợ đầy đủ các loại dữ liệu
- ✅ Có thể lấy data từ 2012

---

## 3️⃣ SSI iBoard API

### Thông tin chung
- **Base URL:** `https://iboard.ssi.com.vn`
- **Authentication:** Không cần
- **CORS:** ✅ Hỗ trợ
- **Rate Limit:** ~60 req/phút
- **Dữ liệu từ:** 2010+

### Endpoints
```javascript
// 1. Giá lịch sử
GET /dchart/api/1.1/bars
  ?resolution=D
  &symbol={symbol}
  &from={timestamp}
  &to={timestamp}

// 2. Thông tin cổ phiếu
GET /dchart/api/1.1/defaultSettings?code={symbol}

// 3. Danh sách cổ phiếu
GET /dchart/api/1.1/search?limit=1000&type=stock

// 4. Bảng giá realtime
GET /dchart/api/1.1/quotes?symbols={symbol1},{symbol2}

// 5. Chỉ số thị trường
GET /dchart/api/1.1/bars?resolution=D&symbol=VNINDEX&from=...&to=...
```

---

## 4️⃣ VNDirect API

### Thông tin chung
- **Base URL:** `https://finfo-api.vndirect.com.vn`
- **Authentication:** Không cần
- **CORS:** ✅ Hỗ trợ
- **Rate Limit:** ~30 req/phút
- **Dữ liệu từ:** 2010+

### Endpoints
```javascript
// 1. Giá lịch sử
GET /v4/stock_prices
  ?sort=date
  &q=code:{symbol}~date:gte:2015-01-01
  &size=5000

// 2. Chỉ số tài chính
GET /v4/ratios?q=code:{symbol}&size=100

// 3. Báo cáo tài chính
GET /v4/financial_statements?q=code:{symbol}~reportType:BS&size=20

// 4. Tin tức
GET /v4/news?q=code:{symbol}&size=20

// 5. Thông tin công ty
GET /v4/stocks?q=code:{symbol}
```

---

## 5️⃣ Simplize API (Trả phí)

### Thông tin chung
- **Website:** https://simplize.vn
- **Authentication:** API Key
- **Rate Limit:** Theo gói
- **Dữ liệu từ:** 2000+
- **Chi phí:** ~500k-2M/tháng

### Ưu điểm
- ✅ Dữ liệu đầy đủ nhất (từ 2000)
- ✅ API ổn định, có SLA
- ✅ Hỗ trợ kỹ thuật
- ✅ Dữ liệu đã được chuẩn hóa

### Endpoints (cần API key)
```javascript
// 1. Giá lịch sử
GET /api/company/price-history/{symbol}
  ?startDate=2015-01-01
  &endDate=2024-12-20

// 2. Chỉ số tài chính
GET /api/company/financial-ratio/{symbol}

// 3. Báo cáo tài chính
GET /api/company/financial-report/{symbol}
```

---

## 6️⃣ AmiBroker (Desktop Software)

### Thông tin chung
- **Loại:** Phần mềm phân tích kỹ thuật
- **Dữ liệu:** Phụ thuộc data feed
- **Dữ liệu từ:** 2000+ (nếu có data feed tốt)
- **Chi phí:** License ~$300 + data feed

### Nguồn data cho AmiBroker VN
| Data Feed | Dữ liệu từ | Chi phí |
|-----------|-----------|---------|
| AmiBroker Data | 2000+ | Trả phí |
| Fireant Plugin | 2007+ | Miễn phí |
| SSI Plugin | 2010+ | Miễn phí |
| VNDirect Plugin | 2010+ | Miễn phí |

### Export từ AmiBroker
```afl
// AFL Script export CSV
SetBarsRequired(100000, 100000);

// Export OHLCV
fh = fopen("C:\\Data\\export.csv", "w");
fputs("Date,Open,High,Low,Close,Volume\n", fh);

for(i = 0; i < BarCount; i++) {
    fputs(DateTimeToStr(DateTime()[i]) + "," + 
          NumToStr(O[i],1.2) + "," +
          NumToStr(H[i],1.2) + "," +
          NumToStr(L[i],1.2) + "," +
          NumToStr(C[i],1.2) + "," +
          NumToStr(V[i],1.0) + "\n", fh);
}
fclose(fh);
```

---

## 7️⃣ Fireant API

### Thông tin chung
- **Base URL:** `https://restv2.fireant.vn`
- **Authentication:** Bearer Token (có token public)
- **Rate Limit:** ~30 req/phút
- **Dữ liệu từ:** 2007+

### Endpoints
```javascript
// Headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkdYdExONzViZlZQakdvNERWdjV4QkZwdEVvSSJ9...

// 1. Fundamental
GET /symbols/{symbol}/fundamental

// 2. Giá lịch sử
GET /symbols/{symbol}/historical-quotes
  ?startDate=2015-01-01
  &endDate=2024-12-20

// 3. Tin tức
GET /posts?symbol={symbol}&type=1&offset=0&limit=20
```

---

## 8️⃣ Cafef API

### Thông tin chung
- **Base URL:** `https://s.cafef.vn`
- **Authentication:** Không cần
- **CORS:** ❌ Cần proxy
- **Rate Limit:** ~10 req/phút
- **Dữ liệu từ:** 2007+

### Endpoints
```javascript
// 1. Giá lịch sử
GET /Ajax/PageNew/DataHistory/PriceHistory.ashx
  ?Symbol={symbol}
  &StartDate=01/01/2015
  &EndDate=21/12/2024

// 2. Thông tin công ty
GET /Ajax/Company.ashx?symbol={symbol}

// 3. Tin tức
GET /Ajax/Events/CompanyNews.ashx?symbol={symbol}
```

---

## 9️⃣ Wichart (Vietcap) API

### Thông tin chung
- **Base URL:** `https://wichart.vn`
- **Authentication:** Không cần
- **CORS:** ⚠️ Một phần
- **Rate Limit:** ~40 req/phút

### Endpoints
```javascript
// 1. Giá lịch sử
GET /api/price/history
  ?symbol={symbol}
  &resolution=D
  &from={timestamp}
  &to={timestamp}

// 2. Thông tin công ty
GET /api/company/overview?symbol={symbol}
```

---

## 🔟 Các nguồn khác

### FPTS API
```javascript
GET https://eztrade.fpts.com.vn/api/v1/stock/history
  ?symbol={symbol}
  &from=2015-01-01
  &to=2024-12-21
```

### HOSE/HNX Official
- Không có public API
- Cần crawl từ website
- Dữ liệu chính xác nhất

### Entrade X (Trả phí)
- API chuyên nghiệp
- Realtime data
- Chi phí cao

---

## 📊 SO SÁNH DỮ LIỆU CÓ THỂ LẤY

| Loại dữ liệu | TCBS | VCI | SSI | VNDirect | Simplize | AmiBroker |
|--------------|------|-----|-----|----------|----------|-----------|
| Giá OHLCV | ✅ 2015+ | ✅ 2012+ | ✅ 2010+ | ✅ 2010+ | ✅ 2000+ | ✅ 2000+ |
| Volume | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| P/E, P/B | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ROE, ROA | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| EPS, BVPS | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| Báo cáo TC | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Cổ tức | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Tin tức | ✅ | ⚠️ | ❌ | ✅ | ✅ | ❌ |
| Realtime | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ |
| Chỉ số KT | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |



---

## 🎯 PHƯƠNG ÁN XÂY DỰNG DATABASE ĐẦY ĐỦ

### Chiến lược: Multi-Source với Fallback

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINSENSEI DATABASE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   Giá OHLCV │    │  Tài chính  │    │  Tin tức    │        │
│  │  2015-nay   │    │   Ratios    │    │   Events    │        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                  │                  │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐        │
│  │  Primary:   │    │  Primary:   │    │  Primary:   │        │
│  │    TCBS     │    │    TCBS     │    │    TCBS     │        │
│  │  Fallback:  │    │  Fallback:  │    │  Fallback:  │        │
│  │  VCI/SSI    │    │  VNDirect   │    │  VNDirect   │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  Chỉ số KT  │    │  Realtime   │    │  Lịch sử    │        │
│  │  MA,RSI,..  │    │   Quotes    │    │  2000-2015  │        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                  │                  │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐        │
│  │  Tự tính    │    │  Primary:   │    │  AmiBroker  │        │
│  │  từ OHLCV   │    │    SSI      │    │  hoặc       │        │
│  │  hoặc       │    │  Fallback:  │    │  Simplize   │        │
│  │  AmiBroker  │    │    TCBS     │    │  (trả phí)  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 KẾ HOẠCH TRIỂN KHAI

### Phase 1: Dữ liệu cơ bản (Miễn phí)

| Dữ liệu | Nguồn chính | Nguồn backup | Phạm vi |
|---------|-------------|--------------|---------|
| Giá OHLCV | TCBS | VCI/SSI | 2015-nay |
| Thông tin công ty | TCBS | VCI | VN100 |
| Chỉ số tài chính | TCBS | VNDirect | 8 quý gần nhất |
| Chỉ số thị trường | SSI | TCBS | VNINDEX, VN30 |

### Phase 2: Dữ liệu nâng cao (Miễn phí)

| Dữ liệu | Nguồn | Phạm vi |
|---------|-------|---------|
| Báo cáo tài chính | TCBS/VCI | 5 năm |
| Cổ tức | TCBS/VCI | 10 năm |
| Tin tức | TCBS/VNDirect | 1 năm |
| Giao dịch nước ngoài | TCBS | 1 năm |

### Phase 3: Dữ liệu lịch sử dài (Cần đầu tư)

| Dữ liệu | Nguồn | Phạm vi | Chi phí |
|---------|-------|---------|---------|
| Giá 2000-2015 | AmiBroker | 15 năm | License + Data |
| Giá 2000-2015 | Simplize | 15 năm | ~1M/tháng |
| Chỉ số KT đầy đủ | AmiBroker | Tất cả | Tự export |

---

## 🔧 PHƯƠNG ÁN AMIBROKER

### Khi nào nên dùng AmiBroker?

1. **Cần dữ liệu lịch sử dài (2000-2015)**
   - Các API miễn phí chỉ có từ 2010-2015
   - AmiBroker có thể có data từ 2000

2. **Cần chỉ số kỹ thuật đầy đủ**
   - MA, EMA, SMA (nhiều period)
   - RSI, MACD, Stochastic
   - Bollinger Bands, ATR
   - Ichimoku, Fibonacci
   - Custom indicators

3. **Cần data ổn định, không phụ thuộc API**
   - API có thể thay đổi/chết
   - AmiBroker data local, ổn định

### Workflow AmiBroker → Supabase

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AmiBroker  │────▶│  CSV Files  │────▶│  Supabase   │
│  Database   │     │  (Export)   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
   AFL Script         Node.js/Python      Auto Sync
   Export Data        Parse & Upload      Daily Job
```

### AFL Script Export đầy đủ

```afl
// Export_Full_Data.afl
// Export OHLCV + Technical Indicators

SetBarsRequired(100000, 100000);

// Tạo file CSV
symbol = Name();
filepath = "C:\\AmiBroker_Export\\" + symbol + ".csv";
fh = fopen(filepath, "w");

// Header
fputs("Date,Open,High,Low,Close,Volume,MA5,MA10,MA20,MA50,MA200,RSI14,MACD,Signal,Histogram,BB_Upper,BB_Middle,BB_Lower,ATR14\n", fh);

// Tính các chỉ số
ma5 = MA(C, 5);
ma10 = MA(C, 10);
ma20 = MA(C, 20);
ma50 = MA(C, 50);
ma200 = MA(C, 200);
rsi14 = RSI(14);
macdLine = MACD(12, 26);
signalLine = Signal(12, 26, 9);
histogram = macdLine - signalLine;
bbTop = BBandTop(C, 20, 2);
bbMid = MA(C, 20);
bbBot = BBandBot(C, 20, 2);
atr14 = ATR(14);

// Export từng dòng
for(i = 200; i < BarCount; i++) {
    line = DateTimeToStr(DateTime()[i], 1) + "," +
           NumToStr(O[i], 1.2) + "," +
           NumToStr(H[i], 1.2) + "," +
           NumToStr(L[i], 1.2) + "," +
           NumToStr(C[i], 1.2) + "," +
           NumToStr(V[i], 1.0) + "," +
           NumToStr(ma5[i], 1.2) + "," +
           NumToStr(ma10[i], 1.2) + "," +
           NumToStr(ma20[i], 1.2) + "," +
           NumToStr(ma50[i], 1.2) + "," +
           NumToStr(ma200[i], 1.2) + "," +
           NumToStr(rsi14[i], 1.2) + "," +
           NumToStr(macdLine[i], 1.4) + "," +
           NumToStr(signalLine[i], 1.4) + "," +
           NumToStr(histogram[i], 1.4) + "," +
           NumToStr(bbTop[i], 1.2) + "," +
           NumToStr(bbMid[i], 1.2) + "," +
           NumToStr(bbBot[i], 1.2) + "," +
           NumToStr(atr14[i], 1.2) + "\n";
    fputs(line, fh);
}

fclose(fh);
```

---

## 💰 PHÂN TÍCH CHI PHÍ

### Option 1: 100% Miễn phí
- **Nguồn:** TCBS + VCI + SSI
- **Dữ liệu:** 2015-nay
- **Chi phí:** $0
- **Rủi ro:** API có thể thay đổi

### Option 2: AmiBroker (One-time)
- **Nguồn:** AmiBroker + API miễn phí
- **Dữ liệu:** 2000-nay (nếu có data feed)
- **Chi phí:** ~$300 license + data feed
- **Ưu điểm:** Chỉ số KT đầy đủ, data ổn định

### Option 3: Simplize (Monthly)
- **Nguồn:** Simplize API
- **Dữ liệu:** 2000-nay
- **Chi phí:** ~500k-2M/tháng
- **Ưu điểm:** API ổn định, có SLA

### Option 4: Hybrid (Khuyến nghị)
- **Nguồn:** TCBS/VCI (daily) + AmiBroker (historical)
- **Dữ liệu:** 2000-nay
- **Chi phí:** ~$300 one-time
- **Ưu điểm:** Tốt nhất cả hai thế giới

---

## 🗄️ SCHEMA DATABASE ĐỀ XUẤT

### Bảng mới cho Technical Indicators

```sql
-- Bảng technical_indicators - Chỉ số kỹ thuật
CREATE TABLE IF NOT EXISTS technical_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    trading_date DATE NOT NULL,
    
    -- Moving Averages
    ma5 DECIMAL(12, 2),
    ma10 DECIMAL(12, 2),
    ma20 DECIMAL(12, 2),
    ma50 DECIMAL(12, 2),
    ma200 DECIMAL(12, 2),
    ema12 DECIMAL(12, 2),
    ema26 DECIMAL(12, 2),
    
    -- RSI
    rsi14 DECIMAL(8, 2),
    
    -- MACD
    macd_line DECIMAL(12, 4),
    macd_signal DECIMAL(12, 4),
    macd_histogram DECIMAL(12, 4),
    
    -- Bollinger Bands
    bb_upper DECIMAL(12, 2),
    bb_middle DECIMAL(12, 2),
    bb_lower DECIMAL(12, 2),
    
    -- Other
    atr14 DECIMAL(12, 2),
    adx14 DECIMAL(8, 2),
    cci20 DECIMAL(10, 2),
    
    -- Source
    data_source VARCHAR(20) DEFAULT 'calculated',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, trading_date)
);

CREATE INDEX idx_tech_symbol_date ON technical_indicators(symbol, trading_date DESC);
```

---

## ✅ KHUYẾN NGHỊ CUỐI CÙNG

### Cho FinSensei hiện tại:

1. **Giá OHLCV (2015-nay):** TCBS API → VCI fallback
2. **Chỉ số tài chính:** TCBS API → VNDirect fallback
3. **Tin tức:** TCBS API
4. **Realtime:** SSI iBoard
5. **Chỉ số KT:** Tự tính từ OHLCV

### Nếu cần mở rộng:

1. **Dữ liệu 2000-2015:** AmiBroker export hoặc Simplize
2. **Chỉ số KT nâng cao:** AmiBroker export
3. **Độ ổn định cao:** Simplize API (trả phí)

### Sync Schedule đề xuất:

| Dữ liệu | Tần suất | Thời điểm |
|---------|----------|-----------|
| Giá OHLCV | Daily | 15:30 (sau đóng cửa) |
| Chỉ số tài chính | Weekly | Chủ nhật |
| Tin tức | 4x/ngày | 9:00, 12:00, 15:00, 18:00 |
| Chỉ số KT | Daily | 16:00 (sau sync giá) |
| Báo cáo TC | Quarterly | Sau mùa BCTC |

---

## 📝 NEXT STEPS

1. [ ] Test lại tất cả API endpoints
2. [ ] Tạo sync script với fallback mechanism
3. [ ] Setup AmiBroker export (nếu anh có license)
4. [ ] Tạo bảng technical_indicators
5. [ ] Implement auto-sync scheduler
6. [ ] Monitor và alert khi API fail
