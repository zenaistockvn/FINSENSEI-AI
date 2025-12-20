
# 🚀 FINSENSEI AI - PROJECT BLUEPRINT (BACKEND & API SPEC)

Tài liệu này dùng để cung cấp cho AI (LLM) nhằm mục tiêu xây dựng hệ thống Backend và tích hợp API cho dự án Finsensei AI.

---

## 1. TỔNG QUAN DỰ ÁN
- **Tên:** Finsensei AI (Trợ lý Sen)
- **Mô tả:** Nền tảng Dashboard tài chính thông minh, hỗ trợ nhà đầu tư chứng khoán Việt Nam bằng AI.
- **Tính năng cốt lõi:** Phân tích cổ phiếu, Chatbot tài chính (Sen), Bộ lọc AI, Theo dõi danh mục Guru.
- **Techstack Frontend:** React, Tailwind CSS, Lucide Icons, Recharts, @google/genai.
- **Techstack Backend (Đề xuất):** Node.js (Express) hoặc Python (FastAPI/Django).

---

## 2. CÁC MÔ-ĐUN & CHỈ SỐ KỸ THUẬT (BUSINESS LOGIC)

### A. Chỉ số Sức mạnh Cổ phiếu
- **RS Rating (Relative Strength):** Xếp hạng 1-100 so với thị trường VN-Index trong 52 tuần.
- **Fundamental Score:** Điểm cơ bản (1-100) tính từ: Tăng trưởng EPS, ROE, Nợ/VCSH, Biên lợi nhuận.
- **SenAI Rating:** Điểm tổng hợp AI (Xác suất tăng giá dựa trên phân tích đa yếu tố).

### B. Bộ lọc Guru (Guru Strategy Logic)
- **Warren Buffett:** ROE > 15%, Nợ/VCSH < 0.5, Biên lãi gộp > 30%.
- **Mark Minervini (VCP):** Giá > MA200, MA200 dốc lên, Giá nằm trên MA50, RS > 80.
- **Hệ Tâm Linh:** Random chọn mã có Volume đột biến hoặc dựa trên các yếu tố phi kỹ thuật (Dành cho tính năng giải trí/vui vẻ).

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### 1. Table: `Users`
- `id` (UUID), `name`, `email`, `avatar_url`, `plan_type` (basic, vip, expert), `member_since`.

### 2. Table: `Stocks`
- `ticker` (Primary Key), `company_name`, `exchange`, `industry`, `price`, `change_percent`, `rs_rating`, `fundamental_score`, `pe`, `eps`.

### 3. Table: `Market_Indices`
- `name` (VNINDEX, VN30...), `value`, `change`, `change_percent`, `market_sentiment`.

### 4. Table: `News`
- `id`, `ticker`, `title`, `summary`, `source`, `sentiment` (positive, negative, neutral), `published_at`.

### 5. Table: `Chat_Sessions`
- `id`, `user_id`, `title`, `created_at`.
- `messages`: JSON Array [{role, text, timestamp}].

---

## 4. DANH SÁCH API ENDPOINTS (RESTFUL)

### Nhóm User & Membership
- `GET /api/user/profile`: Lấy thông tin User hiện tại.
- `POST /api/user/upgrade`: Xử lý thanh toán/nâng cấp gói VIP/Expert.

### Nhóm Dữ liệu Thị trường
- `GET /api/market/indices`: Lấy dữ liệu VNINDEX, VN30.
- `GET /api/stocks/rankings`: Lấy danh sách Top RS, Top đột biến khối lượng.
- `GET /api/stocks/:ticker`: Lấy chi tiết tài chính & kỹ thuật của 1 mã.

### Nhóm AI (Gemini Integration)
- `POST /api/ai/chat`: 
    - **Input:** `{ "message": "...", "session_id": "..." }`
    - **Logic:** Backend gọi Gemini API với `systemInstruction` của Sen.
- `POST /api/ai/screener`: 
    - **Input:** `{ "query": "Cổ phiếu thép tăng trưởng tốt" }`
    - **Logic:** AI parse query thành Filter (e.g., `industry='Steel' AND profit_growth > 20`).

---

## 5. CẤU HÌNH AI (PROMPT ENGINEERING)

**System Instruction cho Trợ lý Sen:**
> "Bạn là Sen, trợ lý tài chính thông minh của Finsensei. 
> - Xưng hô: Sen - Bạn. 
> - Kiến thức: Chuyên sâu chứng khoán Việt Nam. 
> - Định dạng: Markdown (Bảng, list, in đậm). 
> - Lưu ý: Luôn trả lời dựa trên dữ liệu thực tế, nếu không biết hãy nói 'Sen chưa tìm thấy dữ liệu chính xác cho mã này'."

---

## 6. QUY TẮC PHÂN QUYỀN (PLANS)
1. **Basic:** 10 câu chat/ngày, dữ liệu trễ 15p, không có Guru Portfolios.
2. **VIP:** Chat không giới hạn, Real-time data, AI Earnings Insight.
3. **Expert:** Tất cả tính năng VIP + Danh mục Guru + Tín hiệu sớm (Alerts).

---
*Tài liệu này được tạo bởi Finsensei AI Architect.*
