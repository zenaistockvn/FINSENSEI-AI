# 📋 HƯỚNG DẪN CHO TEAM DEV - TÌM API VÀ HOÀN THIỆN CHỈ SỐ

> **Dự án:** FinSensei AI - Nền tảng phân tích chứng khoán Việt Nam
> **Cập nhật:** 21/12/2024
> **Mục tiêu:** Hoàn thiện dữ liệu cho tất cả các bảng trong database

---

## 📊 TỔNG QUAN DATABASE HIỆN TẠI

### Danh sách các bảng cần hoàn thiện dữ liệu

| # | Bảng | Mô tả | Trạng thái | Độ ưu tiên |
|---|------|-------|------------|------------|
| 1 | `companies` | Thông tin 100 công ty VN100 | ✅ Có data | - |
| 2 | `stock_prices` | Giá OHLCV lịch sử | ✅ Có data | - |
| 3 | `financial_ratios` | Chỉ số tài chính | ⚠️ Cần bổ sung | 🔴 Cao |
| 4 | `market_indices` | Chỉ số thị trường | ⚠️ Cần bổ sung | 🔴 Cao |
| 5 | `dividends` | Lịch sử cổ tức | ❌ Chưa có | 🟡 Trung bình |
| 6 | `stock_ratings` | Đánh giá cổ phiếu | ❌ Chưa có | 🟡 Trung bình |
| 7 | `technical_indicators` | Chỉ số kỹ thuật | ⚠️ Cần bổ sung | 🔴 Cao |
| 8 | `ai_analysis` | Chẩn đoán AI | ❌ Chưa có | 🟢 Thấp |
| 9 | `risk_analysis` | Phân tích rủi ro | ❌ Chưa có | 🟢 Thấp |
| 10 | `trading_strategy` | Chiến lược giao dịch | ❌ Chưa có | 🟢 Thấp |
| 11 | `broker_recommendations` | Khuyến nghị CTCK | ❌ Chưa có | 🟡 Trung bình |
| 12 | `guru_stocks` | Cổ phiếu theo Guru | ❌ Chưa có | 🟡 Trung bình |
| 13 | `ai_stock_insights` | AI Insights | ❌ Chưa có | 🟢 Thấp |

---

## 🎯 NHIỆM VỤ CHI TIẾT THEO TỪNG BẢNG

---

### 1️⃣ BẢNG `financial_ratios` - Chỉ số tài chính

**Schema:**
```sql
symbol VARCHAR(10)          -- Mã cổ phiếu
year INTEGER                -- Năm
quarter INTEGER             -- Quý (1-4, NULL = cả năm)
pe_ratio DECIMAL(10,2)      -- P/E
pb_ratio DECIMAL(10,2)      -- P/B
ps_ratio DECIMAL(10,2)      -- P/S
roe DECIMAL(10,4)           -- ROE (%)
roa DECIMAL(10,4)           -- ROA (%)
ros DECIMAL(10,4)           -- ROS (%)
gross_margin DECIMAL(10,4)  -- Biên lợi nhuận gộp
operating_margin DECIMAL(10,4) -- Biên lợi nhuận hoạt động
net_margin DECIMAL(10,4)    -- Biên lợi nhuận ròng
current_ratio DECIMAL(10,2) -- Hệ số thanh toán hiện hành
debt_to_equity DECIMAL(10,2) -- Nợ/Vốn chủ sở hữu
eps DECIMAL(12,2)           -- EPS
bvps DECIMAL(12,2)          -- BVPS
revenue_growth DECIMAL(10,4) -- Tăng trưởng doanh thu
profit_growth DECIMAL(10,4)  -- Tăng trưởng lợi nhuận
```

**API nguồn:**

