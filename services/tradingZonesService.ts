/**
 * Trading Zones Calculator Service
 * Tính toán các vùng giao dịch: Buy Zone, Stop Loss, Targets
 * Dựa trên phân tích kỹ thuật: Support/Resistance, ATR, Fibonacci, Pivot Points
 * 
 * ĐẶC ĐIỂM THỊ TRƯỜNG VIỆT NAM:
 * - Biên độ dao động: ±7% (HOSE), ±10% (HNX), ±15% (UPCOM)
 * - Quy tắc T+2.5: Mua hôm nay, bán được sau 2.5 ngày làm việc
 * - Bước giá: 10đ (<10k), 50đ (10k-50k), 100đ (>50k)
 * - Lô giao dịch: 100 cổ phiếu
 * - Phí giao dịch: ~0.15-0.35% mỗi chiều
 * - Thuế bán: 0.1%
 */

// ============ VIETNAM MARKET CONSTANTS ============

export const VN_MARKET = {
  // Biên độ dao động theo sàn
  PRICE_LIMIT: {
    HOSE: 0.07,    // ±7%
    HNX: 0.10,     // ±10%
    UPCOM: 0.15    // ±15%
  },
  // Bước giá
  TICK_SIZE: {
    UNDER_10K: 10,
    FROM_10K_TO_50K: 50,
    ABOVE_50K: 100
  },
  // Chi phí giao dịch
  TRADING_COST: {
    BUY_FEE: 0.0015,      // 0.15% phí mua
    SELL_FEE: 0.0015,     // 0.15% phí bán
    SELL_TAX: 0.001       // 0.1% thuế bán
  },
  // Quy tắc T+
  SETTLEMENT_DAYS: 2.5,
  // Lô giao dịch tối thiểu
  MIN_LOT_SIZE: 100
};

/**
 * Làm tròn giá theo bước giá Việt Nam
 */
export function roundVNPrice(price: number): number {
  if (price < 10000) {
    return Math.round(price / VN_MARKET.TICK_SIZE.UNDER_10K) * VN_MARKET.TICK_SIZE.UNDER_10K;
  } else if (price < 50000) {
    return Math.round(price / VN_MARKET.TICK_SIZE.FROM_10K_TO_50K) * VN_MARKET.TICK_SIZE.FROM_10K_TO_50K;
  } else {
    return Math.round(price / VN_MARKET.TICK_SIZE.ABOVE_50K) * VN_MARKET.TICK_SIZE.ABOVE_50K;
  }
}

/**
 * Tính giá trần/sàn theo sàn giao dịch
 */
export function calculatePriceLimits(
  referencePrice: number, 
  exchange: 'HOSE' | 'HNX' | 'UPCOM' = 'HOSE'
): { ceiling: number; floor: number } {
  const limit = VN_MARKET.PRICE_LIMIT[exchange];
  return {
    ceiling: roundVNPrice(referencePrice * (1 + limit)),
    floor: roundVNPrice(referencePrice * (1 - limit))
  };
}

/**
 * Tính chi phí giao dịch thực tế
 */
export function calculateTradingCost(
  buyPrice: number,
  sellPrice: number,
  quantity: number
): { totalCost: number; netProfit: number; breakEvenPrice: number } {
  const buyValue = buyPrice * quantity;
  const sellValue = sellPrice * quantity;
  
  const buyFee = buyValue * VN_MARKET.TRADING_COST.BUY_FEE;
  const sellFee = sellValue * VN_MARKET.TRADING_COST.SELL_FEE;
  const sellTax = sellValue * VN_MARKET.TRADING_COST.SELL_TAX;
  
  const totalCost = buyFee + sellFee + sellTax;
  const netProfit = sellValue - buyValue - totalCost;
  
  // Giá hòa vốn = giá mua * (1 + tổng phí %)
  const totalFeePercent = VN_MARKET.TRADING_COST.BUY_FEE + VN_MARKET.TRADING_COST.SELL_FEE + VN_MARKET.TRADING_COST.SELL_TAX;
  const breakEvenPrice = roundVNPrice(buyPrice * (1 + totalFeePercent));
  
  return { totalCost, netProfit, breakEvenPrice };
}

