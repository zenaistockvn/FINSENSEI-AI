/**
 * Technical Indicator Service
 * Tính toán các chỉ số PTKT chuẩn từ dữ liệu giá
 */

// ============ TYPES ============
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  // Price & Performance
  currentPrice: number;
  priceChange1d: number;
  priceChange5d: number;
  priceChange20d: number;
  priceChange60d: number;
  
  // Moving Averages
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  priceVsSma20: number | null;
  priceVsSma50: number | null;
  
  // Momentum
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  stochK: number | null;
  stochD: number | null;
  
  // Volatility
  atr14: number | null;
  volatility20d: number | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
  bollingerWidth: number | null;
  
  // Volume
  volumeAvg20d: number | null;
  volumeRatio: number | null;
  obv: number | null;
  
  // Price Position
  high52w: number;
  low52w: number;
  pricePosition: number;
  distanceFromHigh: number;
  
  // Trend & Signals
  trendShort: 'UP' | 'DOWN' | 'SIDEWAYS';
  trendMedium: 'UP' | 'DOWN' | 'SIDEWAYS';
  maCrossSignal: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NONE';
  
  // Composite Scores
  rsRating: number | null;
  momentumScore: number;
  trendScore: number;
  volumeScore: number;
  overallScore: number;
}

// ============ CALCULATION FUNCTIONS ============

/**
 * Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * RSI (Relative Strength Index)
 */
export function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // First average
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Smoothed averages
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(closes: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  if (closes.length < 26) return { macd: null, signal: null, histogram: null };
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  if (!ema12 || !ema26) return { macd: null, signal: null, histogram: null };
  
  const macd = ema12 - ema26;
  
  // Calculate MACD line history for signal
  const macdLine: number[] = [];
  for (let i = 25; i < closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i + 1), 12);
    const e26 = calculateEMA(closes.slice(0, i + 1), 26);
    if (e12 && e26) macdLine.push(e12 - e26);
  }
  
  const signal = macdLine.length >= 9 ? calculateEMA(macdLine, 9) : null;
  const histogram = signal !== null ? macd - signal : null;
  
  return { macd, signal, histogram };
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): { k: number | null; d: number | null } {
  if (closes.length < kPeriod) return { k: null, d: null };
  
  const kValues: number[] = [];
  
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    const k = highestHigh !== lowestLow 
      ? ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100 
      : 50;
    kValues.push(k);
  }
  
  const k = kValues[kValues.length - 1];
  const d = kValues.length >= dPeriod 
    ? kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod 
    : null;
  
  return { k, d };
}

/**
 * ATR (Average True Range)
 */
export function calculateATR(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 14
): number | null {
  if (highs.length < period + 1) return null;
  
  const trueRanges: number[] = [];
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
 * Bollinger Bands
 */
export function calculateBollingerBands(
  closes: number[], 
  period: number = 20, 
  stdDev: number = 2
): { upper: number | null; middle: number | null; lower: number | null; width: number | null } {
  if (closes.length < period) return { upper: null, middle: null, lower: null, width: null };
  
  const sma = calculateSMA(closes, period);
  if (!sma) return { upper: null, middle: null, lower: null, width: null };
  
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = sma + stdDev * std;
  const lower = sma - stdDev * std;
  const width = ((upper - lower) / sma) * 100;
  
  return { upper, middle: sma, lower, width };
}

/**
 * Volatility (Annualized)
 */
export function calculateVolatility(closes: number[], period: number = 20): number | null {
  if (closes.length < period + 1) return null;
  
  const returns: number[] = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

/**
 * OBV (On-Balance Volume)
 */
export function calculateOBV(closes: number[], volumes: number[]): number {
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += volumes[i];
    else if (closes[i] < closes[i - 1]) obv -= volumes[i];
  }
  return obv;
}

/**
 * RS Rating (Relative Strength - IBD style)
 */
export function calculateRSRating(closes: number[]): number | null {
  const n = closes.length;
  if (n < 63) return null;
  
  const currentPrice = closes[n - 1];
  
  const return3m = n >= 63 ? ((currentPrice - closes[n - 63]) / closes[n - 63]) * 100 : null;
  const return6m = n >= 126 ? ((currentPrice - closes[n - 126]) / closes[n - 126]) * 100 : null;
  const return9m = n >= 189 ? ((currentPrice - closes[n - 189]) / closes[n - 189]) * 100 : null;
  const return12m = n >= 252 ? ((currentPrice - closes[n - 252]) / closes[n - 252]) * 100 : null;
  
  let weightedReturn = 0;
  let totalWeight = 0;
  
  if (return3m !== null) { weightedReturn += return3m * 0.4; totalWeight += 0.4; }
  if (return6m !== null) { weightedReturn += return6m * 0.2; totalWeight += 0.2; }
  if (return9m !== null) { weightedReturn += return9m * 0.2; totalWeight += 0.2; }
  if (return12m !== null) { weightedReturn += return12m * 0.2; totalWeight += 0.2; }
  
  if (totalWeight === 0) return null;
  weightedReturn = weightedReturn / totalWeight;
  
  return Math.max(0, Math.min(100, ((weightedReturn + 50) / 150) * 100));
}


/**
 * Determine trend direction
 */
function determineTrend(
  closes: number[], 
  sma20: number | null, 
  sma50: number | null
): { short: 'UP' | 'DOWN' | 'SIDEWAYS'; medium: 'UP' | 'DOWN' | 'SIDEWAYS' } {
  const n = closes.length;
  if (n < 5) return { short: 'SIDEWAYS', medium: 'SIDEWAYS' };
  
  const currentPrice = closes[n - 1];
  const price5dAgo = closes[n - 5];
  
  // Short-term trend
  const shortChange = ((currentPrice - price5dAgo) / price5dAgo) * 100;
  let short: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
  if (shortChange > 2) short = 'UP';
  else if (shortChange < -2) short = 'DOWN';
  
  // Medium-term trend
  let medium: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) medium = 'UP';
    else if (currentPrice < sma20 && sma20 < sma50) medium = 'DOWN';
  }
  
  return { short, medium };
}

