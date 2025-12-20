# 📈 Hướng dẫn đồng bộ dữ liệu 1 năm - FinSensei AI

## 🎯 Tổng quan
Chức năng phân tích cổ phiếu với khung thời gian 1 năm (1Y) đã được hoàn thiện. Để sử dụng đầy đủ tính năng này, bạn cần đồng bộ dữ liệu giá cổ phiếu 1 năm từ SSI API.

## ✅ Tình trạng hiện tại
- ✅ **StockAnalysis Component**: Đã hỗ trợ khung thời gian 1Y (365 ngày)
- ✅ **Supabase Client**: Đã có hàm `getStockPrices(symbol, 365)` 
- ✅ **Scripts đồng bộ**: Đã tạo sẵn Python và JavaScript
- ⏳ **Dữ liệu**: Cần chạy script để có dữ liệu 1 năm

## 🔍 Kiểm tra dữ liệu hiện tại

### Cách 1: Sử dụng file kiểm tra
1. Mở file `check-data.html` trong trình duyệt
2. Nhấn "Kiểm tra ngay" để xem tình trạng dữ liệu
3. Nhấn "Test khung thời gian" để kiểm tra từng timeframe

### Cách 2: Kiểm tra trực tiếp trong ứng dụng
1. Mở FinSensei AI: http://localhost:3001
2. Chọn một mã cổ phiếu (VD: VNM, VCB, FPT)
3. Chọn khung thời gian "1Y" trên biểu đồ
4. Xem có hiển thị đủ dữ liệu 365 ngày không

## 🚀 Đồng bộ dữ liệu 1 năm

### 🐍 Phương pháp 1: Python (Khuyến nghị)
```bash
# 1. Cài đặt Python từ https://www.python.org/downloads/
# 2. Cài đặt thư viện cần thiết
pip install requests

# 3. Chạy script đồng bộ
python supabase/sync_1year_data.py
```

**Tính năng script Python:**
- Đồng bộ 200+ mã VN100 
- Lấy dữ liệu 365 ngày cho mỗi mã
- Rate limiting để tránh bị chặn
- Batch processing cho hiệu suất tốt
- Thời gian ước tính: 15-20 phút

### 🟢 Phương pháp 2: Node.js
```bash
# 1. Cài đặt Node.js từ https://nodejs.org/
# 2. Chạy script đồng bộ
node supabase/sync-1year-data.js
```

### ⚡ Phương pháp 3: PowerShell (Windows)
```powershell
# 1. Mở PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned

# 2. Chạy script nhanh (chỉ sync 5 mã test)
.\supabase\quick-sync.ps1
```

## 📊 Cấu trúc dữ liệu

### Bảng `stock_prices`
```sql
- symbol: Mã cổ phiếu (VD: VNM, VCB)
- trading_date: Ngày giao dịch (YYYY-MM-DD)
- open_price: Giá mở cửa (VND)
- high_price: Giá cao nhất (VND)  
- low_price: Giá thấp nhất (VND)
- close_price: Giá đóng cửa (VND)
- volume: Khối lượng giao dịch
```

### Nguồn dữ liệu
- **API**: SSI iBoard (https://iboard.ssi.com.vn)
- **Độ phân giải**: Ngày (Daily)
- **Phạm vi**: 365 ngày gần nhất
- **Mã cổ phiếu**: VN100 (200+ mã)

## 🎯 Test chức năng 1Y

### Sau khi đồng bộ dữ liệu:
1. **Mở ứng dụng**: http://localhost:3001
2. **Chọn mã cổ phiếu**: VNM, VCB, FPT, HPG, VIC...
3. **Chọn timeframe**: Nhấn nút "1Y" trên biểu đồ
4. **Kiểm tra**:
   - Biểu đồ nến hiển thị ~365 điểm dữ liệu
   - Đường MA20 (trung bình động 20 ngày)
   - Chỉ số RSI bên dưới
   - Thống kê cao/thấp nhất trong năm

### Các timeframe được hỗ trợ:
- **1W**: 7 ngày
- **1M**: 30 ngày  
- **3M**: 90 ngày
- **6M**: 180 ngày
- **1Y**: 365 ngày ⭐

## 🔧 Troubleshooting

### Lỗi thường gặp:

**1. "Python/Node.js not found"**
- Cài đặt Python hoặc Node.js
- Restart Command Prompt sau khi cài

**2. "SSI API error"**
- Kiểm tra kết nối internet
- Thử lại sau vài phút (rate limiting)

**3. "Supabase error"**
- Kiểm tra API key trong script
- Đảm bảo database đã được setup

**4. "Execution Policy error" (PowerShell)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Kiểm tra logs:
- Script sẽ hiển thị tiến độ real-time
- Lỗi sẽ được ghi chi tiết
- Thống kê cuối: số mã thành công/thất bại

## 📈 Kết quả mong đợi

### Sau khi sync thành công:
- **Tổng bản ghi**: 50,000+ records
- **Số mã cổ phiếu**: 200+ symbols  
- **Khoảng thời gian**: 365 ngày
- **Dung lượng**: ~10-15MB

### Performance:
- **Load time 1Y**: < 2 giây
- **Render chart**: < 1 giây
- **Smooth scrolling**: 60fps
- **Memory usage**: < 50MB

## 🎉 Hoàn thành

Sau khi đồng bộ dữ liệu thành công, bạn có thể:

1. ✅ **Phân tích xu hướng dài hạn** với biểu đồ 1 năm
2. ✅ **So sánh performance** giữa các mã cổ phiếu
3. ✅ **Xác định support/resistance** từ lịch sử giá
4. ✅ **Đánh giá volatility** qua các giai đoạn
5. ✅ **Backtesting** chiến lược đầu tư

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra `check-data.html` để xem tình trạng dữ liệu
2. Xem logs chi tiết khi chạy script
3. Thử script PowerShell cho sync nhanh
4. Restart development server nếu cần: `npm run dev`

**Happy Trading! 📈🚀**