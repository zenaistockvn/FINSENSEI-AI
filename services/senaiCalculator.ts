/**
 * SenAI Calculator Service
 * Tính toán realtime các chỉ số SenAI từ dữ liệu giá và Simplize
 * Sử dụng khi chưa có dữ liệu trong database
 */

export interface SenAIInput {
  symbol: string;
  currentPrice: number;
  priceChangePercent: number;
  ma20: number;
  ma50: number;
  ma200: number;
  rsi14: number;
  pricePosition: number; // 0-100, vị trí trong range 52w
  pe: number;
  pb: number;
  roe: number;
  volume: number;
  avgVolume: number;
  macd?: number;
  macdSignal?: number;
}

export interface SenAIDiagnosis {
  score: number;
  rating: number;
  signal: number; // 1 = MUA, 0 = GIỮ, -1 = BÁN
  recommendation: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  confidence: number;
}

export interface SenAIRisk {
  optimalHoldingDays: number;
  upsideProbability: number;
  downsideRisk: number;
  volatility: number;
  beta: number;
}

export interface SenAIStrategy {
  buyZoneLow: number;
  buyZoneHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  strategyType: string;
  strategyNote: string;
}

/**
 * Tính điểm SenAI Diagnosis
 */
export function calculateSenAIDiagnosis(input: SenAIInput): SenAIDiagnosis {
  let technicalScore = 0;
  let fundamentalScore = 0;
  let momentumScore = 0;

  // ========== TECHNICAL SCORE (max ±30) ==========
  
  // RSI Score (-5 to +10)
  if (input.rsi14 < 30) technicalScore += 10;
  else if (input.rsi14 < 40) technicalScore += 5;
  else if (input.rsi14 <= 60) technicalScore += 3;
  else if (input.rsi14 <= 70) technicalScore += 0;
  else technicalScore -= 5;

  // MA Score (-9 to +15)
  if (input.currentPrice > input.ma20) technicalScore += 5;
  else technicalScore -= 3;
  if (input.currentPrice > input.ma50) technicalScore += 5;
  else technicalScore -= 3;
  if (input.currentPrice > input.ma200) technicalScore += 5;
  else technicalScore -= 3;

  // MA Cross Score (-5 to +5)
  if (input.ma20 > input.ma50) technicalScore += 5;
  else if (input.ma20 < input.ma50 * 0.98) technicalScore -= 5;

  // Price Position Score (0 to +10)
  if (input.pricePosition < 30) technicalScore += 10;
  else if (input.pricePosition < 50) technicalScore += 5;
  else if (input.pricePosition < 70) technicalScore += 3;

  // ========== FUNDAMENTAL SCORE (max ±25) ==========
  
  // P/E Score (-5 to +12)
  if (input.pe > 0) {
    if (input.pe < 8) fundamentalScore += 12;
    else if (input.pe < 12) fundamentalScore += 8;
    else if (input.pe < 15) fundamentalScore += 5;
    else if (input.pe < 20) fundamentalScore += 2;
    else if (input.pe > 30) fundamentalScore -= 5;
  }

  // P/B Score (-3 to +8)
  if (input.pb > 0) {
    if (input.pb < 1.0) fundamentalScore += 8;
    else if (input.pb < 1.5) fundamentalScore += 5;
    else if (input.pb < 2.5) fundamentalScore += 2;
    else if (input.pb > 3) fundamentalScore -= 3;
  }

  // ROE Score (-3 to +10)
  if (input.roe > 25) fundamentalScore += 10;
  else if (input.roe > 20) fundamentalScore += 8;
  else if (input.roe > 15) fundamentalScore += 5;
  else if (input.roe > 10) fundamentalScore += 2;
  else fundamentalScore -= 3;

  // ========== MOMENTUM SCORE (max ±13) ==========
  
  // Price Change Score (-5 to +5)
  if (input.priceChangePercent > 3) momentumScore += 5;
  else if (input.priceChangePercent > 1) momentumScore += 3;
  else if (input.priceChangePercent > -1) momentumScore += 1;
  else if (input.priceChangePercent > -3) momentumScore -= 2;
  else momentumScore -= 5;

  // Volume Score (-2 to +5)
  const volumeRatio = input.avgVolume > 0 ? input.volume / input.avgVolume : 1;
  if (volumeRatio > 2) momentumScore += 5;
  else if (volumeRatio > 1.5) momentumScore += 3;
  else if (volumeRatio > 0.8) momentumScore += 1;
  else momentumScore -= 2;

  // MACD Score (-3 to +5)
  if (input.macd !== undefined && input.macdSignal !== undefined) {
    if (input.macd > input.macdSignal) momentumScore += 5;
    else momentumScore -= 3;
  }

  // ========== TỔNG HỢP ==========
  let score = 50 + technicalScore + fundamentalScore + momentumScore;
  score = Math.max(0, Math.min(100, score));

  // Determine signal and recommendation
  let signal: number;
  let recommendation: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';

  if (score >= 75) {
    signal = 1;
    recommendation = 'MUA';
  } else if (score >= 60) {
    signal = 1;
    recommendation = 'THEO DÕI';
  } else if (score >= 45) {
    signal = 0;
    recommendation = 'NẮM GIỮ';
  } else if (score >= 30) {
    signal = -1;
    recommendation = 'THEO DÕI';
  } else {
    signal = -1;
    recommendation = 'BÁN';
  }

  const rating = Math.ceil(score / 20);
  const confidence = Math.min(95, 60 + Math.abs(score - 50) * 0.7);

  return {
    score: Math.round(score),
    rating,
    signal,
    recommendation,
    confidence: Math.round(confidence)
  };
}

