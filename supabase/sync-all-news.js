// Sync All Stock News - Vietnamese with links
const NEWS = [
  // General market news
  { symbol: null, title: 'VN-Index vượt mốc 1,280 điểm, thanh khoản tăng mạnh', summary: 'Thị trường chứng khoán Việt Nam tiếp tục đà tăng với thanh khoản cải thiện đáng kể. Nhóm cổ phiếu ngân hàng và bất động sản dẫn dắt thị trường.', source: 'CafeF', url: 'https://cafef.vn/thi-truong-chung-khoan.chn', sentiment: 'positive', category: 'market', ai_summary: 'Thị trường tích cực, dòng tiền mạnh hỗ trợ xu hướng tăng.' },
  { symbol: null, title: 'NHNN giữ nguyên lãi suất điều hành, hỗ trợ tăng trưởng', summary: 'Ngân hàng Nhà nước quyết định giữ nguyên các mức lãi suất điều hành nhằm hỗ trợ tăng trưởng kinh tế.', source: 'VnExpress', url: 'https://vnexpress.net/nhnn-giu-nguyen-lai-suat.html', sentiment: 'positive', category: 'macro', ai_summary: 'Chính sách tiền tệ ổn định, thuận lợi cho thị trường chứng khoán.' },
  { symbol: null, title: 'Khối ngoại mua ròng hơn 500 tỷ đồng trong phiên', summary: 'Dòng tiền từ các quỹ ETF ngoại tiếp tục chảy vào thị trường Việt Nam, tập trung vào nhóm vốn hóa lớn.', source: 'Vietstock', url: 'https://vietstock.vn/khoi-ngoai-mua-rong.htm', sentiment: 'positive', category: 'market', ai_summary: 'Dòng tiền ngoại ổn định là yếu tố hỗ trợ giá quan trọng.' },

  // VNM
  { symbol: 'VNM', title: 'Vinamilk công bố kết quả kinh doanh Q4/2024 vượt kỳ vọng', summary: 'Doanh thu và lợi nhuận của Vinamilk trong quý 4/2024 đều vượt dự báo của giới phân tích, nhờ chiến lược mở rộng thị trường xuất khẩu.', source: 'CafeF', url: 'https://cafef.vn/vnm-ket-qua-kinh-doanh-q4-2024.chn', sentiment: 'positive', category: 'earnings', ai_summary: 'Kết quả kinh doanh tích cực, tác động tốt đến tâm lý nhà đầu tư.' },
  { symbol: 'VNM', title: 'Vinamilk đẩy mạnh xuất khẩu sang thị trường Trung Quốc', summary: 'Công ty đang mở rộng kênh phân phối tại Trung Quốc, kỳ vọng tăng trưởng doanh thu xuất khẩu 20% trong năm 2025.', source: 'VnExpress', url: 'https://vnexpress.net/vinamilk-xuat-khau-trung-quoc.html', sentiment: 'positive', category: 'business', ai_summary: 'Chiến lược mở rộng giúp đa dạng hóa nguồn thu, giảm rủi ro tập trung.' },

  // FPT
  { symbol: 'FPT', title: 'FPT ký hợp đồng AI trị giá 100 triệu USD với đối tác Nhật Bản', summary: 'FPT Corporation vừa ký kết hợp đồng cung cấp giải pháp AI cho một tập đoàn công nghệ lớn của Nhật Bản, trị giá 100 triệu USD trong 5 năm.', source: 'Tinnhanhchungkhoan', url: 'https://tinnhanhchungkhoan.vn/fpt-hop-dong-ai-nhat-ban.html', sentiment: 'positive', category: 'business', ai_summary: 'Hợp đồng lớn khẳng định năng lực AI của FPT trên thị trường quốc tế.' },
  { symbol: 'FPT', title: 'FPT đặt mục tiêu doanh thu 2025 tăng 25%', summary: 'Ban lãnh đạo FPT đặt kế hoạch tăng trưởng doanh thu 25% trong năm 2025, tập trung vào mảng chuyển đổi số và AI.', source: 'Vietstock', url: 'https://vietstock.vn/fpt-ke-hoach-2025.htm', sentiment: 'positive', category: 'guidance', ai_summary: 'Mục tiêu tham vọng phản ánh niềm tin vào triển vọng tăng trưởng.' },

  // VCB
  { symbol: 'VCB', title: 'Vietcombank dẫn đầu lợi nhuận ngành ngân hàng năm 2024', summary: 'Vietcombank tiếp tục giữ vị trí quán quân về lợi nhuận trong ngành ngân hàng với LNTT ước đạt 42,000 tỷ đồng.', source: 'CafeF', url: 'https://cafef.vn/vcb-loi-nhuan-2024.chn', sentiment: 'positive', category: 'earnings', ai_summary: 'Vị thế dẫn đầu ngành được củng cố, triển vọng tích cực.' },
  { symbol: 'VCB', title: 'VCB được nâng hạng tín nhiệm bởi Moody\'s', summary: 'Moody\'s nâng xếp hạng tín nhiệm của Vietcombank lên mức Ba1, phản ánh sức khỏe tài chính vững mạnh.', source: 'VnExpress', url: 'https://vnexpress.net/vcb-nang-hang-tin-nhiem.html', sentiment: 'positive', category: 'business', ai_summary: 'Nâng hạng tín nhiệm là tín hiệu tích cực cho cổ phiếu VCB.' },

  // MBB
  { symbol: 'MBB', title: 'MB Bank mở rộng mạng lưới chi nhánh tại miền Nam', summary: 'Ngân hàng Quân đội tiếp tục chiến lược mở rộng với 10 chi nhánh mới tại TP.HCM và các tỉnh miền Nam.', source: 'Tinnhanhchungkhoan', url: 'https://tinnhanhchungkhoan.vn/mbb-mo-rong-mien-nam.html', sentiment: 'positive', category: 'business', ai_summary: 'Mở rộng mạng lưới giúp tăng thị phần và tiếp cận khách hàng.' },
  { symbol: 'MBB', title: 'MBB đẩy mạnh ngân hàng số, tăng trưởng người dùng 40%', summary: 'Ứng dụng MB Bank ghi nhận tăng trưởng người dùng mới 40% trong năm 2024, dẫn đầu về trải nghiệm số.', source: 'VnEconomy', url: 'https://vneconomy.vn/mbb-ngan-hang-so.htm', sentiment: 'positive', category: 'business', ai_summary: 'Chuyển đổi số thành công, tạo lợi thế cạnh tranh dài hạn.' },

  // TCB
  { symbol: 'TCB', title: 'Techcombank: Tỷ lệ CASA duy trì trên 40%', summary: 'Techcombank tiếp tục duy trì tỷ lệ tiền gửi không kỳ hạn (CASA) ở mức cao nhất ngành, giúp tối ưu chi phí vốn.', source: 'Vietstock', url: 'https://vietstock.vn/tcb-casa-cao-nhat-nganh.htm', sentiment: 'positive', category: 'financials', ai_summary: 'CASA cao giúp TCB có lợi thế về chi phí vốn so với đối thủ.' },
  { symbol: 'TCB', title: 'TCB ra mắt sản phẩm cho vay mua nhà lãi suất ưu đãi', summary: 'Techcombank triển khai gói cho vay mua nhà với lãi suất chỉ từ 6.5%/năm trong 2 năm đầu.', source: 'CafeF', url: 'https://cafef.vn/tcb-cho-vay-mua-nha.chn', sentiment: 'positive', category: 'business', ai_summary: 'Sản phẩm mới giúp tăng trưởng tín dụng bán lẻ.' },

  // ACB
  { symbol: 'ACB', title: 'ACB tăng cường cho vay tiêu dùng, mở rộng thị phần bán lẻ', summary: 'Ngân hàng ACB đẩy mạnh phân khúc cho vay tiêu dùng với các sản phẩm mới, hướng tới mục tiêu tăng trưởng tín dụng 15%.', source: 'CafeF', url: 'https://cafef.vn/acb-cho-vay-tieu-dung.chn', sentiment: 'positive', category: 'business', ai_summary: 'Chiến lược bán lẻ giúp đa dạng hóa nguồn thu và giảm rủi ro.' },

  // MSN
  { symbol: 'MSN', title: 'Masan hoàn tất tái cấu trúc, tập trung vào ngành hàng tiêu dùng', summary: 'Tập đoàn Masan đã hoàn tất quá trình tái cấu trúc, tập trung nguồn lực vào mảng bán lẻ và hàng tiêu dùng thiết yếu.', source: 'VnExpress', url: 'https://vnexpress.net/masan-tai-cau-truc.html', sentiment: 'neutral', category: 'business', ai_summary: 'Tái cấu trúc giúp MSN tập trung vào lĩnh vực cốt lõi.' },

  // VIC
  { symbol: 'VIC', title: 'Vingroup đẩy mạnh phát triển xe điện VinFast tại Mỹ', summary: 'VinFast tiếp tục mở rộng mạng lưới đại lý tại Mỹ, đặt mục tiêu bán 50,000 xe trong năm 2025.', source: 'Tinnhanhchungkhoan', url: 'https://tinnhanhchungkhoan.vn/vinfast-mo-rong-my.html', sentiment: 'positive', category: 'business', ai_summary: 'Mở rộng thị trường Mỹ là bước đi chiến lược quan trọng của VinFast.' },

  // GAS
  { symbol: 'GAS', title: 'PV GAS hưởng lợi từ giá dầu tăng', summary: 'Giá dầu thế giới tăng giúp PV GAS cải thiện biên lợi nhuận, dự báo LNST năm 2024 vượt kế hoạch.', source: 'Vietstock', url: 'https://vietstock.vn/gas-gia-dau-tang.htm', sentiment: 'positive', category: 'earnings', ai_summary: 'Giá dầu tăng là yếu tố hỗ trợ tích cực cho lợi nhuận GAS.' }
];

const records = NEWS.map((n, i) => ({
  ...n,
  published_at: new Date(Date.now() - i * 14400000).toISOString() // 4 hours apart
}));

fetch('https://trbiojajipzpqlnlghtt.supabase.co/rest/v1/stock_news', {
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU',
    'Content-Type': 'application/json; charset=utf-8',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  },
  body: JSON.stringify(records)
}).then(r => {
  if (r.ok) console.log('Synced', records.length, 'news articles with Vietnamese!');
  else r.text().then(t => console.log('Error:', t));
});
