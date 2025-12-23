# 📊 VCI API (Vietcap Securities) - Nghiên cứu Chi tiết

> **Cập nhật:** 23/12/2024  
> **Nguồn:** Phân tích source code vnstock library

---

## 🎯 Tổng quan

**VCI API** là API internal của Vietcap Securities, được sử dụng trong thư viện `vnstock` để lấy dữ liệu chứng khoán Việt Nam.

### Thông tin Endpoints

| Endpoint | URL | Mô tả |
|----------|-----|-------|
| **Base URL** | `https://mt.vietcap.com.vn/api/` | URL gốc (cũ) |
| **Trading URL** | `https://trading.vietcap.com.vn/api/` | URL chính hiện tại |
| **GraphQL URL** | `https://trading.vietcap.com.vn/data-mt/graphql` | GraphQL endpoint |

---

## 📈 1. Lấy Giá Lịch Sử (Historical Prices)

### Endpoint
```
POST https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart
```

### Request Payload
```json
{
    "timeFrame": "ONE_DAY",
    "symbols": ["ACB"],
    "to": 1735084800,       
    "countBack": 365         
}
```

### Các giá trị timeFrame

| Input | VCI Value | Mô tả |
|-------|-----------|-------|
| `1m` | `ONE_MINUTE` | 1 phút |
| `5m` | `ONE_MINUTE` | 5 phút (resample) |
| `15m` | `ONE_MINUTE` | 15 phút (resample) |
| `30m` | `ONE_MINUTE` | 30 phút (resample) |
| `1H` | `ONE_HOUR` | 1 giờ |
| `1D` | `ONE_DAY` | 1 ngày |
| `1W` | `ONE_DAY` | 1 tuần (resample) |
| `1M` | `ONE_DAY` | 1 tháng (resample) |

### Response Format
```json
[
    {
        "t": [1735084800, 1735171200, ...],  // timestamps (giây)
        "o": [45.5, 45.7, ...],              // open (nghìn VNĐ)
        "h": [46.0, 46.2, ...],              // high
        "l": [45.0, 45.5, ...],              // low
        "c": [45.8, 46.0, ...],              // close
        "v": [1234567, 2345678, ...]         // volume
    }
]
```

### JavaScript Implementation
```javascript
async function fetchVCIHistory(symbol, countBack = 365) {
    const url = 'https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart';
    
    const endTimestamp = Math.floor(Date.now() / 1000);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
            timeFrame: 'ONE_DAY',
            symbols: [symbol],
            to: endTimestamp,
            countBack: countBack
        })
    });

    const jsonData = await response.json();
    
    if (!jsonData || !jsonData.length) return null;
    
    const symbolData = jsonData[0];
    
    // Transform to array of objects
    const prices = [];
    for (let i = 0; i < symbolData.t.length; i++) {
        prices.push({
            trading_date: new Date(symbolData.t[i] * 1000).toISOString().split('T')[0],
            open: symbolData.o[i] * 1000,      // Convert to VNĐ
            high: symbolData.h[i] * 1000,
            low: symbolData.l[i] * 1000,
            close: symbolData.c[i] * 1000,
            volume: symbolData.v[i]
        });
    }
    
    return prices;
}
```

---

## 📊 2. Lấy Danh Sách Cổ Phiếu

### Endpoint
```
GET https://trading.vietcap.com.vn/api/price/symbols/getAll
```

### Response
```json
[
    {
        "symbol": "ACB",
        "organName": "Ngân hàng TMCP Á Châu",
        "enOrganName": "Asia Commercial Bank",
        "board": "HOSE",
        "type": "STOCK"
    }
]
```

---

## 🎯 3. Lấy Danh Sách Theo Nhóm

### Endpoint
```
GET https://trading.vietcap.com.vn/api/price/symbols/getByGroup?group=VN30
```

### Các nhóm hỗ trợ
- `HOSE`, `HNX`, `UPCOM`
- `VN30`, `VN100`, `VNMidCap`, `VNSmallCap`, `VNAllShare`
- `HNX30`, `HNXCon`, `HNXFin`, `HNXLCap`, `HNXMSCap`, `HNXMan`
- `ETF`, `FU_INDEX`, `FU_BOND`, `BOND`, `CW`

---

## 📡 4. Dữ Liệu Intraday (Khớp Lệnh)

### Endpoint
```
POST https://trading.vietcap.com.vn/api/market-watch/LEData/getAll
```

### Request Payload
```json
{
    "symbol": "ACB",
    "limit": 10000,
    "truncTime": null
}
```

### Response
```json
[
    {
        "truncTime": "2024-12-23T09:15:00.123",
        "matchPrice": 45500,
        "matchVol": 1000,
        "matchType": "BUY",
        "id": "xxx"
    }
]
```

---

## 🏭 5. GraphQL - Phân Ngành ICB

### Endpoint
```
POST https://trading.vietcap.com.vn/data-mt/graphql
```

### Query
```json
{
    "query": "{ CompaniesListingInfo { ticker organName enOrganName icbName3 enIcbName3 icbName2 enIcbName2 icbName4 enIcbName4 comTypeCode icbCode1 icbCode2 icbCode3 icbCode4 __typename } }",
    "variables": {}
}
```

---

## 🔑 6. Mapping Index Code

Đối với các chỉ số thị trường:

| Input | VCI Value |
|-------|-----------|
| `VNINDEX` | `VNINDEX` |
| `HNXINDEX` | `HNXIndex` |
| `UPCOMINDEX` | `HNXUpcomIndex` |

---

## ⚠️ Lưu ý quan trọng

### 1. Đơn vị giá
- **VCI trả về giá ở đơn vị nghìn VNĐ**
- Cần nhân với 1000 để có giá thực (VNĐ)

### 2. Timestamp
- Dữ liệu `t` là Unix timestamp tính bằng **giây** (không phải milliseconds)
- Cần nhân với 1000 khi convert sang JavaScript Date

### 3. Rate Limiting
- Khuyến nghị: 1-2 requests/giây
- Delay 1-1.5 giây giữa các mã

### 4. Headers bắt buộc
```javascript
headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0...'
}
```

### 5. CORS
- API này **KHÔNG** hỗ trợ CORS từ browser
- Cần gọi qua server-side (Python, Node.js với proxy) hoặc browser của app

---

## 🛠️ Code mẫu đầy đủ (JavaScript/Browser)

Xem file: `sync-vn30-vci.html` để chạy trong browser

---

## 📚 Tài liệu tham khảo

- **vnstock GitHub:** https://github.com/thinh-vu/vnstock
- **vnstock Docs:** https://vnstocks.com
- **Source VCI module:** https://github.com/thinh-vu/vnstock/tree/main/vnstock/explorer/vci
