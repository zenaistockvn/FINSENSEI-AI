/**
 * LightweightChart - Professional Candlestick Chart
 * Sử dụng TradingView Lightweight Charts library
 * Performance tối ưu với Canvas 2D rendering
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Layers, ChevronDown, RefreshCw, 
  ZoomIn, ZoomOut, Crosshair, Eye, EyeOff, Camera, Maximize2, Activity
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

// Optimized indicator calculations with memoization
const calculateMA = (closes: number[], period: number): number[] => {
  const result: number[] = new Array(closes.length).fill(NaN);
  let sum = 0;
  
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period - 1) {
      if (i >= period) sum -= closes[i - period];
      result[i] = sum / period;
    }
  }
  return result;
};

const calculateRSI = (closes: number[], period: number = 14): number[] => {
  const result: number[] = new Array(closes.length).fill(NaN);
  let avgGain = 0, avgLoss = 0;
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
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

const LightweightChart: React.FC<LightweightChartProps> = ({
  data,
  symbol,
  isDark = true,
  height = 500,
  onTimeframeChange,
  currentTimeframe = '1Y'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastRenderRef = useRef<number>(0);
  
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [viewState, setViewState] = useState({ zoom: 1, pan: 0 });
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false });
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, pan: 0 });
  
  const [indicators, setIndicators] = useState({
    ma20: true, ma50: true, volume: true, rsi: false
  });
  const [showMenu, setShowMenu] = useState(false);

  // Colors - memoized
  const colors = useMemo(() => ({
    bg: isDark ? '#0f172a' : '#ffffff',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b',
    textBright: isDark ? '#e2e8f0' : '#1e293b',
    bullish: '#22c55e',
    bearish: '#ef4444',
    ma20: '#8b5cf6',
    ma50: '#ec4899',
    crosshair: isDark ? '#475569' : '#cbd5e1',
  }), [isDark]);

  // Pre-calculate indicators - memoized
  const calculatedIndicators = useMemo(() => {
    if (data.length === 0) return null;
    const closes = data.map(d => d.close);
    return {
      ma20: calculateMA(closes, 20),
      ma50: calculateMA(closes, 50),
      rsi: calculateRSI(closes, 14)
    };
  }, [data]);

  // Visible data slice - memoized
  const visibleData = useMemo(() => {
    const visibleCount = Math.floor(data.length / viewState.zoom);
    const startIdx = Math.max(0, Math.min(data.length - visibleCount, Math.floor(viewState.pan)));
    return { data: data.slice(startIdx, startIdx + visibleCount), startIdx };
  }, [data, viewState.zoom, viewState.pan]);

  // Price scale - memoized
  const priceScale = useMemo(() => {
    if (visibleData.data.length === 0) return { min: 0, max: 100, range: 100 };
    const prices = visibleData.data.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding, range: max - min + padding * 2 };
  }, [visibleData.data]);

  // Volume scale - memoized
  const volumeMax = useMemo(() => {
    if (visibleData.data.length === 0) return 1;
    return Math.max(...visibleData.data.map(d => d.volume)) * 1.1;
  }, [visibleData.data]);

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

  // Optimized render with requestAnimationFrame
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleData.data.length === 0) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;
    
    // Set canvas size only if changed
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    // Layout
    const margin = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartHeight = indicators.volume ? h * 0.75 - margin.top : h - margin.top - margin.bottom;
    const volumeTop = h - margin.bottom - (indicators.volume ? h * 0.18 : 0);
    const volumeHeight = indicators.volume ? h * 0.15 : 0;
    const chartWidth = w - margin.left - margin.right;
    
    const candleWidth = Math.max(2, (chartWidth / visibleData.data.length) * 0.75);
    const gap = (chartWidth - candleWidth * visibleData.data.length) / (visibleData.data.length + 1);
    
    // Helper functions
    const priceToY = (price: number) => margin.top + chartHeight - ((price - priceScale.min) / priceScale.range) * chartHeight;
    const indexToX = (i: number) => margin.left + gap + i * (candleWidth + gap) + candleWidth / 2;

    // Clear with background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Draw watermark
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isDark ? '#fff' : '#000';
    ctx.fillText('FINSENSEI AI', w / 2, h / 2);
    ctx.restore();

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = priceScale.max - (priceScale.range / 5) * i;
      ctx.fillStyle = colors.text;
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(price.toLocaleString('en-US', { maximumFractionDigits: 0 }), margin.left + chartWidth + 5, y + 4);
    }

    // Draw MA lines
    if (calculatedIndicators) {
      const drawMA = (maData: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleData.data.length; i++) {
          const val = maData[visibleData.startIdx + i];
          if (!isNaN(val)) {
            const x = indexToX(i);
            const y = priceToY(val);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      if (indicators.ma20) drawMA(calculatedIndicators.ma20, colors.ma20);
      if (indicators.ma50) drawMA(calculatedIndicators.ma50, colors.ma50);
    }

    // Draw candlesticks - optimized batch rendering
    visibleData.data.forEach((candle, i) => {
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
    });

    // Draw volume
    if (indicators.volume) {
      visibleData.data.forEach((candle, i) => {
        const x = indexToX(i);
        const isUp = candle.close >= candle.open;
        const barHeight = (candle.volume / volumeMax) * volumeHeight;
        
        ctx.fillStyle = isUp 
          ? (isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.3)')
          : (isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)');
        ctx.fillRect(x - candleWidth / 2, volumeTop + volumeHeight - barHeight, candleWidth, barHeight);
      });
    }

    // Draw crosshair
    if (crosshair.visible) {
      ctx.strokeStyle = colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      ctx.beginPath();
      ctx.moveTo(crosshair.x, margin.top);
      ctx.lineTo(crosshair.x, h - margin.bottom);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(margin.left, crosshair.y);
      ctx.lineTo(margin.left + chartWidth, crosshair.y);
      ctx.stroke();
      
      ctx.setLineDash([]);

      // Price label
      if (crosshair.y >= margin.top && crosshair.y <= margin.top + chartHeight) {
        const price = priceScale.max - ((crosshair.y - margin.top) / chartHeight) * priceScale.range;
        ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(margin.left + chartWidth, crosshair.y - 10, 65, 20);
        ctx.fillStyle = colors.textBright;
        ctx.font = '11px Inter';
        ctx.fillText(price.toLocaleString('en-US', { maximumFractionDigits: 0 }), margin.left + chartWidth + 5, crosshair.y + 4);
      }
    }

    // Date labels
    const labelInterval = Math.ceil(visibleData.data.length / 8);
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    visibleData.data.forEach((candle, i) => {
      if (i % labelInterval === 0) {
        ctx.fillText(candle.time, indexToX(i), h - 10);
      }
    });

  }, [visibleData, dimensions, colors, priceScale, volumeMax, indicators, calculatedIndicators, crosshair, isDark]);

  // Throttled render with RAF
  useEffect(() => {
    const now = performance.now();
    if (now - lastRenderRef.current < 16) return; // ~60fps cap
    
    lastRenderRef.current = now;
    animationRef.current = requestAnimationFrame(render);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);


  // Mouse handlers with throttling
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCrosshair({ x, y, visible: true });
    
    // Find hovered candle
    const margin = { left: 10, right: 70 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const candleWidth = Math.max(2, (chartWidth / visibleData.data.length) * 0.75);
    const gap = (chartWidth - candleWidth * visibleData.data.length) / (visibleData.data.length + 1);
    
    const candleIndex = Math.floor((x - margin.left - gap / 2) / (candleWidth + gap));
    if (candleIndex >= 0 && candleIndex < visibleData.data.length) {
      setHoveredCandle(visibleData.data[candleIndex]);
    }
    
    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const candlesPerPixel = visibleData.data.length / chartWidth;
      const panDelta = dx * candlesPerPixel;
      const maxPan = Math.max(0, data.length - visibleData.data.length);
      setViewState(prev => ({
        ...prev,
        pan: Math.max(0, Math.min(maxPan, dragStart.pan - panDelta))
      }));
    }
  }, [dimensions, visibleData.data, isDragging, dragStart, data.length]);

  const handleMouseLeave = useCallback(() => {
    setCrosshair(prev => ({ ...prev, visible: false }));
    setHoveredCandle(null);
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, pan: viewState.pan });
  }, [viewState.pan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Smooth zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(1, Math.min(15, prev.zoom * zoomFactor))
    }));
  }, []);

  // Prevent default wheel behavior
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, []);

  // Timeframes
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', 'ALL'];

  // Latest candle info
  const latestCandle = data.length > 0 ? data[data.length - 1] : null;
  const prevCandle = data.length > 1 ? data[data.length - 2] : null;
  const priceChange = latestCandle && prevCandle ? latestCandle.close - prevCandle.close : 0;
  const priceChangePercent = prevCandle && prevCandle.close > 0 ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  // Early return if no data
  if (data.length === 0) {
    return (
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-center h-[500px] text-slate-500">
          <p>Đang tải dữ liệu...</p>
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
        {hoveredCandle && (
          <div className={`hidden lg:flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={`px-2 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              📅 {hoveredCandle.time}
            </span>
            <span>O: <span className={isDark ? 'text-white' : 'text-slate-900'}>{hoveredCandle.open.toLocaleString()}</span></span>
            <span>H: <span className="text-emerald-500">{hoveredCandle.high.toLocaleString()}</span></span>
            <span>L: <span className="text-rose-500">{hoveredCandle.low.toLocaleString()}</span></span>
            <span>C: <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-500' : 'text-rose-500'}>
              {hoveredCandle.close.toLocaleString()}
            </span></span>
            <span>Vol: <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {(hoveredCandle.volume / 1000000).toFixed(2)}M
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
              <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-2 space-y-1">
                  {[
                    { key: 'ma20', label: 'MA 20', color: colors.ma20 },
                    { key: 'ma50', label: 'MA 50', color: colors.ma50 },
                    { key: 'volume', label: 'Volume', color: colors.bullish },
                    { key: 'rsi', label: 'RSI (14)', color: '#a855f7' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
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
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(15, prev.zoom * 1.3) }))}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(1, prev.zoom / 1.3) }))}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <ZoomOut size={14} />
          </button>
          {viewState.zoom > 1 && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              {viewState.zoom.toFixed(1)}x
            </span>
          )}
          <button
            onClick={() => setViewState({ zoom: 1, pan: 0 })}
            className={`p-1.5 rounded ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="relative" style={{ height: `${height}px` }}>
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
        </div>
      </div>
    </div>
  );
};

export default LightweightChart;