| API | Endpoint | Dữ liệu có | Ưu tiên |
|-----|----------|-----------|---------|
| **TCBS** | `GET /tcanalysis/v1/finance/{symbol}/financialratio?yearly=0&isAll=true` | PE, PB, ROE, ROA, EPS, BVPS, Debt/Equity | ⭐⭐⭐ |
| **VCI (vnstock)** | `stock.finance.ratio(period='quarter')` | Đầy đủ các chỉ số | ⭐⭐⭐ |
| **VNDirect** | `GET /v4/ratios?q=code:{symbol}&size=100` | PE, PB, ROE, ROA | ⭐⭐ |

**Ví dụ code lấy từ TCBS:**
```javascript
const response = await fetch(
  `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${symbol}/financialratio?yearly=0&isAll=true`
);
const data = await response.json();

// Mapping fields
const ratios = {
  pe_ratio: data.pe,
  pb_ratio: data.pb,
  roe: data.roe,
  roa: data.roa,
  eps: data.eps,
  bvps: data.bvps,
  debt_to_equity: data.debtOnEquity,
  gross_margin: data.grossProfitMargin,
  net_margin: data.netProfitMargin,
  revenue_growth: data.revenueGrowth,
  profit_growth: data.netProfitGrowth
};
```

**Ví dụ code lấy từ VCI (Python):**
```python
from vnstock3 import Vnstock

stock = Vnstock().stock(symbol='VNM', source='VCI')
ratios = stock.finance.ratio(period='quarter', lang='en')

# DataFrame columns: ROE, ROA, EPS, BVPS, P/E, P/B, etc.
```

---

### 2️⃣ BẢNG `market_indices` - Chỉ số thị trường

**Schema:**
```sql
index_code VARCHAR(20)      -- VNINDEX, VN30, HNX, UPCOM
trading_date DATE
open_value DECIMAL(12,2)
high_value DECIMAL(12,2)
low_value DECIMAL(12,2)
close_value DECIMAL(12,2)
volume BIGINT
value DECIMAL(20,2)
change_value DECIMAL(10,2)
change_percent DECIMAL(8,4)
```

**API nguồn:**

| API | Endpoint | Index hỗ trợ |
|-----|----------|--------------|
| **SSI** | `GET /dchart/api/1.1/bars?symbol=VNINDEX&resolution=D&from=...&to=...` | VNINDEX, VN30, HNX |
| **TCBS** | `GET /stock-insight/v1/stock/bars-long-term?ticker=VNINDEX&type=index` | VNINDEX, VN30 |

**Ví dụ code:**
```javascript
// SSI API
const from = Math.floor(new Date('2024-01-01').getTime() / 1000);
const to = Math.floor(Date.now() / 1000);

const response = await fetch(
  `https://iboard.ssi.com.vn/dchart/api/1.1/bars?resolution=D&symbol=VNINDEX&from=${from}&to=${to}`
);
const data = await response.json();

// data.t = timestamps, data.o = open, data.h = high, data.l = low, data.c = close, data.v = volume
```

---

### 3️⃣ BẢNG `dividends` - Lịch sử cổ tức

**Schema:**
```sql
symbol VARCHAR(10)
ex_date DATE                -- Ngày GDKHQ
record_date DATE            -- Ngày chốt quyền
payment_date DATE           -- Ngày thanh toán
dividend_type VARCHAR(20)   -- 'CASH', 'STOCK', 'BOTH'
cash_dividend DECIMAL(12,4) -- Cổ tức tiền mặt (VND/cp)
stock_dividend_ratio VARCHAR(20) -- Tỷ lệ cổ tức cổ phiếu (vd: "10:1")
year INTEGER
```

**API nguồn:**

| API | Endpoint | Dữ liệu |
|-----|----------|---------|
| **TCBS** | `GET /tcanalysis/v1/ticker/{symbol}/dividend-payment-histories?page=0&size=20` | Đầy đủ |
| **VCI (vnstock)** | `stock.company.dividends()` | Đầy đủ |

**Ví dụ code TCBS:**
```javascript
const response = await fetch(
  `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol}/dividend-payment-histories?page=0&size=50`
);
const data = await response.json();

