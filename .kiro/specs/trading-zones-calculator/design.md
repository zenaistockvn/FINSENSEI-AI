# Trading Zones Calculator - Design Document

## Overview

Hệ thống tính toán các vùng giao dịch tự động dựa trên phân tích kỹ thuật, kết hợp nhiều phương pháp để đưa ra khuyến nghị chính xác nhất.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Trading Zones Calculator                  │
├─────────────────────────────────────────────────────────────┤
│  Input: Price Data (OHLCV), Technical Indicators            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Support/   │  │   Pivot     │  │  Fibonacci  │         │
│  │ Resistance  │  │   Points    │  │ Retracement │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │   Zone Aggregator     │                      │
│              │  (Confluence Finder)  │                      │
│              └───────────┬───────────┘                      │
│                          ▼                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Buy Zone   │  │  Stop Loss  │  │   Targets   │         │
│  │ Calculator  │  │ Calculator  │  │ Calculator  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Output: TradingStrategy object                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Formulas

### 1. Support/Resistance Calculation

```typescript
// Swing High/Low Detection (Fractal Method)
function findSwingHighs(highs: number[], period: number = 5): number[] {
  const swingHighs: number[] = [];
  for (let i = period; i < highs.length - period; i++) {
    const leftMax = Math.max(...highs.slice(i - period, i));
    const rightMax = Math.max(...highs.slice(i + 1, i + period + 1));
    if (highs[i] > leftMax && highs[i] > rightMax) {
      swingHighs.push(highs[i]);
    }
  }
  return swingHighs;
}

// Cluster similar levels (within 2%)
function clusterLevels(levels: number[], threshold: number = 0.02): number[] {
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let currentCluster: number[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i] - sorted[i-1]) / sorted[i-1] <= threshold) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }
  clusters.push(currentCluster);
  
  // Return average of each cluster
  return clusters.map(c => c.reduce((a, b) => a + b, 0) / c.length);
}
```

### 2. Buy Zone Formula

```typescript
interface BuyZone {
  low: number;      // Điểm mua thấp nhất
  high: number;     // Điểm mua cao nhất
  optimal: number;  // Điểm mua tối ưu
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

function calculateBuyZone(
  currentPrice: number,
  support1: number,
  support2: number,
  atr: number,
  ma20: number,
  ma50: number,
  rsi: number
): BuyZone {
  // Base buy zone from support
  let buyLow = support1;
  let buyHigh = support1 + (atr * 0.5);
  
  // Adjust for trend
  const isUptrend = currentPrice > ma50;
  const isPullback = currentPrice < ma20 && currentPrice > ma50;
  
  if (isUptrend && isPullback) {
    // In uptrend, buy on pullback to MA20
    buyLow = Math.max(ma20 - (atr * 0.3), support1);
    buyHigh = ma20 + (atr * 0.2);
  }
  
  // Adjust for oversold conditions
  if (rsi < 30) {
    // Oversold - can buy slightly higher
    buyHigh += atr * 0.3;
  }
  
  // Adjust if price is below MA20 (weak)
  if (currentPrice < ma20 && currentPrice < ma50) {
    buyLow -= atr * 0.3;
    buyHigh = support1;
  }
  
  // Determine strength
  let strength: 'WEAK' | 'MODERATE' | 'STRONG' = 'MODERATE';
  if (rsi < 30 && currentPrice <= support1 * 1.02) {
    strength = 'STRONG';
  } else if (currentPrice > ma20 && currentPrice > support1 * 1.05) {
    strength = 'WEAK';
  }
  
  return {
    low: Math.round(buyLow),
    high: Math.round(buyHigh),
    optimal: Math.round((buyLow + buyHigh) / 2),
    strength
  };
}
```

### 3. Stop Loss Formula

