// Sync Risk Analysis for VN100 stocks
const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";
const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

function calculateSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const recent = changes.slice(-period);
  const gains = recent.filter(c => c > 0);
  const losses = recent.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateVolatility(prices, period = 20) {
  if (prices.length < period + 1) return 25;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1] * 100);
  }
  const recent = returns.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function calculateMaxDrawdown(prices) {
  let maxPrice = prices[0];
  let maxDrawdown = 0;
  for (const price of prices) {
    if (price > maxPrice) maxPrice = price;
    const drawdown = (maxPrice - price) / maxPrice * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}


function calculateRiskAnalysis(symbol, prices, tech, simplize) {
  if (!prices || prices.length < 50) return null;
  
  const sorted = [...prices].sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date));
  const closes = sorted.map(p => p.close_price);
  const n = closes.length;
  const currentPrice = closes[n - 1];
  
  // Calculate indicators
  const ma20 = tech?.ma20 || calculateSMA(closes, 20) || currentPrice;
  const ma50 = tech?.ma50 || calculateSMA(closes, 50) || currentPrice;
  const ma200 = tech?.ma200 || calculateSMA(closes, 200) || currentPrice;
  const rsi14 = tech?.rsi_14 || calculateRSI(closes, 14);
  const volatility = tech?.volatility_20d || calculateVolatility(closes, 20);
  const maxDrawdown = calculateMaxDrawdown(closes.slice(-252));
  
  // Price position in 52w range
  const high52w = Math.max(...closes.slice(-252));
  const low52w = Math.min(...closes.slice(-252));
  const pricePosition = high52w !== low52w ? ((currentPrice - low52w) / (high52w - low52w)) * 100 : 50;
  
  // Get fundamentals
  const pe = simplize?.pe || 0;
  const roe = simplize?.roe || 0;
  const beta = simplize?.beta_5y || null;
  
  // Volume
  const volumes = sorted.map(p => p.volume);
  const avgVolume = calculateSMA(volumes, 20) || 1;
  const currentVolume = volumes[n - 1] || avgVolume;
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
  const priceChange = n > 1 ? ((closes[n-1] - closes[n-2]) / closes[n-2]) * 100 : 0;
  
  // ========== XÁC SUẤT TĂNG NGẮN HẠN ==========
  let upsideProbability = 50;
  
  // MA trend
  if (currentPrice > ma20) upsideProbability += 5; else upsideProbability -= 3;
  if (currentPrice > ma50) upsideProbability += 5; else upsideProbability -= 3;
  if (currentPrice > ma200) upsideProbability += 5; else upsideProbability -= 3;
  
  // MA cross
  if (ma20 > ma50) upsideProbability += 5; else upsideProbability -= 3;
  if (ma50 > ma200) upsideProbability += 3; else upsideProbability -= 2;
  
  // RSI
  if (rsi14 < 25) upsideProbability += 12;
  else if (rsi14 < 35) upsideProbability += 8;
  else if (rsi14 < 45) upsideProbability += 4;
  else if (rsi14 > 75) upsideProbability -= 12;
  else if (rsi14 > 65) upsideProbability -= 6;
  
  // Price position
  if (pricePosition < 20) upsideProbability += 10;
  else if (pricePosition < 35) upsideProbability += 6;
  else if (pricePosition < 50) upsideProbability += 3;
  else if (pricePosition > 85) upsideProbability -= 8;
  else if (pricePosition > 70) upsideProbability -= 4;
  
  // Fundamentals
  if (pe > 0 && pe < 10) upsideProbability += 5;
  else if (pe > 0 && pe < 15) upsideProbability += 3;
  else if (pe > 25) upsideProbability -= 3;
  if (roe > 20) upsideProbability += 3;
  else if (roe > 15) upsideProbability += 2;
  else if (roe < 8) upsideProbability -= 2;
  
  // Volume
  if (volumeRatio > 1.5 && priceChange > 0) upsideProbability += 5;
  else if (volumeRatio > 1.5 && priceChange < 0) upsideProbability -= 3;
  
  upsideProbability = Math.max(15, Math.min(85, upsideProbability));
  
  // ========== RỦI RO ĐIỀU CHỈNH ==========
  let downsideRisk = 15;
  downsideRisk += Math.min(15, volatility * 0.4);
  downsideRisk += Math.min(10, maxDrawdown * 0.3);
  if (rsi14 > 70) downsideRisk += 5;
  if (pricePosition > 80) downsideRisk += 5;
  if (currentPrice < ma200) downsideRisk += 3;
  if (ma20 < ma50) downsideRisk += 2;
  if (pe > 0 && pe < 12 && roe > 15) downsideRisk -= 3;
  downsideRisk = Math.max(5, Math.min(40, downsideRisk));
  
  // ========== THỜI GIAN NẮM GIỮ ==========
  const isUptrend = currentPrice > ma50 && ma20 > ma50;
  const isDowntrend = currentPrice < ma50 && ma20 < ma50;
  let optimalHoldingDays;
  if (volatility > 40) optimalHoldingDays = isUptrend ? 7 : 3;
  else if (volatility > 30) optimalHoldingDays = isUptrend ? 14 : 7;
  else if (volatility > 20) optimalHoldingDays = isUptrend ? 30 : 14;
  else if (volatility > 12) optimalHoldingDays = isUptrend ? 60 : 30;
  else optimalHoldingDays = isUptrend ? 90 : 45;
  if (isDowntrend) optimalHoldingDays = Math.min(optimalHoldingDays, 10);
  
  // ========== BETA ==========
  let calculatedBeta = beta;
  if (!calculatedBeta || calculatedBeta <= 0) {
    calculatedBeta = 1 + (volatility - 22) / 40;
    calculatedBeta = Math.max(0.3, Math.min(2.5, calculatedBeta));
  }
  
  // Sharpe Ratio estimate
  const avgReturn = closes.length > 20 ? ((closes[n-1] / closes[n-21]) - 1) * 100 * 12 : 0; // Annualized
  const riskFreeRate = 5; // Vietnam ~5%
  const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
  
  return {
    symbol,
    analysis_date: new Date().toISOString().split('T')[0],
    optimal_holding_days: optimalHoldingDays,
    upside_probability: Math.round(upsideProbability),
    downside_risk: Math.round(downsideRisk * 10) / 10,
    volatility: Math.round(volatility * 10) / 10,
    beta: Math.round(calculatedBeta * 100) / 100,
    sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
    max_drawdown: Math.round(maxDrawdown * 10) / 10,
    updated_at: new Date().toISOString()
  };
}