// Mapping
data.listDividendPaymentHis.forEach(item => {
  const dividend = {
    symbol: symbol,
    ex_date: item.exerciseDate,
    record_date: item.recordDate,
    payment_date: item.issueDate,
    dividend_type: item.cashDividend > 0 ? 'CASH' : 'STOCK',
    cash_dividend: item.cashDividend,
    stock_dividend_ratio: item.stockDividend,
    year: item.year
  };
});
```

---

### 4️⃣ BẢNG `technical_indicators` - Chỉ số kỹ thuật

**Schema:**
```sql
symbol VARCHAR(10)
calculation_date DATE
current_price DECIMAL(12,2)
price_change_1d DECIMAL(8,4)   -- % thay đổi 1 ngày
price_change_5d DECIMAL(8,4)   -- % thay đổi 5 ngày
price_change_20d DECIMAL(8,4)  -- % thay đổi 20 ngày
price_change_60d DECIMAL(8,4)  -- % thay đổi 60 ngày

-- Moving Averages
ma20 DECIMAL(12,2)
ma50 DECIMAL(12,2)
ma200 DECIMAL(12,2)
price_vs_ma20 DECIMAL(8,4)     -- % so với MA20
price_vs_ma50 DECIMAL(8,4)     -- % so với MA50

-- Momentum
rsi_14 DECIMAL(5,2)            -- RSI 14 ngày
macd DECIMAL(12,4)
macd_signal DECIMAL(12,4)
macd_histogram DECIMAL(12,4)

-- Volatility
volatility_20d DECIMAL(8,4)
atr_14 DECIMAL(12,2)

-- Volume
volume_avg_20d BIGINT
volume_ratio DECIMAL(8,4)

-- Price Position
high_52w DECIMAL(12,2)
low_52w DECIMAL(12,2)
distance_from_high DECIMAL(8,4)

-- Scores
rs_rating DECIMAL(5,2)         -- 0-100
momentum_score DECIMAL(5,2)    -- 0-100
trend_score DECIMAL(5,2)       -- 0-100
overall_technical_score DECIMAL(5,2) -- 0-100
```

**Cách tính (từ dữ liệu giá OHLCV):**

```javascript
// Lấy giá từ bảng stock_prices
const prices = await supabase
  .from('stock_prices')
  .select('*')
  .eq('symbol', symbol)
  .order('trading_date', { ascending: false })
  .limit(250); // 1 năm data

// Tính MA
function calculateMA(prices, period) {
  if (prices.length < period) return null;
  const sum = prices.slice(0, period).reduce((a, b) => a + b.close_price, 0);
  return sum / period;
}

// Tính RSI
function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 0; i < period; i++) {
    const change = prices[i].close_price - prices[i + 1].close_price;
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Tính MACD
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([...], 9); // EMA 9 của MACD
  return { macd, signal, histogram: macd - signal };
}

// RS Rating (so sánh với các cổ phiếu khác)
function calculateRSRating(symbol, allStocks) {
  // Tính % thay đổi 3 tháng + 6 tháng + 9 tháng + 12 tháng
  // Xếp hạng trong tất cả cổ phiếu
  // RS Rating = percentile rank * 100
}
```

**Hoặc dùng thư viện:**
```python
import talib
import pandas as pd

