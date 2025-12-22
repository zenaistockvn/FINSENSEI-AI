/**
 * Auto Analysis Service - Tự động phân tích VN30
 * Tính toán: Chẩn đoán SenAI, Xác suất & Rủi ro, Chiến lược giao dịch
 * 
 * CÔNG THỨC SENAI:
 * - SenAI Score = Technical (40%) + Fundamental (40%) + Momentum (20%)
 * - Upside Probability = Base 50% + Adjustments
 * - Trading Strategy = Support/Resistance + Risk/Reward
 */

const SUPABASE_URL = 'https://trbiojajipzpqlnlghtt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ';

// VN30 symbols (cập nhật Q4/2024)
const VN30_SYMBOLS = [
  'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
  'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
  'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
];

export interface StockAnalysisData {
  symbol: string;
  // Price data
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  high52w: number;
  low52w: number;
  // Technical
  ma20: number;
  ma50: number;
  ma200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  // Fundamental
  pe: number;
  pb: number;
  roe: number;
  eps: number;
  marketCap: number;
  // Calculated
  pricePosition: number; // 0-100, vị trí trong range 52w
  trendScore: number;
  momentumScore: number;
}

export interface SenAIDiagnosis {
  symbol: string;
  rating: number; // 1-5 stars
  score: number; // 0-100
  signal: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  recommendation: string;
  confidence: number;
}

export interface RiskAnalysis {
  symbol: string;
  optimalHoldingDays: number;
  upsideProbability: number; // %
  downsideRisk: number; // %
  volatility: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface TradingStrategy {
  symbol: string;
  buyZoneLow: number;
  buyZoneHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  strategyType: string;
  strategyNote: string;
}

/**
 * Lấy dữ liệu giá từ Supabase
 */
async function getStockPrices(symbol: string, days: number = 252): Promise<any[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=${days}`,
    { headers: { 'apikey': SUPABASE_KEY } }
  );
  return response.json();
}

/**
 * Lấy dữ liệu Simplize
 */
async function getSimplizeData(symbol: string): Promise<any> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/simplize_company_data?symbol=eq.${symbol}`,
    { headers: { 'apikey': SUPABASE_KEY } }
  );
  const data = await response.json();
  return data[0] || null;
}

/**
 * Tính MA
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(0, period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Tính RSI
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = 0; i < period; i++) {
    const change = prices[i] - prices[i + 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Tính Volatility (độ biến động)
 */
