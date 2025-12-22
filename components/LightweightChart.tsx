/**
 * LightweightChart - Professional Candlestick Chart with AI Features
 * - Auto Support/Resistance detection
 * - AI Buy/Sell signals with arrows
 * - SENAI Trading Zones visualization
 * Compatible with lightweight-charts v5.x
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, Time, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { 
  TrendingUp, TrendingDown, Layers, ChevronDown, RefreshCw, 
  ZoomIn, ZoomOut, Activity, Camera, Target, Brain, Shield
} from 'lucide-react';

interface CandleData {
  time: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingZones {
  buyZoneLow: number;
  buyZoneHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
}

interface AISignal {
  time: string;
  type: 'buy' | 'sell';
  price: number;
  reason: string;
}

interface LightweightChartProps {
  data: CandleData[];
  symbol: string;
  isDark?: boolean;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
  tradingZones?: TradingZones;
  aiSignals?: AISignal[];
}

// ========== SUPPORT/RESISTANCE DETECTION ==========
interface SRLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
}

const detectSupportResistance = (data: CandleData[], sensitivity: number = 3): SRLevel[] => {
  if (data.length < 20) return [];
  
  const levels: SRLevel[] = [];
  const priceRange = Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low));
  const tolerance = priceRange * 0.015;
  
  for (let i = sensitivity; i < data.length - sensitivity; i++) {
    const current = data[i];
    let isLocalHigh = true;
    let isLocalLow = true;
    
    for (let j = 1; j <= sensitivity; j++) {
      if (data[i - j].high >= current.high || data[i + j].high >= current.high) isLocalHigh = false;
      if (data[i - j].low <= current.low || data[i + j].low <= current.low) isLocalLow = false;
    }
    
    if (isLocalHigh) {
      const existing = levels.find(l => Math.abs(l.price - current.high) < tolerance);
      if (existing) { existing.touches++; existing.strength = Math.min(5, existing.touches); }
      else levels.push({ price: current.high, type: 'resistance', strength: 1, touches: 1 });
    }
    
    if (isLocalLow) {
      const existing = levels.find(l => Math.abs(l.price - current.low) < tolerance);
      if (existing) { existing.touches++; existing.strength = Math.min(5, existing.touches); }
      else levels.push({ price: current.low, type: 'support', strength: 1, touches: 1 });
    }
  }
  
  return levels.filter(l => l.touches >= 2).sort((a, b) => b.strength - a.strength).slice(0, 6);
};

// ========== AI SIGNAL DETECTION ==========
const detectAISignals = (data: CandleData[]): AISignal[] => {
  if (data.length < 50) return [];
  
  const signals: AISignal[] = [];
  const closes = data.map(d => d.close);
  const ma20 = calculateMA(closes, 20);
  const ma50 = calculateMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  
  for (let i = 50; i < data.length; i++) {
    const candle = data[i];
    const prevCandle = data[i - 1];
    const currentRSI = rsi[i];
    const prevRSI = rsi[i - 1];
    
    // BUY Signals
    const bullishEngulfing = candle.close > candle.open && prevCandle.close < prevCandle.open &&
      candle.close > prevCandle.open && candle.open < prevCandle.close;
    const rsiOversold = prevRSI < 30 && currentRSI > 30;
    const maCrossUp = ma20[i - 1] < ma50[i - 1] && ma20[i] > ma50[i];
    
    if (bullishEngulfing && currentRSI < 50) {
      signals.push({ time: candle.time, type: 'buy', price: candle.low, reason: 'Bullish Engulfing' });
    } else if (rsiOversold) {
      signals.push({ time: candle.time, type: 'buy', price: candle.low, reason: 'RSI Oversold' });
    } else if (maCrossUp) {
      signals.push({ time: candle.time, type: 'buy', price: candle.low, reason: 'MA Cross Up' });
    }
    
    // SELL Signals
    const bearishEngulfing = candle.close < candle.open && prevCandle.close > prevCandle.open &&
      candle.close < prevCandle.open && candle.open > prevCandle.close;
    const rsiOverbought = prevRSI > 70 && currentRSI < 70;
    const maCrossDown = ma20[i - 1] > ma50[i - 1] && ma20[i] < ma50[i];
    
    if (bearishEngulfing && currentRSI > 50) {
      signals.push({ time: candle.time, type: 'sell', price: candle.high, reason: 'Bearish Engulfing' });
    } else if (rsiOverbought) {
      signals.push({ time: candle.time, type: 'sell', price: candle.high, reason: 'RSI Overbought' });
    } else if (maCrossDown) {
      signals.push({ time: candle.time, type: 'sell', price: candle.high, reason: 'MA Cross Down' });
    }
  }
  
  return signals.slice(-20);
};

// Helper functions
const calculateMA = (closes: number[], period: number): number[] => {
  const result: number[] = new Array(closes.length).fill(0);
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += closes[i - j];
    result[i] = sum / period;
  }
  return result;
};

const calculateRSI = (closes: number[], period: number = 14): number[] => {
  const result: number[] = new Array(closes.length).fill(50);
  let avgGain = 0, avgLoss = 0;
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    if (i <= period) {
      avgGain += gain; avgLoss += loss;
      if (i === period) {
        avgGain /= period; avgLoss /= period;
        result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }
  }
  return result;
};

const calculateMALine = (data: CandleData[], period: number) => {
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time as Time, value: sum / period });
  }
  return result;
};

// ========== MAIN COMPONENT ==========
const LightweightChart: React.FC<LightweightChartProps> = ({
  data, symbol, isDark = true, height = 500,
  onTimeframeChange, currentTimeframe = '1Y',
  tradingZones, aiSignals: externalSignals
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const [hoveredData, setHoveredData] = useState<CandleData | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [indicators, setIndicators] = useState({
    ma20: true, ma50: true, volume: true,
    supportResistance: true, aiSignals: true, tradingZones: true
  });

  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    bullish: '#22c55e', bearish: '#ef4444',
    ma20: '#8b5cf6', ma50: '#ec4899',
    support: '#22c55e', resistance: '#ef4444'
  };

  const srLevels = useMemo(() => 
    indicators.supportResistance ? detectSupportResistance(data) : [], 
    [data, indicators.supportResistance]
  );

  const aiSignals = useMemo(() => 
    indicators.aiSignals ? (externalSignals || detectAISignals(data)) : [],
    [data, indicators.aiSignals, externalSignals]
  );

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontFamily: "'Inter', sans-serif" },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: isDark ? '#475569' : '#cbd5e1', style: 2, labelBackgroundColor: isDark ? '#334155' : '#e2e8f0' },
        horzLine: { width: 1, color: isDark ? '#475569' : '#cbd5e1', style: 2, labelBackgroundColor: isDark ? '#334155' : '#e2e8f0' }
      },
      rightPriceScale: { borderColor: colors.grid, scaleMargins: { top: 0.1, bottom: 0.2 } },
      timeScale: { borderColor: colors.grid, timeVisible: true, secondsVisible: false },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
    });

    chartRef.current = chart;

    // Candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.bullish, downColor: colors.bearish,
      borderUpColor: colors.bullish, borderDownColor: colors.bearish,
      wickUpColor: colors.bullish, wickDownColor: colors.bearish
    });

    const candleData = data.map(d => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close }));
    candleSeries.setData(candleData);

    // AI Signal Markers (v5 uses attachPrimitive or we draw via line series)
    if (indicators.aiSignals && aiSignals.length > 0) {
      // Draw buy/sell markers as separate point series
      aiSignals.forEach(signal => {
        const markerSeries = chart.addSeries(LineSeries, {
          color: signal.type === 'buy' ? '#22c55e' : '#ef4444',
          lineWidth: 1,
          lineVisible: false,
          pointMarkersVisible: true,
          pointMarkersRadius: 6,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true,
          title: signal.type === 'buy' ? '▲' : '▼'
        });
        markerSeries.setData([{ time: signal.time as Time, value: signal.price }]);
      });
    }

    // Volume series
    if (indicators.volume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: colors.bullish, priceFormat: { type: 'volume' }, priceScaleId: 'volume'
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      
      const volumeData = data.map(d => ({
        time: d.time as Time, value: d.volume,
        color: d.close >= d.open ? (isDark ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.4)') : (isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.4)')
      }));
      volumeSeries.setData(volumeData);
    }

    // MA Lines
    if (indicators.ma20 && data.length >= 20) {
      const ma20Series = chart.addSeries(LineSeries, { color: colors.ma20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      ma20Series.setData(calculateMALine(data, 20));
    }

    if (indicators.ma50 && data.length >= 50) {
      const ma50Series = chart.addSeries(LineSeries, { color: colors.ma50, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      ma50Series.setData(calculateMALine(data, 50));
    }

    // Support/Resistance Lines
    if (indicators.supportResistance && srLevels.length > 0) {
      srLevels.forEach(level => {
        const lineSeries = chart.addSeries(LineSeries, {
          color: level.type === 'support' ? colors.support : colors.resistance,
          lineWidth: level.strength >= 3 ? 2 : 1, lineStyle: 2,
          priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false,
          title: `${level.type === 'support' ? 'S' : 'R'}${level.touches}`
        });
        lineSeries.setData([
          { time: data[0].time as Time, value: level.price },
          { time: data[data.length - 1].time as Time, value: level.price }
        ]);
      });
    }

    // Trading Zones (SENAI)
    if (indicators.tradingZones && tradingZones) {
      // Buy Zone
      const buyZoneSeries = chart.addSeries(LineSeries, {
        color: '#22c55e', lineWidth: 2, lineStyle: 0,
        priceLineVisible: true, lastValueVisible: true, crosshairMarkerVisible: false, title: 'Buy'
      });
      buyZoneSeries.setData([
        { time: data[0].time as Time, value: tradingZones.buyZoneHigh },
        { time: data[data.length - 1].time as Time, value: tradingZones.buyZoneHigh }
      ]);

      // Stop Loss
      const stopLossSeries = chart.addSeries(LineSeries, {
        color: '#ef4444', lineWidth: 2, lineStyle: 2,
        priceLineVisible: true, lastValueVisible: true, crosshairMarkerVisible: false, title: 'SL'
      });
      stopLossSeries.setData([
        { time: data[0].time as Time, value: tradingZones.stopLoss },
        { time: data[data.length - 1].time as Time, value: tradingZones.stopLoss }
      ]);

      // Targets
      [tradingZones.target1, tradingZones.target2, tradingZones.target3].forEach((target, idx) => {
        const targetSeries = chart.addSeries(LineSeries, {
          color: '#3b82f6', lineWidth: 1, lineStyle: 2,
          priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false, title: `T${idx + 1}`
        });
        targetSeries.setData([
          { time: data[0].time as Time, value: target },
          { time: data[data.length - 1].time as Time, value: target }
        ]);
      });
    }

    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const idx = data.findIndex(d => d.time === param.time);
        if (idx !== -1) setHoveredData(data[idx]);
      } else setHoveredData(null);
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [data, isDark, height, indicators, srLevels, aiSignals, tradingZones, colors]);

  const handleZoomIn = () => {
    if (chartRef.current) {
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (range) ts.setVisibleLogicalRange({ from: range.from + (range.to - range.from) * 0.1, to: range.to - (range.to - range.from) * 0.1 });
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const ts = chartRef.current.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (range) ts.setVisibleLogicalRange({ from: range.from - (range.to - range.from) * 0.2, to: range.to + (range.to - range.from) * 0.2 });
    }
  };

  const handleReset = () => chartRef.current?.timeScale().fitContent();

  const handleScreenshot = () => {
    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${symbol}_chart_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', 'ALL'];
  const latestCandle = data.length > 0 ? data[data.length - 1] : null;
  const prevCandle = data.length > 1 ? data[data.length - 2] : null;
  const priceChange = latestCandle && prevCandle ? latestCandle.close - prevCandle.close : 0;
  const priceChangePercent = prevCandle && prevCandle.close > 0 ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;
  const displayCandle = hoveredData || latestCandle;

  if (data.length === 0) {
    return (
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-center h-[500px] text-slate-500">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Đang tải dữ liệu biểu đồ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-500" />
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{symbol}</span>
          </div>
          {latestCandle && (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{latestCandle.close.toLocaleString()}</span>
              <span className={`text-sm font-medium flex items-center gap-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {timeframes.map(tf => (
              <button key={tf} onClick={() => onTimeframeChange?.(tf)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${currentTimeframe === tf ? 'bg-indigo-600 text-white' : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}>
                {tf}
              </button>
            ))}
          </div>
        </div>

        {displayCandle && (
          <div className={`hidden lg:flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={`px-2 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>📅 {displayCandle.time}</span>
            <span>O: <span className={isDark ? 'text-white' : 'text-slate-900'}>{displayCandle.open.toLocaleString()}</span></span>
            <span>H: <span className="text-emerald-500">{displayCandle.high.toLocaleString()}</span></span>
            <span>L: <span className="text-rose-500">{displayCandle.low.toLocaleString()}</span></span>
            <span>C: <span className={displayCandle.close >= displayCandle.open ? 'text-emerald-500' : 'text-rose-500'}>{displayCandle.close.toLocaleString()}</span></span>
            <span>Vol: <span className={isDark ? 'text-white' : 'text-slate-900'}>{(displayCandle.volume / 1000000).toFixed(2)}M</span></span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 rounded flex items-center gap-1 text-xs ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              <Layers size={14} /><ChevronDown size={12} />
            </button>
            {showMenu && (
              <div className={`absolute right-0 top-full mt-1 w-52 rounded-lg border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-2 space-y-1">
                  <div className={`px-2 py-1 text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Indicators</div>
                  {[
                    { key: 'ma20', label: 'MA 20', color: colors.ma20 },
                    { key: 'ma50', label: 'MA 50', color: colors.ma50 },
                    { key: 'volume', label: 'Volume', color: colors.bullish },
                  ].map(({ key, label, color }) => (
                    <button key={key} onClick={() => setIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
                      </span>
                      {indicators[key as keyof typeof indicators] && <span className="text-emerald-500">✓</span>}
                    </button>
                  ))}
                  <div className={`px-2 py-1 text-xs font-semibold mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>AI Features</div>
                  {[
                    { key: 'supportResistance', label: 'Auto S/R Levels', icon: <Target size={12} /> },
                    { key: 'aiSignals', label: 'AI Buy/Sell Signals', icon: <Brain size={12} /> },
                    { key: 'tradingZones', label: 'SENAI Trading Zones', icon: <Shield size={12} /> },
                  ].map(({ key, label, icon }) => (
                    <button key={key} onClick={() => setIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                      <span className="flex items-center gap-2">
                        <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{icon}</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
                      </span>
                      {indicators[key as keyof typeof indicators] && <span className="text-emerald-500">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleZoomIn} className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><ZoomIn size={14} /></button>
          <button onClick={handleZoomOut} className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><ZoomOut size={14} /></button>
          <button onClick={handleReset} className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><RefreshCw size={14} /></button>
          <button onClick={handleScreenshot} className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}><Camera size={14} /></button>
        </div>
      </div>

      <div className="relative">
        <div ref={chartContainerRef} style={{ height: `${height}px` }} />
        
        <div className={`absolute top-2 left-2 flex flex-wrap gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {indicators.ma20 && <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma20 }} />MA20</span>}
          {indicators.ma50 && <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma50 }} />MA50</span>}
          {indicators.supportResistance && srLevels.length > 0 && <span className="flex items-center gap-1"><Target size={10} className="text-cyan-400" />S/R: {srLevels.length}</span>}
          {indicators.aiSignals && aiSignals.length > 0 && <span className="flex items-center gap-1"><Brain size={10} className="text-purple-400" />Signals: {aiSignals.length}</span>}
          {indicators.tradingZones && tradingZones && <span className="flex items-center gap-1"><Shield size={10} className="text-emerald-400" />SENAI</span>}
        </div>

        {indicators.aiSignals && aiSignals.length > 0 && (
          <div className={`absolute top-2 right-2 p-2 rounded-lg text-xs ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-1"><Brain size={12} className="text-purple-400" /><span className={isDark ? 'text-white' : 'text-slate-900'}>AI Signals</span></div>
            <div className="flex gap-3">
              <span className="text-emerald-500">▲ {aiSignals.filter(s => s.type === 'buy').length} Buy</span>
              <span className="text-rose-500">▼ {aiSignals.filter(s => s.type === 'sell').length} Sell</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-4xl font-bold ${isDark ? 'text-white/[0.03]' : 'text-black/[0.03]'}`}>FINSENSEI AI</span>
        </div>
      </div>

      {indicators.tradingZones && tradingZones && (
        <div className={`px-3 py-2 border-t flex items-center justify-between text-xs ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Buy:</span>
              <span className="text-emerald-500 font-medium">{tradingZones.buyZoneLow.toLocaleString()} - {tradingZones.buyZoneHigh.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>SL:</span>
              <span className="text-rose-500 font-medium">{tradingZones.stopLoss.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Targets:</span>
            <span className="text-blue-400">T1: {tradingZones.target1.toLocaleString()}</span>
            <span className="text-blue-500">T2: {tradingZones.target2.toLocaleString()}</span>
            <span className="text-blue-600">T3: {tradingZones.target3.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightweightChart;
