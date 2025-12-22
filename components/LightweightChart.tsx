/**
 * LightweightChart - Professional Candlestick Chart
 * Sử dụng TradingView Lightweight Charts v4 library chính thức
 * Mượt mà, chuyên nghiệp như TradingView
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { 
  TrendingUp, TrendingDown, Layers, ChevronDown, RefreshCw, 
  ZoomIn, ZoomOut, Activity, Camera
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

interface LightweightChartProps {
  data: CandleData[];
  symbol: string;
  isDark?: boolean;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
}

// Calculate MA
const calculateMA = (data: CandleData[], period: number) => {
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time as Time,
      value: sum / period
    });
  }
  return result;
};

// Calculate EMA
const calculateEMA = (data: CandleData[], period: number) => {
  const result: { time: Time; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    if (i >= period - 1) {
      result.push({
        time: data[i].time as Time,
        value: ema
      });
    }
  }
  return result;
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: CandleData[], period: number = 20, stdDev: number = 2) => {
  const upper: { time: Time; value: number }[] = [];
  const lower: { time: Time; value: number }[] = [];
  const middle: { time: Time; value: number }[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const ma = sum / period;
    
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(data[i - j].close - ma, 2);
    }
    const std = Math.sqrt(variance / period) * stdDev;
    
    middle.push({ time: data[i].time as Time, value: ma });
    upper.push({ time: data[i].time as Time, value: ma + std });
    lower.push({ time: data[i].time as Time, value: ma - std });
  }
  
  return { upper, lower, middle };
};

const LightweightChart: React.FC<LightweightChartProps> = ({
  data,
  symbol,
  isDark = true,
  height = 500,
  onTimeframeChange,
  currentTimeframe = '1Y'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const [hoveredData, setHoveredData] = useState<CandleData | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [indicators, setIndicators] = useState({
    ma20: true,
    ma50: true,
    ema20: false,
    volume: true,
    bollinger: false
  });

  // Colors
  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    bullish: '#22c55e',
    bearish: '#ef4444',
    ma20: '#8b5cf6',
    ma50: '#ec4899',
    ema20: '#f59e0b',
    bbUpper: '#06b6d4',
    bbLower: '#06b6d4',
    bbMiddle: '#0ea5e9'
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDark ? '#475569' : '#cbd5e1',
          style: 2,
          labelBackgroundColor: isDark ? '#334155' : '#e2e8f0'
        },
        horzLine: {
          width: 1,
          color: isDark ? '#475569' : '#cbd5e1',
          style: 2,
          labelBackgroundColor: isDark ? '#334155' : '#e2e8f0'
        }
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
        secondsVisible: false
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: colors.bullish,
      downColor: colors.bearish,
      borderUpColor: colors.bullish,
      borderDownColor: colors.bearish,
      wickUpColor: colors.bullish,
      wickDownColor: colors.bearish
    });

    // Format data for chart
    const candleData = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }));
    candleSeries.setData(candleData);

    // Volume series
    if (indicators.volume) {
      const volumeSeries = chart.addHistogramSeries({
        color: colors.bullish,
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume'
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 }
      });
      
      const volumeData = data.map(d => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open 
          ? (isDark ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.4)')
          : (isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.4)')
      }));
      volumeSeries.setData(volumeData);
    }

    // MA20
    if (indicators.ma20 && data.length >= 20) {
      const ma20Series = chart.addLineSeries({
        color: colors.ma20,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      ma20Series.setData(calculateMA(data, 20));
    }

    // MA50
    if (indicators.ma50 && data.length >= 50) {
      const ma50Series = chart.addLineSeries({
        color: colors.ma50,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      ma50Series.setData(calculateMA(data, 50));
    }

    // EMA20
    if (indicators.ema20 && data.length >= 20) {
      const ema20Series = chart.addLineSeries({
        color: colors.ema20,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      ema20Series.setData(calculateEMA(data, 20));
    }

    // Bollinger Bands
    if (indicators.bollinger && data.length >= 20) {
      const bb = calculateBollingerBands(data, 20, 2);
      
      const bbUpperSeries = chart.addLineSeries({
        color: colors.bbUpper,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      bbUpperSeries.setData(bb.upper);
      
      const bbLowerSeries = chart.addLineSeries({
        color: colors.bbLower,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      bbLowerSeries.setData(bb.lower);
      
      const bbMiddleSeries = chart.addLineSeries({
        color: colors.bbMiddle,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      bbMiddleSeries.setData(bb.middle);
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const idx = data.findIndex(d => d.time === param.time);
        if (idx !== -1) {
          setHoveredData(data[idx]);
        }
      } else {
        setHoveredData(null);
      }
    });

    // Fit content
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, isDark, height, indicators, colors]);

  // Zoom controls
  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      if (visibleRange) {
        const newRange = {
          from: visibleRange.from + (visibleRange.to - visibleRange.from) * 0.1,
          to: visibleRange.to - (visibleRange.to - visibleRange.from) * 0.1
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      if (visibleRange) {
        const newRange = {
          from: visibleRange.from - (visibleRange.to - visibleRange.from) * 0.2,
          to: visibleRange.to + (visibleRange.to - visibleRange.from) * 0.2
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleReset = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleScreenshot = () => {
    if (chartContainerRef.current) {
      const canvas = chartContainerRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${symbol}_chart_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  // Timeframes
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', 'ALL'];

  // Latest candle info
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
        {/* Left: Symbol + Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-500" />
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{symbol}</span>
          </div>
          {latestCandle && (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {latestCandle.close.toLocaleString()}
              </span>
              <span className={`text-sm font-medium flex items-center gap-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          )}
          
          {/* Timeframes */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  currentTimeframe === tf
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center: OHLCV */}
        {displayCandle && (
          <div className={`hidden lg:flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={`px-2 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              📅 {displayCandle.time}
            </span>
            <span>O: <span className={isDark ? 'text-white' : 'text-slate-900'}>{displayCandle.open.toLocaleString()}</span></span>
            <span>H: <span className="text-emerald-500">{displayCandle.high.toLocaleString()}</span></span>
            <span>L: <span className="text-rose-500">{displayCandle.low.toLocaleString()}</span></span>
            <span>C: <span className={displayCandle.close >= displayCandle.open ? 'text-emerald-500' : 'text-rose-500'}>
              {displayCandle.close.toLocaleString()}
            </span></span>
            <span>Vol: <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {(displayCandle.volume / 1000000).toFixed(2)}M
            </span></span>
          </div>
        )}

        {/* Right: Tools */}
        <div className="flex items-center gap-1">
          {/* Indicators Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 rounded flex items-center gap-1 text-xs ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              <Layers size={14} />
              <ChevronDown size={12} />
            </button>
            {showMenu && (
              <div className={`absolute right-0 top-full mt-1 w-44 rounded-lg border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-2 space-y-1">
                  {[
                    { key: 'ma20', label: 'MA 20', color: colors.ma20 },
                    { key: 'ma50', label: 'MA 50', color: colors.ma50 },
                    { key: 'ema20', label: 'EMA 20', color: colors.ema20 },
                    { key: 'bollinger', label: 'Bollinger Bands', color: colors.bbMiddle },
                    { key: 'volume', label: 'Volume', color: colors.bullish }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
                      </span>
                      {indicators[key as keyof typeof indicators] && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleReset}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            title="Reset View"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleScreenshot}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            title="Screenshot"
          >
            <Camera size={14} />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} style={{ height: `${height}px` }} />
        
        {/* MA Legend */}
        <div className={`absolute top-2 left-2 flex gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {indicators.ma20 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma20 }} />
              MA20
            </span>
          )}
          {indicators.ma50 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma50 }} />
              MA50
            </span>
          )}
          {indicators.ema20 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ema20 }} />
              EMA20
            </span>
          )}
          {indicators.bollinger && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.bbMiddle }} />
              BB(20,2)
            </span>
          )}
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-4xl font-bold ${isDark ? 'text-white/[0.03]' : 'text-black/[0.03]'}`}>
            FINSENSEI AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default LightweightChart;
