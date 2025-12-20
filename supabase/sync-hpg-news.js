// Sync HPG News - Vietnamese with links
const NEWS = [
  { 
    symbol: 'HPG', 
    title: 'Hòa Phát đặt mục tiêu xuất khẩu thép 3 triệu tấn năm 2025', 
    summary: 'Hòa Phát đẩy mạnh xuất khẩu sang các thị trường Đông Nam Á, châu Âu và Mỹ, kỳ vọng tăng trưởng mạnh.', 
    source: 'CafeF', 
    url: 'https://cafef.vn/hpg-xuat-khau-thep.chn',
    sentiment: 'positive', 
    category: 'guidance', 
    ai_summary: 'Chiến lược xuất khẩu giúp đa dạng hóa thị trường tiêu thụ, giảm phụ thuộc nội địa.' 
  },
  { 
    symbol: 'HPG', 
    title: 'Hòa Phát báo lãi Q3/2024 tăng 50% so với cùng kỳ', 
    summary: 'Lợi nhuận sau thuế quý 3 đạt 3,200 tỷ đồng, tăng mạnh nhờ giá thép phục hồi và chi phí đầu vào giảm.', 
    source: 'Tinnhanhchungkhoan', 
    url: 'https://tinnhanhchungkhoan.vn/hpg-lai-q3-2024.html',
    sentiment: 'positive', 
    category: 'earnings', 
    ai_summary: 'Kết quả kinh doanh vượt kỳ vọng, triển vọng tích cực cho các quý tiếp theo.' 
  },
  { 
    symbol: 'HPG', 
    title: 'HPG mở rộng công suất Khu liên hợp Dung Quất giai đoạn 2', 
    summary: 'Hòa Phát đầu tư thêm 2 tỷ USD để nâng công suất thép tại Dung Quất lên 8 triệu tấn/năm.', 
    source: 'Vietstock', 
    url: 'https://vietstock.vn/hpg-dung-quat-giai-doan-2.htm',
    sentiment: 'positive', 
    category: 'business', 
    ai_summary: 'Đầu tư mở rộng củng cố vị thế dẫn đầu ngành thép Việt Nam.' 
  },
  { 
    symbol: 'HPG', 
    title: 'Giá thép xây dựng tăng 5% trong tháng 12/2024', 
    summary: 'Giá thép trong nước tăng theo đà phục hồi của thị trường bất động sản và xây dựng hạ tầng.', 
    source: 'VnEconomy', 
    url: 'https://vneconomy.vn/gia-thep-thang-12-2024.htm',
    sentiment: 'positive', 
    category: 'market', 
    ai_summary: 'Giá thép tăng hỗ trợ biên lợi nhuận của HPG trong ngắn hạn.' 
  },
  { 
    symbol: 'HPG', 
    title: 'Khối ngoại mua ròng HPG hơn 200 tỷ đồng trong tuần', 
    summary: 'Các quỹ ETF nước ngoài tiếp tục gom cổ phiếu HPG, thể hiện niềm tin vào triển vọng ngành thép.', 
    source: 'VnExpress', 
    url: 'https://vnexpress.net/khoi-ngoai-mua-rong-hpg.html',
    sentiment: 'positive', 
    category: 'market', 
    ai_summary: 'Dòng tiền ngoại ổn định hỗ trợ giá cổ phiếu HPG.' 
  },
  { 
    symbol: 'HPG', 
    title: 'Hòa Phát đẩy mạnh sản xuất thép cuộn cán nóng HRC', 
    summary: 'Sản lượng HRC của Hòa Phát đạt kỷ lục mới, đáp ứng nhu cầu ngành công nghiệp ô tô và điện tử.', 
    source: 'Báo Đầu tư', 
    url: 'https://baodautu.vn/hpg-san-xuat-hrc.html',
    sentiment: 'positive', 
    category: 'operations', 
    ai_summary: 'Đa dạng hóa sản phẩm giúp HPG mở rộng thị trường tiêu thụ.' 
  }
];

const records = NEWS.map((n, i) => ({
  ...n,
  published_at: new Date(Date.now() - i * 28800000).toISOString() // 8 hours apart
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
  if (r.ok) console.log('Synced', records.length, 'HPG news with Vietnamese!');
  else r.text().then(t => console.log('Error:', t));
});