// ============ TYPES ============

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BuyZone {
  low: number;
  high: number;
  optimal: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface StopLoss {
  price: number;
  percentage: number;
  type: 'ATR_BASED' | 'SUPPORT_BASED' | 'PERCENTAGE_BASED';
}

export interface PriceTarget {
  price: number;
  percentage: number;
  riskReward: number;
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface FibonacciLevels {
  level0: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
  level1000: number;
  ext1272: number;
  ext1618: number;
  ext2000: number;
}

export interface TradingStrategy {
  symbol: string;
  currentPrice: number;
  analysisDate: string;
  exchange?: 'HOSE' | 'HNX' | 'UPCOM';
  buyZone: BuyZone;
  stopLoss: StopLoss;
  targets: {
    target1: PriceTarget;
    target2: PriceTarget;
    target3: PriceTarget;
  };
  support: { s1: number; s2: number };
  resistance: { r1: number; r2: number };
  pivots: PivotPoints;
  fibonacci: FibonacciLevels;
  confluenceZones?: ConfluenceZone[];
  goldenZone?: { isGoldenZone: boolean; price: number } | null;
  riskAnalysis?: RiskRewardAnalysis;
  // Chiến lược phù hợp VN: T+3 (không scalping intraday)
  strategyType: 'SWING_NGẮN' | 'SWING_TRUNG' | 'ĐẦU_TƯ_DÀI';
  holdingPeriod: string;
  trendDirection: 'TĂNG' | 'GIẢM' | 'SIDEWAY';
  confidence: number;
  signals: string[];
  // Thông tin bổ sung cho VN
  breakEvenPrice?: number;  // Giá hòa vốn sau phí
  tradingCostPercent?: number;  // Tổng % phí giao dịch
}


// ============ SUPPORT/RESISTANCE DETECTION ============

/**
 * Find swing highs (local maxima)
 */
export function findSwingHighs(highs: number[], period: number = 5): number[] {
  const swingHighs: number[] = [];
  for (let i = period; i < highs.length - period; i++) {
    const leftMax = Math.max(...highs.slice(i - period, i));
    const rightMax = Math.max(...highs.slice(i + 1, i + period + 1));
    if (highs[i] >= leftMax && highs[i] >= rightMax) {
      swingHighs.push(highs[i]);
    }
  }
  return swingHighs;
}

/**
 * Find swing lows (local minima)
 */
export function findSwingLows(lows: number[], period: number = 5): number[] {
  const swingLows: number[] = [];
  for (let i = period; i < lows.length - period; i++) {
    const leftMin = Math.min(...lows.slice(i - period, i));
    const rightMin = Math.min(...lows.slice(i + 1, i + period + 1));
    if (lows[i] <= leftMin && lows[i] <= rightMin) {
      swingLows.push(lows[i]);
    }
  }
  return swingLows;
}

/**
 * Cluster similar price levels (within threshold)
 */
export function clusterLevels(levels: number[], threshold: number = 0.02): number[] {
  if (levels.length === 0) return [];
  
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let currentCluster: number[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i] - sorted[i - 1]) / sorted[i - 1] <= threshold) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }
  clusters.push(currentCluster);
  
  // Return average of each cluster, weighted by cluster size
  return clusters
    .map(c => c.reduce((a, b) => a + b, 0) / c.length)
    .sort((a, b) => b - a); // Sort descending
}

/**
 * Calculate support and resistance levels
 */
export function calculateSupportResistance(
  prices: PriceData[],
  currentPrice: number
): { supports: number[]; resistances: number[] } {
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  
  const swingHighs = findSwingHighs(highs, 5);
  const swingLows = findSwingLows(lows, 5);
  
  const clusteredHighs = clusterLevels(swingHighs, 0.02);
  const clusteredLows = clusterLevels(swingLows, 0.02);
  
  // Supports are below current price
  const supports = clusteredLows
    .filter(l => l < currentPrice)
    .slice(0, 3);
  
  // Resistances are above current price
  const resistances = clusteredHighs
    .filter(h => h > currentPrice)
    .slice(-3)
    .reverse();
  
  return { supports, resistances };
}

// ============ ATR CALCULATION ============

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(prices: PriceData[], period: number = 14): number {
  if (prices.length < period + 1) return 0;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const tr = Math.max(
      prices[i].high - prices[i].low,
      Math.abs(prices[i].high - prices[i - 1].close),
      Math.abs(prices[i].low - prices[i - 1].close)
    );
    trueRanges.push(tr);
  }
  
  // Simple average of last 'period' true ranges
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
}

// ============ MOVING AVERAGES ============

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}


// ============ BUY ZONE CALCULATION ============