# Tính các chỉ số kỹ thuật
df['ma20'] = talib.SMA(df['close'], timeperiod=20)
df['ma50'] = talib.SMA(df['close'], timeperiod=50)
df['ma200'] = talib.SMA(df['close'], timeperiod=200)
df['rsi_14'] = talib.RSI(df['close'], timeperiod=14)
df['macd'], df['macd_signal'], df['macd_hist'] = talib.MACD(df['close'])
df['atr_14'] = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14)
```

---

### 5️⃣ BẢNG `broker_recommendations` - Khuyến nghị CTCK

**Schema:**
```sql
symbol VARCHAR(10)
recommendation_date DATE
broker_code VARCHAR(20)     -- HSC, SSI, VCSC, FSC, MBS, VND...
broker_name VARCHAR(100)
action VARCHAR(20)          -- MUA, BÁN, NẮM GIỮ, KHẢ QUAN, TRUNG LẬP
target_price DECIMAL(12,2)
previous_target DECIMAL(12,2)
rationale TEXT
report_url VARCHAR(500)
```

**Nguồn dữ liệu:**

| Nguồn | URL | Cách lấy |
|-------|-----|----------|
| **Vietstock** | vietstock.vn/bao-cao-phan-tich | Crawl HTML |
| **CafeF** | cafef.vn/bao-cao-phan-tich | Crawl HTML |
| **Fireant** | fireant.vn | API (cần token) |
| **TCBS** | tcinvest.tcbs.com.vn | Crawl |

**Lưu ý:** Dữ liệu này thường cần crawl từ website, không có API public.

---

### 6️⃣ BẢNG `guru_stocks` - Cổ phiếu theo trường phái Guru

**Schema:**
```sql
strategy_id VARCHAR(20)     -- buffett, lynch, graham, canslim, minervini, dalio
strategy_name VARCHAR(100)
symbol VARCHAR(10)
guru_score INTEGER          -- 0-100
match_reason TEXT
metrics JSONB               -- Các chỉ số theo từng strategy
rank_in_strategy INTEGER
calculation_date DATE
```

**Tiêu chí lọc theo từng Guru:**

| Guru | Tiêu chí chính | Chỉ số cần |
|------|---------------|------------|
| **Warren Buffett** | ROE > 15%, Gross Margin > 40%, D/E < 0.5, PE hợp lý | ROE, Gross Margin, D/E, PE |
| **Peter Lynch** | PEG < 1, EPS Growth > 20%, D/E < 0.35 | PEG, EPS Growth, D/E |
| **Benjamin Graham** | PE < 15, PB < 1.5, Current Ratio > 2, Dividend > 0 | PE, PB, Current Ratio, Dividend |
| **CANSLIM** | EPS QoQ > 25%, EPS YoY > 25%, RS Rating > 80 | EPS Growth, RS Rating, Volume |
| **Mark Minervini** | Price > MA50 > MA200, RS > 70, Tight consolidation | MA50, MA200, RS, Volatility |
| **Ray Dalio** | Low Beta, Low Volatility, Dividend Yield > 3% | Beta, Volatility, Dividend |

**Ví dụ code tính Buffett Score:**
```javascript
function calculateBuffettScore(stock) {
  let score = 0;
  
  // ROE > 15% (25 điểm)
  if (stock.roe > 0.15) score += 25;
  else if (stock.roe > 0.10) score += 15;
  
  // Gross Margin > 40% (25 điểm)
  if (stock.gross_margin > 0.40) score += 25;
  else if (stock.gross_margin > 0.30) score += 15;
  
  // D/E < 0.5 (25 điểm)
  if (stock.debt_to_equity < 0.5) score += 25;
  else if (stock.debt_to_equity < 1.0) score += 15;
  
  // PE < 20 (25 điểm)
  if (stock.pe_ratio < 15) score += 25;
  else if (stock.pe_ratio < 20) score += 15;
  
  return score;
}
```

---

### 7️⃣ BẢNG `stock_ratings` - Đánh giá tổng hợp

**Schema:**
```sql
symbol VARCHAR(10)
rating_date DATE
overall_score DECIMAL(5,2)          -- 0-100
valuation_score DECIMAL(5,2)        -- Định giá
financial_health_score DECIMAL(5,2) -- Sức khỏe tài chính
business_model_score DECIMAL(5,2)   -- Mô hình kinh doanh
technical_score DECIMAL(5,2)        -- Kỹ thuật
target_price DECIMAL(12,2)
recommendation VARCHAR(20)          -- MUA, BÁN, NẮM GIỮ
```

**Cách tính:**
```javascript
function calculateStockRating(stock) {
  // Valuation Score (PE, PB, PEG)
  const valuationScore = calculateValuationScore(stock);
  
  // Financial Health (ROE, ROA, D/E, Current Ratio)
  const financialScore = calculateFinancialScore(stock);
  
  // Business Model (Gross Margin, Revenue Growth, Market Position)
  const businessScore = calculateBusinessScore(stock);
  
  // Technical (RS Rating, Trend, Volume)
  const technicalScore = calculateTechnicalScore(stock);
  
  // Overall = weighted average
  const overall = (
    valuationScore * 0.25 +
    financialScore * 0.30 +
    businessScore * 0.25 +
    technicalScore * 0.20
  );
  
  return {
    overall_score: overall,
    valuation_score: valuationScore,
    financial_health_score: financialScore,
    business_model_score: businessScore,
    technical_score: technicalScore,
    recommendation: overall > 70 ? 'MUA' : overall > 50 ? 'NẮM GIỮ' : 'BÁN'
  };
}
```

---

## 🔗 TỔNG HỢP API ENDPOINTS

### TCBS API (Khuyến nghị dùng chính)
```
Base URL: https://apipubaws.tcbs.com.vn

