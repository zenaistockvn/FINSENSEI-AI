/**
 * Run Technical Indicators Sync
 * Execute: node supabase/run-sync-indicators.js
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// Technical calculations
function calculateSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateMACD(closes) {
  if (closes.length < 26) return { macd: null, signal: null, histogram: null };
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  if (!ema12 || !ema26) return { macd: null, signal: null, histogram: null };
  const macd = ema12 - ema26;
  const macdLine = [];
  for (let i = 25; i < closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i + 1), 12);
    const e26 = calculateEMA(closes.slice(0, i + 1), 26);
    if (e12 && e26) macdLine.push(e12 - e26);
  }
  const signal = macdLine.length >= 9 ? calculateEMA(macdLine, 9) : null;
  return { macd, signal, histogram: signal !== null ? macd - signal : null };
}

function calculateATR(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null;
  const tr = [];
  for (let i = 1; i < highs.length; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  return calculateSMA(tr, period);
}

function calculateVolatility(closes, period = 20) {
  if (closes.length < period + 1) return null;
  const returns = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function calculateRSRating(closes) {
  const n = closes.length;
  if (n < 63) return null;
  const current = closes[n - 1];
  const r3m = n >= 63 ? ((current - closes[n - 63]) / closes[n - 63]) * 100 : null;
  const r6m = n >= 126 ? ((current - closes[n - 126]) / closes[n - 126]) * 100 : null;
  const r9m = n >= 189 ? ((current - closes[n - 189]) / closes[n - 189]) * 100 : null;
  const r12m = n >= 252 ? ((current - closes[n - 252]) / closes[n - 252]) * 100 : null;
  let weighted = 0, totalW = 0;
  if (r3m !== null) { weighted += r3m * 0.4; totalW += 0.4; }
  if (r6m !== null) { weighted += r6m * 0.2; totalW += 0.2; }
  if (r9m !== null) { weighted += r9m * 0.2; totalW += 0.2; }
  if (r12m !== null) { weighted += r12m * 0.2; totalW += 0.2; }
  if (totalW === 0) return null;
  return Math.max(0, Math.min(100, ((weighted / totalW + 50) / 150) * 100));
}

function calculateAllIndicators(prices) {
  if (!prices || prices.length < 20) return null;
  const sorted = [...prices].sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date));
  const closes = sorted.map(p => p.close_price);
  const highs = sorted.map(p => p.high_price);
  const lows = sorted.map(p => p.low_price);
  const volumes = sorted.map(p => p.volume);
  const n = closes.length;
  const current = closes[n - 1];
  const currentVol = volumes[n - 1];

  const pc1d = n >= 2 ? ((closes[n-1] - closes[n-2]) / closes[n-2]) * 100 : null;
  const pc5d = n >= 5 ? ((closes[n-1] - closes[n-5]) / closes[n-5]) * 100 : null;
  const pc20d = n >= 20 ? ((closes[n-1] - closes[n-20]) / closes[n-20]) * 100 : null;
  const pc60d = n >= 60 ? ((closes[n-1] - closes[n-60]) / closes[n-60]) * 100 : null;

  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);
  const pvMa20 = ma20 ? ((current - ma20) / ma20) * 100 : null;
  const pvMa50 = ma50 ? ((current - ma50) / ma50) * 100 : null;

  const rsi = calculateRSI(closes, 14);
  const { macd, signal, histogram } = calculateMACD(closes);
  const atr = calculateATR(highs, lows, closes, 14);
  const vol20d = calculateVolatility(closes, 20);
  const volAvg = calculateSMA(volumes, 20);
  const volRatio = volAvg ? currentVol / volAvg : null;

  const high52 = Math.max(...highs.slice(-252));
  const low52 = Math.min(...lows.slice(-252));
  const pricePos = high52 !== low52 ? ((current - low52) / (high52 - low52)) * 100 : 50;
  const distHigh = ((current - high52) / high52) * 100;

  const shortChange = n >= 5 ? ((current - closes[n-5]) / closes[n-5]) * 100 : 0;
  let trendShort = 'SIDEWAYS';
  if (shortChange > 2) trendShort = 'UP';
  else if (shortChange < -2) trendShort = 'DOWN';

  let trendMedium = 'SIDEWAYS';
  if (ma20 && ma50) {
    if (current > ma20 && ma20 > ma50) trendMedium = 'UP';
    else if (current < ma20 && ma20 < ma50) trendMedium = 'DOWN';
  }

  let maCross = 'NONE';
  if (n >= 55) {
    const ma20Now = calculateSMA(closes, 20);
    const ma50Now = calculateSMA(closes, 50);
    const ma20Prev = calculateSMA(closes.slice(0, -5), 20);
    const ma50Prev = calculateSMA(closes.slice(0, -5), 50);
    if (ma20Prev <= ma50Prev && ma20Now > ma50Now) maCross = 'GOLDEN_CROSS';
    else if (ma20Prev >= ma50Prev && ma20Now < ma50Now) maCross = 'DEATH_CROSS';
  }

  const rsRating = calculateRSRating(closes);

  let momentumScore = 50;
  if (rsi >= 50 && rsi <= 70) momentumScore += 20;
  else if (rsi > 70) momentumScore += 10;
  else if (rsi < 30) momentumScore -= 10;
  if (histogram > 0) momentumScore += 15;
  if (pc5d > 0) momentumScore += 15;
  momentumScore = Math.max(0, Math.min(100, momentumScore));

  let trendScore = 50;
  if (pvMa20 > 0) trendScore += 15;
  if (pvMa50 > 0) trendScore += 15;
  if (trendShort === 'UP') trendScore += 10;
  if (trendMedium === 'UP') trendScore += 10;
  if (maCross === 'GOLDEN_CROSS') trendScore += 20;
  else if (maCross === 'DEATH_CROSS') trendScore -= 20;
  trendScore = Math.max(0, Math.min(100, trendScore));

  let volumeScore = 50;
  if (volRatio > 1.5) volumeScore += 30;
  else if (volRatio > 1) volumeScore += 15;
  else if (volRatio < 0.5) volumeScore -= 20;
  volumeScore = Math.max(0, Math.min(100, volumeScore));

  const overallScore = momentumScore * 0.35 + trendScore * 0.4 + volumeScore * 0.25;

  return {
    current_price: current, price_change_1d: pc1d, price_change_5d: pc5d,
    price_change_20d: pc20d, price_change_60d: pc60d, rs_rating: rsRating,
    ma20, ma50, ma200, price_vs_ma20: pvMa20, price_vs_ma50: pvMa50,
    rsi_14: rsi, macd, macd_signal: signal, macd_histogram: histogram,
    volatility_20d: vol20d, atr_14: atr, volume_avg_20d: volAvg ? Math.round(volAvg) : null,
    volume_ratio: volRatio, price_position: pricePos, high_52w: high52, low_52w: low52,
    distance_from_high: distHigh, trend_short: trendShort, trend_medium: trendMedium,
    ma_cross_signal: maCross, momentum_score: Math.round(momentumScore * 100) / 100,
    trend_score: Math.round(trendScore * 100) / 100, volume_score: Math.round(volumeScore * 100) / 100,
    overall_technical_score: Math.round(overallScore * 100) / 100
  };
}

// Main sync function
async function main() {
  console.log('🚀 Bắt đầu sync Technical Indicators...');
  
  try {
    // Get companies
    const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?is_vn100=eq.true&is_active=eq.true&select=symbol`, { headers });
    const companies = await compRes.json();
    console.log(`📊 Tìm thấy ${companies.length} cổ phiếu VN100`);
    
    const today = new Date().toISOString().split('T')[0];
    let success = 0, errors = 0;
    const allIndicators = [];
    
    for (let i = 0; i < companies.length; i++) {
      const { symbol } = companies[i];
      try {
        const priceRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=300`, { headers });
        const prices = await priceRes.json();
        
        if (prices.length < 20) {
          console.log(`⚠️ ${symbol}: Không đủ dữ liệu (${prices.length})`);
          errors++;
          continue;
        }
        
        const indicators = calculateAllIndicators(prices);
        if (!indicators) { errors++; continue; }
        
        allIndicators.push({ symbol, calculation_date: today, ...indicators, updated_at: new Date().toISOString() });
        success++;
        
        if ((i + 1) % 10 === 0) console.log(`📈 Đã xử lý ${i + 1}/${companies.length}...`);
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        console.log(`❌ ${symbol}: ${err.message}`);
        errors++;
      }
    }
    
    // Batch upsert
    if (allIndicators.length > 0) {
      console.log(`💾 Đang lưu ${allIndicators.length} bản ghi...`);
      for (let i = 0; i < allIndicators.length; i += 50) {
        const batch = allIndicators.slice(i, i + 50);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/technical_indicators`, {
          method: 'POST',
          headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(batch)
        });
        if (!res.ok) console.log(`❌ Batch error: ${await res.text()}`);
        else console.log(`  ✅ Batch ${Math.floor(i / 50) + 1} saved`);
      }
    }
    
    console.log(`\n✅ HOÀN THÀNH! Thành công: ${success}, Lỗi: ${errors}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