/**
 * Calculate optimal buy zone - Điều chỉnh cho VN với T+2.5
 * 
 * LÝ DO CẦN VÙNG MUA RỘNG HƠN:
 * - T+2.5: Cần thời gian để tích lũy, không thể "bắt đáy" chính xác
 * - Vùng mua rộng hơn cho phép mua dần (DCA) trong 2-3 phiên
 * - Giảm rủi ro mua đúng đỉnh ngắn hạn
 */
export function calculateBuyZone(
  currentPrice: number,
  support1: number,
  support2: number,
  atr: number,
  ma20: number | null,
  ma50: number | null,
  rsi: number | null,
  exchange: 'HOSE' | 'HNX' | 'UPCOM' = 'HOSE'
): BuyZone {
  // Base buy zone from support - MỞ RỘNG cho T+2.5
  let buyLow = support1 - (atr * 0.3);  // Thêm buffer dưới support
  let buyHigh = support1 + (atr * 0.8);  // Tăng từ 0.5 lên 0.8
  
  // Adjust for trend
  const isUptrend = ma50 ? currentPrice > ma50 : false;
  const isPullback = ma20 && ma50 ? (currentPrice < ma20 && currentPrice > ma50) : false;
  
  if (isUptrend && isPullback && ma20) {
    // In uptrend, buy on pullback to MA20 - Mở rộng vùng
    buyLow = Math.max(ma20 - (atr * 0.5), support1 - (atr * 0.3));  // Tăng từ 0.3 lên 0.5
    buyHigh = ma20 + (atr * 0.3);  // Tăng từ 0.2 lên 0.3
  }
  
  // Adjust for oversold conditions - Mở rộng hơn khi RSI thấp
  if (rsi && rsi < 35) {
    buyHigh += atr * 0.5;  // Tăng từ 0.3 lên 0.5
  }
  
  // Adjust if price is below both MAs (weak trend) - Cẩn thận hơn
  if (ma20 && ma50 && currentPrice < ma20 && currentPrice < ma50) {
    buyLow -= atr * 0.5;  // Tăng từ 0.3 lên 0.5
    buyHigh = support1 - (atr * 0.1);  // Chờ giá về gần support hơn
  }
  
  // Ensure buy zone is below current price
  if (buyHigh > currentPrice) {
    buyHigh = currentPrice - (atr * 0.15);  // Giảm từ 0.2 xuống 0.15
  }
  if (buyLow > buyHigh) {
    buyLow = buyHigh - (atr * 0.8);  // Tăng từ 0.5 lên 0.8
  }
  
  // Kiểm tra không vượt quá giá sàn
  const { floor } = calculatePriceLimits(currentPrice, exchange);
  if (buyLow < floor) {
    buyLow = floor;
  }
  
  // Determine strength - Điều chỉnh cho VN
  let strength: 'WEAK' | 'MODERATE' | 'STRONG' = 'MODERATE';
  if (rsi && rsi < 35 && currentPrice <= support1 * 1.03) {  // Nới lỏng từ 1.02 lên 1.03
    strength = 'STRONG';
  } else if (ma20 && currentPrice > ma20 && currentPrice > support1 * 1.08) {  // Tăng từ 1.05 lên 1.08
    strength = 'WEAK';
  }
  
  // Làm tròn theo bước giá VN
  return {
    low: roundVNPrice(buyLow),
    high: roundVNPrice(buyHigh),
    optimal: roundVNPrice((buyLow + buyHigh) / 2),
    strength
  };
}

// ============ STOP LOSS CALCULATION ============

/**
 * Calculate stop loss level - Điều chỉnh cho VN với T+2.5
 * 
 * LÝ DO CẦN BIÊN ĐỘ RỘNG HƠN:
 * - T+2.5: Không thể bán ngay khi giá giảm, phải chờ 2-3 ngày
 * - Trong 2-3 ngày, giá có thể dao động ±7% x 2-3 = ±14-21%
 * - Stop loss quá chặt sẽ bị "quét" trước khi có thể bán
 * - Khuyến nghị: Stop loss 7-10% để có buffer cho T+2.5
 */