GET /tcanalysis/v1/ticker/{symbol}/overview          # Thông tin tổng quan
GET /tcanalysis/v1/finance/{symbol}/financialratio   # Chỉ số tài chính
GET /tcanalysis/v1/finance/{symbol}/incomestatement  # Báo cáo KQKD
GET /tcanalysis/v1/finance/{symbol}/balancesheet     # Bảng CĐKT
GET /tcanalysis/v1/finance/{symbol}/cashflow         # Lưu chuyển tiền tệ
GET /tcanalysis/v1/ticker/{symbol}/dividend-payment-histories  # Cổ tức
GET /tcanalysis/v1/ticker/{symbol}/activity-news     # Tin tức
GET /tcanalysis/v1/ticker/{symbol}/foreign-trading   # Giao dịch nước ngoài
GET /tcanalysis/v1/ticker/{symbol}/large-share-holders  # Cổ đông lớn
GET /stock-insight/v1/stock/bars-long-term           # Giá lịch sử
```

### SSI API
```
Base URL: https://iboard.ssi.com.vn

GET /dchart/api/1.1/bars?symbol={symbol}&resolution=D&from=...&to=...  # Giá
GET /dchart/api/1.1/quotes?symbols={symbols}  # Giá realtime
```

### VNDirect API
```
Base URL: https://finfo-api.vndirect.com.vn

GET /v4/stock_prices?q=code:{symbol}~date:gte:2024-01-01  # Giá
GET /v4/ratios?q=code:{symbol}  # Chỉ số tài chính
GET /v4/financial_statements?q=code:{symbol}  # Báo cáo tài chính
```

### VCI (qua vnstock Python)
```python
from vnstock3 import Vnstock

