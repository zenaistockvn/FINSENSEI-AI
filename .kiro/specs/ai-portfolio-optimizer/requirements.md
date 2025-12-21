# Requirements Document

## Introduction

AI Portfolio Optimizer là tính năng giúp nhà đầu tư tối ưu hóa danh mục đầu tư bằng trí tuệ nhân tạo. Hệ thống phân tích danh mục hiện tại của người dùng, đánh giá rủi ro, và đề xuất phân bổ tài sản tối ưu dựa trên mục tiêu đầu tư và khẩu vị rủi ro của từng cá nhân.

## Glossary

- **Portfolio**: Danh mục đầu tư chứa các cổ phiếu và tỷ trọng tương ứng
- **Risk Profile**: Hồ sơ rủi ro của nhà đầu tư (Thận trọng, Cân bằng, Tăng trưởng, Mạo hiểm)
- **Allocation**: Phân bổ tỷ trọng vốn cho từng cổ phiếu trong danh mục
- **Rebalancing**: Tái cân bằng danh mục để đưa về tỷ trọng mục tiêu
- **Diversification Score**: Điểm đa dạng hóa danh mục (0-100)
- **Portfolio Health Score**: Điểm sức khỏe tổng thể của danh mục (0-100)
- **Expected Return**: Lợi nhuận kỳ vọng dựa trên phân tích AI
- **Risk Score**: Điểm rủi ro của danh mục (0-100)
- **Correlation Matrix**: Ma trận tương quan giữa các cổ phiếu trong danh mục
- **SENAI Score**: Điểm đánh giá AI tổng hợp cho từng cổ phiếu

## Requirements

### Requirement 1: Nhập và quản lý danh mục

**User Story:** As a nhà đầu tư, I want to nhập danh mục đầu tư hiện tại của tôi, so that AI có thể phân tích và đề xuất tối ưu hóa.

#### Acceptance Criteria

1. WHEN người dùng truy cập trang Portfolio Optimizer THEN hệ thống SHALL hiển thị form nhập danh mục với các trường: mã cổ phiếu, số lượng, giá mua trung bình
2. WHEN người dùng nhập mã cổ phiếu THEN hệ thống SHALL tự động gợi ý và validate mã cổ phiếu từ danh sách VN100
3. WHEN người dùng hoàn thành nhập danh mục THEN hệ thống SHALL tính toán và hiển thị tổng giá trị danh mục, tỷ trọng từng mã, lãi/lỗ hiện tại
4. WHEN người dùng muốn lưu danh mục THEN hệ thống SHALL lưu vào Supabase database để sử dụng lại trên mọi thiết bị
5. IF người dùng nhập mã cổ phiếu không hợp lệ THEN hệ thống SHALL hiển thị thông báo lỗi và không cho phép thêm vào danh mục

### Requirement 2: Phân tích Risk Profile

**User Story:** As a nhà đầu tư, I want to xác định hồ sơ rủi ro của mình, so that AI có thể đề xuất phù hợp với khẩu vị đầu tư.

#### Acceptance Criteria

1. WHEN người dùng bắt đầu phân tích THEN hệ thống SHALL hiển thị bộ câu hỏi đánh giá risk profile (5-7 câu hỏi)
2. WHEN người dùng hoàn thành bộ câu hỏi THEN hệ thống SHALL tính toán và phân loại vào 1 trong 4 nhóm: Thận trọng, Cân bằng, Tăng trưởng, Mạo hiểm
3. WHEN risk profile được xác định THEN hệ thống SHALL hiển thị mô tả chi tiết về đặc điểm đầu tư phù hợp với profile đó
4. WHERE người dùng đã có risk profile THEN hệ thống SHALL cho phép bỏ qua bước này và sử dụng profile đã lưu

### Requirement 3: Phân tích sức khỏe danh mục

**User Story:** As a nhà đầu tư, I want to biết sức khỏe tổng thể của danh mục, so that tôi hiểu được điểm mạnh và điểm yếu.

#### Acceptance Criteria