export function calculateStopLoss(
  entryPrice: number,
  support1: number,
  support2: number,
  atr: number,
  volatility: number,
  exchange: 'HOSE' | 'HNX' | 'UPCOM' = 'HOSE'
): StopLoss {
  // ATR multiplier - TĂNG cho VN do T+2.5 cần buffer lớn hơn
  let atrMultiplier = 1.8;  // Tăng từ 1.2 lên 1.8
  if (volatility > 3) {
    atrMultiplier = 2.5;    // Tăng từ 1.5 lên 2.5 cho cổ phiếu biến động mạnh
  } else if (volatility < 1.5) {
    atrMultiplier = 1.5;    // Tăng từ 1.0 lên 1.5
  }
  
  // Method 1: ATR-based
  const atrStop = entryPrice - (atr * atrMultiplier);
  
  // Method 2: Support-based - Thêm buffer cho T+2.5
  const supportStop = support2 - (atr * 0.5);  // Tăng buffer từ 0.3 lên 0.5
  
  // Method 3: Percentage-based - Max 8% cho VN (tăng từ 5% lên 8%)
  // Lý do: T+2.5 cần buffer, 8% cho phép chịu được 2-3 ngày biến động
  const maxStop = entryPrice * 0.92;  // 8% max loss
  
  // Choose the best stop
  let finalStop = atrStop;
  let stopType: 'ATR_BASED' | 'SUPPORT_BASED' | 'PERCENTAGE_BASED' = 'ATR_BASED';
  
  // If support-based stop is tighter but still valid
  if (supportStop > atrStop && supportStop < support1) {
    finalStop = supportStop;
    stopType = 'SUPPORT_BASED';
  }
  
  // Ensure we don't exceed max loss (8% cho VN với T+2.5)
  if (finalStop < maxStop) {
    finalStop = maxStop;
    stopType = 'PERCENTAGE_BASED';
  }
  
  // Kiểm tra không vượt quá giá sàn
  const { floor } = calculatePriceLimits(entryPrice, exchange);
  if (finalStop < floor) {
    finalStop = floor;
    stopType = 'PERCENTAGE_BASED';
  }
  
  const percentage = ((entryPrice - finalStop) / entryPrice) * 100;
  
  return {
    price: roundVNPrice(finalStop),
    percentage: Math.round(percentage * 100) / 100,
    type: stopType
  };
}

// ============ TARGETS CALCULATION ============

/**
 * Calculate price targets - Điều chỉnh cho VN với T+2.5
 * 
 * LÝ DO CẦN TARGET CAO HƠN:
 * - Stop loss rộng hơn (8%) → cần target cao hơn để giữ R:R tốt
 * - T+2.5: Cần thời gian nắm giữ dài hơn → target xa hơn
 * - Chi phí giao dịch ~0.4% → cần lãi ròng đủ lớn
 * 
 * KHUYẾN NGHỊ (R:R tối thiểu 1:3):
 * - Target 1: R:R 1:3 (~24% với stop 8%)
 * - Target 2: R:R 1:4 (~32% với stop 8%)
 * - Target 3: R:R 1:5+ (~40%+ với stop 8%)
 */
export function calculateTargets(
  entryPrice: number,
  stopLoss: number,
  resistance1: number,
  resistance2: number,
  high52w: number,
  exchange: 'HOSE' | 'HNX' | 'UPCOM' = 'HOSE'
): { target1: PriceTarget; target2: PriceTarget; target3: PriceTarget } {
  const risk = entryPrice - stopLoss;
  const tradingCostPercent = (VN_MARKET.TRADING_COST.BUY_FEE + VN_MARKET.TRADING_COST.SELL_FEE + VN_MARKET.TRADING_COST.SELL_TAX) * 100;
  
  // Target 1: R:R = 1:3 (tối thiểu) - Đây là mức tối thiểu để giao dịch có ý nghĩa
  // Với stop loss 8%, target 1 = 24%
  let tp1 = entryPrice + (risk * 3);  // R:R 1:3
  const minTarget1 = entryPrice * (1 + 0.20 + tradingCostPercent / 100);  // Tối thiểu 20% lãi ròng
  if (tp1 < minTarget1) tp1 = minTarget1;
  // Chỉ dùng resistance nếu nó đạt R:R >= 3
  if (resistance1 >= entryPrice + (risk * 3) && resistance1 < tp1) {
    tp1 = resistance1;
  }
  
  // Target 2: R:R = 1:4
  let tp2 = entryPrice + (risk * 4);  // R:R 1:4
  const minTarget2 = entryPrice * 1.30;  // Tối thiểu 30%
  if (tp2 < minTarget2) tp2 = minTarget2;
  if (resistance2 >= entryPrice + (risk * 4) && resistance2 < tp2 && resistance2 > tp1) {
    tp2 = resistance2;
  }
  
  // Target 3: R:R = 1:5 hoặc 52-week high
  let tp3 = entryPrice + (risk * 5);  // R:R 1:5
  const minTarget3 = entryPrice * 1.40;  // Tối thiểu 40%
  if (high52w > tp3) {
    tp3 = high52w;  // Dùng 52w high nếu cao hơn
  }
  if (tp3 < minTarget3) tp3 = minTarget3;
  
  const calcRR = (target: number) => Math.round(((target - entryPrice) / risk) * 10) / 10;
  const calcPct = (target: number) => Math.round(((target - entryPrice) / entryPrice) * 1000) / 10;
  
  return {
    target1: { price: roundVNPrice(tp1), percentage: calcPct(tp1), riskReward: calcRR(tp1) },
    target2: { price: roundVNPrice(tp2), percentage: calcPct(tp2), riskReward: calcRR(tp2) },
    target3: { price: roundVNPrice(tp3), percentage: calcPct(tp3), riskReward: calcRR(tp3) }
  };
}