stock = Vnstock().stock(symbol='VNM', source='VCI')
stock.quote.history(start='2024-01-01', end='2024-12-20')  # Giá
stock.finance.ratio(period='quarter')  # Chỉ số tài chính
stock.finance.balance_sheet(period='quarter')  # Bảng CĐKT
stock.finance.income_statement(period='quarter')  # KQKD
stock.company.dividends()  # Cổ tức
```

---

## 📅 LỊCH SYNC DỮ LIỆU ĐỀ XUẤT

| Dữ liệu | Tần suất | Thời điểm | Ghi chú |
|---------|----------|-----------|---------|
| Giá OHLCV | Daily | 15:30 | Sau đóng cửa |
| Technical Indicators | Daily | 16:00 | Sau sync giá |
| Financial Ratios | Weekly | Chủ nhật | Hoặc sau mùa BCTC |
| Market Indices | Daily | 15:30 | Cùng với giá |
| Dividends | Weekly | Chủ nhật | Ít thay đổi |
| Stock Ratings | Daily | 17:00 | Sau tính technical |
| Guru Stocks | Weekly | Chủ nhật | Cần nhiều chỉ số |
| Broker Recommendations | Weekly | Thứ 2 | Crawl từ website |

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Rate Limiting:** Các API miễn phí có giới hạn request
   - TCBS: ~100 req/phút
   - SSI: ~60 req/phút
   - VNDirect: ~30 req/phút
   - Nên thêm delay 500ms-1s giữa các request

2. **CORS:** Nếu gọi từ browser, cần proxy hoặc gọi từ backend

3. **Data Validation:** Luôn validate dữ liệu trước khi insert
   - Check null/undefined
   - Check range hợp lệ (PE > 0, ROE trong khoảng -100% đến 100%)

4. **Error Handling:** API có thể fail, cần retry mechanism

5. **Fallback:** Nếu API chính fail, dùng API backup
   - Primary: TCBS
   - Fallback: VCI/VNDirect

---

## 📞 LIÊN HỆ

Nếu có thắc mắc về API hoặc cấu trúc database, liên hệ:
- Xem thêm file: `VIETNAM_STOCK_API_COMPLETE_RESEARCH.md`
- Xem schema: `supabase/FULL_SCHEMA.sql`

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Sync đầy đủ `financial_ratios` cho VN100 (8 quý gần nhất)
- [ ] Sync `market_indices` (VNINDEX, VN30, HNX)
- [ ] Sync `dividends` cho VN100 (5 năm)
- [ ] Tính và sync `technical_indicators` daily
- [ ] Tính và sync `stock_ratings` daily
- [ ] Tính và sync `guru_stocks` weekly
- [ ] Crawl `broker_recommendations` weekly
- [ ] Setup cron job cho auto sync


---

## 📊 PHỤ LỤC: MAPPING CHI TIẾT TCBS API → DATABASE

### A. Financial Ratios Mapping

```javascript
// TCBS API Response → financial_ratios table
const tcbsToDbMapping = {
  // Từ /tcanalysis/v1/ticker/{symbol}/overview
  'pe': 'pe_ratio',
  'pb': 'pb_ratio',
  'roe': 'roe',                    // Đã là decimal (0.28 = 28%)
  'roa': 'roa',
  'eps': 'eps',
  'bvps': 'bvps',
  'debtOnEquity': 'debt_to_equity',
  'grossProfitMargin': 'gross_margin',
  'netProfitMargin': 'net_margin',
  'revenueGrowth': 'revenue_growth',
  'netProfitGrowth': 'profit_growth',
  
  // Từ /tcanalysis/v1/finance/{symbol}/financialratio
  'priceToSales': 'ps_ratio',
  'operatingProfitMargin': 'operating_margin',
  'currentRatio': 'current_ratio',
  'returnOnSales': 'ros'
};
```

### B. Ví dụ Response TCBS

```json
// GET /tcanalysis/v1/ticker/VNM/overview
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
  "debtOnEquity": 0.35,
  "grossProfitMargin": 0.42,
  "netProfitMargin": 0.15
}
```

```json
// GET /tcanalysis/v1/finance/VNM/financialratio?yearly=0&isAll=true
[
  {
    "ticker": "VNM",
    "quarter": 3,
    "year": 2024,
    "priceToEarning": 18.5,
    "priceToBook": 4.2,
    "priceToSales": 2.8,
    "roe": 0.28,
    "roa": 0.18,
    "currentRatio": 2.1,
    "quickRatio": 1.8,
    "debtToEquity": 0.35,
    "debtToAsset": 0.25,
    "grossProfitMargin": 0.42,
    "operatingProfitMargin": 0.18,
    "netProfitMargin": 0.15,
    "earningPerShare": 4250,
    "bookValuePerShare": 18500,
    "revenueGrowth": 0.08,
    "earningGrowth": 0.12
  }
]
```

### C. Script Sync Mẫu

```javascript
// sync-financial-ratios.js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-service-key';

