# 📊 Nghiên cứu API Chứng khoán Việt Nam (Miễn phí)

> Cập nhật: 21/12/2024
> Mục đích: Tìm nguồn dữ liệu miễn phí, ổn định cho FinSensei

---

## 🏆 BẢNG XẾP HẠNG API

| API | Độ tin cậy | Dữ liệu | Rate Limit | CORS | Khuyến nghị |
|-----|------------|---------|------------|------|-------------|
| **TCBS** | ⭐⭐⭐⭐⭐ | Đầy đủ nhất | Cao | ✅ | 🥇 **#1** |
| **SSI iBoard** | ⭐⭐⭐⭐ | Tốt | Trung bình | ✅ | 🥈 **#2** |
| **VNDirect** | ⭐⭐⭐⭐ | Tốt | Trung bình | ✅ | 🥉 **#3** |
| **Cafef** | ⭐⭐⭐ | Cơ bản | Thấp | ⚠️ | Backup |
| **Vietstock** | ⭐⭐⭐ | Tốt | Thấp | ❌ | Cần proxy |
| **FPTS** | ⭐⭐⭐ | Cơ bản | Trung bình | ⚠️ | Backup |

---

## 1️⃣ TCBS API (Techcombank Securities) - **KHUYẾN NGHỊ #1**

### Ưu điểm
- ✅ Không cần authentication
- ✅ Hỗ trợ CORS (gọi từ browser)
- ✅ Dữ liệu đầy đủ nhất (giá, tài chính, tin tức, phân tích)
- ✅ Rate limit cao
- ✅ Response nhanh

### Endpoints

#### 1.1 Thông tin tổng quan cổ phiếu
```
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/{symbol}/overview
```
**Response:**
```json
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
  "freeFloat": 0.85,
  "beta": 0.92,
  "dividend": 0.045,
  "revenueGrowth": 0.08,
  "netProfitGrowth": 0.12,
  "debtOnEquity": 0.35,
  "grossProfitMargin": 0.42,
  "netProfitMargin": 0.18
}
```

#### 1.2 Giá lịch sử
```
GET https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker={symbol}&type=stock&resolution=D&from={timestamp}&to={timestamp}
```
**Params:**
- `resolution`: D (ngày), W (tuần), M (tháng)
- `from`, `to`: Unix timestamp

#### 1.3 Báo cáo tài chính
```
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/{symbol}/incomestatement?yearly=0&isAll=true
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/{symbol}/balancesheet?yearly=0&isAll=true
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/{symbol}/cashflow?yearly=0&isAll=true
```

#### 1.4 Chỉ số tài chính
```
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/{symbol}/financialratio?yearly=0&isAll=true
```

#### 1.5 Tin tức
```
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/{symbol}/activity-news?page=0&size=20
```

#### 1.6 Danh sách cổ phiếu theo ngành
```
GET https://apipubaws.tcbs.com.vn/tcanalysis/v1/rating/detail/council?fType=INDUSTRY&len=100
```

#### 1.7 Giá realtime (intraday)
```
GET https://apipubaws.tcbs.com.vn/stock-insight/v1/intraday/{symbol}/his/paging?page=0&size=100
```

---

## 2️⃣ SSI iBoard API - **KHUYẾN NGHỊ #2**

### Ưu điểm
- ✅ Không cần authentication
- ✅ Hỗ trợ CORS
- ✅ Dữ liệu realtime tốt
- ✅ API ổn định

### Endpoints

#### 2.1 Thông tin cổ phiếu
```
GET https://iboard.ssi.com.vn/dchart/api/1.1/defaultSettings?code={symbol}
```
**Response:**
```json
{
  "data": {
    "code": "VNM",
    "floor": "HOSE",
    "companyName": "CTCP Sữa Việt Nam",
    "pe": 18.5,
    "pb": 4.2,
    "eps": 4250,
    "bookValue": 18500,
    "roe": 0.28,
    "roa": 0.18,
    "de": 0.35,
    "marketCap": 185000,
    "volume": 1234567,
    "foreignBuy": 50000,
    "foreignSell": 30000
  }
}
```

#### 2.2 Giá lịch sử
```
GET https://iboard.ssi.com.vn/dchart/api/1.1/bars?resolution=D&symbol={symbol}&from={timestamp}&to={timestamp}
```

#### 2.3 Danh sách cổ phiếu
```
GET https://iboard.ssi.com.vn/dchart/api/1.1/search?limit=1000&type=stock&exchange=
```

#### 2.4 Bảng giá realtime
```
GET https://iboard.ssi.com.vn/dchart/api/1.1/quotes?symbols={symbol1},{symbol2}
```

---

## 3️⃣ VNDirect API - **KHUYẾN NGHỊ #3**

### Ưu điểm
- ✅ Dữ liệu chính xác
- ✅ API documentation tốt
- ✅ Hỗ trợ CORS

### Endpoints

#### 3.1 Thông tin cổ phiếu
```
GET https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date&q=code:{symbol}~date:gte:2024-01-01&size=1000
```

#### 3.2 Chỉ số tài chính
```
GET https://finfo-api.vndirect.com.vn/v4/ratios?q=code:{symbol}&size=100
```

#### 3.3 Báo cáo tài chính
```
GET https://finfo-api.vndirect.com.vn/v4/financial_statements?q=code:{symbol}~reportType:BS&size=20
```