// ============ PIVOT POINTS ============

/**
 * Calculate Pivot Points
 */
export function calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
  const pivot = (high + low + close) / 3;
  const range = high - low;
  
  return {
    pivot: Math.round(pivot),
    r1: Math.round((2 * pivot) - low),
    r2: Math.round(pivot + range),
    r3: Math.round(high + 2 * (pivot - low)),
    s1: Math.round((2 * pivot) - high),
    s2: Math.round(pivot - range),
    s3: Math.round(low - 2 * (high - pivot))
  };
}

// ============ FIBONACCI LEVELS ============

/**
 * Calculate Fibonacci retracement and extension levels
 */
export function calculateFibonacci(
  swingLow: number,
  swingHigh: number,
  isUptrend: boolean
): FibonacciLevels {
  const range = swingHigh - swingLow;
  
  if (isUptrend) {
    return {
      level0: Math.round(swingHigh),
      level236: Math.round(swingHigh - (range * 0.236)),
      level382: Math.round(swingHigh - (range * 0.382)),
      level500: Math.round(swingHigh - (range * 0.500)),
      level618: Math.round(swingHigh - (range * 0.618)),
      level786: Math.round(swingHigh - (range * 0.786)),
      level1000: Math.round(swingLow),
      ext1272: Math.round(swingHigh + (range * 0.272)),
      ext1618: Math.round(swingHigh + (range * 0.618)),
      ext2000: Math.round(swingHigh + range)
    };
  } else {
    return {
      level0: Math.round(swingLow),
      level236: Math.round(swingLow + (range * 0.236)),
      level382: Math.round(swingLow + (range * 0.382)),
      level500: Math.round(swingLow + (range * 0.500)),
      level618: Math.round(swingLow + (range * 0.618)),
      level786: Math.round(swingLow + (range * 0.786)),
      level1000: Math.round(swingHigh),
      ext1272: Math.round(swingLow - (range * 0.272)),
      ext1618: Math.round(swingLow - (range * 0.618)),
      ext2000: Math.round(swingLow - range)
    };
  }
}

// ============ CONFLUENCE ZONE DETECTION ============

export interface ConfluenceZone {
  price: number;
  strength: number;
  sources: string[];
  type: 'SUPPORT' | 'RESISTANCE' | 'NEUTRAL';
}

/**
 * Find confluence zones where multiple technical levels overlap
 * Requirements: 1.4, 5.5
 */