async function syncAll() {
  console.log('🚀 Sync Risk Analysis cho VN100...\n');
  
  try {
    const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?is_vn100=eq.true&is_active=eq.true&select=symbol`, { headers });
    const companies = await compRes.json();
    console.log(`📊 Tìm thấy ${companies.length} cổ phiếu VN100\n`);
    
    let success = 0, errors = 0;
    const analyses = [];
    
    for (let i = 0; i < companies.length; i++) {
      const { symbol } = companies[i];
      try {
        const [priceRes, techRes, simpRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=300`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/technical_indicators?symbol=eq.${symbol}&order=calculation_date.desc&limit=1`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/simplize_company_data?symbol=eq.${symbol}&limit=1`, { headers })
        ]);
        
        const prices = await priceRes.json();
        const tech = (await techRes.json())[0];
        const simp = (await simpRes.json())[0];
        
        if (prices.length < 50) { errors++; continue; }
        
        const analysis = calculateRiskAnalysis(symbol, prices, tech, simp);
        if (analysis) { analyses.push(analysis); success++; }
        
        if ((i + 1) % 20 === 0) console.log(`📈 Đã xử lý ${i + 1}/${companies.length}...`);
        await new Promise(r => setTimeout(r, 30));
      } catch (err) { 
        console.log(`❌ ${symbol}: ${err.message}`);
        errors++; 
      }
    }
    
    if (analyses.length > 0) {
      console.log(`\n💾 Đang lưu ${analyses.length} risk analyses...`);
      for (let i = 0; i < analyses.length; i += 50) {
        const batch = analyses.slice(i, i + 50);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/risk_analysis`, {
          method: 'POST',
          headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(batch)
        });
        if (!res.ok) {
          const err = await res.text();
          console.log(`❌ Batch error: ${err}`);
        }
      }
    }
    
    // Show MSN result
    const msn = analyses.find(s => s.symbol === 'MSN');
    if (msn) {
      console.log(`\n✅ MSN Risk Analysis:`);
      console.log(`   Nắm giữ tối ưu: ${msn.optimal_holding_days} ngày`);
      console.log(`   Xác suất tăng: ${msn.upside_probability}%`);
      console.log(`   Rủi ro điều chỉnh: ${msn.downside_risk}%`);
      console.log(`   Volatility: ${msn.volatility}%`);
      console.log(`   Beta: ${msn.beta}`);
      console.log(`   Max Drawdown: ${msn.max_drawdown}%`);
    }
    
    console.log(`\n✅ HOÀN THÀNH! Thành công: ${success}, Lỗi: ${errors}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

syncAll();