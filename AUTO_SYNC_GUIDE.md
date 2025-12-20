# 🚀 Hướng dẫn tự động đồng bộ dữ liệu - FinSensei AI

## ⚡ CÁCH NHANH NHẤT - Chạy trong Browser

### Bước 1: Mở FinSensei AI
- Truy cập: http://localhost:3001
- Đảm bảo ứng dụng đang chạy bình thường

### Bước 2: Mở Developer Console
- Nhấn **F12** hoặc **Ctrl+Shift+I**
- Chọn tab **Console**

### Bước 3: Copy và Paste Script
1. Mở file `browser-auto-sync.js`
2. **Copy toàn bộ nội dung** (Ctrl+A, Ctrl+C)
3. **Paste vào Console** (Ctrl+V)
4. Nhấn **Enter** để chạy

### Bước 4: Đợi hoàn thành
- Script sẽ tự động sync 30 mã VN30 quan trọng nhất
- Mỗi mã sẽ lấy 730 ngày (2 năm) dữ liệu
- Thời gian ước tính: **15-20 phút**
- Theo dõi tiến độ trong Console

### Bước 5: Tự động refresh
- Sau khi hoàn thành, trang sẽ tự động refresh
- Bạn có thể test ngay chức năng 2Y

---

## 🐍 CÁCH 2 - Sử dụng Python (Mạnh mẽ nhất)

```bash
# Cài đặt Python từ python.org/downloads
# Sau đó chạy:
pip install requests
python supabase/sync_2years_data.py
```

---

## 🌐 CÁCH 3 - Sử dụng Browser HTML

1. Mở file `sync-2years.html` trong trình duyệt
2. Nhấn nút **"🔥 BẮT ĐẦU SYNC 2 NĂM"**
3. Đợi hoàn thành

---

## 📊 Thông số kỹ thuật

### Dữ liệu sẽ được sync:
- **30 mã VN30** quan trọng nhất (Browser method)
- **120+ mã VN100** (Python method)
- **730 ngày** (2 năm) cho mỗi mã
- **~20,000+ bản ghi** dữ liệu
- **~15-30MB** dung lượng

### Timeframes được hỗ trợ:
- **1W**: 7 ngày
- **1M**: 30 ngày
- **3M**: 90 ngày
- **6M**: 180 ngày
- **1Y**: 365 ngày
- **2Y**: 730 ngày ⭐ **MỚI**

---

## 🎯 Sau khi sync xong

### Test chức năng:
1. **Hard refresh** ứng dụng (Ctrl+F5)
2. **Chọn mã cổ phiếu** (VD: VNM, VCB, FPT)
3. **Nhấn nút "2Y"** trên biểu đồ
4. **Kiểm tra** hiển thị đầy đủ 730 ngày

### Kết quả mong đợi:
- ✅ Biểu đồ nến hiển thị 730 điểm dữ liệu
- ✅ Đường MA20 mượt mà qua 2 năm
- ✅ Chỉ số RSI với nhiều chu kỳ
- ✅ Thống kê cao/thấp nhất trong 2 năm
- ✅ Phân tích xu hướng dài hạn chính xác

---

## 🔧 Troubleshooting

### Nếu gặp lỗi:
1. **CORS Error**: Chạy script trong cùng domain (localhost:3001)
2. **Network Error**: Kiểm tra kết nối internet
3. **Rate Limit**: Script đã có delay, chờ hoàn thành
4. **No Data**: Một số mã có thể không có đủ dữ liệu

### Kiểm tra kết quả:
```javascript
// Chạy trong Console để kiểm tra dữ liệu
fetch('https://trbiojajipzpqlnlghtt.supabase.co/rest/v1/stock_prices?symbol=eq.VNM&order=trading_date.desc&limit=5', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ'
  }
}).then(r => r.json()).then(console.log);
```

---

## 🎉 Hoàn thành!

Sau khi sync thành công, bạn sẽ có:
- **Dữ liệu 2 năm** cho phân tích dài hạn
- **Timeframe 2Y** hoạt động đầy đủ
- **Xu hướng chính xác** từ lịch sử giá
- **Backtesting** chiến lược hiệu quả

**Happy Trading với FinSensei AI! 📈🚀**