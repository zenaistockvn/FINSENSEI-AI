# 📊 CÔNG THỨC PHÂN TÍCH TỰ ĐỘNG SENAI CHO VN30

## Tổng quan

Hệ thống phân tích tự động SenAI sử dụng kết hợp **Phân tích Kỹ thuật (PTKT)** và **Phân tích Cơ bản (PTCB)** để đưa ra 3 nhóm chỉ số chính:

1. **Chẩn đoán SenAI** - Đánh giá tổng quan và tín hiệu giao dịch (Score 0-100)
2. **Xác suất & Rủi ro** - Đánh giá rủi ro và xác suất thành công
3. **Chiến lược giao dịch** - Các mức giá cụ thể để giao dịch

### 🚀 Cách sử dụng

1. Mở file `run-senai-analysis.html` trong trình duyệt
2. Click "Chạy Phân tích" để phân tích tất cả 30 mã VN30
3. Xem kết quả và xuất Excel nếu cần

---

## 1️⃣ CHẨN ĐOÁN SENAI (SenAI Diagnosis)

### Công thức tính điểm tổng hợp (0-100)

```
SENAI_SCORE = TECHNICAL_SCORE (40%) + FUNDAMENTAL_SCORE (40%) + MOMENTUM_SCORE (20%)
```

### 1.1 Technical Score (40 điểm)

| Chỉ số | Điều kiện | Điểm |
|--------|-----------|------|
| **RSI(14)** | < 30 (Quá bán) | +10 |
| | 30-40 | +5 |
| | 40-60 (Trung tính) | +3 |
| | 60-70 | 0 |
| | > 70 (Quá mua) | -5 |
| **Giá vs MA20** | Giá > MA20 | +5 |
| | Giá < MA20 | -3 |
| **Giá vs MA50** | Giá > MA50 | +5 |
| | Giá < MA50 | -3 |
| **Giá vs MA200** | Giá > MA200 | +5 |
| | Giá < MA200 | -3 |
| **MA Cross** | MA20 > MA50 (Golden Cross) | +5 |
| | MA20 < MA50 (Death Cross) | -5 |
| **Price Position** | < 30% (Gần đáy 52w) | +10 |
| (Vị trí trong range 52w) | 30-50% | +5 |
| | 50-70% | +3 |
| | > 70% (Gần đỉnh 52w) | 0 |

**Công thức Price Position:**
```
Price_Position = (Current_Price - Low_52w) / (High_52w - Low_52w) × 100
```

### 1.2 Fundamental Score (40 điểm)

| Chỉ số | Điều kiện | Điểm |
|--------|-----------|------|
| **P/E Ratio** | < 8 (Rất rẻ) | +12 |
| | 8-12 | +8 |
| | 12-15 | +5 |
| | 15-20 | +2 |
| | > 20 | -3 |
| | > 30 (Đắt) | -5 |
| **P/B Ratio** | < 1.0 | +8 |
| | 1.0-1.5 | +5 |
| | 1.5-2.5 | +2 |
| | > 3.0 | -3 |
| **ROE** | > 25% | +10 |
| | 20-25% | +8 |
| | 15-20% | +5 |
| | 10-15% | +2 |
| | < 10% | -3 |
| **EPS Growth** | > 20% YoY | +5 |
| | 10-20% YoY | +3 |
| | 0-10% YoY | +1 |
| | < 0% (Âm) | -5 |
| **Revenue Growth** | > 15% YoY | +5 |
| | 5-15% YoY | +3 |
| | < 5% YoY | 0 |

### 1.3 Momentum Score (20 điểm)

| Chỉ số | Điều kiện | Điểm |
|--------|-----------|------|
| **Price Change 1D** | > +3% | +5 |
| | +1% to +3% | +3 |
| | -1% to +1% | +1 |
| | -3% to -1% | -2 |
| | < -3% | -5 |
| **Price Change 5D** | > +5% | +5 |
| | +2% to +5% | +3 |
| | -2% to +2% | +1 |
| | < -5% | -3 |
| **Volume Ratio** | > 2.0 (Đột biến) | +5 |
| (Volume / Avg_20d) | 1.2-2.0 | +3 |
| | 0.8-1.2 | +1 |
| | < 0.5 | -2 |
| **MACD** | MACD > Signal (Bullish) | +5 |
| | MACD < Signal (Bearish) | -3 |

### 1.4 Quy đổi điểm → Tín hiệu

