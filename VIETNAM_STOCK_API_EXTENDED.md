# 📊 NGUỒN API CHỨNG KHOÁN VIỆT NAM - MỞ RỘNG

> Cập nhật: 21/12/2024

---

## 🆕 CÁC NGUỒN MỚI TÌM ĐƯỢC

### 1️⃣ VietstockFinance API

**Base URL:** `https://finance.vietstock.vn`

```javascript
// Giá lịch sử
GET https://finance.vietstock.vn/data/gettradingresult
  ?Code={symbol}
  &OrderBy=
  &OrderDirection=desc
  &PageIndex=1
  &PageSize=1000
  &FromDate=2015-01-01
  &ToDate=2024-12-21

// Chỉ số tài chính
GET https://finance.vietstock.vn/data/financeinfo
  ?Code={symbol}
  &ReportType=CDKT  // CDKT, KQKD, LCTT
  &ReportTermType=1  // 1=Quý, 2=Năm

// Thông tin công ty
GET https://finance.vietstock.vn/data/companyinfo?code={symbol}
```

**Lưu ý:** Cần cookie/session, có thể cần đăng nhập

---

### 2️⃣ StockBiz API

**Base URL:** `https://api.stockbiz.vn`

```javascript
// Giá lịch sử
GET https://api.stockbiz.vn/api/stock/history/{symbol}
  ?from=2015-01-01
  &to=2024-12-21

// Thông tin cổ phiếu
GET https://api.stockbiz.vn/api/stock/info/{symbol}
```

---

### 3️⃣ 24HMoney API

**Base URL:** `https://api-finance-t19.24hmoney.vn`

```javascript
// Giá lịch sử
GET https://api-finance-t19.24hmoney.vn/v2/web/stock/histories-price
  ?symbol={symbol}
  &from=2015-01-01
  &to=2024-12-21

// Chỉ số tài chính
GET https://api-finance-t19.24hmoney.vn/v2/web/stock/financial-ratio
  ?symbol={symbol}

// Báo cáo tài chính
GET https://api-finance-t19.24hmoney.vn/v2/web/stock/financial-report
  ?symbol={symbol}
  &type=balance  // balance, income, cashflow
```

---

### 4️⃣ VPS Securities API

**Base URL:** `https://bgapidatafeed.vps.com.vn`

```javascript
// Giá lịch sử
GET https://bgapidatafeed.vps.com.vn/getliststockdata/{symbol}/D
  ?from={timestamp}
  &to={timestamp}

// Thông tin cổ phiếu
GET https://bgapidatafeed.vps.com.vn/getlistallstock
```

---

### 5️⃣ MBS Securities API

**Base URL:** `https://api.mbs.com.vn`

```javascript
// Giá lịch sử
GET https://api.mbs.com.vn/api/v1/stock/history
  ?symbol={symbol}
  &from=2015-01-01
  &to=2024-12-21
```

---

### 6️⃣ DNSE (Chứng khoán Đại Nam) API

**Base URL:** `https://api.dnse.com.vn`

```javascript
// Giá lịch sử
GET https://dchart-api.vndirect.com.vn/dchart/history
  ?symbol={symbol}
  &resolution=D
  &from={timestamp}
  &to={timestamp}
```

---

### 7️⃣ Investing.com Vietnam

**Base URL:** `https://api.investing.com`

```javascript
// Cần reverse engineer, có data VN stocks
// Dữ liệu từ 2000+
```

---

### 8️⃣ TradingView (Unofficial)

**Base URL:** `https://scanner.tradingview.com`

```javascript
// Screener data
POST https://scanner.tradingview.com/vietnam/scan
{
  "filter": [{"left": "exchange", "operation": "in_range", "right": ["HOSE", "HNX"]}],
  "symbols": {"query": {"types": []}, "tickers": []},
  "columns": ["name", "close", "volume", "market_cap_basic", "price_earnings_ttm"]
}
```

---

### 9️⃣ Yahoo Finance (Vietnam)

```javascript
// Cần thêm .VN suffix
GET https://query1.finance.yahoo.com/v8/finance/chart/VNM.VN
  ?period1={timestamp}
  &period2={timestamp}
  &interval=1d

// Có P/E, Market Cap
GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/VNM.VN
  ?modules=summaryDetail,defaultKeyStatistics,financialData
```

**Ưu điểm:** Có fundamental data (P/E, P/B, Market Cap)
**Nhược điểm:** Không đầy đủ tất cả mã VN

---

### 🔟 Finnhub (Free tier)