#### 3.4 Tin tức
```
GET https://finfo-api.vndirect.com.vn/v4/news?q=code:{symbol}&size=20
```

---

## 4️⃣ Wichart (Vietcap) API

### Endpoints

#### 4.1 Giá lịch sử
```
GET https://wichart.vn/api/price/history?symbol={symbol}&resolution=D&from={timestamp}&to={timestamp}
```

#### 4.2 Thông tin công ty
```
GET https://wichart.vn/api/company/overview?symbol={symbol}
```

---

## 5️⃣ Cafef API

### Lưu ý
- ⚠️ Cần xử lý CORS (dùng proxy hoặc server-side)
- Rate limit thấp

### Endpoints

#### 5.1 Giá cổ phiếu
```
GET https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol={symbol}&StartDate=01/01/2024&EndDate=21/12/2024
```

#### 5.2 Thông tin công ty
```
GET https://s.cafef.vn/Ajax/Company.ashx?symbol={symbol}
```

---

## 6️⃣ FPTS API

### Endpoints

#### 6.1 Giá lịch sử
```
GET https://eztrade.fpts.com.vn/api/v1/stock/history?symbol={symbol}&from=2024-01-01&to=2024-12-21
```

---

## 7️⃣ Fireant API

### Lưu ý
- Cần token (có thể dùng token public)

### Endpoints

#### 7.1 Fundamental
```
GET https://restv2.fireant.vn/symbols/{symbol}/fundamental
Headers: Authorization: Bearer {token}
```

#### 7.2 Giá lịch sử
```
GET https://restv2.fireant.vn/symbols/{symbol}/historical-quotes?startDate=2024-01-01&endDate=2024-12-21
```

---

## 📋 DỮ LIỆU CẦN CHO FINSENSEI

### Bảng mapping API → Database

| Dữ liệu cần | Bảng DB | API tốt nhất | Backup API |
|-------------|---------|--------------|------------|
| Giá lịch sử | `stock_prices` | TCBS | SSI, VNDirect |
| Thông tin công ty | `companies` | TCBS | SSI |
| Chỉ số tài chính | `financial_ratios` | **TCBS** | VNDirect |
| Báo cáo tài chính | `financial_statements` | TCBS | VNDirect |
| Tin tức | `stock_news` | TCBS | VNDirect |
| Chỉ số thị trường | `market_indices` | SSI | TCBS |

---

## 🔧 CODE MẪU - FETCH TỪ TCBS

```javascript
// Lấy chỉ số tài chính từ TCBS
async function fetchFinancialRatios(symbol) {
  const url = `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol}/overview`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    return {
      symbol: symbol,
      pe_ratio: data.pe,
      pb_ratio: data.pb,
      roe: data.roe,
      roa: data.roa,
      eps: data.eps,
      bvps: data.bvps,
      debt_to_equity: data.debtOnEquity,
      revenue_growth: data.revenueGrowth,
      profit_growth: data.netProfitGrowth,
      gross_margin: data.grossProfitMargin,
      net_margin: data.netProfitMargin,
      market_cap: data.marketCap,
      dividend_yield: data.dividend
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// Lấy giá lịch sử từ TCBS
async function fetchPriceHistory(symbol, fromDate, toDate) {
  const from = Math.floor(new Date(fromDate).getTime() / 1000);
  const to = Math.floor(new Date(toDate).getTime() / 1000);
  
  const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${symbol}&type=stock&resolution=D&from=${from}&to=${to}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.data.map(item => ({
      symbol: symbol,
      trading_date: new Date(item.tradingDate).toISOString().split('T')[0],
      open_price: item.open,
      high_price: item.high,
      low_price: item.low,
      close_price: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error);
    return [];
  }
}
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Rate Limiting
- **TCBS**: ~100 requests/phút (an toàn)
- **SSI**: ~60 requests/phút
- **VNDirect**: ~30 requests/phút
- **Cafef**: ~10 requests/phút (rất hạn chế)

### Best Practices
1. **Delay giữa requests**: 300-500ms
2. **Retry logic**: 3 lần với exponential backoff
3. **Caching**: Cache dữ liệu ít thay đổi (company info)
4. **Fallback**: Luôn có API backup

### CORS Issues
- TCBS, SSI, VNDirect: ✅ Gọi trực tiếp từ browser
- Cafef, Vietstock: ❌ Cần proxy server

---

## 🎯 KHUYẾN NGHỊ CHO FINSENSEI

### Primary Sources (Ưu tiên)
1. **TCBS** - Dữ liệu tài chính, giá, tin tức
2. **SSI** - Backup và realtime data

### Sync Strategy
```
1. Financial Ratios: TCBS → fallback SSI
2. Price History: TCBS → fallback SSI  
3. Company Info: TCBS → fallback SSI
4. News: TCBS → fallback VNDirect
```

### Tần suất sync
- **Giá**: Mỗi 15 phút (trong giờ giao dịch)
- **Chỉ số tài chính**: Mỗi ngày 1 lần
- **Tin tức**: Mỗi 30 phút
- **Báo cáo tài chính**: Mỗi quý

---

## 📝 TODO

- [ ] Tạo sync script dùng TCBS API
- [ ] Implement fallback mechanism
- [ ] Setup cron job cho auto-sync
- [ ] Monitor API health
