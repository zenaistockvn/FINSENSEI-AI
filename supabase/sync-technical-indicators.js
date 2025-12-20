/**
 * Sync Technical Indicators to Supabase
 * Tính toán và lưu các chỉ số PTKT cho tất cả cổ phiếu VN100
 * Phục vụ cho Bộ lọc AI (AI Screener)
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

// ============ TECHNICAL INDICATOR CALCULATIONS ============

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
function calculateSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0);
  const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD
 */
function calculateMACD(closes) {
  if (closes.length < 26) return { macd: null, signal: null, histogram: null };
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd = ema12 - ema26;
  
  // Calculate signal line (9-day EMA of MACD)
  const macdLine = [];
  for (let i = 25; i < closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i + 1), 12);
    const e26 = calculateEMA(closes.slice(0, i + 1), 26);
    macdLine.push(e12 - e26);
  }
  
  const signal = macdLine.length >= 9 ? calculateEMA(macdLine, 9) : null;
  const histogram = signal !== null ? macd - signal : null;
  
  return { macd, signal, histogram };
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null;
  
  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  return calculateSMA(trueRanges, period);
}

/**
 * Calculate Volatility (Annualized)
 */
function calculateVolatility(closes, period = 20) {
  if (closes.length < period + 1) return null;
  
  const returns = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  // Annualized volatility
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

/**
 * Calculate RS Rating (Relative Strength)
 * Based on price performance over multiple timeframes
 */
function calculateRSRating(closes) {
  if (closes.length < 252) {
    // If less than 1 year data, use available data
    if (closes.length < 60) return null;
  }
  
  const n = closes.length;
  const currentPrice = closes[n - 1];
  
  // Calculate returns for different periods
  const return3m = n >= 63 ? ((currentPrice - closes[n - 63]) / closes[n - 63]) * 100 : null;
  const return6m = n >= 126 ? ((currentPrice - closes[n - 126]) / closes[n - 126]) * 100 : null;
  const return9m = n >= 189 ? ((currentPrice - closes[n - 189]) / closes[n - 189]) * 100 : null;
  const return12m = n >= 252 ? ((currentPrice - closes[n - 252]) / closes[n - 252]) * 100 : null;
  
  // Weighted average (more weight on recent performance)
  // IBD-style: 40% for 3m, 20% for 6m, 20% for 9m, 20% for 12m
  let weightedReturn = 0;
  let totalWeight = 0;
  
  if (return3m !== null) { weightedReturn += return3m * 0.4; totalWeight += 0.4; }
  if (return6m !== null) { weightedReturn += return6m * 0.2; totalWeight += 0.2; }
  if (return9m !== null) { weightedReturn += return9m * 0.2; totalWeight += 0.2; }
  if (return12m !== null) { weightedReturn += return12m * 0.2; totalWeight += 0.2; }
  
  if (totalWeight === 0) return null;
  weightedReturn = weightedReturn / totalWeight;
  
  // Normalize to 0-100 scale (assuming -50% to +100% range)
  return Math.max(0, Math.min(100, ((weightedReturn + 50) / 150) * 100));
}

/**
 * Determine trend direction
 */
function determineTrend(closes, ma20, ma50) {
  if (closes.length < 5) return 'SIDEWAYS';
  
  const n = closes.length;
  const currentPrice = closes[n - 1];
  const price5dAgo = closes[n - 5];
  
  // Short-term trend (5 days)
  const shortChange = ((currentPrice - price5dAgo) / price5dAgo) * 100;
  let shortTrend = 'SIDEWAYS';
  if (shortChange > 2) shortTrend = 'UP';
  else if (shortChange < -2) shortTrend = 'DOWN';
  
  // Medium-term trend (based on MA)
  let mediumTrend = 'SIDEWAYS';
  if (ma20 && ma50) {
    if (currentPrice > ma20 && ma20 > ma50) mediumTrend = 'UP';
    else if (currentPrice < ma20 && ma20 < ma50) mediumTrend = 'DOWN';
  }
  
  return { shortTrend, mediumTrend };
}

/**
 * Calculate MA Cross Signal
 */
function calculateMACrossSignal(closes, period = 5) {
  if (closes.length < 50 + period) return 'NONE';
  
  const n = closes.length;
  
  // Calculate MA20 and MA50 for recent days
  const ma20Now = calculateSMA(closes.slice(0, n), 20);
  const ma50Now = calculateSMA(closes.slice(0, n), 50);
  const ma20Prev = calculateSMA(closes.slice(0, n - period), 20);
  const ma50Prev = calculateSMA(closes.slice(0, n - period), 50);
  
  if (!ma20Now || !ma50Now || !ma20Prev || !ma50Prev) return 'NONE';
  
  // Golden Cross: MA20 crosses above MA50
  if (ma20Prev <= ma50Prev && ma20Now > ma50Now) return 'GOLDEN_CROSS';
  
  // Death Cross: MA20 crosses below MA50
  if (ma20Prev >= ma50Prev && ma20Now < ma50Now) return 'DEATH_CROSS';
  
  return 'NONE';
}

/**
 * Calculate composite scores
 */
function calculateScores(indicators) {
  // Momentum Score (RSI, MACD, price changes)
  let momentumScore = 50;
  if (indicators.rsi_14) {
    if (indicators.rsi_14 >= 50 && indicators.rsi_14 <= 70) momentumScore += 20;
    else if (indicators.rsi_14 > 70) momentumScore += 10;
    else if (indicators.rsi_14 < 30) momentumScore -= 10;
  }
  if (indicators.macd_histogram > 0) momentumScore += 15;
  if (indicators.price_change_5d > 0) momentumScore += 15;
  momentumScore = Math.max(0, Math.min(100, momentumScore));
  
  // Trend Score (MA positions, trend direction)
  let trendScore = 50;
  if (indicators.price_vs_ma20 > 0) trendScore += 15;
  if (indicators.price_vs_ma50 > 0) trendScore += 15;
  if (indicators.trend_short === 'UP') trendScore += 10;
  if (indicators.trend_medium === 'UP') trendScore += 10;
  if (indicators.ma_cross_signal === 'GOLDEN_CROSS') trendScore += 20;
  else if (indicators.ma_cross_signal === 'DEATH_CROSS') trendScore -= 20;
  trendScore = Math.max(0, Math.min(100, trendScore));
  
  // Volume Score
  let volumeScore = 50;
  if (indicators.volume_ratio > 1.5) volumeScore += 30;
  else if (indicators.volume_ratio > 1) volumeScore += 15;
  else if (indicators.volume_ratio < 0.5) volumeScore -= 20;
  volumeScore = Math.max(0, Math.min(100, volumeScore));
  
  // Overall Technical Score (weighted average)
  const overallScore = (momentumScore * 0.35 + trendScore * 0.4 + volumeScore * 0.25);
  
  return {
    momentum_score: Math.round(momentumScore * 100) / 100,
    trend_score: Math.round(trendScore * 100) / 100,
    volume_score: Math.round(volumeScore * 100) / 100,
    overall_technical_score: Math.round(overallScore * 100) / 100
  };
}

/**
 * Calculate all technical indicators for a stock
 */
function calculateAllIndicators(priceData) {
  if (!priceData || priceData.length < 20) {
    return null;
  }
  
  // Sort by date ascending
  const sorted = [...priceData].sort((a, b) => 
    new Date(a.trading_date) - new Date(b.trading_date)
  );
  
  const closes = sorted.map(p => p.close_price);
  const highs = sorted.map(p => p.high_price);
  const lows = sorted.map(p => p.low_price);
  const volumes = sorted.map(p => p.volume);
  const n = closes.length;
  
  const currentPrice = closes[n - 1];
  const currentVolume = volumes[n - 1];
  
  // Price changes
  const priceChange1d = n >= 2 ? ((closes[n - 1] - closes[n - 2]) / closes[n - 2]) * 100 : null;
  const priceChange5d = n >= 5 ? ((closes[n - 1] - closes[n - 5]) / closes[n - 5]) * 100 : null;
  const priceChange20d = n >= 20 ? ((closes[n - 1] - closes[n - 20]) / closes[n - 20]) * 100 : null;
  const priceChange60d = n >= 60 ? ((closes[n - 1] - closes[n - 60]) / closes[n - 60]) * 100 : null;
  
  // Moving Averages
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);
  
  const priceVsMa20 = ma20 ? ((currentPrice - ma20) / ma20) * 100 : null;
  const priceVsMa50 = ma50 ? ((currentPrice - ma50) / ma50) * 100 : null;
  
  // RSI
  const rsi14 = calculateRSI(closes, 14);
  
  // MACD
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closes);
  
  // RS Rating
  const rsRating = calculateRSRating(closes);
  
  // Volatility
  const volatility20d = calculateVolatility(closes, 20);
  
  // ATR
  const atr14 = calculateATR(highs, lows, closes, 14);
  
  // Volume
  const volumeAvg20d = calculateSMA(volumes, 20);
  const volumeRatio = volumeAvg20d ? currentVolume / volumeAvg20d : null;
  
  // 52-week high/low
  const high52w = Math.max(...highs.slice(-252));
  const low52w = Math.min(...lows.slice(-252));
  const pricePosition = high52w !== low52w 
    ? ((currentPrice - low52w) / (high52w - low52w)) * 100 
    : 50;
  const distanceFromHigh = ((currentPrice - high52w) / high52w) * 100;
  
  // Trends
  const { shortTrend, mediumTrend } = determineTrend(closes, ma20, ma50);
  const maCrossSignal = calculateMACrossSignal(closes);
  
  const indicators = {
    current_price: currentPrice,
    price_change_1d: priceChange1d,
    price_change_5d: priceChange5d,
    price_change_20d: priceChange20d,
    price_change_60d: priceChange60d,
    rs_rating: rsRating,
    ma20,
    ma50,
    ma200,
    price_vs_ma20: priceVsMa20,
    price_vs_ma50: priceVsMa50,
    rsi_14: rsi14,
    macd,
    macd_signal: macdSignal,
    macd_histogram: macdHistogram,
    volatility_20d: volatility20d,
    atr_14: atr14,
    volume_avg_20d: volumeAvg20d ? Math.round(volumeAvg20d) : null,
    volume_ratio: volumeRatio,
    price_position: pricePosition,
    high_52w: high52w,
    low_52w: low52w,
    distance_from_high: distanceFromHigh,
    trend_short: shortTrend,
    trend_medium: mediumTrend,
    ma_cross_signal: maCrossSignal
  };
  
  // Calculate composite scores
  const scores = calculateScores(indicators);
  
  return { ...indicators, ...scores };
}