1. WHEN danh mục được nhập THEN hệ thống SHALL tính toán Portfolio Health Score (0-100) dựa trên: Diversification, Risk-adjusted return, Sector balance, SENAI Score trung bình
2. WHEN phân tích hoàn thành THEN hệ thống SHALL hiển thị biểu đồ radar với 5 tiêu chí: Đa dạng hóa, Rủi ro, Momentum, Chất lượng, Định giá
3. WHEN phân tích hoàn thành THEN hệ thống SHALL liệt kê top 3 điểm mạnh và top 3 điểm yếu của danh mục
4. WHEN danh mục có cổ phiếu SENAI Score dưới 35 THEN hệ thống SHALL cảnh báo về các mã có rủi ro cao

### Requirement 4: Đề xuất tối ưu hóa AI

**User Story:** As a nhà đầu tư, I want to nhận đề xuất tối ưu hóa từ AI, so that tôi có thể cải thiện hiệu suất danh mục.

#### Acceptance Criteria

1. WHEN người dùng yêu cầu tối ưu hóa THEN hệ thống SHALL phân tích và đề xuất danh mục tối ưu dựa trên risk profile
2. WHEN đề xuất được tạo THEN hệ thống SHALL hiển thị so sánh trước/sau: Expected Return, Risk Score, Diversification Score
3. WHEN đề xuất được tạo THEN hệ thống SHALL liệt kê các hành động cụ thể: Mua thêm (mã, số lượng), Bán bớt (mã, số lượng), Giữ nguyên
4. WHEN đề xuất bao gồm mã mới THEN hệ thống SHALL giải thích lý do chọn mã đó (SENAI Score, sector diversification, correlation)
5. IF danh mục đã tối ưu THEN hệ thống SHALL thông báo danh mục đã ở trạng thái tốt và không cần điều chỉnh

### Requirement 5: Phân tích tương quan và đa dạng hóa

**User Story:** As a nhà đầu tư, I want to hiểu mức độ tương quan giữa các cổ phiếu, so that tôi có thể đa dạng hóa hiệu quả.

#### Acceptance Criteria

1. WHEN danh mục có từ 2 cổ phiếu trở lên THEN hệ thống SHALL tính toán và hiển thị correlation matrix
2. WHEN có cặp cổ phiếu correlation > 0.7 THEN hệ thống SHALL cảnh báo về rủi ro tập trung
3. WHEN phân tích hoàn thành THEN hệ thống SHALL hiển thị biểu đồ phân bổ theo ngành (sector allocation pie chart)
4. WHEN một ngành chiếm > 40% danh mục THEN hệ thống SHALL cảnh báo về rủi ro tập trung ngành

### Requirement 6: Rebalancing Suggestions

**User Story:** As a nhà đầu tư, I want to nhận gợi ý tái cân bằng định kỳ, so that danh mục luôn ở trạng thái tối ưu.

#### Acceptance Criteria

1. WHEN danh mục có tỷ trọng lệch > 5% so với mục tiêu THEN hệ thống SHALL đề xuất rebalancing
2. WHEN đề xuất rebalancing THEN hệ thống SHALL tính toán số lượng cổ phiếu cần mua/bán để đạt tỷ trọng mục tiêu
3. WHEN đề xuất rebalancing THEN hệ thống SHALL ước tính chi phí giao dịch (phí + thuế)
4. WHERE người dùng thiết lập ngưỡng rebalancing THEN hệ thống SHALL chỉ đề xuất khi vượt ngưỡng đó

### Requirement 7: Hiển thị và xuất báo cáo

**User Story:** As a nhà đầu tư, I want to xem báo cáo tổng hợp và xuất ra file, so that tôi có thể lưu trữ và theo dõi.

#### Acceptance Criteria

1. WHEN phân tích hoàn thành THEN hệ thống SHALL hiển thị dashboard tổng hợp với tất cả metrics quan trọng
2. WHEN người dùng yêu cầu xuất báo cáo THEN hệ thống SHALL tạo file PDF với đầy đủ thông tin phân tích
3. WHEN hiển thị dashboard THEN hệ thống SHALL sử dụng biểu đồ trực quan: pie chart, bar chart, line chart, radar chart
4. WHEN hiển thị so sánh THEN hệ thống SHALL highlight sự khác biệt bằng màu sắc (xanh = cải thiện, đỏ = giảm)
