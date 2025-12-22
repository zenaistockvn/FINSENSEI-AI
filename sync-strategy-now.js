// Sync Trading Strategy with dynamic R:R based on Beta
const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";
const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

function roundVNPrice(price) {
  if (price < 10000) return Math.round(price / 10) * 10;
  if (price < 50000) return Math.round(price / 50) * 50;
  return Math.round(price / 100) * 100;
}

function findSwingHighs(highs, period = 5) {
  const swings = [];
  for (let i = period; i < highs.length - period; i++) {
    const leftMax = Math.max(...highs.slice(i - period, i));
    const rightMax = Math.max(...highs.slice(i + 1, i + period + 1));
    if (highs[i] >= leftMax && highs[i] >= rightMax) swings.push(highs[i]);
  }
  return swings;
}

function findSwingLows(lows, period = 5) {
  const swings = [];
  for (let i = period; i < lows.length - period; i++) {
    const leftMin = Math.min(...lows.slice(i - period, i));
    const rightMin = Math.min(...lows.slice(i + 1, i + period + 1));
    if (lows[i] <= leftMin && lows[i] <= rightMin) swings.push(lows[i]);
  }
  return swings;
}

function clusterLevels(levels, threshold = 0.02) {
  if (levels.length === 0) return [];
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters = []; let current = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i] - sorted[i-1]) / sorted[i-1] <= threshold) current.push(sorted[i]);
    else { clusters.push(current); current = [sorted[i]]; }
  }
  clusters.push(current);
  return clusters.map(c => c.reduce((a, b) => a + b, 0) / c.length).sort((a, b) => b - a);
}

function calculateATR(prices, period = 14) {
  if (prices.length < period + 1) return 0;
  const tr = [];
  for (let i = 1; i < prices.length; i++) {
    tr.push(Math.max(prices[i].high_price - prices[i].low_price,
      Math.abs(prices[i].high_price - prices[i-1].close_price),
      Math.abs(prices[i].low_price - prices[i-1].close_price)));
  }
  return tr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}


function calculateStrategy(symbol, prices, tech, beta) {
  if (!prices || prices.length < 30) return null;
  
  const sorted = [...prices].sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date));
  const n = sorted.length;
  const currentPrice = sorted[n-1].close_price;
  const closes = sorted.map(p => p.close_price);
  const highs = sorted.map(p => p.high_price);
  const lows = sorted.map(p => p.low_price);
  
  const atr = calculateATR(sorted, 14);
  const ma20 = tech?.ma20 || calculateSMA(closes, 20);
  const ma50 = tech?.ma50 || calculateSMA(closes, 50);
  const rsi = tech?.rsi_14 || null;
  const volatility = tech?.volatility_20d || (atr / currentPrice) * 100;
  
  const swingHighs = findSwingHighs(highs, 5);
  const swingLows = findSwingLows(lows, 5);
  const clusteredHighs = clusterLevels(swingHighs);
  const clusteredLows = clusterLevels(swingLows);
  
  const supports = clusteredLows.filter(l => l < currentPrice).slice(0, 2);
  const resistances = clusteredHighs.filter(h => h > currentPrice).slice(-2).reverse();
  
  const support1 = supports[0] || currentPrice * 0.95;
  const support2 = supports[1] || support1 * 0.97;
  const resistance1 = resistances[0] || currentPrice * 1.05;
  const resistance2 = resistances[1] || resistance1 * 1.05;
  const high52w = Math.max(...highs.slice(-252));
  
  const recentHigh = Math.max(...highs.slice(-60));
  const recentLow = Math.min(...lows.slice(-60));
  const fibRange = recentHigh - recentLow;
  const fib1272 = recentHigh + (fibRange * 0.272);
  const fib1618 = recentHigh + (fibRange * 0.618);
  
  const yesterday = sorted[n-2];
  const pivot = (yesterday.high_price + yesterday.low_price + yesterday.close_price) / 3;
  const pivotR1 = (2 * pivot) - yesterday.low_price;
  const pivotR2 = pivot + (yesterday.high_price - yesterday.low_price);
  
  let buyLow = support1 - (atr * 0.3);
  let buyHigh = support1 + (atr * 0.8);
  if (buyHigh > currentPrice) buyHigh = currentPrice - (atr * 0.15);
  if (buyLow > buyHigh) buyLow = buyHigh - (atr * 0.8);
  const floorPrice = currentPrice * 0.93;
  if (buyLow < floorPrice) buyLow = floorPrice;
  
  let buyStrength = 'MODERATE';
  if (rsi && rsi < 35 && currentPrice <= support1 * 1.03) buyStrength = 'STRONG';
  else if (ma20 && currentPrice > ma20 && currentPrice > support1 * 1.08) buyStrength = 'WEAK';
  
  const entryPrice = (buyLow + buyHigh) / 2;
  let atrMult = volatility > 3 ? 2.5 : volatility < 1.5 ? 1.5 : 1.8;
  let stopLoss = entryPrice - (atr * atrMult);
  const maxStop = entryPrice * 0.92;
  let stopType = 'ATR_BASED';
  if (stopLoss < maxStop) { stopLoss = maxStop; stopType = 'PERCENTAGE_BASED'; }
  const stopPercent = ((entryPrice - stopLoss) / entryPrice) * 100;
  
  const effectiveBeta = beta ?? (volatility > 3 ? 1.3 : volatility > 2 ? 1.0 : 0.7);
  let minRR1, minRR2, minRR3, riskProfile;
  if (effectiveBeta < 0.8) { minRR1 = 2.0; minRR2 = 2.5; minRR3 = 3.0; riskProfile = 'LOW'; }
  else if (effectiveBeta <= 1.2) { minRR1 = 2.5; minRR2 = 3.0; minRR3 = 4.0; riskProfile = 'MEDIUM'; }
  else { minRR1 = 3.0; minRR2 = 4.0; minRR3 = 5.0; riskProfile = 'HIGH'; }
  
  const risk = entryPrice - stopLoss;
  const technicalLevels = [resistance1, resistance2, high52w, fib1272, fib1618, pivotR1, pivotR2]
    .filter(l => l > entryPrice && l > 0).sort((a, b) => a - b);
  
  const minTP1 = entryPrice + (risk * minRR1);
  const minTP2 = entryPrice + (risk * minRR2);
  const minTP3 = entryPrice + (risk * minRR3);
  
  let tp1 = technicalLevels.find(l => l >= minTP1) || minTP1;
  let tp2 = technicalLevels.find(l => l >= minTP2 && l > tp1) || minTP2;
  let tp3 = technicalLevels.find(l => l >= minTP3 && l > tp2) || minTP3;
  if (high52w > tp3) tp3 = high52w;
  if (tp2 <= tp1) tp2 = tp1 * 1.1;
  if (tp3 <= tp2) tp3 = tp2 * 1.1;
  
  const calcRR = (t) => Math.round(((t - entryPrice) / risk) * 10) / 10;
  const calcPct = (t) => Math.round(((t - entryPrice) / entryPrice) * 1000) / 10;
  
  const targetPct = calcPct(tp1);
  let strategyType = 'Swing Trading';
  if (targetPct < 15) strategyType = 'Swing Ngắn hạn';
  else if (targetPct > 25) strategyType = 'Position Trading';
  
  let confidence = 50;
  if (rsi && rsi < 35) confidence += 15;
  if (rsi && rsi > 70) confidence -= 10;
  if (ma20 && ma50 && ma20 > ma50) confidence += 10;
  if (currentPrice <= support1 * 1.03) confidence += 10;
  if (calcRR(tp1) >= minRR1) confidence += 10;
  confidence = Math.max(20, Math.min(95, confidence));
  
  return {
    symbol, analysis_date: new Date().toISOString().split('T')[0],
    buy_zone_low: roundVNPrice(buyLow), buy_zone_high: roundVNPrice(buyHigh),
    buy_zone_optimal: roundVNPrice(entryPrice), buy_zone_strength: buyStrength,
    stop_loss: roundVNPrice(stopLoss), stop_loss_percent: Math.round(stopPercent * 100) / 100, stop_loss_type: stopType,
    target_1: roundVNPrice(tp1), target_1_percent: calcPct(tp1), target_1_rr: calcRR(tp1),
    target_2: roundVNPrice(tp2), target_2_percent: calcPct(tp2), target_2_rr: calcRR(tp2),
    target_3: roundVNPrice(tp3), target_3_percent: calcPct(tp3), target_3_rr: calcRR(tp3),
    support_1: roundVNPrice(support1), support_2: roundVNPrice(support2),
    resistance_1: roundVNPrice(resistance1), resistance_2: roundVNPrice(resistance2),
    risk_profile: riskProfile, strategy_type: strategyType,
    strategy_note: `${strategyType} - R:R ${calcRR(tp1)}:1 - Beta ${effectiveBeta.toFixed(2)}`,
    confidence, break_even_price: roundVNPrice(entryPrice * 1.004), trading_cost_percent: 0.4,
    updated_at: new Date().toISOString()
  };
}