| Điểm SenAI | Rating | Tín hiệu | Mô tả |
|------------|--------|----------|-------|
| 80-100 | ⭐⭐⭐⭐⭐ | **MUA MẠNH** | Cơ hội tốt, cân nhắc mua ngay |
| 65-79 | ⭐⭐⭐⭐ | **MUA** | Tích cực, có thể mua dần |
| 50-64 | ⭐⭐⭐ | **THEO DÕI** | Tiềm năng, chờ điểm mua tốt |
| 35-49 | ⭐⭐ | **NẮM GIỮ** | Trung lập, giữ nguyên vị thế |
| 20-34 | ⭐ | **THẬN TRỌNG** | Rủi ro cao, cân nhắc giảm vị thế |
| 0-19 | ⚠️ | **BÁN** | Tiêu cực, nên thoát hàng |

---

## 2️⃣ XÁC SUẤT & RỦI RO (Risk Analysis)

### 2.1 Xác suất tăng giá (Upside Probability)

```
Base_Probability = 50%

Adjustments:
+ Giá > MA20: +8%
+ Giá > MA50: +7%
+ Giá > MA200: +5%
+ RSI < 40: +10%
+ RSI > 60: -8%
+ Price_Position < 30%: +10%
+ Price_Position > 70%: -5%
+ MACD > Signal: +5%
+ Volume_Ratio > 1.5: +5%
+ P/E < 15: +5%
+ ROE > 15%: +5%

Upside_Probability = Base + Sum(Adjustments)
Clamp: 15% ≤ Upside_Probability ≤ 85%
```

### 2.2 Rủi ro giảm giá (Downside Risk)

```
Downside_Risk = Min(30%, Max_Drawdown_20d × 0.6 + Volatility × 0.3)

Trong đó:
- Max_Drawdown_20d: Mức giảm tối đa trong 20 phiên gần nhất
- Volatility: Độ biến động 20 ngày (annualized)
```

### 2.3 Độ biến động (Volatility)

```
Daily_Returns[i] = (Price[i] - Price[i-1]) / Price[i-1]
Variance = Σ(Daily_Returns - Mean)² / N
Volatility_Daily = √Variance
Volatility_Annual = Volatility_Daily × √252 × 100 (%)
```

| Volatility | Mức độ | Khuyến nghị |
|------------|--------|-------------|
| < 20% | Thấp | Phù hợp đầu tư dài hạn |
| 20-35% | Trung bình | Cân bằng rủi ro/lợi nhuận |
| 35-50% | Cao | Chỉ cho trader có kinh nghiệm |
| > 50% | Rất cao | Cực kỳ rủi ro |

### 2.4 Thời gian nắm giữ tối ưu

```
if Volatility > 45%: Optimal_Days = 3-5 (Scalping)
elif Volatility > 35%: Optimal_Days = 5-10 (Swing ngắn)
elif Volatility > 25%: Optimal_Days = 10-20 (Swing)
elif Volatility > 15%: Optimal_Days = 20-60 (Position)
else: Optimal_Days = 60+ (Đầu tư)
```

### 2.5 Beta (Hệ số rủi ro thị trường)

```
Beta = Covariance(Stock_Returns, VNIndex_Returns) / Variance(VNIndex_Returns)

Đơn giản hóa:
Beta ≈ 1 + (Stock_Volatility - Market_Volatility) / 50
Clamp: 0.3 ≤ Beta ≤ 2.5
```

| Beta | Ý nghĩa |
|------|---------|
| < 0.8 | Ít biến động hơn thị trường (Defensive) |
| 0.8-1.2 | Tương đương thị trường |
| 1.2-1.5 | Biến động hơn thị trường |
| > 1.5 | Rủi ro cao, biến động mạnh |

### 2.6 Sharpe Ratio

```
Expected_Return = Price_Change_252d (% annualized)
Risk_Free_Rate = 5% (Lãi suất tiết kiệm VN)
Sharpe_Ratio = (Expected_Return - Risk_Free_Rate) / Volatility
```

| Sharpe | Đánh giá |
|--------|----------|
| > 2.0 | Xuất sắc |
| 1.0-2.0 | Tốt |
| 0.5-1.0 | Chấp nhận được |
| 0-0.5 | Kém |
| < 0 | Thua lỗ |

### 2.7 Max Drawdown

```
Max_Drawdown = Max((Peak_Price - Trough_Price) / Peak_Price × 100)

Tính trong 252 ngày (1 năm)
```

---

## 3️⃣ CHIẾN LƯỢC GIAO DỊCH (Trading Strategy)

### 3.1 Xác định vùng Hỗ trợ/Kháng cự

