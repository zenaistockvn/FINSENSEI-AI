# 📊 Hướng dẫn Sync dữ liệu từ vnstock API (Nguồn VCI)

## 🎯 Tổng quan

**vnstock** là thư viện Python mã nguồn mở để lấy dữ liệu chứng khoán Việt Nam.

### Các nguồn dữ liệu:
| Nguồn | Mô tả | Chất lượng | Khuyến nghị |
|-------|-------|------------|-------------|
| **VCI** | Vietcap Securities | ⭐⭐⭐⭐⭐ | ✅ **KHUYẾN NGHỊ** |
| SSI | SSI Securities | ⭐⭐⭐⭐ | Backup |
| TCBS | Techcombank Securities | ⭐⭐⭐ | Backup |

### Tại sao chọn VCI?
- ✅ Dữ liệu chất lượng cao từ Vietcap Securities
- ✅ API ổn định, ít downtime
- ✅ Cập nhật real-time trong giờ giao dịch
- ✅ Đầy đủ: giá, công ty, tài chính, cổ tức

---

## 🚀 CÁCH 1: Sử dụng Browser (Nhanh nhất - Không cần Python)

### Bước 1: Mở file sync
```
sync-vci-browser.html
```

### Bước 2: Nhấn nút sync
```
"🚀 Bắt đầu Sync VCI"
```

### Bước 3: Đợi hoàn thành
- **Thời gian**: 15-25 phút
- **Dữ liệu**: 100 mã VN100 + 4 chỉ số thị trường
- **Khoảng thời gian**: 730 ngày (2 năm)

### Ưu điểm:
- ✅ Không cần cài Python
- ✅ Giao diện trực quan
- ✅ Theo dõi tiến độ real-time

---

## 🐍 CÁCH 2: Sử dụng Python (Đầy đủ nhất - Khuyến nghị)

### Bước 1: Cài đặt Python
Tải từ: https://www.python.org/downloads/

### Bước 2: Cài đặt thư viện
```bash
pip install vnstock3 requests pandas
```

### Bước 3: Chạy script sync VCI tối ưu
```bash
python supabase/sync_vci_optimized.py
```

### Kết quả:
- **100 mã VN100** với dữ liệu 2 năm
- **Company info** cho mỗi mã
- **Financial ratios** (P/E, P/B, ROE, ROA, EPS...)
- **Dividends** (lịch sử cổ tức)
- **Market indices** (VNINDEX, VN30, HNX, UPCOM)

### Ưu điểm:
- ✅ Dữ liệu đầy đủ nhất (giá + tài chính + cổ tức)
- ✅ Sử dụng trực tiếp vnstock API
- ✅ Xử lý lỗi tốt hơn
- ✅ Log chi tiết

---

## 📊 Dữ liệu được sync từ VCI

### 1. Stock Prices (Giá cổ phiếu)
```
- symbol: Mã cổ phiếu
- trading_date: Ngày giao dịch
- open_price: Giá mở cửa
- high_price: Giá cao nhất
- low_price: Giá thấp nhất
- close_price: Giá đóng cửa
- volume: Khối lượng
```

### 2. Companies (Thông tin công ty)
```
- symbol: Mã cổ phiếu
- company_name: Tên công ty
- exchange: Sàn giao dịch (HOSE, HNX, UPCOM)
- industry: Ngành nghề
- sector: Lĩnh vực
- outstanding_shares: Số cổ phiếu lưu hành
- website: Website công ty
```

### 3. Financial Ratios (Chỉ số tài chính)
```
- pe_ratio: P/E (Price to Earnings)
- pb_ratio: P/B (Price to Book)
- roe: Return on Equity
- roa: Return on Assets
- eps: Earnings Per Share
- gross_margin: Biên lợi nhuận gộp
- net_margin: Biên lợi nhuận ròng
- debt_to_equity: Nợ/Vốn CSH
```

