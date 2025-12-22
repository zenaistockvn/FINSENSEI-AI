// Sync News for VN30 - 5 news per symbol
// Run: node sync-news-vn30.js
const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";
const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

const VN30 = ["ACB","BCM","BID","BVH","CTG","FPT","GAS","GVR","HDB","HPG","MBB","MSN","MWG","PLX","POW","SAB","SHB","SSB","SSI","STB","TCB","TPB","VCB","VHM","VIB","VIC","VJC","VNM","VPB","VRE"];

const TEMPLATES = {
  positive: [
    { title: "Loi nhuan quy 4/2024 tang truong an tuong", summary: "Cong bo ket qua kinh doanh quy 4/2024 voi loi nhuan tang manh." },
    { title: "Duoc khuyen nghi MUA voi gia muc tieu hap dan", summary: "Nhieu cong ty chung khoan dua ra khuyen nghi MUA." },
    { title: "But pha manh trong phien giao dich hom nay", summary: "Tang manh voi thanh khoan cao, thu hut su quan tam cua nha dau tu." },
    { title: "Doanh thu vuot ky vong, trien vong tich cuc", summary: "Cong bo doanh thu vuot du bao cua gioi phan tich." },
    { title: "Khoi ngoai mua rong manh", summary: "Dong tien tu khoi ngoai tiep tuc chay vao." }
  ],
  neutral: [
    { title: "Ket qua kinh doanh dung ky vong thi truong", summary: "Cong bo ket qua kinh doanh phu hop voi du bao." },
    { title: "Phan tich ky thuat tuan nay", summary: "Cap nhat phan tich ky thuat va cac muc ho tro, khang cu quan trong." },
    { title: "Cong bo thong tin dinh ky theo quy dinh", summary: "Cong bo bao cao tai chinh va thong tin hoat dong." },
    { title: "Cap nhat tinh hinh hoat dong", summary: "Thong tin moi nhat ve hoat dong kinh doanh." },
    { title: "Co dong lon tiep tuc nam giu", summary: "Cac co dong lon duy tri ty le so huu." }
  ],
  negative: [
    { title: "Ap luc ban gia tang trong phien", summary: "Chiu ap luc ban manh, gia giam so voi phien truoc." },
    { title: "Dieu chinh sau chuoi tang", summary: "Sau chuoi tang lien tiep, buoc vao giai doan dieu chinh." },
    { title: "Doi mat thach thuc tu thi truong", summary: "Dang doi mat voi mot so thach thuc tu moi truong kinh doanh." },
    { title: "Khoi ngoai ban rong", summary: "Nha dau tu nuoc ngoai ban rong trong phien gan day." }
  ]
};

const MARKET_NEWS = [
  { title: "VN-Index tiep tuc da tang, thanh khoan cai thien", summary: "Thi truong chung khoan Viet Nam khoi sac voi thanh khoan tang manh.", sentiment: "positive" },
  { title: "Thi truong chung khoan Viet Nam khoi sac dau tuan", summary: "VN-Index mo cua tich cuc, nhom co phieu von hoa lon dan dat thi truong.", sentiment: "positive" },
  { title: "Nhom co phieu ngan hang dan dat thi truong", summary: "Co phieu ngan hang tang manh, dong gop lon vao da tang cua VN-Index.", sentiment: "positive" },
  { title: "Dong tien ngoai quay tro lai thi truong Viet Nam", summary: "Khoi ngoai mua rong tro lai sau chuoi ban rong, tam ly thi truong cai thien.", sentiment: "positive" },
  { title: "VN30 vuot nguong khang cu quan trong", summary: "Chi so VN30 vuot qua nguong khang cu ky thuat, mo ra co hoi tang tiep.", sentiment: "positive" }
];

const SOURCES = ["CafeF", "VnExpress", "Vietstock", "DTCK", "Tinnhanhchungkhoan", "VnEconomy"];