// ============ SUPABASE API ============

async function getVN100Companies() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?is_vn100=eq.true&is_active=eq.true&select=symbol`,
    { headers: { ...headers, "Prefer": "return=representation" } }
  );
  return response.json();
}

async function getStockPrices(symbol, days = 300) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=${days}`,
    { headers: { ...headers, "Prefer": "return=representation" } }
  );
  return response.json();
}

async function upsertTechnicalIndicators(data) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/technical_indicators`,
    {
      method: 'POST',
      headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify(data)
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upsert: ${error}`);
  }
  
  return true;
}

// ============ MAIN SYNC FUNCTION ============

async function syncTechnicalIndicators(logFn = console.log) {
  logFn('🚀 Bắt đầu tính toán chỉ số PTKT...');
  
  try {
    // Get all VN100 companies
    const companies = await getVN100Companies();
    logFn(`📊 Tìm thấy ${companies.length} cổ phiếu VN100`);
    
    const today = new Date().toISOString().split('T')[0];
    let successCount = 0;
    let errorCount = 0;
    const allIndicators = [];
    
    for (let i = 0; i < companies.length; i++) {
      const { symbol } = companies[i];
      
      try {
        // Get price history (300 days for 52-week calculations)
        const prices = await getStockPrices(symbol, 300);
        
        if (prices.length < 20) {
          logFn(`⚠️ ${symbol}: Không đủ dữ liệu (${prices.length} ngày)`);
          errorCount++;
          continue;
        }
        
        // Calculate indicators
        const indicators = calculateAllIndicators(prices);
        
        if (!indicators) {
          logFn(`⚠️ ${symbol}: Không thể tính toán chỉ số`);
          errorCount++;
          continue;
        }
        
        // Prepare data for upsert
        const record = {
          symbol,
          calculation_date: today,
          ...indicators,
          updated_at: new Date().toISOString()
        };
        
        allIndicators.push(record);
        successCount++;
        
        // Log progress every 10 stocks
        if ((i + 1) % 10 === 0) {
          logFn(`📈 Đã xử lý ${i + 1}/${companies.length} cổ phiếu...`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
        
      } catch (err) {
        logFn(`❌ ${symbol}: ${err.message}`);
        errorCount++;
      }
    }
    
    // Batch upsert all indicators
    if (allIndicators.length > 0) {
      logFn(`💾 Đang lưu ${allIndicators.length} bản ghi vào database...`);
      
      // Upsert in batches of 50
      for (let i = 0; i < allIndicators.length; i += 50) {
        const batch = allIndicators.slice(i, i + 50);
        await upsertTechnicalIndicators(batch);
        logFn(`  ✅ Đã lưu batch ${Math.floor(i / 50) + 1}`);
      }
    }
    
    logFn(`\n✅ HOÀN THÀNH!`);
    logFn(`   - Thành công: ${successCount} cổ phiếu`);
    logFn(`   - Lỗi: ${errorCount} cổ phiếu`);
    
    return { success: successCount, errors: errorCount };
    
  } catch (error) {
    logFn(`❌ Lỗi: ${error.message}`);
    throw error;
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { syncTechnicalIndicators, calculateAllIndicators };
}