```typescript
interface StopLoss {
  price: number;
  percentage: number;  // % từ entry
  type: 'ATR_BASED' | 'SUPPORT_BASED' | 'PERCENTAGE_BASED';
}

function calculateStopLoss(
  entryPrice: number,
  support1: number,
  support2: number,
  atr: number,
  volatility: number  // 20-day volatility %
): StopLoss {
  // Method 1: ATR-based (default)
  let atrMultiplier = 1.5;
  if (volatility > 3) {
    atrMultiplier = 2.0;  // High volatility
  } else if (volatility < 1.5) {
    atrMultiplier = 1.2;  // Low volatility
  }
  const atrStop = entryPrice - (atr * atrMultiplier);
  
  // Method 2: Support-based
  const supportStop = support2 - (atr * 0.5);
  
  // Method 3: Percentage-based (max 7%)
  const maxStop = entryPrice * 0.93;
  
  // Choose the tightest stop that makes sense
  let finalStop = atrStop;
  let stopType: 'ATR_BASED' | 'SUPPORT_BASED' | 'PERCENTAGE_BASED' = 'ATR_BASED';
  
  // If support-based stop is tighter but still below support
  if (supportStop > atrStop && supportStop < support1) {
    finalStop = supportStop;
    stopType = 'SUPPORT_BASED';
  }
  
  // Ensure we don't exceed max loss
  if (finalStop < maxStop) {
    finalStop = maxStop;
    stopType = 'PERCENTAGE_BASED';
  }
  
  const percentage = ((entryPrice - finalStop) / entryPrice) * 100;
  
  return {
    price: Math.round(finalStop),
    percentage: Math.round(percentage * 100) / 100,
    type: stopType
  };
}
```

### 4. Price Targets Formula

```typescript
interface PriceTargets {
  target1: { price: number; percentage: number; riskReward: number };
  target2: { price: number; percentage: number; riskReward: number };
  target3: { price: number; percentage: number; riskReward: number };
}

function calculateTargets(
  entryPrice: number,
  stopLoss: number,
  resistance1: number,
  resistance2: number,
  high52w: number,
  fibExtension161: number
): PriceTargets {
  const risk = entryPrice - stopLoss;
  
  // Target 1: R:R = 1:1.5 or Resistance 1 (whichever is closer)
  let tp1 = entryPrice + (risk * 1.5);
  if (resistance1 < tp1 && resistance1 > entryPrice) {
    tp1 = resistance1;
  }
  
  // Target 2: R:R = 1:2.5 or Resistance 2
  let tp2 = entryPrice + (risk * 2.5);
  if (resistance2 < tp2 && resistance2 > tp1) {
    tp2 = resistance2;
  }
  
  // Target 3: Fibonacci 161.8% extension or 52-week high
  let tp3 = Math.min(fibExtension161, high52w);
  if (tp3 < tp2) {
    tp3 = entryPrice + (risk * 4);  // R:R = 1:4
  }
  
  const calcRR = (target: number) => Math.round(((target - entryPrice) / risk) * 10) / 10;
  const calcPct = (target: number) => Math.round(((target - entryPrice) / entryPrice) * 1000) / 10;
  
  return {
    target1: { price: Math.round(tp1), percentage: calcPct(tp1), riskReward: calcRR(tp1) },
    target2: { price: Math.round(tp2), percentage: calcPct(tp2), riskReward: calcRR(tp2) },
    target3: { price: Math.round(tp3), percentage: calcPct(tp3), riskReward: calcRR(tp3) }
  };
}
```

### 5. Pivot Points Formula

```typescript
interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

function calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
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
```

### 6. Fibonacci Levels Formula

```typescript
interface FibonacciLevels {
  level0: number;    // 0% (swing low/high)
  level236: number;  // 23.6%
  level382: number;  // 38.2%
  level500: number;  // 50%
  level618: number;  // 61.8% (Golden ratio)
  level786: number;  // 78.6%
  level1000: number; // 100% (swing high/low)
  // Extensions
  ext1272: number;   // 127.2%
  ext1618: number;   // 161.8%
  ext2000: number;   // 200%
}

function calculateFibonacci(swingLow: number, swingHigh: number, isUptrend: boolean): FibonacciLevels {
  const range = swingHigh - swingLow;
  
  if (isUptrend) {
    // Retracement from high to low
    return {
      level0: swingHigh,
      level236: swingHigh - (range * 0.236),
      level382: swingHigh - (range * 0.382),
      level500: swingHigh - (range * 0.500),
      level618: swingHigh - (range * 0.618),
      level786: swingHigh - (range * 0.786),
      level1000: swingLow,
      ext1272: swingHigh + (range * 0.272),
      ext1618: swingHigh + (range * 0.618),
      ext2000: swingHigh + range
    };
  } else {
    // Retracement from low to high
    return {
      level0: swingLow,
      level236: swingLow + (range * 0.236),
      level382: swingLow + (range * 0.382),
      level500: swingLow + (range * 0.500),
      level618: swingLow + (range * 0.618),
      level786: swingLow + (range * 0.786),
      level1000: swingHigh,
      ext1272: swingLow - (range * 0.272),
      ext1618: swingLow - (range * 0.618),
      ext2000: swingLow - range
    };
  }
}
```