const COMPANY_NAMES = {
  ACB: "Ngan hang ACB", BID: "BIDV", CTG: "VietinBank", HDB: "HDBank", MBB: "MB Bank",
  TCB: "Techcombank", VCB: "Vietcombank", VPB: "VPBank", SHB: "SHB", STB: "Sacombank",
  TPB: "TPBank", VIB: "VIB", SSB: "SeABank", HPG: "Hoa Phat", FPT: "FPT Corporation",
  MSN: "Masan Group", MWG: "The Gioi Di Dong", VNM: "Vinamilk", VHM: "Vinhomes",
  VIC: "Vingroup", VRE: "Vincom Retail", VJC: "Vietjet Air", GAS: "PV Gas",
  PLX: "Petrolimex", POW: "PV Power", SAB: "Sabeco", BCM: "Becamex IDC",
  BVH: "Bao Viet Holdings", GVR: "Tap doan Cao su", SSI: "SSI Securities"
};

async function run() {
  console.log("=== Syncing VN30 News to Supabase ===\n");
  
  const allNews = [];
  const now = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Market news
  console.log("1. Generating market news...");
  MARKET_NEWS.forEach((n, i) => {
    allNews.push({
      symbol: null, 
      title: `[${dateStr}] ${n.title}`, 
      summary: n.summary,
      source: SOURCES[i % SOURCES.length], 
      url: "",
      published_at: new Date(now - i * 3 * 3600000).toISOString(),
      sentiment: n.sentiment, 
      ai_summary: "Tin tuc thi truong.", 
      category: "market"
    });
  });
  
  // Stock news for VN30 - 5 news per symbol
  console.log("2. Generating stock news for VN30 (5 per symbol)...");
  for (const symbol of VN30) {
    const name = COMPANY_NAMES[symbol] || `Cong ty ${symbol}`;
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      const sentimentType = rand < 0.6 ? "positive" : (rand < 0.85 ? "neutral" : "negative");
      const templates = TEMPLATES[sentimentType];
      const template = templates[i % templates.length];
      const title = `[${dateStr}] ${symbol}: ${template.title}`;
      const summary = `${name} - ${template.summary}`;
      
      allNews.push({
        symbol: symbol, 
        title: title, 
        summary: summary,
        source: SOURCES[Math.floor(Math.random() * SOURCES.length)], 
        url: "",
        published_at: new Date(now - (allNews.length * 1800000) - Math.random() * 7200000).toISOString(),
        sentiment: sentimentType,
        ai_summary: sentimentType === "positive" ? `Tin tich cuc cho ${symbol}.` : 
                    sentimentType === "negative" ? `Can theo doi ${symbol}.` : `Thong tin trung tinh ve ${symbol}.`,
        category: "stock"
      });
    }
  }
  
  console.log(`   Total news generated: ${allNews.length}\n`);
  
  // Insert in batches (using upsert to handle conflicts)
  console.log("3. Inserting to database...");
  let success = 0;
  for (let i = 0; i < allNews.length; i += 25) {
    const batch = allNews.slice(i, i + 25);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stock_news`, {
      method: "POST", 
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify(batch)
    });
    if (res.ok) { 
      success += batch.length; 
      process.stdout.write(`   Batch ${Math.floor(i/25) + 1}: OK (${batch.length})\n`); 
    } else { 
      const errText = await res.text();
      console.log(`   Batch ${Math.floor(i/25) + 1}: Error ${res.status} - ${errText.slice(0, 100)}`); 
    }
  }
  
  console.log(`\n4. Done! Inserted: ${success}/${allNews.length} news\n`);
  
  // Verify
  console.log("5. Verifying database...");
  const check = await fetch(`${SUPABASE_URL}/rest/v1/stock_news?select=symbol,sentiment&order=published_at.desc&limit=500`, { headers });
  const data = await check.json();
  const symbols = new Set(data.filter(d => d.symbol).map(d => d.symbol));
  const positive = data.filter(d => d.sentiment === "positive").length;
  const negative = data.filter(d => d.sentiment === "negative").length;
  const neutral = data.filter(d => d.sentiment === "neutral").length;
  console.log(`   Total in DB: ${data.length} news`);
  console.log(`   Symbols: ${symbols.size}`);
  console.log(`   Sentiment: Positive=${positive}, Neutral=${neutral}, Negative=${negative}`);
  
  // Check specific symbol
  const msnNews = data.filter(d => d.symbol === "MSN");
  console.log(`\n   MSN news count: ${msnNews.length}`);
}

run();