const VN100_SYMBOLS = ['VNM', 'VIC', 'VHM', 'HPG', 'MSN', /* ... */];

async function syncFinancialRatios() {
  for (const symbol of VN100_SYMBOLS) {
    try {
      // 1. Lấy data từ TCBS
      const response = await fetch(
        `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${symbol}/financialratio?yearly=0&isAll=true`
      );
      const data = await response.json();
      
      // 2. Transform data
      const records = data.map(item => ({
        symbol: symbol,
        year: item.year,
        quarter: item.quarter,
        pe_ratio: item.priceToEarning,
        pb_ratio: item.priceToBook,
        ps_ratio: item.priceToSales,
        roe: item.roe,
        roa: item.roa,
        ros: item.returnOnSales,
        gross_margin: item.grossProfitMargin,
        operating_margin: item.operatingProfitMargin,
        net_margin: item.netProfitMargin,
        current_ratio: item.currentRatio,
        debt_to_equity: item.debtToEquity,
        eps: item.earningPerShare,
        bvps: item.bookValuePerShare,
        revenue_growth: item.revenueGrowth,
        profit_growth: item.earningGrowth
      }));
      
      // 3. Upsert vào Supabase
      const { error } = await supabase
        .from('financial_ratios')
        .upsert(records, { onConflict: 'symbol,year,quarter' });
      
      if (error) throw error;
      console.log(`✅ ${symbol}: ${records.length} records`);
      
      // 4. Rate limiting
      await new Promise(r => setTimeout(r, 500));
      
    } catch (err) {
      console.error(`❌ ${symbol}: ${err.message}`);
    }
  }
}

syncFinancialRatios();
```

### D. Danh sách VN100 Symbols

```javascript
const VN100_SYMBOLS = [
  // VN30
  'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
  'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
  'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE',
  
  // VN70 (còn lại)
  'AAA', 'ANV', 'ASM', 'BWE', 'CII', 'CMG', 'CTD', 'DCM', 'DGC', 'DGW',
  'DIG', 'DPM', 'DXG', 'EIB', 'EVF', 'FRT', 'GEX', 'GMD', 'HAG', 'HCM',
  'HDC', 'HDG', 'HNG', 'HSG', 'HT1', 'IMP', 'KBC', 'KDC', 'KDH', 'LPB',
  'MSB', 'NKG', 'NLG', 'NT2', 'NVL', 'OCB', 'PAN', 'PC1', 'PDR', 'PHR',
  'PNJ', 'PPC', 'PVD', 'PVS', 'PVT', 'REE', 'SBT', 'SCS', 'SIP', 'SJS',
  'SSC', 'TCH', 'TLG', 'TNH', 'VCI', 'VGC', 'VHC', 'VIX', 'VND', 'VOS',
  'VPI', 'VTP', 'YEG', 'DBC', 'DHC', 'FCN', 'HAH', 'HHV', 'IDC', 'IJC'
];
```

---

## 🔧 CÔNG CỤ HỖ TRỢ

### Test API Online
- **Postman:** Import collection từ file `postman_collection.json` (nếu có)
- **Browser Console:** Có thể test trực tiếp các API TCBS, SSI

### Thư viện Python
```bash
pip install vnstock3 pandas numpy talib-binary
```

### Thư viện JavaScript
```bash
npm install @supabase/supabase-js node-fetch
```

---

## 📈 KPI HOÀN THÀNH

| Milestone | Mục tiêu | Deadline |
|-----------|----------|----------|
| M1 | Sync đầy đủ financial_ratios | Tuần 1 |
| M2 | Tính technical_indicators | Tuần 1 |
| M3 | Sync dividends + market_indices | Tuần 2 |
| M4 | Tính stock_ratings + guru_stocks | Tuần 2 |
| M5 | Setup auto sync cron | Tuần 3 |
| M6 | Crawl broker_recommendations | Tuần 3 |

---

**Good luck! 🚀**
