/**
 * Sync Financial Ratios từ Simplize API
 * Chạy: node sync-financial-ratios.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
// Thay bằng service_role key của bạn
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.auj1AHSwWifdueryQXXgUHo6hK0uqkJxt_Gizfb6UfU";

const VN100_SYMBOLS = [
    'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
    'MBB', 'MSN', 'MWG', 'NVL', 'PDR', 'PLX', 'POW', 'SAB', 'SSI', 'STB',
    'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE',
    'BSR', 'BMP', 'BWE', 'CII', 'CMG', 'DBC', 'DCM', 'DGC', 'DGW', 'DIG',
    'DPM', 'DXG', 'EIB', 'EVF', 'FRT', 'GEX', 'GMD', 'HAG', 'HCM', 'HDC',
    'HDG', 'HNG', 'HSG', 'HT1', 'IMP', 'KBC', 'KDC', 'KDH', 'KOS', 'LPB',
    'MSB', 'NAB', 'NLG', 'NT2', 'OCB', 'PAN', 'PC1', 'PHR', 'PNJ', 'PPC',
    'PVD', 'PVS', 'PVT', 'REE', 'SBT', 'SCS', 'SHB', 'SHS', 'SSB', 'TCH',
    'VCI', 'VGC', 'VHC', 'VIX', 'VND', 'VOS', 'VPI', 'VTP', 'ANV', 'APH',
    'ASM', 'BAF', 'CTR', 'CSV', 'DHC', 'DRC', 'FCN', 'FTS', 'HAH', 'HHV'
];

async function fetchFromSimplize(symbol) {
    try {
        // Get summary data (ROE, ROA, etc.)
        const summaryUrl = `https://api.simplize.vn/api/company/summary/${symbol.toLowerCase()}`;
        const summaryRes = await fetch(summaryUrl);
        let summaryData = {};
        if (summaryRes.ok) {
            const json = await summaryRes.json();
            if (json.status === 200 && json.data) {
                summaryData = json.data;
            }
        }

        // Get snapshot data (P/E, P/B, EPS, etc.)
        const snapshotUrl = `https://api.simplize.vn/api/company/snapshot/${symbol.toLowerCase()}`;
        const snapshotRes = await fetch(snapshotUrl);
        let snapshotData = {};
        if (snapshotRes.ok) {
            const json = await snapshotRes.json();
            if (json.status === 200 && json.data) {
                snapshotData = json.data;
            }
        }

        // Merge data
        if (Object.keys(summaryData).length > 0 || Object.keys(snapshotData).length > 0) {
            return { 
                data: { ...summaryData, ...snapshotData }, 
                source: 'Simplize' 
            };
        }
    } catch (e) {
        console.error(`Simplize error for ${symbol}:`, e.message);
    }
    return null;
}

// VCI API - Vietcap Securities (có P/E, P/B)
async function fetchFromVCI(symbol) {
    try {
        const url = `https://mt.vietcap.com.vn/api/price/symbols/getBySymbol?symbol=${symbol}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data) {
                return { data, source: 'VCI' };
            }
        }
    } catch (e) {}
    
    // Try alternative VCI endpoint
    try {
        const url = `https://api.vietcap.com.vn/data-mt/graphql`;
        const query = {
            query: `{
                stock(ticker: "${symbol}") {
                    ticker
                    pe
                    pb
                    eps
                    bvps
                    roe
                    roa
                }
            }`
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });
        if (response.ok) {
            const result = await response.json();
            if (result.data?.stock) {
                return { data: result.data.stock, source: 'VCI-GQL' };
            }
        }
    } catch (e) {}
    
    return null;
}

// Cafef API - có P/E, P/B
async function fetchFromCafef(symbol) {
    try {
        const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${symbol}&StartDate=&EndDate=&PageIndex=1&PageSize=1`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.Data?.Data?.[0]) {
                return { data: data.Data.Data[0], source: 'Cafef' };
            }
        }
    } catch (e) {}
    return null;
}

// Wichart API - có P/E, P/B, ROE
async function fetchFromWichart(symbol) {
    try {
        const url = `https://wichart.vn/api/thong-ke-co-ban/chi-tiet?code=${symbol}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data?.data) {
                return { data: data.data, source: 'Wichart' };
            }
        }
    } catch (e) {}
    return null;
}

// Fireant API - có P/E, P/B
async function fetchFromFireant(symbol) {
    try {
        const url = `https://restv2.fireant.vn/symbols/${symbol}/fundamental`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data) {
                return { data, source: 'Fireant' };
            }
        }
    } catch (e) {}
    return null;
}

// TCBS API - có P/E, P/B (public endpoint)
async function fetchFromTCBS(symbol) {
    try {
        const url = `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol}/overview`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data) {
                return { data, source: 'TCBS' };
            }
        }
    } catch (e) {}
    return null;
}

async function fetchFromVNDirect(symbol) {
    try {
        const url = `https://finfo-api.vndirect.com.vn/v4/ratios?q=code:${symbol}~reportType:QUARTER&size=1&sort=reportDate`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return { data: data.data[0], source: 'VNDirect' };
            }
        }
    } catch (e) {}
    return null;
}

async function fetchFinancialData(symbol) {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    // Try Simplize first (best for ROE, ROA)
    let result = await fetchFromSimplize(symbol);
    let simplizeData = result?.data || {};
    
    // Get current price from our database to calculate P/E, P/B
    let currentPrice = null;
    try {
        const priceRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (priceRes.ok) {
            const priceData = await priceRes.json();
            if (priceData?.[0]?.close_price) {
                currentPrice = priceData[0].close_price;
            }
        }
    } catch (e) {}
    
    if (Object.keys(simplizeData).length === 0) {
        return null;
    }
    
    // Extract data
    const d = simplizeData;
    const eps = d.eps || d.EPS || null;
    const bvps = d.bvps || d.bookValue || null;
    const roe = normalizePercent(d.roe || d.ROE);
    
    // Calculate P/E and P/B if we have price and EPS/BVPS
    let pe_ratio = d.pe || d.PE || null;
    let pb_ratio = d.pb || d.PB || null;
    
    if (currentPrice && eps && eps > 0 && !pe_ratio) {
        pe_ratio = currentPrice / eps;
    }
    if (currentPrice && bvps && bvps > 0 && !pb_ratio) {
        pb_ratio = currentPrice / bvps;
    }
    
    // If we have P/B and ROE, we can estimate P/E using: P/E = P/B / ROE
    // This is because: P/E = Price/EPS, P/B = Price/BVPS, ROE = EPS/BVPS
    // So P/E = P/B / ROE
    if (!pe_ratio && pb_ratio && roe && roe > 0) {
        pe_ratio = pb_ratio / roe;
    }
    
    return {
        symbol,
        year: currentYear,
        quarter: currentQuarter,
        pe_ratio: pe_ratio,
        pb_ratio: pb_ratio,
        roe: normalizePercent(d.roe || d.ROE),
        roa: normalizePercent(d.roa || d.ROA),
        eps: eps,
        bvps: bvps,
        debt_to_equity: d.debtOnEquity || d.de || d.DE || null,
        revenue_growth: normalizePercent(d.revenueGrowth),
        profit_growth: normalizePercent(d.netProfitGrowth || d.profitGrowth || d.postTaxProfitGrowth),
        gross_margin: normalizePercent(d.grossProfitMargin),
        net_margin: normalizePercent(d.netProfitMargin),
        source: 'Simplize' + (currentPrice ? '+Calc' : '')
    };
}

function normalizePercent(value) {
    if (value === null || value === undefined) return null;
    // If value > 1, assume it's percentage (e.g., 15 = 15%), convert to decimal
    if (Math.abs(value) > 1) return value / 100;
    return value;
}

async function saveToSupabase(record) {
    if (!record) return false;

    const payload = {
        symbol: record.symbol,
        year: record.year,
        quarter: record.quarter,
        pe_ratio: record.pe_ratio,
        pb_ratio: record.pb_ratio,
        roe: record.roe,
        roa: record.roa,
        eps: record.eps,
        bvps: record.bvps,
        debt_to_equity: record.debt_to_equity,
        revenue_growth: record.revenue_growth,
        profit_growth: record.profit_growth,
        gross_margin: record.gross_margin,
        net_margin: record.net_margin,
        updated_at: new Date().toISOString()
    };

    try {
        // Use UPSERT - update if exists, insert if not
        const response = await fetch(`${SUPABASE_URL}/rest/v1/financial_ratios?symbol=eq.${record.symbol}&year=eq.${record.year}&quarter=eq.${record.quarter}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });

        // Then insert new record
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/financial_ratios`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        return insertRes.ok;
    } catch (error) {
        console.error('Save error:', error.message);
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('='.repeat(50));
    console.log('📊 SYNC FINANCIAL RATIOS - VN100');
    console.log('='.repeat(50));

    if (SUPABASE_KEY === 'YOUR_SERVICE_KEY_HERE') {
        console.log('\n⚠️  Chưa có SUPABASE_SERVICE_KEY!');
        console.log('Cách 1: set SUPABASE_SERVICE_KEY=your_key');
        console.log('Cách 2: Sửa trực tiếp trong file này');
        return;
    }

    console.log(`\n📡 Nguồn: Simplize + Tính P/E, P/B từ giá`);
    console.log(`📊 Tổng: ${VN100_SYMBOLS.length} mã\n`);

    let success = 0;
    let errors = 0;

    for (let i = 0; i < VN100_SYMBOLS.length; i++) {
        const symbol = VN100_SYMBOLS[i];
        process.stdout.write(`[${i + 1}/${VN100_SYMBOLS.length}] ${symbol}... `);

        const data = await fetchFinancialData(symbol);

        if (data) {
            const saved = await saveToSupabase(data);
            if (saved) {
                success++;
                const pe = data.pe_ratio ? data.pe_ratio.toFixed(1) : '-';
                const pb = data.pb_ratio ? data.pb_ratio.toFixed(1) : '-';
                const roe = data.roe ? (data.roe * 100).toFixed(1) + '%' : '-';
                console.log(`✅ P/E=${pe}, P/B=${pb}, ROE=${roe} [${data.source}]`);
            } else {
                errors++;
                console.log('❌ Lỗi lưu DB');
            }
        } else {
            errors++;
            console.log('⚠️ Không có dữ liệu');
        }

        await sleep(300);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Hoàn thành! ✅ ${success} | ❌ ${errors}`);
    console.log('='.repeat(50));
}

main();