export function findConfluenceZones(
  supports: number[],
  resistances: number[],
  pivots: PivotPoints,
  fibonacci: FibonacciLevels,
  ma20: number | null,
  ma50: number | null,
  currentPrice: number,
  threshold: number = 0.015  // 1.5% threshold
): ConfluenceZone[] {
  const allLevels: { price: number; source: string }[] = [
    ...supports.map((p, i) => ({ price: p, source: `Support ${i + 1}` })),
    ...resistances.map((p, i) => ({ price: p, source: `Resistance ${i + 1}` })),
    { price: pivots.pivot, source: 'Pivot' },
    { price: pivots.s1, source: 'Pivot S1' },
    { price: pivots.s2, source: 'Pivot S2' },
    { price: pivots.r1, source: 'Pivot R1' },
    { price: pivots.r2, source: 'Pivot R2' },
    { price: fibonacci.level382, source: 'Fib 38.2%' },
    { price: fibonacci.level500, source: 'Fib 50%' },
    { price: fibonacci.level618, source: 'Fib 61.8% (Golden)' },
    { price: fibonacci.level786, source: 'Fib 78.6%' },
  ];
  
  // Add MAs if available
  if (ma20) allLevels.push({ price: ma20, source: 'MA20' });
  if (ma50) allLevels.push({ price: ma50, source: 'MA50' });
  
  // Filter out invalid prices
  const validLevels = allLevels.filter(l => l.price > 0 && isFinite(l.price));
  
  const confluences: ConfluenceZone[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < validLevels.length; i++) {
    const baseLevel = validLevels[i];
    
    // Skip if already processed in another cluster
    if (processed.has(i)) continue;
    
    const sources = [baseLevel.source];
    const prices = [baseLevel.price];
    processed.add(i);
    
    for (let j = i + 1; j < validLevels.length; j++) {
      if (processed.has(j)) continue;
      
      const compareLevel = validLevels[j];
      const diff = Math.abs(baseLevel.price - compareLevel.price) / baseLevel.price;
      
      if (diff <= threshold) {
        sources.push(compareLevel.source);
        prices.push(compareLevel.price);
        processed.add(j);
      }
    }
    
    // Only add if there are at least 2 confluent levels
    if (sources.length >= 2) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const type: 'SUPPORT' | 'RESISTANCE' | 'NEUTRAL' = 
        avgPrice < currentPrice * 0.99 ? 'SUPPORT' :
        avgPrice > currentPrice * 1.01 ? 'RESISTANCE' : 'NEUTRAL';
      
      confluences.push({
        price: Math.round(avgPrice),
        strength: sources.length,
        sources,
        type
      });
    }
  }
  
  return confluences.sort((a, b) => b.strength - a.strength);
}

/**
 * Check if Fibonacci 61.8% coincides with support (Golden Zone)
 * Requirements: 6.4
 */
export function detectGoldenZone(
  fibonacci: FibonacciLevels,
  supports: number[],
  threshold: number = 0.015
): { isGoldenZone: boolean; price: number } | null {
  const fib618 = fibonacci.level618;
  
  for (const support of supports) {
    const diff = Math.abs(fib618 - support) / fib618;
    if (diff <= threshold) {
      return {
        isGoldenZone: true,
        price: Math.round((fib618 + support) / 2)
      };
    }
  }
  
  return null;
}


// ============ RISK/REWARD ANALYSIS ============

export interface RiskRewardAnalysis {
  riskReward: number;
  riskPercent: number;
  rewardPercent: number;
  winRateNeeded: number;
  rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  suggestedPositionSize: number;  // % of portfolio based on 2% rule
}

/**
 * Analyze risk/reward ratio for a trade
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function analyzeRiskReward(
  entry: number,
  stopLoss: number,
  target: number,
  portfolioSize: number = 100000000  // Default 100M VND
): RiskRewardAnalysis {
  const risk = entry - stopLoss;
  const reward = target - entry;
  const riskReward = risk > 0 ? reward / risk : 0;
  
  const riskPercent = (risk / entry) * 100;
  const rewardPercent = (reward / entry) * 100;
  
  // Win rate needed to break even: WR = 1 / (1 + R:R)
  const winRateNeeded = riskReward > 0 ? (1 / (1 + riskReward)) * 100 : 100;
  
  // Rating based on R:R ratio
  let rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'FAIR';
  if (riskReward < 1) rating = 'POOR';
  else if (riskReward >= 1 && riskReward < 2) rating = 'FAIR';
  else if (riskReward >= 2 && riskReward < 3) rating = 'GOOD';
  else rating = 'EXCELLENT';
  
  // Position size based on 2% risk rule
  // Max loss = 2% of portfolio
  // Position size = (2% of portfolio) / (risk per share)
  const maxRiskAmount = portfolioSize * 0.02;
  const sharesCanBuy = risk > 0 ? Math.floor(maxRiskAmount / risk) : 0;
  const positionValue = sharesCanBuy * entry;
  const suggestedPositionSize = Math.round((positionValue / portfolioSize) * 100);
  
  return {
    riskReward: Math.round(riskReward * 100) / 100,
    riskPercent: Math.round(riskPercent * 100) / 100,
    rewardPercent: Math.round(rewardPercent * 100) / 100,
    winRateNeeded: Math.round(winRateNeeded * 10) / 10,
    rating,
    suggestedPositionSize: Math.min(suggestedPositionSize, 100)  // Cap at 100%
  };
}


// ============ STRATEGY CLASSIFICATION ============

/**
 * Classify trading strategy type - Điều chỉnh cho VN với R:R 1:3+
 * - Không có Scalping (do T+2.5)
 * - Với stop 8% và R:R 1:3, target tối thiểu ~24%
 * - Swing ngắn: 1-2 tuần (target 20-30%)
 * - Swing trung: 2-4 tuần (target 30-40%)
 * - Đầu tư dài: 1-3 tháng+ (target 40%+)
 */