```python
# Support Levels
Recent_Lows = Sort(Low_Prices[0:20], ascending=True)
Support_1 = Recent_Lows[0]  # Đáy gần nhất
Support_2 = Recent_Lows[len/2]  # Đáy trung bình

# Resistance Levels  
Recent_Highs = Sort(High_Prices[0:20], descending=True)
Resistance_1 = Recent_Highs[0]  # Đỉnh gần nhất
Resistance_2 = Recent_Highs[len/2]  # Đỉnh trung bình

# Pivot Points (Công thức cổ điển)
Pivot = (High + Low + Close) / 3
R1 = 2 × Pivot - Low
R2 = Pivot + (High - Low)
S1 = 2 × Pivot - High
S2 = Pivot - (High - Low)
```

### 3.2 Vùng mua (Buy Zone)

```
Buy_Zone_Low = Support_1 × 0.99  # Dưới hỗ trợ 1%
Buy_Zone_High = Support_1 × 1.02  # Trên hỗ trợ 2%

Điều kiện mua tốt:
- Giá trong Buy Zone
- RSI < 40
- Volume tăng
- MACD cắt lên
```

### 3.3 Cắt lỗ (Stop Loss)

```
Stop_Loss = Support_2 × 0.97  # Dưới hỗ trợ 2 khoảng 3%

Hoặc theo ATR:
Stop_Loss = Entry_Price - (ATR_14 × 2)

Hoặc theo % cố định:
Stop_Loss = Entry_Price × (1 - Max_Loss%)
- Blue chip: Max_Loss = 5-7%
- Mid cap: Max_Loss = 7-10%
- Small cap: Max_Loss = 10-15%
```

### 3.4 Mục tiêu chốt lời (Take Profit)

```
Risk = Entry_Price - Stop_Loss
Reward_Ratio = 2:1 (Tối thiểu)

Target_1 = Entry_Price + Risk × 1.5  # Chốt 30% vị thế
Target_2 = Entry_Price + Risk × 2.5  # Chốt 40% vị thế  
Target_3 = Entry_Price + Risk × 4.0  # Chốt 30% còn lại

Hoặc theo Resistance:
Target_1 = Resistance_1
Target_2 = Resistance_2
Target_3 = Resistance_2 × 1.1
```

### 3.5 Loại chiến lược

| Điều kiện | Chiến lược | Mô tả |
|-----------|------------|-------|
| RSI < 30 AND Giá < MA20 | **Bắt đáy** | Mua khi có tín hiệu đảo chiều (nến đảo chiều, volume tăng) |
| RSI > 70 AND Giá > MA20 | **Chốt lời** | Bán dần tại vùng kháng cự |
| Giá > MA20 > MA50 | **Theo xu hướng** | Mua khi pullback về MA20 |
| Giá < MA20 < MA50 | **Đứng ngoài** | Không giao dịch, chờ đảo chiều |
| MA20 ≈ MA50 (±2%) | **Tích lũy** | Mua dần tại hỗ trợ, bán tại kháng cự |
| Breakout Resistance | **Breakout** | Mua khi vượt kháng cự với volume lớn |

---

## 4️⃣ BẢNG TỔNG HỢP DỮ LIỆU CẦN THIẾT

### Dữ liệu đầu vào

| Nguồn | Dữ liệu | Tần suất |
|-------|---------|----------|
| **Giá** | OHLCV (Open, High, Low, Close, Volume) | Realtime/EOD |
| **Simplize** | P/E, P/B, ROE, EPS, Market Cap | Daily |
| **Tính toán** | MA20, MA50, MA200, RSI, MACD, ATR | Daily |
| **Lịch sử** | 252 ngày (1 năm) để tính 52w High/Low | Daily |

### Công thức tính nhanh

```javascript
// RSI
function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 0; i < period; i++) {
    const change = prices[i] - prices[i + 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

// MA
function calculateMA(prices, period) {
  return prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
}

// Volatility (Annualized)
function calculateVolatility(prices, period = 20) {
  const returns = [];
  for (let i = 0; i < period - 1; i++) {
    returns.push((prices[i] - prices[i + 1]) / prices[i + 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}
```

---

## 5️⃣ VÍ DỤ THỰC TẾ

### Ví dụ: Phân tích HPG

**Dữ liệu đầu vào:**
- Giá hiện tại: 25,500
- MA20: 24,800 | MA50: 25,200 | MA200: 26,000
- RSI(14): 45
- P/E: 8.5 | P/B: 1.2 | ROE: 18%
- 52w High: 32,000 | 52w Low: 20,000
- Volume: 15M (Avg: 12M)

**Tính toán:**