/**
 * Tính Risk Analysis
 */
export function calculateSenAIRisk(
  input: SenAIInput,
  volatility: number,
  maxDrawdown: number
): SenAIRisk {
  // Upside Probability
  let upsideProbability = 50;
  
  if (input.currentPrice > input.ma20) upsideProbability += 8;
  if (input.currentPrice > input.ma50) upsideProbability += 7;
  if (input.currentPrice > input.ma200) upsideProbability += 5;
  
  if (input.rsi14 < 30) upsideProbability += 12;
  else if (input.rsi14 < 40) upsideProbability += 10;
  else if (input.rsi14 > 70) upsideProbability -= 10;
  else if (input.rsi14 > 60) upsideProbability -= 8;
  
  if (input.pricePosition < 30) upsideProbability += 10;
  else if (input.pricePosition < 50) upsideProbability += 5;
  else if (input.pricePosition > 80) upsideProbability -= 5;
  
  if (input.pe > 0 && input.pe < 15) upsideProbability += 5;
  if (input.roe > 15) upsideProbability += 5;

  upsideProbability = Math.max(15, Math.min(85, upsideProbability));

  // Downside Risk
  const downsideRisk = Math.min(30, maxDrawdown * 0.6 + volatility * 0.3);

  // Optimal Holding Days
  let optimalHoldingDays: number;
  if (volatility > 45) optimalHoldingDays = 5;
  else if (volatility > 35) optimalHoldingDays = 10;
  else if (volatility > 25) optimalHoldingDays = 20;
  else if (volatility > 15) optimalHoldingDays = 40;
  else optimalHoldingDays = 60;

  // Beta
  const marketVolatility = 25;
  let beta = 1 + (volatility - marketVolatility) / 50;
  beta = Math.max(0.3, Math.min(2.5, beta));

  return {
    optimalHoldingDays,
    upsideProbability: Math.round(upsideProbability),
    downsideRisk: Math.round(downsideRisk * 10) / 10,
    volatility: Math.round(volatility * 10) / 10,
    beta: Math.round(beta * 100) / 100
  };
}

/**
 * Tính Trading Strategy
 */
export function calculateSenAIStrategy(
  input: SenAIInput,
  support1: number,
  support2: number,
  resistance1: number,
  resistance2: number
): SenAIStrategy {
  const currentPrice = input.currentPrice;
  
  // Buy Zone
  const buyZoneLow = support1 * 0.99;
  const buyZoneHigh = support1 * 1.02;
  
  // Stop Loss
  const stopLoss = support2 * 0.97;
  
  // Targets
  const risk = currentPrice - stopLoss;
  const target1 = Math.min(currentPrice + risk * 1.5, resistance1);
  const target2 = Math.min(currentPrice + risk * 2.5, resistance2);
  const target3 = Math.max(currentPrice + risk * 4.0, resistance2 * 1.1);

  // Strategy Type
  let strategyType: string;
  let strategyNote: string;

  const maCrossRatio = input.ma20 / input.ma50;
  const isMASideway = maCrossRatio > 0.97 && maCrossRatio < 1.03;

  if (input.rsi14 < 30 && currentPrice < input.ma20) {
    strategyType = 'Bắt đáy';
    strategyNote = '🔵 RSI quá bán + giá dưới MA20. Cơ hội bắt đáy khi có nến đảo chiều với volume tăng.';
  } else if (input.rsi14 > 70 && currentPrice > input.ma20) {
    strategyType = 'Chốt lời';
    strategyNote = '🟡 RSI quá mua. Cân nhắc chốt lời 50-70% vị thế tại vùng kháng cự.';
  } else if (currentPrice > input.ma20 && input.ma20 > input.ma50) {
    strategyType = 'Theo xu hướng';
    strategyNote = '🟢 Xu hướng TĂNG (Giá > MA20 > MA50). Mua khi pullback về MA20.';
  } else if (currentPrice < input.ma20 && input.ma20 < input.ma50) {
    strategyType = 'Đứng ngoài';
    strategyNote = '🔴 Xu hướng GIẢM. KHÔNG GIAO DỊCH. Chờ tín hiệu đảo chiều.';
  } else if (isMASideway) {
    strategyType = 'Tích lũy';
    strategyNote = '⚪ Thị trường SIDEWAY. Mua tại hỗ trợ, bán tại kháng cự.';
  } else if (currentPrice > resistance1 * 0.98) {
    strategyType = 'Breakout';
    strategyNote = '🚀 Giá gần kháng cự. Chờ BREAKOUT với volume đột biến (>2x).';
  } else {
    strategyType = 'Theo dõi';
    strategyNote = '👀 Chưa có setup rõ ràng. Theo dõi và chờ cơ hội.';
  }

  const round = (p: number) => Math.round(p / 100) * 100;

  return {
    buyZoneLow: round(buyZoneLow),
    buyZoneHigh: round(buyZoneHigh),
    stopLoss: round(stopLoss),
    target1: round(target1),
    target2: round(target2),
    target3: round(target3),
    strategyType,
    strategyNote
  };
}

export default {
  calculateSenAIDiagnosis,
  calculateSenAIRisk,
  calculateSenAIStrategy
};