/**
 * Detect MA Cross Signal
 */
function detectMACrossSignal(closes: number[], lookback: number = 5): 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NONE' {
  if (closes.length < 50 + lookback) return 'NONE';
  
  const n = closes.length;
  const sma20Now = calculateSMA(closes.slice(0, n), 20);
  const sma50Now = calculateSMA(closes.slice(0, n), 50);
  const sma20Prev = calculateSMA(closes.slice(0, n - lookback), 20);
  const sma50Prev = calculateSMA(closes.slice(0, n - lookback), 50);
  
  if (!sma20Now || !sma50Now || !sma20Prev || !sma50Prev) return 'NONE';
  
  if (sma20Prev <= sma50Prev && sma20Now > sma50Now) return 'GOLDEN_CROSS';
  if (sma20Prev >= sma50Prev && sma20Now < sma50Now) return 'DEATH_CROSS';
  
  return 'NONE';
}

/**
 * Calculate composite scores
 */
function calculateScores(indicators: Partial<TechnicalIndicators>): {
  momentumScore: number;
  trendScore: number;
  volumeScore: number;
  overallScore: number;
} {
  // Momentum Score
  let momentumScore = 50;
  if (indicators.rsi14) {
    if (indicators.rsi14 >= 50 && indicators.rsi14 <= 70) momentumScore += 20;
    else if (indicators.rsi14 > 70) momentumScore += 10;
    else if (indicators.rsi14 < 30) momentumScore -= 10;
  }
  if (indicators.macdHistogram && indicators.macdHistogram > 0) momentumScore += 15;
  if (indicators.priceChange5d && indicators.priceChange5d > 0) momentumScore += 15;
  momentumScore = Math.max(0, Math.min(100, momentumScore));
  
  // Trend Score
  let trendScore = 50;
  if (indicators.priceVsSma20 && indicators.priceVsSma20 > 0) trendScore += 15;
  if (indicators.priceVsSma50 && indicators.priceVsSma50 > 0) trendScore += 15;
  if (indicators.trendShort === 'UP') trendScore += 10;
  if (indicators.trendMedium === 'UP') trendScore += 10;
  if (indicators.maCrossSignal === 'GOLDEN_CROSS') trendScore += 20;
  else if (indicators.maCrossSignal === 'DEATH_CROSS') trendScore -= 20;
  trendScore = Math.max(0, Math.min(100, trendScore));
  
  // Volume Score
  let volumeScore = 50;
  if (indicators.volumeRatio) {
    if (indicators.volumeRatio > 1.5) volumeScore += 30;
    else if (indicators.volumeRatio > 1) volumeScore += 15;
    else if (indicators.volumeRatio < 0.5) volumeScore -= 20;
  }
  volumeScore = Math.max(0, Math.min(100, volumeScore));
  
  // Overall Score (weighted)
  const overallScore = momentumScore * 0.35 + trendScore * 0.4 + volumeScore * 0.25;
  
  return {
    momentumScore: Math.round(momentumScore * 100) / 100,
    trendScore: Math.round(trendScore * 100) / 100,
    volumeScore: Math.round(volumeScore * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100
  };
}

/**
 * Calculate ALL technical indicators from price data
 */
export function calculateAllIndicators(priceData: PriceData[]): TechnicalIndicators | null {
  if (!priceData || priceData.length < 20) return null;
  
  // Sort by date ascending
  const sorted = [...priceData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const closes = sorted.map(p => p.close);
  const highs = sorted.map(p => p.high);
  const lows = sorted.map(p => p.low);
  const volumes = sorted.map(p => p.volume);
  const n = closes.length;
  
  const currentPrice = closes[n - 1];
  const currentVolume = volumes[n - 1];
  
  // Price changes
  const priceChange1d = n >= 2 ? ((closes[n - 1] - closes[n - 2]) / closes[n - 2]) * 100 : 0;
  const priceChange5d = n >= 5 ? ((closes[n - 1] - closes[n - 5]) / closes[n - 5]) * 100 : 0;
  const priceChange20d = n >= 20 ? ((closes[n - 1] - closes[n - 20]) / closes[n - 20]) * 100 : 0;
  const priceChange60d = n >= 60 ? ((closes[n - 1] - closes[n - 60]) / closes[n - 60]) * 100 : 0;
  
  // Moving Averages
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const priceVsSma20 = sma20 ? ((currentPrice - sma20) / sma20) * 100 : null;
  const priceVsSma50 = sma50 ? ((currentPrice - sma50) / sma50) * 100 : null;
  
  // Momentum
  const rsi14 = calculateRSI(closes, 14);
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closes);
  const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
  
  // Volatility
  const atr14 = calculateATR(highs, lows, closes, 14);
  const volatility20d = calculateVolatility(closes, 20);
  const { upper: bollingerUpper, lower: bollingerLower, width: bollingerWidth } = calculateBollingerBands(closes);
  
  // Volume
  const volumeAvg20d = calculateSMA(volumes, 20);
  const volumeRatio = volumeAvg20d ? currentVolume / volumeAvg20d : null;
  const obv = calculateOBV(closes, volumes);
  
  // Price Position (52-week)
  const high52w = Math.max(...highs.slice(-252));
  const low52w = Math.min(...lows.slice(-252));
  const pricePosition = high52w !== low52w 
    ? ((currentPrice - low52w) / (high52w - low52w)) * 100 
    : 50;
  const distanceFromHigh = ((currentPrice - high52w) / high52w) * 100;
  
  // Trends
  const { short: trendShort, medium: trendMedium } = determineTrend(closes, sma20, sma50);
  const maCrossSignal = detectMACrossSignal(closes);
  
  // RS Rating
  const rsRating = calculateRSRating(closes);
  
  // Build partial indicators for score calculation
  const partialIndicators = {
    rsi14,
    macdHistogram,
    priceChange5d,
    priceVsSma20,
    priceVsSma50,
    trendShort,
    trendMedium,
    maCrossSignal,
    volumeRatio
  };
  
  const scores = calculateScores(partialIndicators);
  
  return {
    currentPrice,
    priceChange1d,
    priceChange5d,
    priceChange20d,
    priceChange60d,
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    priceVsSma20,
    priceVsSma50,
    rsi14,
    macd,
    macdSignal,
    macdHistogram,
    stochK,
    stochD,
    atr14,
    volatility20d,
    bollingerUpper,
    bollingerLower,
    bollingerWidth,
    volumeAvg20d,
    volumeRatio,
    obv,
    high52w,
    low52w,
    pricePosition,
    distanceFromHigh,
    trendShort,
    trendMedium,
    maCrossSignal,
    rsRating,
    ...scores
  };
}

/**
 * Get signal interpretation
 */
export function getSignalInterpretation(indicators: TechnicalIndicators): {
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendSignal: 'STRONG_UP' | 'UP' | 'SIDEWAYS' | 'DOWN' | 'STRONG_DOWN';
  overallSignal: 'BUY' | 'SELL' | 'HOLD';
} {
  // RSI Signal
  let rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
  if (indicators.rsi14) {
    if (indicators.rsi14 < 30) rsiSignal = 'OVERSOLD';
    else if (indicators.rsi14 > 70) rsiSignal = 'OVERBOUGHT';
  }
  
  // MACD Signal
  let macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (indicators.macdHistogram) {
    if (indicators.macdHistogram > 0) macdSignal = 'BULLISH';
    else if (indicators.macdHistogram < 0) macdSignal = 'BEARISH';
  }
  
  // Trend Signal
  let trendSignal: 'STRONG_UP' | 'UP' | 'SIDEWAYS' | 'DOWN' | 'STRONG_DOWN' = 'SIDEWAYS';
  if (indicators.trendShort === 'UP' && indicators.trendMedium === 'UP') trendSignal = 'STRONG_UP';
  else if (indicators.trendShort === 'UP' || indicators.trendMedium === 'UP') trendSignal = 'UP';
  else if (indicators.trendShort === 'DOWN' && indicators.trendMedium === 'DOWN') trendSignal = 'STRONG_DOWN';
  else if (indicators.trendShort === 'DOWN' || indicators.trendMedium === 'DOWN') trendSignal = 'DOWN';
  
  // Overall Signal
  let overallSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (indicators.overallScore >= 70 && rsiSignal !== 'OVERBOUGHT') overallSignal = 'BUY';
  else if (indicators.overallScore <= 30 || rsiSignal === 'OVERBOUGHT') overallSignal = 'SELL';
  
  return { rsiSignal, macdSignal, trendSignal, overallSignal };
}

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
  calculateBollingerBands,
  calculateVolatility,
  calculateOBV,
  calculateRSRating,
  calculateAllIndicators,
  getSignalInterpretation
};