### 4. Market Indices (Chỉ số thị trường)
```
- VNINDEX: Chỉ số VN-Index
- VN30: Chỉ số VN30
- HNX: Chỉ số HNX
- UPCOM: Chỉ số UPCOM
```

### 5. Dividends (Cổ tức) - Chỉ có khi dùng Python
```
- ex_date: Ngày GDKHQ
- record_date: Ngày chốt quyền
- payment_date: Ngày thanh toán
- cash_dividend: Cổ tức tiền mặt
- stock_dividend_ratio: Tỷ lệ cổ tức cổ phiếu
```

---

## 🎯 Sau khi sync xong

### 1. Mở FinSensei AI
```
http://localhost:3001
```

### 2. Hard refresh
```
Ctrl + F5
```

### 3. Test các tính năng
- Chọn mã cổ phiếu (VNM, VCB, FPT...)
- Test timeframes: 1W, 1M, 3M, 6M, 1Y, 2Y
- Xem chỉ số tài chính
- Phân tích AI

---

## 💡 Lưu ý quan trọng

### Rate Limiting
- vnstock API có giới hạn request
- Script đã có delay tự động (1.5 giây/request)
- Không chạy nhiều script cùng lúc

### Dữ liệu
- Dữ liệu cập nhật sau 15:00 mỗi ngày
- Cuối tuần không có dữ liệu mới
- Một số mã có thể thiếu dữ liệu (đã hủy niêm yết)

### Troubleshooting
```bash
# Nếu gặp lỗi import
pip install --upgrade vnstock3

# Nếu gặp lỗi SSL
pip install --upgrade certifi

# Nếu gặp lỗi timeout
# Chạy lại script, nó sẽ tiếp tục từ chỗ dừng

# Nếu gặp lỗi CORS (browser)
# Sử dụng Python script thay vì browser
```

### So sánh các cách sync

| Tính năng | Browser | Python |
|-----------|---------|--------|
| Cài đặt | Không cần | Cần Python |
| Giá cổ phiếu | ✅ | ✅ |
| Thông tin công ty | ❌ | ✅ |
| Chỉ số tài chính | ❌ | ✅ |
| Cổ tức | ❌ | ✅ |
| Chỉ số thị trường | ✅ | ✅ |
| Tốc độ | Nhanh | Chậm hơn |
| Độ tin cậy | Tốt | Rất tốt |

---

## 📈 Kết quả mong đợi

### Sau khi sync thành công:
- ✅ **50,000+ bản ghi** giá cổ phiếu (2 năm x 100 mã)
- ✅ **100 công ty** với thông tin đầy đủ
- ✅ **800+ bản ghi** chỉ số tài chính (8 quý x 100 mã)
- ✅ **2,000+ bản ghi** chỉ số thị trường
- ✅ **Dữ liệu 2 năm** cho phân tích dài hạn

### Tính năng sẵn sàng:
- ✅ Biểu đồ nến chuyên nghiệp
- ✅ Chỉ số kỹ thuật (MA, RSI, MACD, Bollinger...)
- ✅ Phân tích AI với dữ liệu thực
- ✅ Cảnh báo giá
- ✅ So sánh cổ phiếu
- ✅ Screening theo chỉ số tài chính

---

## 📚 Tài liệu tham khảo

- **vnstock GitHub:** https://github.com/thinh-vu/vnstock
- **vnstock Docs:** https://docs.vnstock.site/
- **VCI (Vietcap):** https://www.vietcap.com.vn/
- **Chi tiết VCI API:** Xem file `VNSTOCK_VCI_RESEARCH.md`

---

## 🚀 Bắt đầu ngay!

**Cách nhanh nhất:** Mở `sync-vci-browser.html` và nhấn "Bắt đầu Sync VCI"

**Cách đầy đủ nhất:** Chạy `python supabase/sync_vci_optimized.py`

Dữ liệu chất lượng cao từ VCI sẽ giúp FinSensei AI hoạt động tốt nhất! 📊🎯