export function classifyStrategy(
  atr: number,
  currentPrice: number,
  targetPercent: number
): { type: 'SWING_NGẮN' | 'SWING_TRUNG' | 'ĐẦU_TƯ_DÀI'; holdingPeriod: string } {
  // VN không có scalping intraday do T+2.5
  // Với R:R 1:3 và stop 8%, target tối thiểu ~24%
  
  if (targetPercent < 30) {
    return { type: 'SWING_NGẮN', holdingPeriod: '1-2 tuần' };
  }
  
  if (targetPercent >= 30 && targetPercent <= 40) {
    return { type: 'SWING_TRUNG', holdingPeriod: '2-4 tuần' };
  }
  
  return { type: 'ĐẦU_TƯ_DÀI', holdingPeriod: '1-3 tháng' };
}

// ============ TREND DETECTION ============

/**
 * Detect trend direction - Tiếng Việt
 */
export function detectTrend(
  currentPrice: number,
  ma20: number | null,
  ma50: number | null,
  priceChange20d: number
): 'TĂNG' | 'GIẢM' | 'SIDEWAY' {
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  if (ma20 && currentPrice > ma20) bullishSignals++;
  else if (ma20) bearishSignals++;
  
  if (ma50 && currentPrice > ma50) bullishSignals++;
  else if (ma50) bearishSignals++;
  
  if (ma20 && ma50 && ma20 > ma50) bullishSignals++;
  else if (ma20 && ma50) bearishSignals++;
  
  if (priceChange20d > 5) bullishSignals++;
  else if (priceChange20d < -5) bearishSignals++;
  
  if (bullishSignals >= 3) return 'TĂNG';
  if (bearishSignals >= 3) return 'GIẢM';
  return 'SIDEWAY';
}


// ============ MAIN CALCULATION FUNCTION ============

/**
 * Calculate complete trading strategy for a stock - Phiên bản Việt Nam
 */