1. **Technical Score:**
   - RSI 45 (trung tính): +3
   - Giá > MA20: +5
   - Giá > MA50: +5
   - Giá < MA200: -3
   - MA20 < MA50: -5
   - Price Position = (25,500-20,000)/(32,000-20,000) = 45.8%: +5
   - **Total: 10 điểm**

2. **Fundamental Score:**
   - P/E 8.5: +8
   - P/B 1.2: +5
   - ROE 18%: +5
   - **Total: 18 điểm**

3. **Momentum Score:**
   - Volume Ratio 1.25: +3
   - **Total: 3 điểm**

4. **SenAI Score = 50 + 10 + 18 + 3 = 81** → ⭐⭐⭐⭐⭐ **MUA MẠNH**

5. **Upside Probability:**
   - Base: 50%
   - Giá > MA20: +8%
   - Giá > MA50: +7%
   - RSI < 50: +5%
   - P/E < 15: +5%
   - ROE > 15%: +5%
   - **Total: 80%**

6. **Trading Strategy:**
   - Buy Zone: 24,500 - 25,000
   - Stop Loss: 23,500
   - Target 1: 27,000
   - Target 2: 29,000
   - Target 3: 32,000
   - Chiến lược: **Tích lũy** (MA20 ≈ MA50)

---

## 6️⃣ CẬP NHẬT TỰ ĐỘNG

Hệ thống sẽ tự động:
1. Lấy dữ liệu giá mới nhất từ Supabase
2. Tính toán các chỉ số kỹ thuật
3. Kết hợp với dữ liệu Simplize (P/E, P/B, ROE)
4. Chạy công thức và lưu kết quả
5. Cập nhật mỗi ngày sau 15:30 (sau khi đóng cửa)

---

*Tài liệu này được tạo bởi SenAI Analysis System*
*Cập nhật: 22/12/2024*


---

## 7️⃣ CÁC FILE LIÊN QUAN

| File | Mô tả |
|------|-------|
| `run-senai-analysis.html` | Giao diện chạy phân tích VN30 |
| `services/autoAnalysisService.ts` | Service tính toán công thức |
| `supabase/create-senai-analysis-tables.sql` | SQL tạo bảng lưu kết quả |
| `SENAI_ANALYSIS_FORMULA.md` | Tài liệu công thức (file này) |

---

## 8️⃣ BẢNG TÓM TẮT CÔNG THỨC

### Chẩn đoán SenAI (Score 0-100)

```
SENAI_SCORE = 50 (base) + TECHNICAL + FUNDAMENTAL + MOMENTUM

TECHNICAL (max ±30):
├── RSI: -5 to +10
├── MA Score: -9 to +15
├── MA Cross: -5 to +5
└── Price Position: 0 to +10

FUNDAMENTAL (max ±30):
├── P/E: -5 to +12
├── P/B: -3 to +8
└── ROE: -3 to +10

MOMENTUM (max ±15):
├── Price Change: -5 to +5
├── Volume: -2 to +5
└── MACD: -3 to +5
```

### Xác suất & Rủi ro

```
UPSIDE_PROBABILITY = 50% + Adjustments (15% - 85%)
DOWNSIDE_RISK = Min(30%, MaxDrawdown×0.6 + Volatility×0.3)
OPTIMAL_DAYS = f(Volatility)
```

### Chiến lược Giao dịch

```
BUY_ZONE = Support_1 × [0.99, 1.02]
STOP_LOSS = Support_2 × 0.97
TARGET_1 = Entry + Risk × 1.5
TARGET_2 = Entry + Risk × 2.5
TARGET_3 = Entry + Risk × 4.0
```

---

## 9️⃣ LƯU Ý QUAN TRỌNG

⚠️ **Disclaimer**: Đây là công cụ hỗ trợ phân tích, không phải khuyến nghị đầu tư. Nhà đầu tư cần tự nghiên cứu và chịu trách nhiệm với quyết định của mình.

### Hạn chế của hệ thống:
- Dựa trên dữ liệu lịch sử, không dự đoán được sự kiện bất ngờ
- Không tính đến yếu tố vĩ mô, tin tức, sentiment thị trường
- Cần kết hợp với phân tích định tính và kinh nghiệm

### Khuyến nghị sử dụng:
- Sử dụng như một trong nhiều công cụ hỗ trợ quyết định
- Luôn đặt stop loss để quản lý rủi ro
- Không all-in vào một mã duy nhất
- Theo dõi và điều chỉnh chiến lược theo thị trường

---

*Tài liệu này được tạo bởi SenAI Analysis System*
*Cập nhật: 22/12/2024*
