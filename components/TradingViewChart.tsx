import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Maximize2, Minimize2, Settings,
  ZoomIn, ZoomOut, Crosshair, BarChart2, Activity, Layers,
  ChevronDown, RefreshCw, Download, Camera, Minus, MousePointer2,
  PenLine, GitBranch, ArrowUpRight, Lock, Unlock, Trash2, Eye, EyeOff
} from 'lucide-react';

// Types
interface CandleData {
  time: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Drawing tool types
type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle';

interface DrawingLine {
  id: string;
  type: DrawingTool;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  locked: boolean;
  visible: boolean;
}

interface ChartProps {
  data: CandleData[];
  symbol: string;
  isDark?: boolean;
  height?: number;
  showVolume?: boolean;
  showMA?: boolean;
  showBollinger?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
}

interface Indicator {
  ma5: number[];
  ma10: number[];
  ma20: number[];
  ma50: number[];
  ema12: number[];
  ema26: number[];
  bollinger: { upper: number[]; middle: number[]; lower: number[] };
  rsi: number[];
  macd: { macd: number[]; signal: number[]; histogram: number[] };
  ichimoku: {
    tenkan: number[];      // Conversion Line (9 periods)
    kijun: number[];       // Base Line (26 periods)
    senkouA: number[];     // Leading Span A
    senkouB: number[];     // Leading Span B
    chikou: number[];      // Lagging Span
  };
}


// Calculate technical indicators
const calculateIndicators = (data: CandleData[]): Indicator => {
  const closes = data.map(d => d.close);
  
  // Simple Moving Average
  const sma = (arr: number[], period: number): number[] => {
    return arr.map((_, i) => {
      if (i < period - 1) return NaN;
      const slice = arr.slice(i - period + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / period;
    });
  };
  
  // Exponential Moving Average
  const ema = (arr: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result: number[] = [];
    let prev = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < arr.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else if (i === period - 1) {
        result.push(prev);
      } else {
        prev = arr[i] * k + prev * (1 - k);
        result.push(prev);
      }
    }
    return result;
  };
  
  // RSI
  const calculateRSI = (arr: number[], period: number = 14): number[] => {
    const rsi: number[] = [];
    let gains = 0, losses = 0;
    
    for (let i = 0; i < arr.length; i++) {
      if (i === 0) { rsi.push(NaN); continue; }
      
      const change = arr[i] - arr[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      
      if (i < period) {
        gains += gain;
        losses += loss;
        rsi.push(NaN);
      } else if (i === period) {
        gains += gain;
        losses += loss;
        const avgGain = gains / period;
        const avgLoss = losses / period;
        rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
      } else {
        const avgGain = (gains * (period - 1) + gain) / period;
        const avgLoss = (losses * (period - 1) + loss) / period;
        gains = avgGain * period;
        losses = avgLoss * period;
        rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
      }
    }
    return rsi;
  };

  
  // Bollinger Bands
  const calculateBollinger = (arr: number[], period: number = 20, stdDev: number = 2) => {
    const middle = sma(arr, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < arr.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = arr.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }
    return { upper, middle, lower };
  };
  
  // MACD
  const calculateMACD = (arr: number[]) => {
    const ema12Arr = ema(arr, 12);
    const ema26Arr = ema(arr, 26);
    const macdLine = ema12Arr.map((v, i) => v - ema26Arr[i]);
    const signalLine = ema(macdLine.filter(v => !isNaN(v)), 9);
    
    // Pad signal line
    const paddedSignal: number[] = [];
    let signalIdx = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i])) {
        paddedSignal.push(NaN);
      } else {
        paddedSignal.push(signalLine[signalIdx] || NaN);
        signalIdx++;
      }
    }
    
    const histogram = macdLine.map((v, i) => v - paddedSignal[i]);
    return { macd: macdLine, signal: paddedSignal, histogram };
  };
  
  // Ichimoku Cloud
  const calculateIchimoku = (candles: CandleData[]) => {
    const highs = candles.map(d => d.high);
    const lows = candles.map(d => d.low);
    
    // Helper: get highest high and lowest low over period
    const getHighLow = (start: number, period: number) => {
      if (start < period - 1) return { high: NaN, low: NaN };
      const highSlice = highs.slice(start - period + 1, start + 1);
      const lowSlice = lows.slice(start - period + 1, start + 1);
      return {
        high: Math.max(...highSlice),
        low: Math.min(...lowSlice)
      };
    };
    
    const tenkan: number[] = [];  // Conversion Line (9)
    const kijun: number[] = [];   // Base Line (26)
    const senkouA: number[] = []; // Leading Span A
    const senkouB: number[] = []; // Leading Span B
    const chikou: number[] = [];  // Lagging Span
    
    for (let i = 0; i < candles.length; i++) {
      // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
      const tenkanHL = getHighLow(i, 9);
      tenkan.push(isNaN(tenkanHL.high) ? NaN : (tenkanHL.high + tenkanHL.low) / 2);
      
      // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
      const kijunHL = getHighLow(i, 26);
      kijun.push(isNaN(kijunHL.high) ? NaN : (kijunHL.high + kijunHL.low) / 2);
      
      // Senkou Span A: (Tenkan + Kijun) / 2, plotted 26 periods ahead
      const spanA = (!isNaN(tenkan[i]) && !isNaN(kijun[i])) ? (tenkan[i] + kijun[i]) / 2 : NaN;
      senkouA.push(spanA);
      
      // Senkou Span B: (52-period high + 52-period low) / 2, plotted 26 periods ahead
      const senkouBHL = getHighLow(i, 52);
      senkouB.push(isNaN(senkouBHL.high) ? NaN : (senkouBHL.high + senkouBHL.low) / 2);
      
      // Chikou Span: Current close, plotted 26 periods behind
      chikou.push(closes[i]);
    }
    
    return { tenkan, kijun, senkouA, senkouB, chikou };
  };
  
  return {
    ma5: sma(closes, 5),
    ma10: sma(closes, 10),
    ma20: sma(closes, 20),
    ma50: sma(closes, 50),
    ema12: ema(closes, 12),
    ema26: ema(closes, 26),
    bollinger: calculateBollinger(closes),
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    ichimoku: calculateIchimoku(data)
  };
};

