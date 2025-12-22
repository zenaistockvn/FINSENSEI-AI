/**
 * Sync Trading Strategy to Supabase
 * Tính toán và lưu chiến lược giao dịch cho VN100
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// ============ CALCULATION FUNCTIONS ============

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
  const clusters = [];
  let current = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i] - sorted[i-1]) / sorted[i-1] <= threshold) {
      current.push(sorted[i]);
    } else {
      clusters.push(current);
      current = [sorted[i]];
    }
  }
  clusters.push(current);
  return clusters.map(c => c.reduce((a, b) => a + b, 0) / c.length).sort((a, b) => b - a);
}

function calculateATR(prices, period = 14) {
  if (prices.length < period + 1) return 0;
  const tr = [];
  for (let i = 1; i < prices.length; i++) {
    tr.push(Math.max(
      prices[i].high_price - prices[i].low_price,
      Math.abs(prices[i].high_price - prices[i-1].close_price),
      Math.abs(prices[i].low_price - prices[i-1].close_price)
    ));
  }
  return tr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateTradingStrategy(symbol, prices, techIndicators) {
  if (!prices || prices.length < 30) return null;
  
  const sorted = [...prices].sort((a, b) => new Date(a.trading_date) - new Date(b.trading_date));
  const n = sorted.length;
  const currentPrice = sorted[n-1].close_price;
  const closes = sorted.map(p => p.close_price);
  const highs = sorted.map(p => p.high_price);
  const lows = sorted.map(p => p.low_price);
  
  const atr = calculateATR(sorted, 14);
  const ma20 = techIndicators?.ma20 || calculateSMA(closes, 20);
  const ma50 = techIndicators?.ma50 || calculateSMA(closes, 50);
  const rsi = techIndicators?.rsi_14 || null;
  const volatility = techIndicators?.volatility_20d || (atr / currentPrice) * 100;
  
  // Support/Resistance
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
  const low52w = Math.min(...lows.slice(-252));
  
  // Buy Zone
  let buyLow = support1;
  let buyHigh = support1 + (atr * 0.5);
  const isUptrend = ma50 ? currentPrice > ma50 : false;
  const isPullback = ma20 && ma50 ? (currentPrice < ma20 && currentPrice > ma50) : false;
  
  if (isUptrend && isPullback && ma20) {
    buyLow = Math.max(ma20 - (atr * 0.3), support1);
    buyHigh = ma20 + (atr * 0.2);
  }
  if (rsi && rsi < 30) buyHigh += atr * 0.3;
  if (buyHigh > currentPrice) buyHigh = currentPrice - (atr * 0.2);
  if (buyLow > buyHigh) buyLow = buyHigh - (atr * 0.5);
  
  let buyStrength = 'MODERATE';
  if (rsi && rsi < 30 && currentPrice <= support1 * 1.02) buyStrength = 'STRONG';
  else if (ma20 && currentPrice > ma20 && currentPrice > support1 * 1.05) buyStrength = 'WEAK';
  
  // Stop Loss
  let atrMult = volatility > 3 ? 2.0 : volatility < 1.5 ? 1.2 : 1.5;
  const entryPrice = (buyLow + buyHigh) / 2;
  let stopLoss = entryPrice - (atr * atrMult);
  const supportStop = support2 - (atr * 0.5);
  const maxStop = entryPrice * 0.93;
  
  let stopType = 'ATR_BASED';
  if (supportStop > stopLoss && supportStop < support1) {
    stopLoss = supportStop;
    stopType = 'SUPPORT_BASED';
  }
  if (stopLoss < maxStop) {
    stopLoss = maxStop;
    stopType = 'PERCENTAGE_BASED';
  }
  const stopPercent = ((entryPrice - stopLoss) / entryPrice) * 100;
  
  // Targets
  const risk = entryPrice - stopLoss;
  let tp1 = entryPrice + (risk * 1.5);
  if (resistance1 < tp1 && resistance1 > entryPrice) tp1 = resistance1;
  
  let tp2 = entryPrice + (risk * 2.5);
  if (resistance2 < tp2 && resistance2 > tp1) tp2 = resistance2;
  
  let tp3 = high52w;
  if (tp3 < tp2) tp3 = entryPrice + (risk * 4);
  
  const calcRR = (t) => Math.round(((t - entryPrice) / risk) * 10) / 10;
  const calcPct = (t) => Math.round(((t - entryPrice) / entryPrice) * 1000) / 10;
  
  // Strategy Type
  const targetPct = calcPct(tp1);
  let strategyType = 'Swing Trading';
  if ((atr / currentPrice) * 100 < 2 && targetPct < 5) strategyType = 'Scalping';
  else if (targetPct > 15) strategyType = 'Position Trading';
  
  // Confidence
  let confidence = 50;
  if (rsi && rsi < 30) confidence += 15;
  if (rsi && rsi > 70) confidence -= 10;
  if (ma20 && ma50 && ma20 > ma50) confidence += 10;
  if (currentPrice <= support1 * 1.02) confidence += 10;
  if (calcRR(tp1) >= 2) confidence += 5;
  confidence = Math.max(20, Math.min(95, confidence));
  
  return {
    symbol,
    analysis_date: new Date().toISOString().split('T')[0],
    buy_zone_low: Math.round(buyLow),
    buy_zone_high: Math.round(buyHigh),
    buy_zone_optimal: Math.round(entryPrice),
    buy_zone_strength: buyStrength,
    stop_loss: Math.round(stopLoss),
    stop_loss_percent: Math.round(stopPercent * 100) / 100,
    stop_loss_type: stopType,
    target_1: Math.round(tp1),
    target_1_percent: calcPct(tp1),
    target_1_rr: calcRR(tp1),
    target_2: Math.round(tp2),
    target_2_percent: calcPct(tp2),
    target_2_rr: calcRR(tp2),
    target_3: Math.round(tp3),
    target_3_percent: calcPct(tp3),
    target_3_rr: calcRR(tp3),
    support_1: Math.round(support1),
    support_2: Math.round(support2),
    resistance_1: Math.round(resistance1),
    resistance_2: Math.round(resistance2),
    strategy_type: strategyType,
    strategy_note: `${strategyType} - R:R ${calcRR(tp1)}:1`,
    confidence: confidence,
    updated_at: new Date().toISOString()
  };
}


// ============ MAIN SYNC ============

async function main() {
  console.log('🚀 Bắt đầu sync Trading Strategy...');
  
  try {
    // Get companies
    const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?is_vn100=eq.true&is_active=eq.true&select=symbol`, { headers });
    const companies = await compRes.json();
    console.log(`📊 Tìm thấy ${companies.length} cổ phiếu VN100`);
    
    let success = 0, errors = 0;
    const allStrategies = [];
    
    for (let i = 0; i < companies.length; i++) {
      const { symbol } = companies[i];
      try {
        // Get prices
        const priceRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=300`, { headers });
        const prices = await priceRes.json();
        
        // Get technical indicators
        const techRes = await fetch(`${SUPABASE_URL}/rest/v1/technical_indicators?symbol=eq.${symbol}&order=calculation_date.desc&limit=1`, { headers });
        const techData = await techRes.json();
        const tech = techData[0] || null;
        
        if (prices.length < 30) {
          console.log(`⚠️ ${symbol}: Không đủ dữ liệu`);
          errors++;
          continue;
        }
        
        const strategy = calculateTradingStrategy(symbol, prices, tech);
        if (!strategy) { errors++; continue; }
        
        allStrategies.push(strategy);
        success++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`📈 Đã xử lý ${i + 1}/${companies.length}...`);
        }
        
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        console.log(`❌ ${symbol}: ${err.message}`);
        errors++;
      }
    }
    
    // Upsert to database
    if (allStrategies.length > 0) {
      console.log(`💾 Đang lưu ${allStrategies.length} chiến lược...`);
      
      for (let i = 0; i < allStrategies.length; i += 50) {
        const batch = allStrategies.slice(i, i + 50);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/trading_strategy`, {
          method: 'POST',
          headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(batch)
        });
        if (!res.ok) {
          const err = await res.text();
          console.log(`❌ Batch error: ${err}`);
        } else {
          console.log(`  ✅ Batch ${Math.floor(i / 50) + 1} saved`);
        }
      }
    }
    
    // Log sample
    if (allStrategies.length > 0) {
      const sample = allStrategies.find(s => s.symbol === 'HPG') || allStrategies[0];
      console.log(`\n📋 Ví dụ ${sample.symbol}:`);
      console.log(`   Vùng mua: ${sample.buy_zone_low.toLocaleString()} - ${sample.buy_zone_high.toLocaleString()} (${sample.buy_zone_strength})`);
      console.log(`   Cắt lỗ: ${sample.stop_loss.toLocaleString()} (-${sample.stop_loss_percent}%)`);
      console.log(`   Mục tiêu 1: ${sample.target_1.toLocaleString()} (+${sample.target_1_percent}%, R:R ${sample.target_1_rr})`);
      console.log(`   Mục tiêu 2: ${sample.target_2.toLocaleString()} (+${sample.target_2_percent}%, R:R ${sample.target_2_rr})`);
      console.log(`   Chiến lược: ${sample.strategy_type}`);
    }
    
    console.log(`\n✅ HOÀN THÀNH! Thành công: ${success}, Lỗi: ${errors}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