## Complete Trading Strategy Interface

```typescript
interface TradingStrategy {
  symbol: string;
  currentPrice: number;
  analysisDate: string;
  
  // Buy Zone
  buyZone: {
    low: number;
    high: number;
    optimal: number;
    strength: 'WEAK' | 'MODERATE' | 'STRONG';
  };
  
  // Stop Loss
  stopLoss: {
    price: number;
    percentage: number;
    type: string;
  };
  
  // Targets
  targets: {
    target1: { price: number; percentage: number; riskReward: number };
    target2: { price: number; percentage: number; riskReward: number };
    target3: { price: number; percentage: number; riskReward: number };
  };
  
  // Support/Resistance
  support: { s1: number; s2: number };
  resistance: { r1: number; r2: number };
  
  // Pivot Points
  pivots: PivotPoints;
  
  // Fibonacci
  fibonacci: FibonacciLevels;
  
  // Strategy Classification
  strategyType: 'SCALPING' | 'SWING_TRADING' | 'POSITION_TRADING';
  trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  // Risk Analysis
  riskAnalysis: {
    maxRiskPercent: number;
    suggestedPositionSize: number;  // % of portfolio
    winRateNeeded: number;          // % win rate needed to be profitable
  };
  
  // Confidence
  confidence: number;  // 0-100
  signals: string[];   // List of supporting signals
}
```

## Strategy Type Classification

```typescript
function classifyStrategy(
  atr: number,
  currentPrice: number,
  targetPercent: number,
  adx: number,
  trendStrength: number
): { type: string; holdingPeriod: string; description: string } {
  const atrPercent = (atr / currentPrice) * 100;
  
  // Scalping: Low volatility, small targets
  if (atrPercent < 2 && targetPercent < 5) {
    return {
      type: 'SCALPING',
      holdingPeriod: 'Intraday - vài giờ',
      description: 'Giao dịch ngắn hạn, chốt lời nhanh'
    };
  }
  
  // Swing Trading: Medium volatility, medium targets
  if (targetPercent >= 5 && targetPercent <= 15) {
    return {
      type: 'SWING_TRADING',
      holdingPeriod: '2-10 ngày',
      description: 'Giao dịch theo sóng, nắm giữ vài ngày'
    };
  }
  
  // Position Trading: Large targets
  if (targetPercent > 15) {
    return {
      type: 'POSITION_TRADING',
      holdingPeriod: '2-8 tuần',
      description: 'Đầu tư trung hạn, theo xu hướng lớn'
    };
  }
  
  // Default to Swing
  return {
    type: 'SWING_TRADING',
    holdingPeriod: '3-7 ngày',
    description: 'Giao dịch swing trading chuẩn'
  };
}
```

## Confluence Zone Detection