function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;
  
  const returns: number[] = [];
  for (let i = 0; i < period - 1; i++) {
    returns.push((prices[i] - prices[i + 1]) / prices[i + 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized %
}

/**
 * Tính Max Drawdown
 */
function calculateMaxDrawdown(prices: number[]): number {
  let maxPrice = prices[prices.length - 1];
  let maxDrawdown = 0;
  
  for (let i = prices.length - 1; i >= 0; i--) {
    if (prices[i] > maxPrice) maxPrice = prices[i];
    const drawdown = (maxPrice - prices[i]) / maxPrice * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return maxDrawdown;
}

/**
 * Tính Support/Resistance levels
 */
function calculateSupportResistance(prices: number[], highs: number[], lows: number[]): {
  support1: number; support2: number; resistance1: number; resistance2: number;
} {
  const currentPrice = prices[0];
  const recentLows = lows.slice(0, 20).sort((a, b) => a - b);
  const recentHighs = highs.slice(0, 20).sort((a, b) => b - a);
  
  // Find supports below current price
  const supports = recentLows.filter(l => l < currentPrice);
  const support1 = supports[0] || currentPrice * 0.95;
  const support2 = supports[Math.floor(supports.length / 2)] || currentPrice * 0.90;
  
  // Find resistances above current price
  const resistances = recentHighs.filter(h => h > currentPrice);
  const resistance1 = resistances[0] || currentPrice * 1.05;
  const resistance2 = resistances[Math.floor(resistances.length / 2)] || currentPrice * 1.10;
  
  return { support1, support2, resistance1, resistance2 };
}

/**
 * ============================================
 * CÔNG THỨC CHẨN ĐOÁN SENAI (SenAI Diagnosis)
 * ============================================
 * 
 * SENAI_SCORE = TECHNICAL_SCORE (40%) + FUNDAMENTAL_SCORE (40%) + MOMENTUM_SCORE (20%)
 * 
 * Technical Score (max 40 điểm):
 * - RSI: +10 (quá bán) to -5 (quá mua)
 * - Price vs MA20/50/200: +5 mỗi MA
 * - MA Cross: +5 (golden) / -5 (death)
 * - Price Position: +10 (gần đáy) to 0 (gần đỉnh)
 * 
 * Fundamental Score (max 40 điểm):
 * - P/E: +12 (rất rẻ) to -5 (đắt)
 * - P/B: +8 (rẻ) to -3 (đắt)
 * - ROE: +10 (xuất sắc) to -3 (kém)
 * 
 * Momentum Score (max 20 điểm):
 * - Price Change: +5 to -5
 * - Volume Ratio: +5 to -2
 * - MACD: +5 (bullish) / -3 (bearish)
 */
export function calculateSenAIDiagnosis(data: StockAnalysisData): SenAIDiagnosis {
  let technicalScore = 0;
  let fundamentalScore = 0;
  let momentumScore = 0;
  
  // ========== TECHNICAL SCORE (40 điểm) ==========
  
  // RSI Score (-5 to +10)
  let rsiScore = 0;
  if (data.rsi14 < 30) rsiScore = 10;        // Quá bán - cơ hội mua
  else if (data.rsi14 < 40) rsiScore = 5;
  else if (data.rsi14 <= 60) rsiScore = 3;   // Trung tính
  else if (data.rsi14 <= 70) rsiScore = 0;
  else rsiScore = -5;                         // Quá mua - rủi ro
  technicalScore += rsiScore;
  
  // MA Score (+15 max)
  let maScore = 0;
  if (data.currentPrice > data.ma20) maScore += 5;
  else maScore -= 3;
  if (data.currentPrice > data.ma50) maScore += 5;
  else maScore -= 3;
  if (data.currentPrice > data.ma200) maScore += 5;
  else maScore -= 3;
  technicalScore += maScore;
  
  // MA Cross Score (+5 or -5)
  if (data.ma20 > data.ma50) technicalScore += 5;  // Golden cross potential
  else if (data.ma20 < data.ma50 * 0.98) technicalScore -= 5;  // Death cross
  
  // Price Position Score (+10 max)
  let positionScore = 0;
  if (data.pricePosition < 30) positionScore = 10;      // Gần đáy 52w - value
  else if (data.pricePosition < 50) positionScore = 5;
  else if (data.pricePosition < 70) positionScore = 3;
  else positionScore = 0;                               // Gần đỉnh
  technicalScore += positionScore;
  
  // ========== FUNDAMENTAL SCORE (40 điểm) ==========
  
  // P/E Score (-5 to +12)
  let peScore = 0;
  if (data.pe > 0) {
    if (data.pe < 8) peScore = 12;           // Rất rẻ
    else if (data.pe < 12) peScore = 8;
    else if (data.pe < 15) peScore = 5;
    else if (data.pe < 20) peScore = 2;
    else if (data.pe < 30) peScore = -3;
    else peScore = -5;                        // Đắt
  }
  fundamentalScore += peScore;
  
  // P/B Score (-3 to +8)
  let pbScore = 0;
  if (data.pb > 0) {
    if (data.pb < 1.0) pbScore = 8;
    else if (data.pb < 1.5) pbScore = 5;
    else if (data.pb < 2.5) pbScore = 2;
    else if (data.pb < 3.0) pbScore = 0;
    else pbScore = -3;
  }
  fundamentalScore += pbScore;
  
  // ROE Score (-3 to +10)
  let roeScore = 0;
  if (data.roe > 25) roeScore = 10;          // Xuất sắc
  else if (data.roe > 20) roeScore = 8;
  else if (data.roe > 15) roeScore = 5;
  else if (data.roe > 10) roeScore = 2;
  else roeScore = -3;                         // Kém
  fundamentalScore += roeScore;
  
  // EPS Growth bonus (+5 max)
  if (data.momentumScore > 70) fundamentalScore += 5;
  else if (data.momentumScore > 50) fundamentalScore += 3;
  
  // ========== MOMENTUM SCORE (20 điểm) ==========
  
  // Price Change Score (-5 to +5)
  if (data.priceChangePercent > 3) momentumScore += 5;
  else if (data.priceChangePercent > 1) momentumScore += 3;
  else if (data.priceChangePercent > -1) momentumScore += 1;
  else if (data.priceChangePercent > -3) momentumScore -= 2;
  else momentumScore -= 5;
  
  // Volume Score (-2 to +5)
  // Giả định volume ratio từ trendScore
  if (data.trendScore > 70) momentumScore += 5;
  else if (data.trendScore > 50) momentumScore += 3;
  else if (data.trendScore > 30) momentumScore += 1;
  else momentumScore -= 2;
  
  // MACD Score (+5 or -3)
  if (data.macd > data.macdSignal) momentumScore += 5;
  else momentumScore -= 3;
  
  // ========== TỔNG HỢP ==========
  
  // Base score 50 + adjustments
  const baseScore = 50;
  const totalAdjustment = technicalScore + fundamentalScore + momentumScore;
  let score = baseScore + totalAdjustment;
  
  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Determine signal based on score
  let signal: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  let recommendation: string;
  
  if (score >= 80) {
    signal = 'MUA';
    recommendation = '⭐ Cổ phiếu có điểm số xuất sắc. Cơ hội MUA MẠNH với xu hướng tích cực và định giá hấp dẫn.';
  } else if (score >= 65) {
    signal = 'MUA';
    recommendation = '✅ Cổ phiếu có tiềm năng tốt. Cân nhắc MUA dần khi giá về vùng hỗ trợ.';
  } else if (score >= 50) {
    signal = 'THEO DÕI';
    recommendation = '👀 Cổ phiếu trung lập. THEO DÕI và chờ tín hiệu rõ ràng hơn trước khi vào lệnh.';
  } else if (score >= 35) {
    signal = 'NẮM GIỮ';
    recommendation = '⚠️ Cổ phiếu có rủi ro. NẮM GIỮ nếu đã có, không nên mua thêm.';
  } else {
    signal = 'BÁN';
    recommendation = '🔴 Cổ phiếu tiêu cực. Cân nhắc BÁN hoặc cắt lỗ để bảo toàn vốn.';
  }
  
  // Rating 1-5 stars
  const rating = Math.ceil(score / 20);
  
  // Confidence based on score clarity
  const confidence = Math.min(95, 60 + Math.abs(score - 50) * 0.7);
  
  return {
    symbol: data.symbol,
    rating,
    score,
    signal,
    recommendation,
    confidence: Math.round(confidence)
  };
}

/**
 * ============================================
 * CÔNG THỨC XÁC SUẤT & RỦI RO (Risk Analysis)
 * ============================================
 * 
 * Upside Probability = Base 50% + Adjustments
 * - Giá > MA20: +8%
 * - Giá > MA50: +7%
 * - Giá > MA200: +5%
 * - RSI < 40: +10%
 * - RSI > 60: -8%
 * - Price Position < 30%: +10%
 * - MACD > Signal: +5%
 * - P/E < 15: +5%
 * - ROE > 15%: +5%
 * 
 * Downside Risk = Min(30%, MaxDrawdown * 0.6 + Volatility * 0.3)
 * 
 * Optimal Holding Days based on Volatility:
 * - > 45%: 3-5 days (Scalping)
 * - 35-45%: 5-10 days (Swing ngắn)
 * - 25-35%: 10-20 days (Swing)
 * - 15-25%: 20-60 days (Position)
 * - < 15%: 60+ days (Đầu tư)
 */
export function calculateRiskAnalysis(
  data: StockAnalysisData,
  prices: number[],
  volatility: number,
  maxDrawdown: number
): RiskAnalysis {
  // ========== UPSIDE PROBABILITY ==========
  let upsideProbability = 50; // Base
  
  // Technical adjustments
  if (data.currentPrice > data.ma20) upsideProbability += 8;
  if (data.currentPrice > data.ma50) upsideProbability += 7;
  if (data.currentPrice > data.ma200) upsideProbability += 5;
  
  // RSI adjustments
  if (data.rsi14 < 30) upsideProbability += 12;      // Quá bán - cơ hội cao
  else if (data.rsi14 < 40) upsideProbability += 10;
  else if (data.rsi14 > 70) upsideProbability -= 10; // Quá mua - rủi ro
  else if (data.rsi14 > 60) upsideProbability -= 8;
  
  // Price position adjustments
  if (data.pricePosition < 30) upsideProbability += 10;  // Gần đáy
  else if (data.pricePosition < 50) upsideProbability += 5;
  else if (data.pricePosition > 80) upsideProbability -= 5;  // Gần đỉnh
  
  // MACD adjustment
  if (data.macd > data.macdSignal) upsideProbability += 5;
  else upsideProbability -= 3;
  
  // Fundamental adjustments
  if (data.pe > 0 && data.pe < 15) upsideProbability += 5;
  if (data.roe > 15) upsideProbability += 5;
  
  // Clamp probability
  upsideProbability = Math.max(15, Math.min(85, upsideProbability));
  
  // ========== DOWNSIDE RISK ==========
  const downsideRisk = Math.min(30, maxDrawdown * 0.6 + volatility * 0.3);
  
  // ========== OPTIMAL HOLDING DAYS ==========
  let optimalHoldingDays: number;
  let holdingStrategy: string;
  
  if (volatility > 45) {
    optimalHoldingDays = 5;
    holdingStrategy = 'Scalping';
  } else if (volatility > 35) {
    optimalHoldingDays = 10;
    holdingStrategy = 'Swing ngắn';
  } else if (volatility > 25) {
    optimalHoldingDays = 20;
    holdingStrategy = 'Swing';
  } else if (volatility > 15) {
    optimalHoldingDays = 40;
    holdingStrategy = 'Position';
  } else {
    optimalHoldingDays = 60;
    holdingStrategy = 'Đầu tư';
  }
  
  // ========== BETA ==========
  // Simplified beta calculation
  const marketVolatility = 25; // VNIndex average volatility
  let beta = 1 + (volatility - marketVolatility) / 50;
  beta = Math.max(0.3, Math.min(2.5, beta));
  
  // ========== SHARPE RATIO ==========
  const expectedReturn = (data.priceChangePercent * 252 / 100) || 0;
  const riskFreeRate = 0.05; // 5% (lãi suất tiết kiệm VN)
  let sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / (volatility / 100) : 0;
  sharpeRatio = Math.max(-2, Math.min(3, sharpeRatio));
  
  // ========== VOLATILITY LEVEL ==========
  let volatilityLevel: string;
  if (volatility < 20) volatilityLevel = 'Thấp';
  else if (volatility < 35) volatilityLevel = 'Trung bình';
  else if (volatility < 50) volatilityLevel = 'Cao';
  else volatilityLevel = 'Rất cao';
  
  return {
    symbol: data.symbol,
    optimalHoldingDays,
    upsideProbability: Math.round(upsideProbability),
    downsideRisk: Math.round(downsideRisk * 10) / 10,
    volatility: Math.round(volatility * 10) / 10,
    beta: Math.round(beta * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10) / 10
  };
}

/**
 * ============================================
 * CÔNG THỨC CHIẾN LƯỢC GIAO DỊCH (Trading Strategy)
 * ============================================
 * 
 * Support/Resistance:
 * - Support 1: Đáy gần nhất trong 20 phiên
 * - Support 2: Đáy trung bình trong 20 phiên
 * - Resistance 1: Đỉnh gần nhất trong 20 phiên
 * - Resistance 2: Đỉnh trung bình trong 20 phiên
 * 
 * Buy Zone:
 * - Low: Support_1 × 0.99 (dưới hỗ trợ 1%)
 * - High: Support_1 × 1.02 (trên hỗ trợ 2%)
 * 
 * Stop Loss:
 * - Support_2 × 0.97 (dưới hỗ trợ 2 khoảng 3%)
 * 
 * Targets (Risk:Reward = 1:2 minimum):
 * - Target 1: Entry + Risk × 1.5 (chốt 30%)
 * - Target 2: Entry + Risk × 2.5 (chốt 40%)
 * - Target 3: Entry + Risk × 4.0 (chốt 30%)
 * 
 * Strategy Types:
 * - Bắt đáy: RSI < 30 AND Giá < MA20
 * - Chốt lời: RSI > 70 AND Giá > MA20
 * - Theo xu hướng: Giá > MA20 > MA50
 * - Đứng ngoài: Giá < MA20 < MA50
 * - Tích lũy: MA20 ≈ MA50 (±2%)
 * - Breakout: Giá vượt Resistance với volume lớn
 */
export function calculateTradingStrategy(
  data: StockAnalysisData,
  support1: number,
  support2: number,
  resistance1: number,
  resistance2: number
): TradingStrategy {
  const currentPrice = data.currentPrice;
  
  // ========== BUY ZONE ==========
  const buyZoneLow = support1 * 0.99;   // Dưới hỗ trợ 1%
  const buyZoneHigh = support1 * 1.02;  // Trên hỗ trợ 2%
  
  // ========== STOP LOSS ==========
  const stopLoss = support2 * 0.97;     // Dưới hỗ trợ 2 khoảng 3%
  const stopLossPercent = ((currentPrice - stopLoss) / currentPrice) * 100;
  
  // ========== TARGETS (Risk:Reward) ==========
  const risk = currentPrice - stopLoss;
  const target1 = currentPrice + risk * 1.5;  // R:R = 1:1.5
  const target2 = currentPrice + risk * 2.5;  // R:R = 1:2.5
  const target3 = currentPrice + risk * 4.0;  // R:R = 1:4
  
  // Hoặc dựa trên resistance
  const targetByResistance1 = resistance1;
  const targetByResistance2 = resistance2;
  const targetByResistance3 = resistance2 * 1.1;
  
  // Chọn target hợp lý hơn
  const finalTarget1 = Math.min(target1, targetByResistance1);
  const finalTarget2 = Math.min(target2, targetByResistance2);
  const finalTarget3 = Math.min(target3, targetByResistance3);
  
  // ========== STRATEGY TYPE ==========
  let strategyType: string;
  let strategyNote: string;
  let entryCondition: string;
  let exitCondition: string;
  
  // Xác định chiến lược dựa trên điều kiện kỹ thuật
  if (data.rsi14 < 30 && currentPrice < data.ma20) {
    strategyType = 'Bắt đáy';
    strategyNote = '🔵 RSI quá bán (<30), giá dưới MA20. Cơ hội mua khi có tín hiệu đảo chiều (nến đảo chiều, volume tăng).';
    entryCondition = 'Mua khi RSI vượt 30 từ dưới lên + nến xanh + volume > trung bình';
    exitCondition = 'Chốt lời khi RSI > 60 hoặc giá chạm kháng cự';
  } else if (data.rsi14 > 70 && currentPrice > data.ma20) {
    strategyType = 'Chốt lời';
    strategyNote = '🔴 RSI quá mua (>70), cân nhắc chốt lời một phần tại vùng kháng cự. Không nên mua mới.';
    entryCondition = 'Không mua mới ở vùng này';
    exitCondition = 'Chốt 50% tại giá hiện tại, trailing stop 3% cho phần còn lại';
  } else if (currentPrice > data.ma20 && data.ma20 > data.ma50) {
    strategyType = 'Theo xu hướng';
    strategyNote = '🟢 Xu hướng TĂNG rõ ràng (Giá > MA20 > MA50). Mua khi giá pullback về MA20.';
    entryCondition = 'Mua khi giá chạm MA20 + RSI 40-50 + nến đảo chiều';
    exitCondition = 'Cắt lỗ nếu giá đóng cửa dưới MA50, chốt lời theo target';
  } else if (currentPrice < data.ma20 && data.ma20 < data.ma50) {
    strategyType = 'Đứng ngoài';
    strategyNote = '⚫ Xu hướng GIẢM (Giá < MA20 < MA50). Không giao dịch, chờ tín hiệu đảo chiều rõ ràng.';
    entryCondition = 'Chờ giá vượt MA20 + MA20 cắt lên MA50';
    exitCondition = 'Nếu đang giữ: cắt lỗ ngay hoặc chờ bounce để thoát';
  } else if (Math.abs(data.ma20 - data.ma50) / data.ma50 < 0.02) {
    strategyType = 'Tích lũy';
    strategyNote = '🟡 Thị trường SIDEWAY (MA20 ≈ MA50). Mua dần tại vùng hỗ trợ, bán tại kháng cự.';
    entryCondition = 'Mua tại vùng hỗ trợ + RSI < 40';
    exitCondition = 'Bán tại vùng kháng cự + RSI > 60';
  } else if (currentPrice > resistance1 * 0.98) {
    strategyType = 'Breakout';
    strategyNote = '🚀 Giá gần vùng kháng cự. Nếu breakout với volume lớn (>1.5x), có thể mua theo momentum.';
    entryCondition = 'Mua khi giá vượt kháng cự + volume > 1.5x trung bình';
    exitCondition = 'Cắt lỗ nếu giá quay lại dưới kháng cự cũ (false breakout)';
  } else {
    strategyType = 'Quan sát';
    strategyNote = '👀 Chưa có tín hiệu rõ ràng. Theo dõi và chờ cơ hội tốt hơn.';
    entryCondition = 'Chờ một trong các điều kiện trên xuất hiện';
    exitCondition = 'N/A';
  }
  
  // Round prices to nearest 100
  const roundPrice = (p: number) => Math.round(p / 100) * 100;
  
  return {
    symbol: data.symbol,
    buyZoneLow: roundPrice(buyZoneLow),
    buyZoneHigh: roundPrice(buyZoneHigh),
    stopLoss: roundPrice(stopLoss),
    target1: roundPrice(finalTarget1),
    target2: roundPrice(finalTarget2),
    target3: roundPrice(finalTarget3),
    support1: roundPrice(support1),
    support2: roundPrice(support2),
    resistance1: roundPrice(resistance1),
    resistance2: roundPrice(resistance2),
    strategyType,
    strategyNote
  };
}

/**
 * Phân tích đầy đủ cho 1 mã
 */
export async function analyzeStock(symbol: string): Promise<{
  diagnosis: SenAIDiagnosis;
  risk: RiskAnalysis;
  strategy: TradingStrategy;
} | null> {
  try {
    // Lấy dữ liệu
    const [priceData, simplizeData] = await Promise.all([
      getStockPrices(symbol, 252),
      getSimplizeData(symbol)
    ]);
    
    if (!priceData || priceData.length < 50) {
      console.log(`⚠️ ${symbol}: Không đủ dữ liệu giá`);
      return null;
    }
    
    const prices = priceData.map((p: any) => p.close_price);
    const highs = priceData.map((p: any) => p.high_price);
    const lows = priceData.map((p: any) => p.low_price);
    
    const currentPrice = prices[0];
    const prevPrice = prices[1] || currentPrice;
    
    // Tính các chỉ số
    const ma20 = calculateMA(prices, 20);
    const ma50 = calculateMA(prices, 50);
    const ma200 = calculateMA(prices, 200);
    const rsi14 = calculateRSI(prices, 14);
    const volatility = calculateVolatility(prices, 20);
    const maxDrawdown = calculateMaxDrawdown(prices);
    
    const high52w = Math.max(...prices);
    const low52w = Math.min(...prices);
    const pricePosition = ((currentPrice - low52w) / (high52w - low52w)) * 100;
    
    const { support1, support2, resistance1, resistance2 } = calculateSupportResistance(prices, highs, lows);
    
    // Build analysis data
    const analysisData: StockAnalysisData = {
      symbol,
      currentPrice,
      priceChange: currentPrice - prevPrice,
      priceChangePercent: ((currentPrice - prevPrice) / prevPrice) * 100,
      high52w,
      low52w,
      ma20,
      ma50,
      ma200,
      rsi14,
      macd: 0,
      macdSignal: 0,
      pe: simplizeData?.pe_ratio || 0,
      pb: simplizeData?.pb_ratio || 0,
      roe: simplizeData?.roe || 0,
      eps: simplizeData?.eps || 0,
      marketCap: simplizeData?.market_cap || 0,
      pricePosition,
      trendScore: currentPrice > ma20 ? 60 : 40,
      momentumScore: rsi14 > 50 ? 60 : 40
    };
    
    // Calculate all analyses
    const diagnosis = calculateSenAIDiagnosis(analysisData);
    const risk = calculateRiskAnalysis(analysisData, prices, volatility, maxDrawdown);
    const strategy = calculateTradingStrategy(analysisData, support1, support2, resistance1, resistance2);
    
    return { diagnosis, risk, strategy };
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

/**
 * Lưu kết quả vào Supabase
 */
export async function saveAnalysisToSupabase(
  symbol: string,
  diagnosis: SenAIDiagnosis,
  risk: RiskAnalysis,
  strategy: TradingStrategy
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Save AI Analysis
    await fetch(`${SUPABASE_URL}/rest/v1/ai_analysis`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        symbol,
        analysis_date: today,
        rating: diagnosis.rating,
        score: diagnosis.score,
        signal: diagnosis.signal === 'MUA' ? 1 : diagnosis.signal === 'BÁN' ? -1 : 0,
        recommendation: diagnosis.signal,
        confidence: diagnosis.confidence
      })
    });
    
    // Save Risk Analysis
    await fetch(`${SUPABASE_URL}/rest/v1/risk_analysis`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        symbol,
        analysis_date: today,
        optimal_holding_days: risk.optimalHoldingDays,
        upside_probability: risk.upsideProbability,
        downside_risk: risk.downsideRisk,
        volatility: risk.volatility,
        beta: risk.beta,
        sharpe_ratio: risk.sharpeRatio,
        max_drawdown: risk.maxDrawdown
      })
    });
    
    // Save Trading Strategy
    await fetch(`${SUPABASE_URL}/rest/v1/trading_strategy`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        symbol,
        analysis_date: today,
        buy_zone_low: strategy.buyZoneLow,
        buy_zone_high: strategy.buyZoneHigh,
        stop_loss: strategy.stopLoss,
        target_1: strategy.target1,
        target_2: strategy.target2,
        target_3: strategy.target3,
        support_1: strategy.support1,
        support_2: strategy.support2,
        resistance_1: strategy.resistance1,
        resistance_2: strategy.resistance2,
        strategy_type: strategy.strategyType,
        strategy_note: strategy.strategyNote
      })
    });
    
    return true;
  } catch (error) {
    console.error(`Error saving ${symbol}:`, error);
    return false;
  }
}

/**
 * Phân tích tất cả VN30
 */
export async function analyzeAllVN30(
  onProgress?: (symbol: string, index: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < VN30_SYMBOLS.length; i++) {
    const symbol = VN30_SYMBOLS[i];
    onProgress?.(symbol, i + 1, VN30_SYMBOLS.length);
    
    const result = await analyzeStock(symbol);
    if (result) {
      const saved = await saveAnalysisToSupabase(
        symbol,
        result.diagnosis,
        result.risk,
        result.strategy
      );
      if (saved) success++;
      else failed++;
    } else {
      failed++;
    }
    
    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  return { success, failed };
}

export { VN30_SYMBOLS };
export default { analyzeStock, analyzeAllVN30, VN30_SYMBOLS };