export function calculateTradingStrategy(
  symbol: string,
  prices: PriceData[],
  technicalIndicators?: {
    rsi14?: number;
    ma20?: number;
    ma50?: number;
    volatility20d?: number;
    priceChange20d?: number;
  },
  exchange: 'HOSE' | 'HNX' | 'UPCOM' = 'HOSE'
): TradingStrategy | null {
  if (!prices || prices.length < 30) return null;
  
  // Sort by date ascending
  const sorted = [...prices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const n = sorted.length;
  const currentPrice = sorted[n - 1].close;
  const closes = sorted.map(p => p.close);
  const highs = sorted.map(p => p.high);
  const lows = sorted.map(p => p.low);
  
  // Calculate ATR
  const atr = calculateATR(sorted, 14);
  
  // Calculate MAs if not provided
  const ma20 = technicalIndicators?.ma20 || calculateSMA(closes, 20);
  const ma50 = technicalIndicators?.ma50 || calculateSMA(closes, 50);
  const rsi = technicalIndicators?.rsi14 || null;
  const volatility = technicalIndicators?.volatility20d || (atr / currentPrice) * 100;
  const priceChange20d = technicalIndicators?.priceChange20d || 
    (n >= 20 ? ((currentPrice - closes[n - 20]) / closes[n - 20]) * 100 : 0);
  
  // Calculate Support/Resistance
  const { supports, resistances } = calculateSupportResistance(sorted, currentPrice);
  const support1 = supports[0] || currentPrice * 0.95;
  const support2 = supports[1] || support1 * 0.97;
  const resistance1 = resistances[0] || currentPrice * 1.05;
  const resistance2 = resistances[1] || resistance1 * 1.05;
  
  // Calculate 52-week high/low
  const high52w = Math.max(...highs.slice(-252));
  
  // Calculate Buy Zone - Với exchange
  const buyZone = calculateBuyZone(currentPrice, support1, support2, atr, ma20, ma50, rsi, exchange);
  
  // Calculate Stop Loss - Với exchange
  const stopLoss = calculateStopLoss(buyZone.optimal, support1, support2, atr, volatility, exchange);
  
  // Calculate Targets - Với exchange
  const targets = calculateTargets(buyZone.optimal, stopLoss.price, resistance1, resistance2, high52w, exchange);
  
  // Calculate Pivot Points (using yesterday's data)
  const yesterday = sorted[n - 2];
  const pivots = calculatePivotPoints(yesterday.high, yesterday.low, yesterday.close);
  
  // Calculate Fibonacci
  const recentHigh = Math.max(...highs.slice(-60));
  const recentLow = Math.min(...lows.slice(-60));
  const isUptrend = currentPrice > (recentHigh + recentLow) / 2;
  const fibonacci = calculateFibonacci(recentLow, recentHigh, isUptrend);
  
  // Find Confluence Zones
  const confluenceZones = findConfluenceZones(
    supports,
    resistances,
    pivots,
    fibonacci,
    ma20,
    ma50,
    currentPrice
  );
  
  // Detect Golden Zone (Fib 61.8% + Support)
  const goldenZone = detectGoldenZone(fibonacci, supports);
  
  // Calculate Risk/Reward Analysis
  const riskAnalysis = analyzeRiskReward(
    buyZone.optimal,
    stopLoss.price,
    targets.target1.price
  );
  
  // Classify Strategy - Phiên bản VN
  const { type: strategyType, holdingPeriod } = classifyStrategy(atr, currentPrice, targets.target1.percentage);
  
  // Detect Trend - Tiếng Việt
  const trendDirection = detectTrend(currentPrice, ma20, ma50, priceChange20d);
  
  // Tính chi phí giao dịch
  const tradingCostPercent = (VN_MARKET.TRADING_COST.BUY_FEE + VN_MARKET.TRADING_COST.SELL_FEE + VN_MARKET.TRADING_COST.SELL_TAX) * 100;
  const breakEvenPrice = roundVNPrice(buyZone.optimal * (1 + tradingCostPercent / 100));
  
  // Calculate Confidence
  let confidence = 50;
  const signals: string[] = [];
  
  // Add confidence based on signals - Tiếng Việt
  if (rsi && rsi < 35) { confidence += 15; signals.push('RSI quá bán (<35)'); }
  if (rsi && rsi > 70) { confidence -= 10; signals.push('RSI quá mua (>70)'); }
  if (ma20 && ma50 && ma20 > ma50) { confidence += 10; signals.push('MA20 cắt lên MA50'); }
  if (currentPrice <= support1 * 1.02) { confidence += 10; signals.push('Gần vùng hỗ trợ mạnh'); }
  if (trendDirection === 'TĂNG') { confidence += 10; signals.push('Xu hướng tăng'); }
  if (trendDirection === 'GIẢM') { confidence -= 10; signals.push('Xu hướng giảm'); }
  if (targets.target1.riskReward >= 2) { confidence += 5; signals.push('R:R tốt (≥2:1)'); }
  
  // Add confidence for confluence zones
  if (confluenceZones.length > 0) {
    const strongConfluence = confluenceZones.find(c => c.strength >= 3);
    if (strongConfluence) {
      confidence += 10;
      signals.push(`Vùng hội tụ mạnh (${strongConfluence.strength} mức)`);
    }
  }
  
  // Add confidence for Golden Zone
  if (goldenZone?.isGoldenZone) {
    confidence += 8;
    signals.push('Golden Zone (Fib 61.8% + Hỗ trợ)');
  }
  
  // Thêm cảnh báo cho VN
  if (volatility > 4) {
    confidence -= 5;
    signals.push('⚠️ Biến động cao (>4%)');
  }
  
  confidence = Math.max(20, Math.min(95, confidence));
  
  return {
    symbol,
    currentPrice: roundVNPrice(currentPrice),
    analysisDate: new Date().toISOString().split('T')[0],
    exchange,
    buyZone,
    stopLoss,
    targets,
    support: { s1: roundVNPrice(support1), s2: roundVNPrice(support2) },
    resistance: { r1: roundVNPrice(resistance1), r2: roundVNPrice(resistance2) },
    pivots,
    fibonacci,
    confluenceZones,
    goldenZone,
    riskAnalysis,
    strategyType,
    holdingPeriod,
    trendDirection,
    confidence,
    signals,
    breakEvenPrice,
    tradingCostPercent: Math.round(tradingCostPercent * 100) / 100
  };
}

export default {
  calculateTradingStrategy,
  calculateBuyZone,
  calculateStopLoss,
  calculateTargets,
  calculatePivotPoints,
  calculateFibonacci,
  calculateSupportResistance,
  calculateATR,
  classifyStrategy,
  detectTrend,
  findConfluenceZones,
  detectGoldenZone,
  analyzeRiskReward,
  // Vietnam-specific exports
  VN_MARKET,
  roundVNPrice,
  calculatePriceLimits,
  calculateTradingCost
};