```typescript
function findConfluenceZones(
  supports: number[],
  resistances: number[],
  pivots: PivotPoints,
  fibonacci: FibonacciLevels,
  ma20: number,
  ma50: number,
  threshold: number = 0.015  // 1.5%
): { price: number; strength: number; sources: string[] }[] {
  const allLevels: { price: number; source: string }[] = [
    ...supports.map(p => ({ price: p, source: 'Support' })),
    ...resistances.map(p => ({ price: p, source: 'Resistance' })),
    { price: pivots.pivot, source: 'Pivot' },
    { price: pivots.s1, source: 'Pivot S1' },
    { price: pivots.r1, source: 'Pivot R1' },
    { price: fibonacci.level382, source: 'Fib 38.2%' },
    { price: fibonacci.level500, source: 'Fib 50%' },
    { price: fibonacci.level618, source: 'Fib 61.8%' },
    { price: ma20, source: 'MA20' },
    { price: ma50, source: 'MA50' }
  ];
  
  const confluences: { price: number; strength: number; sources: string[] }[] = [];
  
  for (let i = 0; i < allLevels.length; i++) {
    const baseLevel = allLevels[i];
    const sources = [baseLevel.source];
    
    for (let j = i + 1; j < allLevels.length; j++) {
      const compareLevel = allLevels[j];
      const diff = Math.abs(baseLevel.price - compareLevel.price) / baseLevel.price;
      
      if (diff <= threshold) {
        sources.push(compareLevel.source);
      }
    }
    
    if (sources.length >= 2) {
      confluences.push({
        price: baseLevel.price,
        strength: sources.length,
        sources
      });
    }
  }
  
  return confluences.sort((a, b) => b.strength - a.strength);
}
```

## Risk/Reward Analysis

```typescript
function analyzeRiskReward(
  entry: number,
  stopLoss: number,
  target: number
): {
  riskReward: number;
  riskPercent: number;
  rewardPercent: number;
  winRateNeeded: number;
  rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
} {
  const risk = entry - stopLoss;
  const reward = target - entry;
  const riskReward = reward / risk;
  
  const riskPercent = (risk / entry) * 100;
  const rewardPercent = (reward / entry) * 100;
  
  // Win rate needed to break even: WR = 1 / (1 + R:R)
  const winRateNeeded = (1 / (1 + riskReward)) * 100;
  
  let rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'FAIR';
  if (riskReward < 1) rating = 'POOR';
  else if (riskReward >= 1 && riskReward < 2) rating = 'FAIR';
  else if (riskReward >= 2 && riskReward < 3) rating = 'GOOD';
  else rating = 'EXCELLENT';
  
  return {
    riskReward: Math.round(riskReward * 100) / 100,
    riskPercent: Math.round(riskPercent * 100) / 100,
    rewardPercent: Math.round(rewardPercent * 100) / 100,
    winRateNeeded: Math.round(winRateNeeded * 10) / 10,
    rating
  };
}
```

## Data Models

### Database Schema (trading_strategy table)

```sql
CREATE TABLE IF NOT EXISTS trading_strategy (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Buy Zone
  buy_zone_low DECIMAL(12, 2),
  buy_zone_high DECIMAL(12, 2),
  buy_zone_optimal DECIMAL(12, 2),
  buy_zone_strength VARCHAR(20),
  
  -- Stop Loss
  stop_loss DECIMAL(12, 2),
  stop_loss_percent DECIMAL(5, 2),
  stop_loss_type VARCHAR(30),
  
  -- Targets
  target_1 DECIMAL(12, 2),
  target_1_percent DECIMAL(5, 2),
  target_1_rr DECIMAL(4, 2),
  target_2 DECIMAL(12, 2),
  target_2_percent DECIMAL(5, 2),
  target_2_rr DECIMAL(4, 2),
  target_3 DECIMAL(12, 2),
  target_3_percent DECIMAL(5, 2),
  target_3_rr DECIMAL(4, 2),
  
  -- Support/Resistance
  support_1 DECIMAL(12, 2),
  support_2 DECIMAL(12, 2),
  resistance_1 DECIMAL(12, 2),
  resistance_2 DECIMAL(12, 2),
  
  -- Strategy Info
  strategy_type VARCHAR(30),
  strategy_note TEXT,
  confidence DECIMAL(5, 2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(symbol, analysis_date)
);
```

## Testing Strategy

### Unit Tests
- Test support/resistance detection with known price patterns
- Test buy zone calculation with various market conditions
- Test stop loss calculation with different volatility levels
- Test target calculation with resistance levels

### Property-Based Tests
- Stop loss should always be below buy zone
- Targets should always be above entry price
- Risk/Reward ratio should be positive
- Confluence zones should have at least 2 sources

## Error Handling

- If insufficient price data (< 60 days), use available data with lower confidence
- If no clear support/resistance found, use ATR-based levels
- If volatility is extreme (> 5%), flag strategy as "High Risk"
- If all targets are below current price, mark as "Not Recommended"