async function syncAll() {
  console.log('🚀 Sync Trading Strategy với R:R động theo Beta...\n');
  
  try {
    const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?is_vn100=eq.true&is_active=eq.true&select=symbol`, { headers });
    const companies = await compRes.json();
    console.log(`📊 Tìm thấy ${companies.length} cổ phiếu VN100\n`);
    
    let success = 0, errors = 0;
    const strategies = [];
    
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
        
        if (prices.length < 30) { errors++; continue; }
        
        const strategy = calculateStrategy(symbol, prices, tech, simp?.beta_5y);
        if (strategy) { strategies.push(strategy); success++; }
        
        if ((i + 1) % 20 === 0) console.log(`📈 Đã xử lý ${i + 1}/${companies.length}...`);
        await new Promise(r => setTimeout(r, 30));
      } catch (err) { errors++; }
    }
    
    if (strategies.length > 0) {
      console.log(`\n💾 Đang lưu ${strategies.length} chiến lược...`);
      for (let i = 0; i < strategies.length; i += 50) {
        const batch = strategies.slice(i, i + 50);
        await fetch(`${SUPABASE_URL}/rest/v1/trading_strategy`, {
          method: 'POST',
          headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(batch)
        });
      }
    }
    
    const msn = strategies.find(s => s.symbol === 'MSN');
    if (msn) {
      console.log(`\n✅ MSN Strategy:`);
      console.log(`   Buy Zone: ${msn.buy_zone_low.toLocaleString()} - ${msn.buy_zone_high.toLocaleString()}`);
      console.log(`   Stop Loss: ${msn.stop_loss.toLocaleString()} (-${msn.stop_loss_percent}%)`);
      console.log(`   Target 1: ${msn.target_1.toLocaleString()} (+${msn.target_1_percent}%, R:R ${msn.target_1_rr})`);
      console.log(`   Target 2: ${msn.target_2.toLocaleString()} (+${msn.target_2_percent}%, R:R ${msn.target_2_rr})`);
      console.log(`   Target 3: ${msn.target_3.toLocaleString()} (+${msn.target_3_percent}%, R:R ${msn.target_3_rr})`);
      console.log(`   Risk Profile: ${msn.risk_profile}`);
      console.log(`   Confidence: ${msn.confidence}%`);
    }
    
    console.log(`\n✅ HOÀN THÀNH! Thành công: ${success}, Lỗi: ${errors}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

syncAll();