// Find significant peaks and troughs (đỉnh và đáy)
interface PeakTrough {
  index: number;
  price: number;
  type: 'peak' | 'trough';
  date: string;
}

const findPeaksAndTroughs = (data: CandleData[], lookback: number = 20): PeakTrough[] => {
  const results: PeakTrough[] = [];
  if (data.length < lookback * 2) return results;
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    
    // Check for peak (đỉnh)
    let isPeak = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].high >= currentHigh) {
        isPeak = false;
        break;
      }
    }
    
    // Check for trough (đáy)
    let isTrough = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].low <= currentLow) {
        isTrough = false;
        break;
      }
    }
    
    if (isPeak) {
      results.push({ index: i, price: currentHigh, type: 'peak', date: data[i].time });
    }
    if (isTrough) {
      results.push({ index: i, price: currentLow, type: 'trough', date: data[i].time });
    }
  }
  
  return results;
};


// Main TradingView-style Chart Component
const TradingViewChart: React.FC<ChartProps> = ({
  data,
  symbol,
  isDark = true,
  height = 500,
  showVolume = true,
  showMA = true,
  showBollinger = false,
  showRSI = false,
  showMACD = false,
  onTimeframeChange,
  currentTimeframe = '1Y'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; visible: boolean; sticky: boolean }>({ x: 0, y: 0, visible: false, sticky: false });
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, pan: 0 });
  
  // Drawing tools state
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingLine | null>(null);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [showPeaksTroughs, setShowPeaksTroughs] = useState(true);
  
  const [activeIndicators, setActiveIndicators] = useState({
    ma5: false, ma10: false, ma20: true, ma50: true,
    bollinger: showBollinger, rsi: showRSI, macd: showMACD, volume: showVolume,
    ichimoku: false
  });
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Colors
  const colors = useMemo(() => ({
    bg: isDark ? '#0f172a' : '#ffffff',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    textBright: isDark ? '#e2e8f0' : '#1e293b',
    bullish: '#22c55e',
    bearish: '#ef4444',
    bullishBg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
    bearishBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
    ma5: '#f59e0b',
    ma10: '#3b82f6',
    ma20: '#8b5cf6',
    ma50: '#ec4899',
    bollingerUpper: '#06b6d4',
    bollingerLower: '#06b6d4',
    bollingerFill: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)',
    crosshair: isDark ? '#475569' : '#cbd5e1',
    volumeUp: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.3)',
    volumeDown: isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.3)',
    // Ichimoku colors
    ichimokuTenkan: '#2563eb',      // Blue - Conversion Line
    ichimokuKijun: '#dc2626',       // Red - Base Line
    ichimokuChikou: '#16a34a',      // Green - Lagging Span
    ichimokuCloudUp: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',   // Green cloud
    ichimokuCloudDown: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)', // Red cloud
    ichimokuSenkouA: '#22c55e',     // Green - Senkou A
    ichimokuSenkouB: '#ef4444'      // Red - Senkou B
  }), [isDark]);


  // Calculate indicators
  const indicators = useMemo(() => calculateIndicators(data), [data]);

  // Smart peaks/troughs - only show significant ones based on zoom
  const visiblePeaksTroughs = useMemo(() => {
    if (!showPeaksTroughs) return [];
    const lookback = zoom > 3 ? 10 : zoom > 2 ? 15 : 20;
    return findPeaksAndTroughs(data, lookback);
  }, [data, zoom, showPeaksTroughs]);

  // Layout calculations
  const layout = useMemo(() => {
    const margin = { top: 10, right: 80, bottom: 30, left: 10 };
    const chartHeight = activeIndicators.rsi || activeIndicators.macd 
      ? dimensions.height * 0.55 
      : activeIndicators.volume 
        ? dimensions.height * 0.7 
        : dimensions.height * 0.85;
    const volumeHeight = activeIndicators.volume ? dimensions.height * 0.15 : 0;
    const indicatorHeight = (activeIndicators.rsi || activeIndicators.macd) ? dimensions.height * 0.2 : 0;
    
    return {
      margin,
      width: dimensions.width - margin.left - margin.right,
      chartHeight: chartHeight - margin.top,
      volumeTop: chartHeight + 5,
      volumeHeight: volumeHeight - 10,
      indicatorTop: chartHeight + volumeHeight + 10,
      indicatorHeight: indicatorHeight - 20
    };
  }, [dimensions, activeIndicators]);

  // Visible data based on zoom and pan
  const visibleData = useMemo(() => {
    const visibleCount = Math.floor(data.length / zoom);
    const startIdx = Math.max(0, Math.min(data.length - visibleCount, Math.floor(pan)));
    return data.slice(startIdx, startIdx + visibleCount);
  }, [data, zoom, pan]);

  // Price scale
  const priceScale = useMemo(() => {
    if (visibleData.length === 0) return { min: 0, max: 100, range: 100 };
    
    let min = Math.min(...visibleData.map(d => d.low));
    let max = Math.max(...visibleData.map(d => d.high));
    
    // Include Bollinger bands if active
    if (activeIndicators.bollinger) {
      const startIdx = data.indexOf(visibleData[0]);
      const endIdx = startIdx + visibleData.length;
      const upperBand = indicators.bollinger.upper.slice(startIdx, endIdx).filter(v => !isNaN(v));
      const lowerBand = indicators.bollinger.lower.slice(startIdx, endIdx).filter(v => !isNaN(v));
      if (upperBand.length) max = Math.max(max, ...upperBand);
      if (lowerBand.length) min = Math.min(min, ...lowerBand);
    }
    
    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding, range: max - min + padding * 2 };
  }, [visibleData, activeIndicators.bollinger, indicators.bollinger, data]);


  // Volume scale
  const volumeScale = useMemo(() => {
    if (visibleData.length === 0) return { max: 1000000 };
    return { max: Math.max(...visibleData.map(d => d.volume)) * 1.1 };
  }, [visibleData]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      const { width, height: h } = entries[0].contentRect;
      setDimensions({ width, height: h || height });
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    const { margin, width, chartHeight, volumeTop, volumeHeight, indicatorTop, indicatorHeight } = layout;
    const rightPadding = 50; // Khoảng cách từ nến cuối đến lề phải
    const effectiveWidth = width - rightPadding;
    const candleWidth = Math.max(3, (effectiveWidth / visibleData.length) * 0.8);
    const gap = (effectiveWidth - candleWidth * visibleData.length) / (visibleData.length + 1);
    
    // Helper functions
    const priceToY = (price: number) => margin.top + chartHeight - ((price - priceScale.min) / priceScale.range) * chartHeight;
    const volumeToY = (vol: number) => volumeTop + volumeHeight - (vol / volumeScale.max) * volumeHeight;
    const indexToX = (i: number) => margin.left + gap + i * (candleWidth + gap) + candleWidth / 2;
    
    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    // Horizontal grid lines
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const y = margin.top + (chartHeight / priceSteps) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
      
      // Price labels
      const price = priceScale.max - (priceScale.range / priceSteps) * i;
      ctx.fillStyle = colors.text;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(price), margin.left + width + 5, y + 4);
    }

    
    // Draw Bollinger Bands
    if (activeIndicators.bollinger) {
      const startIdx = data.indexOf(visibleData[0]);
      
      ctx.beginPath();
      ctx.fillStyle = colors.bollingerFill;
      
      // Upper band
      let started = false;
      for (let i = 0; i < visibleData.length; i++) {
        const upper = indicators.bollinger.upper[startIdx + i];
        if (!isNaN(upper)) {
          const x = indexToX(i);
          const y = priceToY(upper);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      }
      
      // Lower band (reverse)
      for (let i = visibleData.length - 1; i >= 0; i--) {
        const lower = indicators.bollinger.lower[startIdx + i];
        if (!isNaN(lower)) {
          ctx.lineTo(indexToX(i), priceToY(lower));
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Draw band lines
      ctx.strokeStyle = colors.bollingerUpper;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      ['upper', 'lower'].forEach(band => {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleData.length; i++) {
          const val = indicators.bollinger[band as 'upper' | 'lower'][startIdx + i];
          if (!isNaN(val)) {
            const x = indexToX(i);
            const y = priceToY(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Calculate startIdx once for all indicators
    const startIdx = data.indexOf(visibleData[0]);

    // Draw Ichimoku Cloud
    if (activeIndicators.ichimoku) {
      const ich = indicators.ichimoku;
      
      // Draw Cloud (Kumo) - fill between Senkou A and B
      // Note: Senkou spans are plotted 26 periods ahead
      const cloudOffset = 26;
      
      ctx.beginPath();
      let cloudStarted = false;
      
      // Draw Senkou A line and collect points for cloud
      const senkouAPoints: { x: number; y: number }[] = [];
      const senkouBPoints: { x: number; y: number }[] = [];
      
      for (let i = 0; i < visibleData.length; i++) {
        const dataIdx = startIdx + i - cloudOffset;
        if (dataIdx >= 0 && dataIdx < ich.senkouA.length) {
          const valA = ich.senkouA[dataIdx];
          const valB = ich.senkouB[dataIdx];
          if (!isNaN(valA) && !isNaN(valB)) {
            senkouAPoints.push({ x: indexToX(i), y: priceToY(valA) });
            senkouBPoints.push({ x: indexToX(i), y: priceToY(valB) });
          }
        }
      }
      
      // Fill cloud
      if (senkouAPoints.length > 1) {
        for (let i = 0; i < senkouAPoints.length - 1; i++) {
          const a1 = senkouAPoints[i], a2 = senkouAPoints[i + 1];
          const b1 = senkouBPoints[i], b2 = senkouBPoints[i + 1];
          
          // Determine cloud color based on A vs B
          const avgA = (ich.senkouA[startIdx + i - cloudOffset] + ich.senkouA[startIdx + i + 1 - cloudOffset]) / 2;
          const avgB = (ich.senkouB[startIdx + i - cloudOffset] + ich.senkouB[startIdx + i + 1 - cloudOffset]) / 2;
          ctx.fillStyle = avgA >= avgB ? colors.ichimokuCloudUp : colors.ichimokuCloudDown;
          
          ctx.beginPath();
          ctx.moveTo(a1.x, a1.y);
          ctx.lineTo(a2.x, a2.y);
          ctx.lineTo(b2.x, b2.y);
          ctx.lineTo(b1.x, b1.y);
          ctx.closePath();
          ctx.fill();
        }
        
        // Draw Senkou A line
        ctx.strokeStyle = colors.ichimokuSenkouA;
        ctx.lineWidth = 1;
        ctx.beginPath();
        senkouAPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        
        // Draw Senkou B line
        ctx.strokeStyle = colors.ichimokuSenkouB;
        ctx.beginPath();
        senkouBPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
      
      // Draw Tenkan-sen (Conversion Line)
      ctx.strokeStyle = colors.ichimokuTenkan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let tenkanStarted = false;
      for (let i = 0; i < visibleData.length; i++) {
        const val = ich.tenkan[startIdx + i];
        if (!isNaN(val)) {
          const x = indexToX(i);
          const y = priceToY(val);
          if (!tenkanStarted) { ctx.moveTo(x, y); tenkanStarted = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw Kijun-sen (Base Line)
      ctx.strokeStyle = colors.ichimokuKijun;
      ctx.beginPath();
      let kijunStarted = false;
      for (let i = 0; i < visibleData.length; i++) {
        const val = ich.kijun[startIdx + i];
        if (!isNaN(val)) {
          const x = indexToX(i);
          const y = priceToY(val);
          if (!kijunStarted) { ctx.moveTo(x, y); kijunStarted = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw Chikou Span (Lagging Span) - plotted 26 periods behind
      ctx.strokeStyle = colors.ichimokuChikou;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      let chikouStarted = false;
      for (let i = 0; i < visibleData.length; i++) {
        const dataIdx = startIdx + i + 26; // 26 periods ahead in data = 26 periods behind on chart
        if (dataIdx < ich.chikou.length) {
          const val = ich.chikou[dataIdx];
          if (!isNaN(val)) {
            const x = indexToX(i);
            const y = priceToY(val);
            if (!chikouStarted) { ctx.moveTo(x, y); chikouStarted = true; }
            else ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    
    // Draw Moving Averages
    const maConfigs = [
      { key: 'ma5', color: colors.ma5, data: indicators.ma5 },
      { key: 'ma10', color: colors.ma10, data: indicators.ma10 },
      { key: 'ma20', color: colors.ma20, data: indicators.ma20 },
      { key: 'ma50', color: colors.ma50, data: indicators.ma50 }
    ];
    
    maConfigs.forEach(({ key, color, data: maData }) => {
      if (!activeIndicators[key as keyof typeof activeIndicators]) return;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < visibleData.length; i++) {
        const val = maData[startIdx + i];
        if (!isNaN(val)) {
          const x = indexToX(i);
          const y = priceToY(val);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
    
    // Draw candlesticks
    visibleData.forEach((candle, i) => {
      const x = indexToX(i);
      const isUp = candle.close >= candle.open;
      const color = isUp ? colors.bullish : colors.bearish;
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      
      if (!isUp) {
        ctx.strokeStyle = color;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Draw peaks and troughs markers (đỉnh và đáy) - smart display based on zoom
    if (showPeaksTroughs) {
      visiblePeaksTroughs.forEach(pt => {
        const visibleIdx = pt.index - startIdx;
        if (visibleIdx >= 0 && visibleIdx < visibleData.length) {
          const x = indexToX(visibleIdx);
          const y = priceToY(pt.price);
          
          if (pt.type === 'peak') {
            // Draw peak marker (đỉnh) - triangle pointing down above the candle
            ctx.fillStyle = '#f59e0b'; // Amber color
            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x - 6, y - 25);
            ctx.lineTo(x + 6, y - 25);
            ctx.closePath();
            ctx.fill();
            
            // Price label
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pt.price.toLocaleString(), x, y - 28);
          } else {
            // Draw trough marker (đáy) - triangle pointing up below the candle
            ctx.fillStyle = '#06b6d4'; // Cyan color
            ctx.beginPath();
            ctx.moveTo(x, y + 15);
            ctx.lineTo(x - 6, y + 25);
            ctx.lineTo(x + 6, y + 25);
            ctx.closePath();
            ctx.fill();
            
            // Price label
            ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pt.price.toLocaleString(), x, y + 38);
          }
        }
      });
    }

    // Draw user drawings (trendlines, horizontals, etc.)
    drawings.forEach(drawing => {
      if (!drawing.visible) return;
      
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(drawing.type === 'fibonacci' ? [5, 5] : []);
      
      if (drawing.type === 'horizontal') {
        ctx.beginPath();
        ctx.moveTo(margin.left, drawing.startY);
        ctx.lineTo(margin.left + width, drawing.startY);
        ctx.stroke();
        
        // Price label
        const price = priceScale.max - ((drawing.startY - margin.top) / chartHeight) * priceScale.range;
        ctx.fillStyle = drawing.color;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(formatPrice(price), margin.left + width + 5, drawing.startY + 4);
      } else if (drawing.type === 'trendline' || drawing.type === 'rectangle') {
        ctx.beginPath();
        ctx.moveTo(drawing.startX, drawing.startY);
        ctx.lineTo(drawing.endX, drawing.endY);
        ctx.stroke();
      } else if (drawing.type === 'fibonacci') {
        // Draw Fibonacci retracement levels
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const yDiff = drawing.endY - drawing.startY;
        
        levels.forEach((level, i) => {
          const y = drawing.startY + yDiff * level;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(Math.min(drawing.startX, drawing.endX), y);
          ctx.lineTo(Math.max(drawing.startX, drawing.endX), y);
          ctx.stroke();
          
          // Level label
          ctx.globalAlpha = 1;
          ctx.fillStyle = drawing.color;
          ctx.font = '10px Inter, sans-serif';
          ctx.fillText(`${(level * 100).toFixed(1)}%`, Math.max(drawing.startX, drawing.endX) + 5, y + 4);
        });
      }
      
      ctx.setLineDash([]);
    });

    // Draw current drawing in progress
    if (isDrawing && currentDrawing) {
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentDrawing.startX, currentDrawing.startY);
      ctx.lineTo(currentDrawing.endX, currentDrawing.endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    
    // Draw volume bars
    if (activeIndicators.volume) {
      visibleData.forEach((candle, i) => {
        const x = indexToX(i);
        const isUp = candle.close >= candle.open;
        const barHeight = (candle.volume / volumeScale.max) * volumeHeight;
        
        ctx.fillStyle = isUp ? colors.volumeUp : colors.volumeDown;
        ctx.fillRect(
          x - candleWidth / 2,
          volumeTop + volumeHeight - barHeight,
          candleWidth,
          barHeight
        );
      });
      
      // Volume separator line
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, volumeTop - 5);
      ctx.lineTo(margin.left + width, volumeTop - 5);
      ctx.stroke();
    }
    
    // Draw RSI
    if (activeIndicators.rsi && indicatorHeight > 0) {
      // RSI background
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)';
      ctx.fillRect(margin.left, indicatorTop, width, indicatorHeight);
      
      // RSI levels
      [30, 50, 70].forEach(level => {
        const y = indicatorTop + indicatorHeight - (level / 100) * indicatorHeight;
        ctx.strokeStyle = level === 50 ? colors.text : colors.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash(level === 50 ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + width, y);
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(level.toString(), margin.left + width + 5, y + 3);
      });
      ctx.setLineDash([]);
      
      // RSI line
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < visibleData.length; i++) {
        const rsi = indicators.rsi[startIdx + i];
        if (!isNaN(rsi)) {
          const x = indexToX(i);
          const y = indicatorTop + indicatorHeight - (rsi / 100) * indicatorHeight;
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // RSI label
      ctx.fillStyle = colors.textBright;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('RSI(14)', margin.left + 5, indicatorTop + 15);
    }

    
    // Draw MACD
    if (activeIndicators.macd && indicatorHeight > 0 && !activeIndicators.rsi) {
      const macdData = indicators.macd;
      const visibleMACD = macdData.macd.slice(startIdx, startIdx + visibleData.length);
      const visibleSignal = macdData.signal.slice(startIdx, startIdx + visibleData.length);
      const visibleHist = macdData.histogram.slice(startIdx, startIdx + visibleData.length);
      
      const validMACD = visibleMACD.filter(v => !isNaN(v));
      const validHist = visibleHist.filter(v => !isNaN(v));
      
      if (validMACD.length > 0) {
        const maxVal = Math.max(...validMACD.map(Math.abs), ...validHist.map(Math.abs));
        const macdToY = (val: number) => indicatorTop + indicatorHeight / 2 - (val / maxVal) * (indicatorHeight / 2) * 0.8;
        
        // Zero line
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, indicatorTop + indicatorHeight / 2);
        ctx.lineTo(margin.left + width, indicatorTop + indicatorHeight / 2);
        ctx.stroke();
        
        // Histogram
        for (let i = 0; i < visibleData.length; i++) {
          const hist = visibleHist[i];
          if (!isNaN(hist)) {
            const x = indexToX(i);
            const y = macdToY(hist);
            const zeroY = indicatorTop + indicatorHeight / 2;
            
            ctx.fillStyle = hist >= 0 ? colors.bullish : colors.bearish;
            ctx.fillRect(x - candleWidth / 2, Math.min(y, zeroY), candleWidth, Math.abs(y - zeroY));
          }
        }
        
        // MACD line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleData.length; i++) {
          const val = visibleMACD[i];
          if (!isNaN(val)) {
            const x = indexToX(i);
            const y = macdToY(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        
        // Signal line
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        started = false;
        for (let i = 0; i < visibleData.length; i++) {
          const val = visibleSignal[i];
          if (!isNaN(val)) {
            const x = indexToX(i);
            const y = macdToY(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        
        // MACD label
        ctx.fillStyle = colors.textBright;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('MACD(12,26,9)', margin.left + 5, indicatorTop + 15);
      }
    }

    
    // Draw crosshair
    if (crosshair.visible) {
      ctx.strokeStyle = colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, margin.top);
      ctx.lineTo(crosshair.x, dimensions.height - margin.bottom);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(margin.left, crosshair.y);
      ctx.lineTo(margin.left + width, crosshair.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Price label
      if (crosshair.y >= margin.top && crosshair.y <= margin.top + chartHeight) {
        const price = priceScale.max - ((crosshair.y - margin.top) / chartHeight) * priceScale.range;
        
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(margin.left + width, crosshair.y - 10, 75, 20);
        ctx.fillStyle = colors.textBright;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(price), margin.left + width + 5, crosshair.y + 4);
      }
    }
    
    // Draw date labels
    const labelInterval = Math.ceil(visibleData.length / 8);
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    visibleData.forEach((candle, i) => {
      if (i % labelInterval === 0) {
        const x = indexToX(i);
        ctx.fillText(candle.time, x, dimensions.height - 10);
      }
    });
    
  }, [visibleData, dimensions, colors, layout, priceScale, volumeScale, activeIndicators, indicators, crosshair, isDark, data, showPeaksTroughs, visiblePeaksTroughs, drawings, isDrawing, currentDrawing]);


  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update crosshair (unless sticky mode is on and we're not hovering)
    if (!crosshair.sticky) {
      setCrosshair(prev => ({ ...prev, x, y, visible: true }));
    }
    
    // Find hovered candle
    const { margin, width } = layout;
    const rightPadding = 50;
    const effectiveWidth = width - rightPadding;
    const candleWidth = Math.max(3, (effectiveWidth / visibleData.length) * 0.8);
    const gap = (effectiveWidth - candleWidth * visibleData.length) / (visibleData.length + 1);
    
    const candleIndex = Math.floor((x - margin.left - gap / 2) / (candleWidth + gap));
    if (candleIndex >= 0 && candleIndex < visibleData.length) {
      setHoveredCandle(visibleData[candleIndex]);
    }
    
    // Handle drawing in progress
    if (isDrawing && currentDrawing) {
      setCurrentDrawing(prev => prev ? { ...prev, endX: x, endY: y } : null);
    }
    
    // Handle dragging for pan (only if not drawing)
    if (isDragging && activeTool === 'none') {
      const dx = e.clientX - dragStart.x;
      // More responsive panning
      const candlesPerPixel = visibleData.length / width;
      const panDelta = dx * candlesPerPixel;
      const maxPan = Math.max(0, data.length - visibleData.length);
      const newPan = Math.max(0, Math.min(maxPan, dragStart.pan - panDelta));
      setPan(newPan);
    }
  }, [layout, visibleData, isDragging, dragStart, data.length, crosshair.sticky, isDrawing, currentDrawing, activeTool]);

  const handleMouseLeave = useCallback(() => {
    if (!crosshair.sticky) {
      setCrosshair(prev => ({ ...prev, visible: false }));
    }
    setHoveredCandle(null);
    setIsDragging(false);
    setIsDrawing(false);
    setCurrentDrawing(null);
  }, [crosshair.sticky]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start drawing if tool is active
    if (activeTool !== 'none') {
      const newDrawing: DrawingLine = {
        id: `drawing-${Date.now()}`,
        type: activeTool,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: activeTool === 'fibonacci' ? '#8b5cf6' : '#3b82f6',
        locked: false,
        visible: true
      };
      setCurrentDrawing(newDrawing);
      setIsDrawing(true);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX, pan });
    }
  }, [pan, activeTool]);

  const handleMouseUp = useCallback(() => {
    // Finish drawing
    if (isDrawing && currentDrawing) {
      // Only save if there's actual movement
      const dx = Math.abs(currentDrawing.endX - currentDrawing.startX);
      const dy = Math.abs(currentDrawing.endY - currentDrawing.startY);
      if (dx > 5 || dy > 5) {
        setDrawings(prev => [...prev, currentDrawing]);
      }
      setCurrentDrawing(null);
      setIsDrawing(false);
    }
    setIsDragging(false);
  }, [isDrawing, currentDrawing]);

  // Zoom at mouse position like TradingView
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const { margin, width } = layout;
    
    // Calculate mouse position as percentage of chart width
    const mousePercent = Math.max(0, Math.min(1, (mouseX - margin.left) / width));
    
    // Zoom factor - smaller for smoother zoom
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(1, Math.min(15, zoom * zoomFactor));
    
    // Calculate visible range before and after zoom
    const oldVisibleCount = Math.floor(data.length / zoom);
    const newVisibleCount = Math.floor(data.length / newZoom);
    
    // Adjust pan to keep mouse position fixed
    const visibleDiff = oldVisibleCount - newVisibleCount;
    const panAdjust = visibleDiff * mousePercent;
    const newPan = Math.max(0, Math.min(data.length - newVisibleCount, pan + panAdjust));
    
    setZoom(newZoom);
    setPan(newPan);
  }, [zoom, pan, data.length, layout]);

  // Also handle native wheel event for better performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    
    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleNativeWheel);
  }, []);

  // Format helpers - làm tròn theo bước giá cổ phiếu VN
  const formatPrice = (price: number) => {
    let roundedPrice: number;
    if (price >= 10000) {
      // Bước giá 100 cho giá >= 10,000
      roundedPrice = Math.round(price / 100) * 100;
    } else if (price >= 1000) {
      // Bước giá 50 cho giá >= 1,000
      roundedPrice = Math.round(price / 50) * 50;
    } else {
      // Bước giá 10 cho giá < 1,000
      roundedPrice = Math.round(price / 10) * 10;
    }
    return roundedPrice.toLocaleString('en-US');
  };

  const formatVolume = (vol: number) => {
    return vol.toLocaleString('en-US');
  };

  // Timeframes
  const timeframes = [
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '6M', label: '6M' },
    { id: '1Y', label: '1Y' },
    { id: '2Y', label: '2Y' },
    { id: 'ALL', label: 'ALL' }
  ];

  // Drawing tools config
  const drawingTools = [
    { id: 'trendline' as DrawingTool, label: 'Trendline', icon: TrendingUp },
    { id: 'horizontal' as DrawingTool, label: 'Horizontal Line', icon: Minus },
    { id: 'fibonacci' as DrawingTool, label: 'Fibonacci', icon: GitBranch },
    { id: 'rectangle' as DrawingTool, label: 'Rectangle', icon: BarChart2 }
  ];

  // Clear all drawings
  const clearDrawings = () => {
    setDrawings([]);
    setActiveTool('none');
  };

  // Toggle sticky crosshair
  const toggleStickyCrosshair = () => {
    setCrosshair(prev => ({ ...prev, sticky: !prev.sticky }));
  };

  // Get latest data for header
  const latestCandle = data[data.length - 1];
  const prevCandle = data[data.length - 2];
  const priceChange = latestCandle && prevCandle ? latestCandle.close - prevCandle.close : 0;
  const priceChangePercent = prevCandle ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Compact Single-Row Header */}
      <div className={`px-2 py-1.5 border-b flex items-center justify-between gap-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
        {/* Left: Symbol + Price + Timeframes */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{symbol}</span>
          {latestCandle && (
            <span className={`text-sm font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {latestCandle.close.toLocaleString()}
              <span className="text-xs ml-1">
                {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </span>
          )}
          <div className="hidden md:flex items-center gap-0.5 ml-1">
            {timeframes.map(tf => (
              <button
                key={tf.id}
                onClick={() => onTimeframeChange?.(tf.id)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all ${
                  currentTimeframe === tf.id
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: OHLCV (hidden on small screens) */}
        {hoveredCandle && (
          <div className={`hidden lg:flex items-center gap-2 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>📅 {hoveredCandle.time}</span>
            <span>O:<span className={isDark ? 'text-white' : 'text-slate-900'}>{hoveredCandle.open.toLocaleString()}</span></span>
            <span>H:<span className="text-emerald-500">{hoveredCandle.high.toLocaleString()}</span></span>
            <span>L:<span className="text-rose-500">{hoveredCandle.low.toLocaleString()}</span></span>
            <span>C:<span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-500' : 'text-rose-500'}>{hoveredCandle.close.toLocaleString()}</span></span>
          </div>
        )}

        {/* Right: Tools */}
        <div className="flex items-center gap-1">
          {/* Drawing Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              className={`p-1.5 rounded flex items-center gap-0.5 text-[10px] font-medium transition-colors ${
                activeTool !== 'none' ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <PenLine size={12} />
              <ChevronDown size={10} />
            </button>
            {showDrawingTools && (
              <div className={`absolute left-0 top-full mt-1 w-40 rounded-lg border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-1.5 space-y-0.5">
                  {drawingTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => { setActiveTool(activeTool === tool.id ? 'none' : tool.id); setShowDrawingTools(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${activeTool === tool.id ? 'bg-indigo-600 text-white' : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                    >
                      <tool.icon size={14} />
                      {tool.label}
                    </button>
                  ))}
                  {drawings.length > 0 && (
                    <>
                      <div className={`border-t my-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}></div>
                      <button onClick={() => { clearDrawings(); setShowDrawingTools(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-rose-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                        <Trash2 size={14} />Xóa ({drawings.length})
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Crosshair */}
          <button onClick={toggleStickyCrosshair} className={`p-1.5 rounded transition-colors ${crosshair.sticky ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Crosshair">
            <Crosshair size={12} />
          </button>

          {/* Peaks/Troughs */}
          <button onClick={() => setShowPeaksTroughs(!showPeaksTroughs)} className={`p-1.5 rounded transition-colors ${showPeaksTroughs ? isDark ? 'bg-amber-600/20 text-amber-400' : 'bg-amber-100 text-amber-600' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Đỉnh/Đáy">
            {showPeaksTroughs ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          {/* Indicators Dropdown */}
          <div className="relative">
            <button onClick={() => setShowIndicatorMenu(!showIndicatorMenu)} className={`p-1.5 rounded flex items-center gap-0.5 text-[10px] font-medium transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              <Layers size={12} />
              <ChevronDown size={10} />
            </button>
            {showIndicatorMenu && (
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-xl z-50 max-h-72 overflow-y-auto scrollbar-thin ${isDark ? 'bg-slate-800 border-slate-700 scrollbar-thumb-slate-600' : 'bg-white border-slate-200 scrollbar-thumb-slate-300'}`}>
                <div className="p-1.5 space-y-0.5">
                  <div className={`text-[10px] font-bold uppercase px-2 py-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Moving Averages</div>
                  {[{ key: 'ma5', label: 'MA 5', color: colors.ma5 }, { key: 'ma10', label: 'MA 10', color: colors.ma10 }, { key: 'ma20', label: 'MA 20', color: colors.ma20 }, { key: 'ma50', label: 'MA 50', color: colors.ma50 }].map(({ key, label, color }) => (
                    <button key={key} onClick={() => setActiveIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: color }} /><span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span></span>
                      {activeIndicators[key as keyof typeof activeIndicators] && <span className="text-emerald-500 text-[10px]">✓</span>}
                    </button>
                  ))}
                  <div className={`text-[10px] font-bold uppercase px-2 py-0.5 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Overlays</div>
                  <button onClick={() => setActiveIndicators(prev => ({ ...prev, bollinger: !prev.bollinger }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Bollinger</span>
                    {activeIndicators.bollinger && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </button>
                  <button onClick={() => setActiveIndicators(prev => ({ ...prev, ichimoku: !prev.ichimoku }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <span className="flex items-center gap-1"><span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Ichimoku</span><span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-500">PRO</span></span>
                    {activeIndicators.ichimoku && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </button>
                  <div className={`text-[10px] font-bold uppercase px-2 py-0.5 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Oscillators</div>
                  <button onClick={() => setActiveIndicators(prev => ({ ...prev, rsi: !prev.rsi, macd: false }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>RSI (14)</span>
                    {activeIndicators.rsi && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </button>
                  <button onClick={() => setActiveIndicators(prev => ({ ...prev, macd: !prev.macd, rsi: false }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>MACD</span>
                    {activeIndicators.macd && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </button>
                  <div className={`text-[10px] font-bold uppercase px-2 py-0.5 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Other</div>
                  <button onClick={() => setActiveIndicators(prev => ({ ...prev, volume: !prev.volume }))} className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Volume</span>
                    {activeIndicators.volume && <span className="text-emerald-500 text-[10px]">✓</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zoom */}
          <button onClick={() => setZoom(prev => Math.min(15, prev * 1.3))} className={`p-1.5 rounded transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Zoom In">
            <ZoomIn size={12} />
          </button>
          <button onClick={() => setZoom(prev => Math.max(1, prev / 1.3))} className={`p-1.5 rounded transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Zoom Out">
            <ZoomOut size={12} />
          </button>
          {zoom > 1 && <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{zoom.toFixed(1)}x</span>}
          <button onClick={() => { setZoom(1); setPan(0); }} className={`p-1.5 rounded transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Reset">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      
      {/* Chart Canvas */}
      <div 
        ref={containerRef} 
        className="relative"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          style={{ width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
        
        {/* Legend */}
        <div className={`absolute top-2 left-2 flex flex-wrap gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {activeIndicators.ma5 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma5 }} />
              MA5
            </span>
          )}
          {activeIndicators.ma10 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma10 }} />
              MA10
            </span>
          )}
          {activeIndicators.ma20 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma20 }} />
              MA20
            </span>
          )}
          {activeIndicators.ma50 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma50 }} />
              MA50
            </span>
          )}
          {activeIndicators.bollinger && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.bollingerUpper }} />
              BB(20,2)
            </span>
          )}
          {activeIndicators.ichimoku && (
            <span className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-800/50">
              <span className="text-[10px] font-medium">Ichimoku:</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 rounded" style={{ backgroundColor: colors.ichimokuTenkan }} />
                <span className="text-[10px]">Tenkan</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 rounded" style={{ backgroundColor: colors.ichimokuKijun }} />
                <span className="text-[10px]">Kijun</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded opacity-50" style={{ backgroundColor: colors.ichimokuSenkouA }} />
                <span className="text-[10px]">Cloud</span>
              </span>
            </span>
          )}
        </div>
        
        {/* Zoom Hint - shows briefly when hovering */}
        {crosshair.visible && zoom === 1 && (
          <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] opacity-50 ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            Scroll để zoom • Kéo để di chuyển
          </div>
        )}
        
        {/* Zoom indicator when zoomed */}
        {zoom > 1 && (
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] flex items-center gap-2 ${
            isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100/80 text-slate-600'
          }`}>
            <span>🔍 {zoom.toFixed(1)}x</span>
            <span className="opacity-50">|</span>
            <span className="opacity-70">{visibleData.length} nến</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;