```javascript
// Cần API key (miễn phí)
GET https://finnhub.io/api/v1/stock/candle
  ?symbol=VNM.VN
  &resolution=D
  &from={timestamp}
  &to={timestamp}
  &token={API_KEY}

// Basic financials
GET https://finnhub.io/api/v1/stock/metric
  ?symbol=VNM.VN
  &metric=all
  &token={API_KEY}
```

---

## 💰 API TRẢ PHÍ

### 1. Simplize Pro
- **Website:** https://simplize.vn
- **Chi phí:** 500k-2M/tháng
- **Dữ liệu:** 2000+, đầy đủ nhất

### 2. Entrade X
- **Website:** https://entrade.com.vn
- **Chi phí:** Theo gói
- **Dữ liệu:** Realtime, institutional grade

### 3. FiinPro
- **Website:** https://fiingroup.vn
- **Chi phí:** Cao (doanh nghiệp)
- **Dữ liệu:** Chuyên nghiệp nhất VN

### 4. StoxPlus
- **Website:** https://stoxplus.com
- **Chi phí:** Cao
- **Dữ liệu:** Research grade

---

## 📊 BẢNG SO SÁNH MỞ RỘNG

| API | Giá | P/E,P/B | BCTC | Miễn phí | CORS | Ổn định |
|-----|-----|---------|------|----------|------|---------|
| **TCBS** | ✅ 2015+ | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **VCI** | ✅ 2012+ | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **SSI** | ✅ 2010+ | ⚠️ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **VNDirect** | ✅ 2010+ | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐ |
| **Vietstock** | ✅ 2007+ | ✅ | ✅ | ⚠️ | ❌ | ⭐⭐⭐ |
| **24HMoney** | ✅ 2010+ | ✅ | ✅ | ✅ | ⚠️ | ⭐⭐⭐ |
| **VPS** | ✅ 2015+ | ❌ | ❌ | ✅ | ⚠️ | ⭐⭐⭐ |
| **Yahoo** | ✅ 2010+ | ✅ | ⚠️ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **TradingView** | ✅ | ✅ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **Fireant** | ✅ 2007+ | ✅ | ✅ | ✅ | ⚠️ | ⭐⭐⭐ |
| **Cafef** | ✅ 2007+ | ⚠️ | ⚠️ | ✅ | ❌ | ⭐⭐ |
| **Simplize** | ✅ 2000+ | ✅ | ✅ | ❌ | ✅ | ⭐⭐⭐⭐⭐ |

---

## 🎯 KHUYẾN NGHỊ THEO MỤC ĐÍCH

### Cần giá lịch sử dài (2000+):
1. **Simplize** (trả phí) - Tốt nhất
2. **AmiBroker** (export) - One-time cost
3. **Vietstock** (crawl) - Miễn phí nhưng khó

### Cần P/E, P/B, ROE realtime:
1. **TCBS** - Tốt nhất, miễn phí
2. **VCI (vnstock)** - Ổn định
3. **Yahoo Finance** - Backup quốc tế

### Cần báo cáo tài chính đầy đủ:
1. **TCBS** - Income, Balance, Cashflow
2. **VNDirect** - Đầy đủ
3. **24HMoney** - Backup

### Cần realtime trong giờ giao dịch:
1. **SSI iBoard** - Tốt nhất
2. **VPS** - Nhanh
3. **TCBS** - Ổn định

---

## 🔧 CODE TEST CÁC API MỚI

```javascript
// Test Yahoo Finance VN
async function testYahooVN(symbol) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}.VN?modules=summaryDetail,defaultKeyStatistics`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.quoteSummary.result[0]);
}

// Test TradingView Scanner
async function testTradingView() {
  const url = 'https://scanner.tradingview.com/vietnam/scan';
  const body = {
    filter: [{ left: "exchange", operation: "in_range", right: ["HOSE"] }],
    columns: ["name", "close", "volume", "price_earnings_ttm", "price_book_ratio"],
    range: [0, 50]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log(data);
}

// Test 24HMoney
async function test24HMoney(symbol) {
  const url = `https://api-finance-t19.24hmoney.vn/v2/web/stock/financial-ratio?symbol=${symbol}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}
```

---

## ✅ KẾT LUẬN

### Combo tốt nhất (Miễn phí):
1. **Giá OHLCV:** TCBS → VCI → SSI (fallback chain)
2. **P/E, P/B, ROE:** TCBS → Yahoo Finance
3. **Báo cáo TC:** TCBS → VNDirect
4. **Realtime:** SSI iBoard

### Nếu cần data 2000+:
- **Option 1:** Simplize (~1M/tháng)
- **Option 2:** AmiBroker export (one-time ~$300)
- **Option 3:** Crawl Vietstock/Cafef (free nhưng khó)

Anh muốn em test API nào cụ thể không?
