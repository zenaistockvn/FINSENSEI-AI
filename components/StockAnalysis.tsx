import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Target,
  Clock,
  ArrowRight,
  BrainCircuit,
  BarChart2,
  Activity,
  Zap,
  X,
  ChevronDown,
  FileText,
  FileSearch,
  Mic2,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Newspaper,
  Globe,
  Share2,
  Search,
  Sparkles,
  Star,
  RefreshCw,
  Maximize2,
  Info,
  ChevronUp,
  Bell,
} from 'lucide-react';
import {
  getVN100Companies,
  getStockPrices,
  getCompanyBySymbol,
  searchCompanies,
  getStockNews,
  getAIAnalysis,
  getRiskAnalysis,
  getTradingStrategy,
  getBrokerRecommendations,
  getSimplizeCompanyData,
  getTechnicalIndicators,
  getTopSenaiStocks,
  Company,
  StockPrice,
  StockNews,
  AIAnalysis,
  RiskAnalysis,
  TradingStrategy,
  BrokerRecommendation,
  SimplizeCompanyData,
  TopSenaiStock,
} from '../services/supabaseClient';
import AIStockInsight from './AIStockInsight';
import TradingViewChart from './TradingViewChart';
import LightweightChart from './LightweightChart';
import { analyzeStockWithGPT, AISignal } from '../services/gptSignalService';
import { getSimplizePrice } from '../services/simplizePriceService';
import { getChartData } from '../services/vciService';
import {
  calculateSenAIDiagnosis,
  calculateSenAIRisk,
  calculateSenAIStrategy,
  SenAIInput,
} from '../services/senaiCalculator';

// --- Types ---
interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  rsi?: number;
}

interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

// --- Custom Candlestick Chart Component ---
const CandlestickChart = ({ data, isDark }: { data: CandlestickData[]; isDark: boolean }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: CandlestickData } | null>(null);
  
  if (data.length === 0) return null;
  
  const margin = { top: 20, right: 60, bottom: 30, left: 10 };
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  
  useEffect(() => {
    if (containerRef) {
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });
      resizeObserver.observe(containerRef);
      return () => resizeObserver.disconnect();
    }
  }, [containerRef]);
  
  const width = dimensions.width - margin.left - margin.right;
  const height = dimensions.height - margin.top - margin.bottom;
  
  // Calculate scales
  const prices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;
  const priceRange = maxPrice - minPrice;
  
  const candleWidth = Math.max(4, Math.min(20, (width / data.length) * 0.7));
  const gap = (width - candleWidth * data.length) / (data.length + 1);
  
  const scaleY = (price: number) => height - ((price - minPrice) / priceRange) * height;
  const scaleX = (index: number) => gap + index * (candleWidth + gap) + candleWidth / 2;
  
  // Format price for Y axis
  const yTicks = Array.from({ length: 5 }, (_, i) => minPrice + (priceRange * i) / 4);
  
  // MA20 path
  const ma20Points = data
    .map((d, i) => d.ma20 ? `${scaleX(i)},${scaleY(d.ma20)}` : null)
    .filter(Boolean)
    .join(' L ');
  
  return (
    <div ref={setContainerRef} className="w-full h-full relative">
      <svg width={dimensions.width} height={dimensions.height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={scaleY(tick)}
                x2={width}
                y2={scaleY(tick)}
                stroke={isDark ? '#1e293b' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={width + 5}
                y={scaleY(tick) + 4}
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
              >
                {(tick / 1000).toFixed(0)}k
              </text>
            </g>
          ))}
          
          {/* Candlesticks */}
          {data.map((d, i) => {
            const isUp = d.close >= d.open;
            const color = isUp ? '#10b981' : '#ef4444';
            const x = scaleX(i);
            const bodyTop = scaleY(Math.max(d.open, d.close));
            const bodyBottom = scaleY(Math.min(d.open, d.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);
            
            return (
              <g 
                key={i}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ x: rect.left + rect.width / 2, y: rect.top, data: d });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'crosshair' }}
              >
                {/* Hover area */}
                <rect
                  x={x - candleWidth}
                  y={0}
                  width={candleWidth * 2}
                  height={height}
                  fill="transparent"
                />
                {/* Upper wick */}
                <line
                  x1={x}
                  y1={scaleY(d.high)}
                  x2={x}
                  y2={bodyTop}
                  stroke={color}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isUp ? color : color}
                  stroke={color}
                  strokeWidth={1}
                />
                {/* Lower wick */}
                <line
                  x1={x}
                  y1={bodyBottom}
                  x2={x}
                  y2={scaleY(d.low)}
                  stroke={color}
                  strokeWidth={1}
                />
              </g>
            );
          })}
          
          {/* MA20 line */}
          {ma20Points && (
            <path
              d={`M ${ma20Points}`}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          )}
          
          {/* X axis labels */}
          {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i, arr) => {
            const originalIndex = data.indexOf(d);
            return (
              <text
                key={i}
                x={scaleX(originalIndex)}
                y={height + 20}
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontSize={10}
                textAnchor="middle"
              >
                {d.date}
              </text>
            );
          })}
        </g>
      </svg>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className={`absolute z-50 p-3 rounded-lg border shadow-lg pointer-events-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          style={{ 
            left: Math.min(tooltip.x, dimensions.width - 180), 
            top: margin.top + 10,
            transform: 'translateX(-50%)'
          }}
        >
          <p className={`text-xs font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tooltip.data.date}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-500">Mở cửa:</span>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>{tooltip.data.open?.toLocaleString()}</span>
            <span className="text-slate-500">Cao nhất:</span>
            <span className="text-emerald-500">{tooltip.data.high?.toLocaleString()}</span>
            <span className="text-slate-500">Thấp nhất:</span>
            <span className="text-rose-500">{tooltip.data.low?.toLocaleString()}</span>
            <span className="text-slate-500">Đóng cửa:</span>
            <span className={tooltip.data.close >= tooltip.data.open ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
              {tooltip.data.close?.toLocaleString()}
            </span>
            <span className="text-slate-500">KL:</span>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>{(tooltip.data.volume / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- News Data Interface ---
interface NewsItem {
  id: number;
  source: string;
  time: string;
  title: string;
  summary: string;
  sentiment: string;
  aiSummary: string;
  url?: string;
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return '1 ngày trước';
  return `${diffDays} ngày trước`;
}

// --- Sub-Components ---
const AIEarningsInsight = ({ isDark, stockInfo }: { isDark: boolean; stockInfo: StockInfo | null }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'positive' | 'negative'>('overview');
  
  const positivePoints = [
    { title: "Tăng trưởng Doanh thu", desc: "Doanh thu tăng trưởng ổn định, vượt dự báo của giới phân tích.", score: 85 },
    { title: "Biên lợi nhuận cải thiện", desc: "Biên lãi gộp cải thiện nhờ tối ưu hóa chi phí và nâng cao hiệu quả.", score: 78 },
    { title: "Dòng tiền mạnh", desc: "Dòng tiền từ hoạt động kinh doanh dương, đảm bảo khả năng chi trả.", score: 82 }
  ];
  
  const negativePoints = [
    { title: "Rủi ro Tỷ giá", desc: "Biến động tỷ giá có thể ảnh hưởng đến lợi nhuận tài chính ngắn hạn.", risk: 'medium' },
    { title: "Chi phí tăng", desc: "Chi phí đầu tư và vận hành tăng, gây áp lực lên biên lợi nhuận ròng.", risk: 'low' }
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header Card */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/60 dark:to-slate-800/40 rounded-xl border border-indigo-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
              Phân tích AI
              <span className="text-xs font-medium px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                {stockInfo?.symbol || 'N/A'}
              </span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">BCTC Hợp nhất • Biên bản ĐHCD</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Điểm tổng hợp</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">75/100</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
        {[
          { id: 'overview', label: 'Tổng quan', icon: FileSearch },
          { id: 'positive', label: 'Tích cực', icon: ThumbsUp, count: positivePoints.length },
          { id: 'negative', label: 'Rủi ro', icon: ThumbsDown, count: negativePoints.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
            {tab.count && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id 
                  ? tab.id === 'positive' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20 text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{positivePoints.length}</div>
                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase font-medium">Điểm mạnh</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-3 border border-rose-100 dark:border-rose-500/20 text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{negativePoints.length}</div>
                <div className="text-[10px] text-rose-600/70 dark:text-rose-400/70 uppercase font-medium">Rủi ro</div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-500/20 text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">88%</div>
                <div className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 uppercase font-medium">Độ tin cậy</div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Smile size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Nhận định tổng quan</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">Tích cực</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Dựa trên phân tích BCTC và biên bản họp ĐHCD, cổ phiếu {stockInfo?.symbol} có nền tảng cơ bản vững chắc với doanh thu tăng trưởng ổn định. Ban lãnh đạo thể hiện sự tự tin về triển vọng kinh doanh. Khuyến nghị theo dõi diễn biến vĩ mô và các yếu tố rủi ro tỷ giá.
                  </p>
                </div>
              </div>
            </div>

            {/* Top Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Điểm nổi bật</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{positivePoints[0].title}: {positivePoints[0].desc}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cần lưu ý</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{negativePoints[0].title}: {negativePoints[0].desc}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positive' && (
          <div className="space-y-3">
            {positivePoints.map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.score}</span>
                    <span className="text-[10px] text-slate-400">điểm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'negative' && (
          <div className="space-y-3">
            {negativePoints.map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.risk === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                        item.risk === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                      }`}>
                        {item.risk === 'high' ? 'Cao' : item.risk === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} />
            <span>Cập nhật: Hôm nay, 09:30</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
            <FileText size={12} />
            Xem báo cáo đầy đủ
          </button>
        </div>
      </div>
    </div>
  );
};

const StockNewsFeed = ({ data, stockSymbol }: { data: NewsItem[]; stockSymbol: string }) => {
  // Temporarily show maintenance message
  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/40 rounded-xl border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Newspaper size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
              Tin tức
              <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                {stockSymbol}
              </span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Đang cập nhật nguồn tin</p>
          </div>
        </div>
      </div>

      {/* Maintenance Message */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Đang bảo trì</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          Tính năng tin tức đang được nâng cấp để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau!
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-full">
          <Clock size={14} />
          <span>Sẽ sớm hoạt động trở lại</span>
        </div>
      </div>
    </div>
  );
};


const FinancialDetailsModal = ({ isOpen, onClose, isDark, stockInfo }: { isOpen: boolean; onClose: () => void; isDark: boolean; stockInfo: StockInfo | null }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Báo cáo tài chính chi tiết</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stockInfo?.symbol} - {stockInfo?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          <section>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">Kết quả kinh doanh</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 text-xs mb-1">Doanh thu thuần</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">12,480 Tỷ</p>
                <span className="text-emerald-500 text-xs font-bold flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +15.2% YoY</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 text-xs mb-1">Lợi nhuận gộp</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">4,805 Tỷ</p>
                <span className="text-emerald-500 text-xs font-bold flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +12.5% YoY</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 text-xs mb-1">LNST Công ty mẹ</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">1,810 Tỷ</p>
                <span className="text-emerald-500 text-xs font-bold flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +8.4% YoY</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-l-4 border-purple-500 pl-3">Chỉ số hiệu quả</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Biên LN Gộp', value: '38.5%' },
                { label: 'Biên LN Ròng', value: '14.4%' },
                { label: 'ROE', value: '22.5%', highlight: true },
                { label: 'ROA', value: '9.8%' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs">{item.label}</p>
                  <p className={`font-bold text-lg ${item.highlight ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-l-4 border-teal-500 pl-3">Sức khỏe tài chính</h4>
            <div className="space-y-3">
              {[
                { label: 'Tổng tài sản', value: '65,200 Tỷ', percent: 100 },
                { label: 'Nợ / Vốn chủ sở hữu', value: '0.45', percent: 45 },
                { label: 'Chỉ số thanh toán hiện hành', value: '1.5x', percent: 75 }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-white/5">
                  <span className="text-slate-600 dark:text-slate-300 text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${item.percent}%` }}></div>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-medium text-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const SenAIGauge = ({ value, label, color, isDark }: { value: number; label: string; color: string; isDark: boolean }) => {
  const data = [
    { name: 'Value', value: value },
    { name: 'Rest', value: 100 - value }
  ];

  return (
    <div className="flex flex-col items-center justify-end w-full h-full">
      <div className="w-full h-16">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              innerRadius={30}
              outerRadius={45}
              startAngle={180}
              endAngle={0}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              <Cell fill={color} />
              <Cell fill={isDark ? "#1e293b" : "#e2e8f0"} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
    </div>
  );
};

// Mini Sparkline Chart Component (Bloomberg style)
const MiniSparkline = ({ data, color = '#10b981', width = 60, height = 24 }: { 
  data: number[]; 
  color?: string; 
  width?: number; 
  height?: number;
}) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = color === 'auto' ? (isUp ? '#10b981' : '#ef4444') : color;
  
  // Create gradient area
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGradient-${lineColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon 
        points={areaPoints} 
        fill={`url(#sparkGradient-${lineColor})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={lineColor}
        className="animate-pulse"
      />
    </svg>
  );
};

// Gradient Score Ring Component
const GradientScoreRing = ({ 
  score, 
  maxScore = 100, 
  size = 56, 
  strokeWidth = 4,
  label,
  showLabel = true
}: { 
  score: number; 
  maxScore?: number; 
  size?: number; 
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const strokeDashoffset = circumference * (1 - progress);
  
  // Color based on score
  const getColor = () => {
    if (score >= 80) return { start: '#10b981', end: '#059669' }; // Green
    if (score >= 60) return { start: '#22d3ee', end: '#0891b2' }; // Cyan
    if (score >= 40) return { start: '#f59e0b', end: '#d97706' }; // Amber
    return { start: '#ef4444', end: '#dc2626' }; // Red
  };
  
  const colors = getColor();
  // Create unique gradient ID using random suffix
  const gradientId = `scoreGradient-${Math.round(score)}-${label?.replace(/\s/g, '')}-${Math.random().toString(36).substr(2, 5)}`;
  
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(score)}</span>
        </div>
      </div>
      {showLabel && label && (
        <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap">{label}</span>
      )}
    </div>
  );
};

// AI Confidence Meter Component - Gauge with needle
const AIConfidenceMeter = ({ 
  confidence, 
  label = "Độ tin cậy AI",
  size = 120 
}: { 
  confidence: number; 
  label?: string;
  size?: number;
}) => {
  // Clamp confidence between 0-100
  const value = Math.max(0, Math.min(100, confidence));
  // Convert to angle (-135 to 135 degrees, total 270 degrees)
  const angle = -135 + (value / 100) * 270;
  
  const getConfidenceLevel = () => {
    if (value >= 80) return { text: 'Rất cao', color: '#10b981' };
    if (value >= 60) return { text: 'Cao', color: '#22d3ee' };
    if (value >= 40) return { text: 'Trung bình', color: '#f59e0b' };
    if (value >= 20) return { text: 'Thấp', color: '#f97316' };
    return { text: 'Rất thấp', color: '#ef4444' };
  };
  
  const level = getConfidenceLevel();
  const centerX = size / 2;
  const centerY = size / 2 + 10;
  const radius = size / 2 - 15;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.7 }}>
        <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
          <defs>
            {/* Gradient for the arc */}
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc */}
          <path
            d={`M ${centerX - radius * Math.cos(Math.PI * 0.75)} ${centerY - radius * Math.sin(Math.PI * 0.75)} 
                A ${radius} ${radius} 0 1 1 ${centerX + radius * Math.cos(Math.PI * 0.75)} ${centerY - radius * Math.sin(Math.PI * 0.75)}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-700"
          />
          
          {/* Colored arc */}
          <path
            d={`M ${centerX - radius * Math.cos(Math.PI * 0.75)} ${centerY - radius * Math.sin(Math.PI * 0.75)} 
                A ${radius} ${radius} 0 1 1 ${centerX + radius * Math.cos(Math.PI * 0.75)} ${centerY - radius * Math.sin(Math.PI * 0.75)}`}
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = (-135 + (tick / 100) * 270) * (Math.PI / 180);
            const innerR = radius - 12;
            const outerR = radius - 6;
            return (
              <line
                key={tick}
                x1={centerX + innerR * Math.cos(tickAngle)}
                y1={centerY + innerR * Math.sin(tickAngle)}
                x2={centerX + outerR * Math.cos(tickAngle)}
                y2={centerY + outerR * Math.sin(tickAngle)}
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-400 dark:text-slate-500"
              />
            );
          })}
          
          {/* Needle */}
          <g transform={`rotate(${angle}, ${centerX}, ${centerY})`} filter="url(#glow)">
            <polygon
              points={`${centerX},${centerY - radius + 20} ${centerX - 4},${centerY} ${centerX + 4},${centerY}`}
              fill={level.color}
            />
            <circle cx={centerX} cy={centerY} r="6" fill={level.color} />
            <circle cx={centerX} cy={centerY} r="3" fill="white" />
          </g>
        </svg>
        
        {/* Center value */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <span className="text-2xl font-bold" style={{ color: level.color }}>{Math.round(value)}%</span>
        </div>
      </div>
      
      {/* Label and level */}
      <div className="text-center mt-1">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: level.color }}></span>
          <span className="text-xs font-bold" style={{ color: level.color }}>{level.text}</span>
        </div>
      </div>
    </div>
  );
};

// Sector Heatmap Mini Component
const SectorHeatmapMini = ({ currentSector }: { currentSector?: string }) => {
  // Vietnam market sectors with mock performance data
  const sectors = [
    { name: 'Ngân hàng', code: 'BANK', change: 1.2, volume: 85 },
    { name: 'Bất động sản', code: 'BDS', change: -0.8, volume: 72 },
    { name: 'Chứng khoán', code: 'CK', change: 2.5, volume: 90 },
    { name: 'Thép', code: 'STEEL', change: 0.5, volume: 65 },
    { name: 'Dầu khí', code: 'OIL', change: -1.2, volume: 55 },
    { name: 'Công nghệ', code: 'TECH', change: 1.8, volume: 78 },
    { name: 'Bán lẻ', code: 'RETAIL', change: 0.3, volume: 60 },
    { name: 'Thực phẩm', code: 'FOOD', change: -0.2, volume: 45 },
    { name: 'Điện', code: 'POWER', change: 0.8, volume: 50 },
    { name: 'Xây dựng', code: 'BUILD', change: -0.5, volume: 40 },
    { name: 'Vận tải', code: 'TRANS', change: 1.5, volume: 55 },
    { name: 'Hóa chất', code: 'CHEM', change: 0.2, volume: 35 },
  ];
  
  const getHeatColor = (change: number) => {
    if (change >= 2) return 'bg-emerald-500';
    if (change >= 1) return 'bg-emerald-400';
    if (change >= 0.5) return 'bg-emerald-300';
    if (change > 0) return 'bg-emerald-200';
    if (change === 0) return 'bg-slate-300 dark:bg-slate-600';
    if (change > -0.5) return 'bg-rose-200';
    if (change > -1) return 'bg-rose-300';
    if (change > -2) return 'bg-rose-400';
    return 'bg-rose-500';
  };
  
  const getTextColor = (change: number) => {
    if (Math.abs(change) >= 1) return 'text-white';
    return 'text-slate-700 dark:text-slate-200';
  };
  
  return (
    <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bản đồ ngành</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-400">
          <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
          <span>Tăng</span>
          <span className="w-2 h-2 rounded-sm bg-rose-500 ml-1"></span>
          <span>Giảm</span>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="grid grid-cols-4 gap-1">
        {sectors.map((sector) => {
          const isCurrentSector = currentSector?.toLowerCase().includes(sector.name.toLowerCase());
          return (
            <div
              key={sector.code}
              className={`relative p-1.5 rounded-md cursor-pointer transition-all hover:scale-105 ${getHeatColor(sector.change)} ${
                isCurrentSector ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
              }`}
              title={`${sector.name}: ${sector.change >= 0 ? '+' : ''}${sector.change.toFixed(1)}%`}
            >
              <div className={`text-[8px] font-bold truncate ${getTextColor(sector.change)}`}>
                {sector.code}
              </div>
              <div className={`text-[9px] font-medium ${getTextColor(sector.change)}`}>
                {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
              </div>
              {/* Volume indicator */}
              <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-white/50" 
                   style={{ opacity: sector.volume / 100 }}></div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[9px] text-slate-500">
        <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="flex items-center gap-1">
          <Activity size={10} />
          12 ngành
        </span>
      </div>
    </div>
  );
};

// Professional Empty State Components
const EmptyState = ({ 
  type = 'default',
  title,
  description,
  action,
  onAction
}: { 
  type?: 'chart' | 'data' | 'search' | 'error' | 'loading' | 'default';
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) => {
  const configs = {
    chart: {
      icon: (
        <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="7" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="20" cy="10" r="1.5" fill="currentColor"/>
        </svg>
      ),
      defaultTitle: 'Chưa có dữ liệu biểu đồ',
      defaultDesc: 'Dữ liệu giá chưa được tải hoặc không có sẵn cho mã này',
      gradient: 'from-blue-500/10 to-indigo-500/10'
    },
    data: {
      icon: (
        <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
          <circle cx="15" cy="15" r="2" strokeDasharray="2 2"/>
        </svg>
      ),
      defaultTitle: 'Không có dữ liệu',
      defaultDesc: 'Thông tin chưa được cập nhật cho cổ phiếu này',
      gradient: 'from-purple-500/10 to-pink-500/10'
    },
    search: {
      icon: (
        <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M11 8v6M8 11h6" strokeLinecap="round"/>
        </svg>
      ),
      defaultTitle: 'Không tìm thấy kết quả',
      defaultDesc: 'Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại mã cổ phiếu',
      gradient: 'from-amber-500/10 to-orange-500/10'
    },
    error: {
      icon: (
        <svg className="w-16 h-16 text-rose-300 dark:text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
        </svg>
      ),
      defaultTitle: 'Đã xảy ra lỗi',
      defaultDesc: 'Không thể tải dữ liệu. Vui lòng thử lại sau',
      gradient: 'from-rose-500/10 to-red-500/10'
    },
    loading: {
      icon: (
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      ),
      defaultTitle: 'Đang tải dữ liệu',
      defaultDesc: 'Vui lòng đợi trong giây lát...',
      gradient: 'from-indigo-500/10 to-purple-500/10'
    },
    default: {
      icon: (
        <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M12 8v8M8 12h8" strokeLinecap="round" strokeDasharray="2 2"/>
        </svg>
      ),
      defaultTitle: 'Không có nội dung',
      defaultDesc: 'Nội dung sẽ được hiển thị khi có dữ liệu',
      gradient: 'from-slate-500/10 to-slate-600/10'
    }
  };
  
  const config = configs[type];
  
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center bg-gradient-to-br ${config.gradient} rounded-2xl border border-dashed border-slate-300 dark:border-slate-700`}>
      {/* Animated background circles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 animate-pulse"></div>
        <div className="relative z-10">
          {config.icon}
        </div>
      </div>
      
      {/* Title */}
      <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
        {title || config.defaultTitle}
      </h4>
      
      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
        {description || config.defaultDesc}
      </p>
      
      {/* Action button */}
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
        >
          <RefreshCw size={14} />
          {action}
        </button>
      )}
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-2xl"></div>
    </div>
  );
};

// Compact Empty State for smaller areas
const EmptyStateCompact = ({ 
  message = 'Không có dữ liệu',
  icon: Icon = Activity
}: { 
  message?: string;
  icon?: any;
}) => (
  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
      <Icon size={20} className="text-slate-400" />
    </div>
    <span className="text-xs text-slate-500 dark:text-slate-400">{message}</span>
  </div>
);

// Inline Empty State for list items
const EmptyStateInline = ({ message = 'N/A' }: { message?: string }) => (
  <span className="text-slate-400 dark:text-slate-500 italic text-sm">{message}</span>
);

// Top SENAI Price Ticker Component (Real-time scrolling)
const TopSenaiTicker = ({ isDark }: { isDark: boolean }) => {
  const [tickerData, setTickerData] = useState<Array<{
    symbol: string;
    price: number;
    senaiScore: number;
    signal: string;
    rating: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');
  
  useEffect(() => {
    const fetchTopSenai = async () => {
      try {
        const data = await getTopSenaiStocks(10);
        if (data && data.length > 0) {
          // Filter out stocks with 0 price or 0 score
          const validData = data.filter(s => s.current_price > 0 || s.senai_score > 0);
          if (validData.length > 0) {
            setTickerData(validData.map(stock => ({
              symbol: stock.symbol,
              price: stock.current_price || 0,
              senaiScore: stock.senai_score || 0,
              signal: stock.signal || 'THEO DÕI',
              rating: stock.rating || Math.ceil((stock.senai_score || 50) / 20)
            })));
            setDataSource('database');
          } else {
            setFallbackData();
          }
        } else {
          setFallbackData();
        }
      } catch (error) {
        console.error('Error fetching top SENAI stocks:', error);
        setFallbackData();
      } finally {
        setLoading(false);
      }
    };
    
    const setFallbackData = () => {
      // Fallback data if no data available
      setTickerData([
        { symbol: 'FPT', price: 125000, senaiScore: 85, signal: 'MUA MẠNH', rating: 5 },
        { symbol: 'VNM', price: 72500, senaiScore: 78, signal: 'MUA', rating: 4 },
        { symbol: 'VCB', price: 92300, senaiScore: 75, signal: 'MUA', rating: 4 },
        { symbol: 'HPG', price: 25800, senaiScore: 72, signal: 'THEO DÕI', rating: 4 },
        { symbol: 'MSN', price: 78200, senaiScore: 70, signal: 'THEO DÕI', rating: 4 },
        { symbol: 'MWG', price: 52300, senaiScore: 68, signal: 'THEO DÕI', rating: 3 },
        { symbol: 'TCB', price: 24500, senaiScore: 65, signal: 'NẮM GIỮ', rating: 3 },
        { symbol: 'VIC', price: 42100, senaiScore: 62, signal: 'NẮM GIỮ', rating: 3 },
        { symbol: 'VHM', price: 44500, senaiScore: 58, signal: 'THẬN TRỌNG', rating: 3 },
        { symbol: 'VPB', price: 19800, senaiScore: 55, signal: 'THẬN TRỌNG', rating: 3 },
      ]);
      setDataSource('fallback');
    };
    
    fetchTopSenai();
    
    // Refresh every hour
    const interval = setInterval(fetchTopSenai, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Get signal color
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'MUA MẠNH': return 'text-emerald-400 bg-emerald-500/20';
      case 'MUA': return 'text-green-400 bg-green-500/20';
      case 'THEO DÕI': return 'text-cyan-400 bg-cyan-500/20';
      case 'NẮM GIỮ': return 'text-amber-400 bg-amber-500/20';
      case 'THẬN TRỌNG': return 'text-orange-400 bg-orange-500/20';
      case 'BÁN': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };
  
  if (loading) {
    return (
      <div className="w-full overflow-hidden bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full mr-2"></div>
          <span className="text-xs text-slate-400">Đang tải Top SENAI...</span>
        </div>
      </div>
    );
  }
  
  if (tickerData.length === 0) return null;
  
  // Duplicate for seamless loop
  const duplicatedData = [...tickerData, ...tickerData];
  const originalLength = tickerData.length;
  
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950 backdrop-blur-sm border-b border-slate-800">
      {/* Header label */}
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
          <Sparkles size={12} className="animate-pulse" />
          TOP SENAI
          {dataSource === 'database' && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" title="Live data"></span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker">
            {duplicatedData.map((stock, index) => {
              const originalIndex = index % originalLength;
              return (
                <div 
                  key={`${stock.symbol}-${index}`}
                  className="flex items-center gap-2 px-4 py-1.5 border-r border-slate-800/50 whitespace-nowrap hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  {/* Rank badge for top 3 - only show for first set */}
                  {originalIndex < 3 && index < originalLength && (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      originalIndex === 0 ? 'bg-amber-500 text-amber-900' :
                      originalIndex === 1 ? 'bg-slate-400 text-slate-900' :
                      'bg-amber-700 text-amber-100'
                    }`}>
                      {originalIndex + 1}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white">{stock.symbol}</span>
                  {stock.price > 0 && (
                    <span className="text-xs text-slate-400 tabular-nums">
                      {stock.price.toLocaleString()}
                    </span>
                  )}
                  {/* SENAI Score */}
                  <span className={`text-xs font-bold tabular-nums ${getScoreColor(stock.senaiScore)}`}>
                    {stock.senaiScore}
                  </span>
                  {/* Signal badge */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getSignalColor(stock.signal)}`}>
                    {stock.signal}
                  </span>
                  {/* Rating stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div 
                        key={star} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          star <= stock.rating ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: any }) => (
  <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <div>
      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-slate-900 dark:text-white font-bold text-base">{value}</p>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
    {Icon && <Icon size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
  </div>
);

// Animated Metric Card with dynamic icons for Technical Indicators
const AnimatedMetricCard = ({ 
  label, 
  value, 
  sub, 
  status,
  type 
}: { 
  label: string; 
  value: string; 
  sub?: string; 
  status?: 'bullish' | 'bearish' | 'neutral' | 'strong' | 'weak';
  type: 'rs' | 'rsi' | 'ma' | 'macd' | 'volatility' | 'change' | 'volume' | 'position';
}) => {
  // Dynamic icon based on type
  const getIcon = () => {
    switch (type) {
      case 'rs':
        return (
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
            status === 'strong' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' :
            status === 'weak' ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/10' :
            'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10'
          }`}>
            <TrendingUp size={18} className={`${
              status === 'strong' ? 'text-emerald-500 animate-bounce' :
              status === 'weak' ? 'text-rose-500' :
              'text-cyan-500'
            }`} />
            {status === 'strong' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
        );
      case 'rsi':
        return (
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
            status === 'bullish' ? 'bg-gradient-to-br from-rose-500/20 to-orange-500/10' :
            status === 'bearish' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10' :
            'bg-gradient-to-br from-purple-500/20 to-purple-600/10'
          }`}>
            <Activity size={18} className={`${
              status === 'bullish' ? 'text-rose-500 animate-pulse' :
              status === 'bearish' ? 'text-emerald-500 animate-pulse' :
              'text-purple-500'
            }`} />
            <div className={`absolute inset-0 rounded-xl ${
              status === 'bullish' ? 'animate-ping bg-rose-500/10' :
              status === 'bearish' ? 'animate-ping bg-emerald-500/10' : ''
            }`} style={{ animationDuration: '2s' }}></div>
          </div>
        );
      case 'ma':
        return (
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
            status === 'bullish' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' :
            status === 'bearish' ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/10' :
            'bg-gradient-to-br from-blue-500/20 to-blue-600/10'
          }`}>
            <svg className={`w-5 h-5 ${
              status === 'bullish' ? 'text-emerald-500' :
              status === 'bearish' ? 'text-rose-500' :
              'text-blue-500'
            }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17l6-6 4 4 8-8" className={status === 'bullish' ? 'animate-draw-line' : ''} />
              <circle cx="21" cy="7" r="2" className={status === 'bullish' ? 'animate-pulse' : ''} />
            </svg>
          </div>
        );
      case 'macd':
        return (
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
            status === 'bullish' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10' :
            status === 'bearish' ? 'bg-gradient-to-br from-rose-500/20 to-pink-500/10' :
            'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10'
          }`}>
            <BarChart2 size={18} className={`${
              status === 'bullish' ? 'text-emerald-500' :
              status === 'bearish' ? 'text-rose-500' :
              'text-indigo-500'
            }`} />
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${
              status === 'bullish' ? 'bg-emerald-500 animate-expand-width' :
              status === 'bearish' ? 'bg-rose-500 animate-expand-width' :
              'bg-indigo-500/50'
            }`}></div>
          </div>
        );
      case 'volatility':
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
            <Zap size={18} className="text-amber-500 animate-pulse" />
            <div className="absolute inset-0 rounded-xl border-2 border-amber-500/30 animate-ping" style={{ animationDuration: '3s' }}></div>
          </div>
        );
      case 'change':
        return (
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
            status === 'bullish' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' :
            status === 'bearish' ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/10' :
            'bg-gradient-to-br from-slate-500/20 to-slate-600/10'
          }`}>
            <TrendingUp size={18} className={`transition-transform ${
              status === 'bullish' ? 'text-emerald-500 animate-bounce-subtle' :
              status === 'bearish' ? 'text-rose-500 rotate-180' :
              'text-slate-500'
            }`} />
          </div>
        );
      case 'volume':
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center overflow-hidden">
            <BarChart2 size={18} className="text-blue-500" />
            <div className="absolute bottom-0 left-1 right-1 flex items-end justify-around h-4 gap-0.5">
              <div className="w-1 bg-blue-500/60 rounded-t animate-bar-1" style={{ height: '40%' }}></div>
              <div className="w-1 bg-blue-500/60 rounded-t animate-bar-2" style={{ height: '70%' }}></div>
              <div className="w-1 bg-blue-500/60 rounded-t animate-bar-3" style={{ height: '50%' }}></div>
              <div className="w-1 bg-blue-500/60 rounded-t animate-bar-4" style={{ height: '90%' }}></div>
            </div>
          </div>
        );
      case 'position':
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
            <Target size={18} className="text-violet-500" />
            <div className="absolute inset-2 rounded-full border-2 border-violet-500/30 animate-spin-slow"></div>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 flex items-center justify-center">
            <Activity size={18} className="text-slate-500" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.02] hover:shadow-lg">
      <div className="flex-1">
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`font-bold text-base tabular-nums ${
            status === 'bullish' || status === 'strong' ? 'text-emerald-600 dark:text-emerald-400' :
            status === 'bearish' || status === 'weak' ? 'text-rose-600 dark:text-rose-400' :
            'text-slate-900 dark:text-white'
          }`}>{value}</p>
          {sub && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              status === 'bullish' || status === 'strong' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              status === 'bearish' || status === 'weak' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' :
              'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>{sub}</span>
          )}
        </div>
      </div>
      {getIcon()}
    </div>
  );
};

// Mobile Metric Card for bottom sheet
const MobileMetricCard = ({ label, value, color }: { label: string; value: string; color: string }) => {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} rounded-xl p-3 border`}>
      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className={`font-bold text-lg ${colorClasses[color]?.split(' ').pop() || 'text-blue-400'}`}>{value}</p>
    </div>
  );
};

// --- AI Analysis Logic ---
interface AIAlert {
  id: number;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

const analyzeTechnicalSignals = (data: CandlestickData[]): AIAlert[] => {
  if (data.length < 2) return [];
  
  const alerts: AIAlert[] = [];
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  
  // MA20 Crossover
  if (last.ma20 && prev.ma20) {
    if (prev.close < prev.ma20 && last.close > last.ma20) {
      alerts.push({
        id: 1, type: 'success', title: 'Tín hiệu Bứt phá',
        message: 'Giá cắt lên đường MA20, xác nhận xu hướng tăng ngắn hạn.',
        timestamp: 'Vừa xong'
      });
    } else if (prev.close > prev.ma20 && last.close < last.ma20) {
      alerts.push({
        id: 2, type: 'danger', title: 'Cảnh báo Đảo chiều',
        message: 'Giá cắt xuống MA20, áp lực bán gia tăng.',
        timestamp: '10 phút trước'
      });
    }
  }

  // RSI Alerts
  if (last.rsi) {
    if (last.rsi > 70) {
      alerts.push({
        id: 3, type: 'warning', title: 'Vùng Quá mua (RSI)',
        message: `RSI đạt ${Math.round(last.rsi)}, khả năng có nhịp điều chỉnh.`,
        timestamp: '30 phút trước'
      });
    } else if (last.rsi < 30) {
      alerts.push({
        id: 4, type: 'info', title: 'Vùng Quá bán (RSI)',
        message: `RSI về mức ${Math.round(last.rsi)}, cơ hội bắt đáy tiềm năng.`,
        timestamp: '1 giờ trước'
      });
    }
  }

  // Volume Spike
  if (last.volume > 2000000) {
    alerts.push({
      id: 5, type: 'info', title: 'Dòng tiền đột biến',
      message: 'Khối lượng giao dịch tăng vọt so với trung bình.',
      timestamp: 'Hôm nay'
    });
  }

  // Candlestick patterns
  const bodySize = Math.abs(last.close - last.open);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  
  // Hammer pattern (bullish)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
    alerts.push({
      id: 6, type: 'success', title: 'Mẫu hình Búa (Hammer)',
      message: 'Tín hiệu đảo chiều tăng tiềm năng sau xu hướng giảm.',
      timestamp: 'Phiên gần nhất'
    });
  }
  
  // Shooting star (bearish)
  if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5) {
    alerts.push({
      id: 7, type: 'warning', title: 'Mẫu hình Sao Băng',
      message: 'Tín hiệu đảo chiều giảm tiềm năng sau xu hướng tăng.',
      timestamp: 'Phiên gần nhất'
    });
  }

  return alerts;
};

// --- Technical Indicators Calculation ---
interface TechnicalIndicators {
  rsi14: number | null;
  ma20: number | null;
  ma50: number | null;
  macd: number | null;
  macdSignal: number | null;
  rs: number | null; // Relative Strength vs VN-Index
  avgVolume20: number | null;
  priceChange5d: number | null;
  priceChange20d: number | null;
  volatility: number | null;
  pricePosition: number | null; // Position within 52-week range
}

const calculateTechnicalIndicators = (data: CandlestickData[]): TechnicalIndicators => {
  const result: TechnicalIndicators = {
    rsi14: null,
    ma20: null,
    ma50: null,
    macd: null,
    macdSignal: null,
    rs: null,
    avgVolume20: null,
    priceChange5d: null,
    priceChange20d: null,
    volatility: null,
    pricePosition: null,
  };

  if (data.length < 2) return result;

  const closes = data.map(d => d.close);
  const n = closes.length;

  // RSI 14
  if (n >= 15) {
    const changes = [];
    for (let i = 1; i < n; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    const recentChanges = changes.slice(-14);
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
    if (avgLoss === 0) {
      result.rsi14 = 100;
    } else {
      const rs = avgGain / avgLoss;
      result.rsi14 = 100 - (100 / (1 + rs));
    }
  }

  // MA20
  if (n >= 20) {
    result.ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  }

  // MA50
  if (n >= 50) {
    result.ma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
  }

  // MACD (12, 26, 9)
  if (n >= 26) {
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    result.macd = ema12 - ema26;
    
    // Signal line (9-day EMA of MACD) - simplified
    if (n >= 35) {
      const macdLine = [];
      for (let i = 25; i < n; i++) {
        const e12 = calculateEMA(closes.slice(0, i + 1), 12);
        const e26 = calculateEMA(closes.slice(0, i + 1), 26);
        macdLine.push(e12 - e26);
      }
      if (macdLine.length >= 9) {
        result.macdSignal = calculateEMA(macdLine, 9);
      }
    }
  }

  // RS (Relative Strength) - Performance vs benchmark (simplified: 3-month return rank)
  if (n >= 60) {
    const return3m = ((closes[n - 1] - closes[n - 60]) / closes[n - 60]) * 100;
    // RS Score: normalize to 0-100 scale based on typical stock returns
    // Assuming -30% to +50% range maps to 0-100
    result.rs = Math.max(0, Math.min(100, ((return3m + 30) / 80) * 100));
  } else if (n >= 20) {
    const return1m = ((closes[n - 1] - closes[n - 20]) / closes[n - 20]) * 100;
    result.rs = Math.max(0, Math.min(100, ((return1m + 15) / 40) * 100));
  }

  // Average Volume 20
  if (n >= 20) {
    const volumes = data.slice(-20).map(d => d.volume);
    result.avgVolume20 = volumes.reduce((a, b) => a + b, 0) / 20;
  }

  // Price Change 5 days
  if (n >= 5) {
    result.priceChange5d = ((closes[n - 1] - closes[n - 5]) / closes[n - 5]) * 100;
  }

  // Price Change 20 days
  if (n >= 20) {
    result.priceChange20d = ((closes[n - 1] - closes[n - 20]) / closes[n - 20]) * 100;
  }

  // Volatility (20-day standard deviation of returns)
  if (n >= 21) {
    const returns = [];
    for (let i = n - 20; i < n; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    result.volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility %
  }

  // Price Position (within period high-low range)
  if (n > 0) {
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const currentPrice = closes[n - 1];
    if (periodHigh !== periodLow) {
      result.pricePosition = ((currentPrice - periodLow) / (periodHigh - periodLow)) * 100;
    }
  }

  return result;
};

// Helper: Calculate EMA
const calculateEMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1];
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
};

// --- Main Component ---
interface StockAnalysisProps {
  isDark?: boolean;
}

// Làm tròn giá theo bước giá cổ phiếu VN
const roundVNPrice = (price: number): number => {
  if (price >= 10000) {
    return Math.round(price / 100) * 100;
  } else if (price >= 1000) {
    return Math.round(price / 50) * 50;
  } else {
    return Math.round(price / 10) * 10;
  }
};

const StockAnalysis: React.FC<StockAnalysisProps> = ({ isDark = true }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('HPG');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('3M');
  const [viewMode, setViewMode] = useState<'chart' | 'earnings' | 'news'>('chart');
  const [showAlerts, setShowAlerts] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [chartMode, setChartMode] = useState<'advanced' | 'lite'>('advanced'); // Toggle chart mode
  const [newsFilter, setNewsFilter] = useState<
    'all' | 'positive' | 'neutral' | 'negative'
  >('all');

  // Data states
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [simplizeData, setSimplizeData] = useState<SimplizeCompanyData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  // New UI states
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileIndicators, setShowMobileIndicators] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // AI Analysis states
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [tradingStrategy, setTradingStrategy] =
    useState<TradingStrategy | null>(null);
  const [brokerRecommendations, setBrokerRecommendations] = useState<
    BrokerRecommendation[]
  >([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Number keys for tabs
      if (e.key === '1') setViewMode('chart');
      if (e.key === '2') setViewMode('earnings');
      if (e.key === '3') setViewMode('news');
      
      // R for refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) handleRefresh();
      
      // W for watchlist toggle
      if (e.key === 'w') toggleWatchlist();
      
      // F for fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) setIsFullscreen(prev => !prev);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastUpdate(new Date());
    // Trigger re-fetch by updating a dependency
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Watchlist toggle
  const toggleWatchlist = useCallback(() => {
    setIsInWatchlist(prev => !prev);
    // TODO: Save to localStorage or database
  }, []);

  // Listen for stock selection from global search
  useEffect(() => {
    const handleSelectStock = (e: CustomEvent) => {
      setSelectedSymbol(e.detail);
    };
    window.addEventListener('selectStock', handleSelectStock as EventListener);
    return () =>
      window.removeEventListener('selectStock', handleSelectStock as EventListener);
  }, []);

  // Fetch AI Analysis data when symbol changes
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        // Fetch data from database first
        const [dbAi, dbRisk, dbStrategy, brokers, simplize, technicals, priceData] = await Promise.all([
          getAIAnalysis(selectedSymbol),
          getRiskAnalysis(selectedSymbol),
          getTradingStrategy(selectedSymbol),
          getBrokerRecommendations(selectedSymbol),
          getSimplizeCompanyData(selectedSymbol),
          getTechnicalIndicators(selectedSymbol),
          getStockPrices(selectedSymbol, 252), // 1 year data for calculations
        ]);

        setBrokerRecommendations(brokers);
        setSimplizeData(simplize);

        // If no database data, calculate realtime using SenAI formulas
        if (!dbAi || !dbRisk || !dbStrategy) {
          // Prepare input data for SenAI calculations
          const prices = priceData.map(p => p.close_price);
          const highs = priceData.map(p => p.high_price);
          const lows = priceData.map(p => p.low_price);
          const volumes = priceData.map(p => p.volume);

          if (prices.length >= 50) {
            const currentPrice = prices[0];
            const prevPrice = prices[1] || currentPrice;
            
            // Calculate MAs
            const ma20 = prices.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
            const ma50 = prices.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
            const ma200 = prices.length >= 200 
              ? prices.slice(0, 200).reduce((a, b) => a + b, 0) / 200 
              : ma50;

            // Calculate RSI
            let gains = 0, losses = 0;
            for (let i = 0; i < 14 && i < prices.length - 1; i++) {
              const change = prices[i] - prices[i + 1];
              if (change > 0) gains += change;
              else losses -= change;
            }
            const rs = (gains / 14) / ((losses / 14) || 0.001);
            const rsi14 = 100 - (100 / (1 + rs));

            // Calculate price position in 52w range
            const high52w = Math.max(...prices);
            const low52w = Math.min(...prices);
            const pricePosition = ((currentPrice - low52w) / (high52w - low52w)) * 100;

            // Calculate volatility
            const returns: number[] = [];
            for (let i = 0; i < 19 && i < prices.length - 1; i++) {
              returns.push((prices[i] - prices[i + 1]) / prices[i + 1]);
            }
            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
            const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

            // Calculate max drawdown
            let maxPrice = prices[prices.length - 1];
            let maxDrawdown = 0;
            for (let i = prices.length - 1; i >= 0; i--) {
              if (prices[i] > maxPrice) maxPrice = prices[i];
              const drawdown = (maxPrice - prices[i]) / maxPrice * 100;
              if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }

            // Calculate support/resistance
            const recentLows = lows.slice(0, 20).sort((a, b) => a - b);
            const recentHighs = highs.slice(0, 20).sort((a, b) => b - a);
            const supports = recentLows.filter(l => l < currentPrice);
            const resistances = recentHighs.filter(h => h > currentPrice);
            const support1 = supports[0] || currentPrice * 0.95;
            const support2 = supports[Math.floor(supports.length / 2)] || currentPrice * 0.90;
            const resistance1 = resistances[0] || currentPrice * 1.05;
            const resistance2 = resistances[Math.floor(resistances.length / 2)] || currentPrice * 1.10;

            // Average volume
            const avgVolume = volumes.slice(0, 20).reduce((a, b) => a + b, 0) / 20;

            // Build SenAI input
            const senaiInput: SenAIInput = {
              symbol: selectedSymbol,
              currentPrice,
              priceChangePercent: ((currentPrice - prevPrice) / prevPrice) * 100,
              ma20,
              ma50,
              ma200,
              rsi14,
              pricePosition,
              pe: simplize?.pe_ratio || technicals?.current_price ? (currentPrice / (simplize?.eps || 1)) : 0,
              pb: simplize?.pb_ratio || 0,
              roe: simplize?.roe || 0,
              volume: volumes[0] || 0,
              avgVolume,
              macd: technicals?.macd,
              macdSignal: technicals?.macd_signal,
            };

            // Calculate SenAI metrics
            const diagnosis = calculateSenAIDiagnosis(senaiInput);
            const risk = calculateSenAIRisk(senaiInput, volatility, maxDrawdown);
            const strategy = calculateSenAIStrategy(senaiInput, support1, support2, resistance1, resistance2);

            // Set calculated values if no database data
            if (!dbAi) {
              setAIAnalysis({
                id: 0,
                symbol: selectedSymbol,
                analysis_date: new Date().toISOString().split('T')[0],
                rating: diagnosis.rating,
                score: diagnosis.score,
                signal: diagnosis.signal,
                recommendation: diagnosis.recommendation,
                confidence: diagnosis.confidence,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } else {
              setAIAnalysis(dbAi);
            }

            if (!dbRisk) {
              setRiskAnalysis({
                id: 0,
                symbol: selectedSymbol,
                analysis_date: new Date().toISOString().split('T')[0],
                optimal_holding_days: risk.optimalHoldingDays,
                upside_probability: risk.upsideProbability,
                downside_risk: risk.downsideRisk,
                volatility: risk.volatility,
                beta: risk.beta,
                sharpe_ratio: 0,
                max_drawdown: maxDrawdown,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } else {
              setRiskAnalysis(dbRisk);
            }

            if (!dbStrategy) {
              setTradingStrategy({
                id: 0,
                symbol: selectedSymbol,
                analysis_date: new Date().toISOString().split('T')[0],
                buy_zone_low: strategy.buyZoneLow,
                buy_zone_high: strategy.buyZoneHigh,
                stop_loss: strategy.stopLoss,
                target_1: strategy.target1,
                target_2: strategy.target2,
                target_3: strategy.target3,
                support_1: support1,
                support_2: support2,
                resistance_1: resistance1,
                resistance_2: resistance2,
                strategy_type: strategy.strategyType,
                strategy_note: strategy.strategyNote,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            } else {
              setTradingStrategy(dbStrategy);
            }
          } else {
            // Not enough data, use database values or null
            setAIAnalysis(dbAi);
            setRiskAnalysis(dbRisk);
            setTradingStrategy(dbStrategy);
          }
        } else {
          // Use database values
          setAIAnalysis(dbAi);
          setRiskAnalysis(dbRisk);
          setTradingStrategy(dbStrategy);
        }
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      }
    };
    fetchAnalysisData();
  }, [selectedSymbol]);

  // Fetch companies list
  useEffect(() => {
    const fetchCompanies = async () => {
      const data = await getVN100Companies();
      setCompanies(data);
    };
    fetchCompanies();
  }, []);

  // Fetch news when symbol changes
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const news = await getStockNews(selectedSymbol, 10);
        const formattedNews: NewsItem[] = news.map(n => ({
          id: n.id,
          source: n.source,
          time: formatTimeAgo(n.published_at),
          title: n.title,
          summary: n.summary,
          sentiment: n.sentiment,
          aiSummary: n.ai_summary,
          url: n.url
        }));
        setNewsData(formattedNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsData([]);
      }
    };
    fetchNews();
  }, [selectedSymbol]);

  // Search companies
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    
    setSearchLoading(true);
    const search = async () => {
      try {
        const results = await searchCompanies(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    
    // Debounce search
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch stock data when symbol changes
  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      try {
        // Get company info
        const company = await getCompanyBySymbol(selectedSymbol);
        
        // Get realtime price from Simplize (database + API fallback)
        const simplizePrice = await getSimplizePrice(selectedSymbol);
        
        // Get price history from database (VCI service)
        const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : timeframe === '2Y' ? 730 : 60;
        let vciData = await getChartData(selectedSymbol, days);
        
        console.log(`[Chart] ${selectedSymbol}: DB data ${vciData.length} candles, last: ${vciData[vciData.length - 1]?.date}`);
        console.log(`[Chart] Simplize price:`, simplizePrice);
        
        // Add today's candle from Simplize if not in database yet
        if (vciData.length > 0 && simplizePrice && simplizePrice.price > 0) {
          const lastCandle = vciData[vciData.length - 1];
          const today = new Date().toISOString().split('T')[0];
          
          console.log(`[Chart] Last candle date: ${lastCandle.date}, Today: ${today}`);
          
          // Add today's candle if database doesn't have it yet
          if (lastCandle.date !== today) {
            console.log(`[Chart] Adding today's candle from Simplize: O=${simplizePrice.open} H=${simplizePrice.high} L=${simplizePrice.low} C=${simplizePrice.price}`);
            vciData = [...vciData, {
              date: today,
              open: simplizePrice.open || simplizePrice.reference || lastCandle.close,
              high: simplizePrice.high || simplizePrice.price,
              low: simplizePrice.low || simplizePrice.price,
              close: simplizePrice.price,
              volume: simplizePrice.volume || 0
            }];
          }
        }
        
        if (vciData.length > 0) {
          // Use Simplize price as current price (most up-to-date)
          const currentPrice = simplizePrice?.price || vciData[vciData.length - 1].close;
          const prevPrice = vciData.length > 1 ? vciData[vciData.length - 2].close : vciData[vciData.length - 1].open;
          const change = simplizePrice?.change || (currentPrice - prevPrice);
          const changePercent = simplizePrice?.changePercent || (prevPrice > 0 ? (change / prevPrice) * 100 : 0);
          
          setStockInfo({
            symbol: selectedSymbol,
            name: company?.company_name || selectedSymbol,
            price: currentPrice,
            change: change,
            changePercent: Math.round(changePercent * 100) / 100,
            volume: simplizePrice?.volume || vciData[vciData.length - 1].volume,
            marketCap: company?.outstanding_shares 
              ? company.outstanding_shares * currentPrice 
              : undefined
          });
          
          // Convert VCI data to candlestick format with indicators
          const candleData: CandlestickData[] = vciData.map((p, index, arr) => {
            // Calculate MA20
            let ma20 = undefined;
            if (index >= 19) {
              const sum = arr.slice(index - 19, index + 1).reduce((acc, item) => acc + item.close, 0);
              ma20 = sum / 20;
            }
            
            // Calculate RSI
            let rsi = undefined;
            if (index >= 14) {
              const changes = arr.slice(index - 13, index + 1).map((item, i, a) => 
                i > 0 ? item.close - a[i-1].close : 0
              );
              const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / 14;
              const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / 14;
              rsi = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
            }
            
            return {
              date: p.date, // Keep YYYY-MM-DD format for chart
              open: p.open,
              high: p.high,
              low: p.low,
              close: p.close,
              volume: p.volume,
              ma20,
              rsi
            };
          });
          
          setChartData(candleData);
        } else {
          // Fallback to database if VCI fails
          const prices = await getStockPrices(selectedSymbol, days);
          
          if (prices.length > 0) {
            const currentPrice = simplizePrice?.price || prices[0].close_price;
            const prevPrice = prices[1]?.close_price || prices[0].close_price;
            const change = simplizePrice?.change || (currentPrice - prevPrice);
            const changePercent = simplizePrice?.changePercent || (prevPrice > 0 ? (change / prevPrice) * 100 : 0);
            
            setStockInfo({
              symbol: selectedSymbol,
              name: company?.company_name || selectedSymbol,
              price: currentPrice,
              change: change,
              changePercent: Math.round(changePercent * 100) / 100,
              volume: simplizePrice?.volume || prices[0].volume,
              marketCap: company?.outstanding_shares 
                ? company.outstanding_shares * currentPrice 
                : undefined
            });
            
            const candleData: CandlestickData[] = prices
              .slice()
              .reverse()
              .map((p, index, arr) => {
                let ma20 = undefined;
                if (index >= 19) {
                  const sum = arr.slice(index - 19, index + 1).reduce((acc, item) => acc + item.close_price, 0);
                  ma20 = sum / 20;
                }
                
                let rsi = undefined;
                if (index >= 14) {
                  const changes = arr.slice(index - 13, index + 1).map((item, i, a) => 
                    i > 0 ? item.close_price - a[i-1].close_price : 0
                  );
                  const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / 14;
                  const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / 14;
                  rsi = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
                }
                
                return {
                  date: new Date(p.trading_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                  open: p.open_price,
                  high: p.high_price,
                  low: p.low_price,
                  close: p.close_price,
                  volume: p.volume,
                  ma20,
                  rsi
                };
              });
            
            setChartData(candleData);
          } else {
            // No data at all
            setStockInfo({
              symbol: selectedSymbol,
              name: company?.company_name || selectedSymbol,
              price: simplizePrice?.price || 0,
              change: simplizePrice?.change || 0,
              changePercent: simplizePrice?.changePercent || 0,
              volume: simplizePrice?.volume || 0
            });
            setChartData([]);
          }
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
        setLastUpdate(new Date());
      }
    };
    
    fetchStockData();
    
    // Auto-refresh every 15 minutes during market hours (9:00 - 15:00)
    const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
    
    const shouldAutoRefresh = () => {
      if (!isAutoRefresh) return false;
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      // Only refresh on weekdays (Mon-Fri) during market hours (9:00 - 15:00)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 15;
    };
    
    const intervalId = setInterval(() => {
      if (shouldAutoRefresh()) {
        console.log(`[Auto-refresh] Updating ${selectedSymbol} at ${new Date().toLocaleTimeString()}`);
        fetchStockData();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [selectedSymbol, timeframe, isAutoRefresh]);

  // AI Alerts - GPT powered
  const [aiAlerts, setAiAlerts] = useState<AISignal[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch AI signals when stock data changes
  useEffect(() => {
    const fetchAISignals = async () => {
      if (chartData.length < 5 || !stockInfo) return;
      
      setAiLoading(true);
      try {
        const last = chartData[chartData.length - 1];
        const prev = chartData[chartData.length - 2];
        
        const signals = await analyzeStockWithGPT({
          symbol: selectedSymbol,
          currentPrice: last.close,
          priceChange: last.close - prev.close,
          priceChangePercent: ((last.close - prev.close) / prev.close) * 100,
          volume: last.volume,
          high: last.high,
          low: last.low,
          open: last.open,
          ma20: last.ma20,
          rsi: last.rsi,
          recentPrices: chartData.slice(-10).map(d => ({
            date: d.date,
            close: d.close,
            volume: d.volume
          }))
        });
        
        setAiAlerts(signals);
      } catch (error) {
        console.error('Error fetching AI signals:', error);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAISignals();
  }, [chartData, stockInfo, selectedSymbol]);
  
  // Technical Indicators - calculated from chart data
  const techIndicators = useMemo(() => calculateTechnicalIndicators(chartData), [chartData]);
  
  // Filtered news from database
  const filteredNews = newsData.filter(item => newsFilter === 'all' || item.sentiment === newsFilter);

  // Broker data
  const brokerData = [
    { date: '06/06/25', firm: 'HSC', action: 'Nắm giữ', price: '40.6', color: 'text-amber-500', reason: 'Duy trì khuyến nghị nắm giữ.' },
    { date: '23/04/25', firm: 'FSC', action: 'Nắm giữ', price: '35.0', color: 'text-amber-500', reason: 'Định giá hợp lý.' },
    { date: '24/01/25', firm: 'VCSC', action: 'Mua', price: '33.8', color: 'text-emerald-500', reason: 'Triển vọng tăng trưởng tốt.' },
    { date: '18/12/24', firm: 'SSI', action: 'Mua', price: '33.8', color: 'text-emerald-500', reason: 'KQKD dự kiến tích cực.' },
  ];

  const selectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle keyboard navigation for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      selectStock(searchResults[0].symbol);
    }
  };


  return (
    <div className={`animate-fade-in-up space-y-4 pb-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-auto p-4' : ''}`}>
      
      {/* TOP SENAI PRICE TICKER - Bloomberg style */}
      <div className="rounded-xl overflow-hidden shadow-lg -mx-2 sm:mx-0">
        <TopSenaiTicker isDark={isDark} />
      </div>
      
      {/* SECTION 1: HEADER & STOCK SELECTOR - Sticky on scroll */}
      <div className="glass-panel p-3 rounded-2xl border-b border-indigo-200 dark:border-indigo-500/20 sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Stock Selector */}
          <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
            {/* Stock Logo */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              <img 
                src={`https://finance.vietstock.vn/image/${selectedSymbol}`}
                alt={selectedSymbol}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-lg sm:text-xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">${selectedSymbol.slice(0, 3)}</span>`;
                }}
              />
            </div>
            
            {/* Stock Info with Mini Sparkline */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {(stockInfo?.price || 0).toLocaleString('vi-VN')}
                    </h1>
                    <span className="text-xs sm:text-sm font-normal text-slate-500">VND</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs sm:text-sm flex items-center gap-1 ${
                      (stockInfo?.changePercent || 0) >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10' 
                        : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10'
                    }`}>
                      <TrendingUp size={12} className={(stockInfo?.changePercent || 0) < 0 ? 'rotate-180' : ''} />
                      {(stockInfo?.changePercent || 0) > 0 ? '+' : ''}{stockInfo?.changePercent?.toFixed(2)}%
                    </span>
                    {/* Mini Sparkline Chart - 7 day trend */}
                    <div className="hidden sm:flex items-center gap-1 ml-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <MiniSparkline 
                        data={chartData.slice(-7).map(d => d.close)} 
                        color="auto"
                        width={50}
                        height={20}
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">7D</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedSymbol}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline truncate">{stockInfo?.name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons - Mobile & Desktop */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Watchlist Button */}
              <button
                onClick={toggleWatchlist}
                className={`p-2 rounded-lg transition-all ${
                  isInWatchlist 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500'
                }`}
                title="Thêm vào Watchlist (W)"
              >
                <Star size={18} className={isInWatchlist ? 'fill-current' : ''} />
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all disabled:opacity-50"
                title="Làm mới (R)"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              
              {/* Fullscreen Button - Desktop only */}
              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                className="hidden sm:block p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all"
                title="Toàn màn hình (F)"
              >
                <Maximize2 size={18} />
              </button>
              
              {/* Mobile Indicators Toggle */}
              <button
                onClick={() => setShowMobileIndicators(prev => !prev)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all"
                title="Chỉ số kỹ thuật"
              >
                <Activity size={18} />
              </button>
            </div>
          </div>

          {/* Quick Stats - Desktop only - Enhanced with mini charts */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Volume with mini bar chart */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-500/20">
              <div className="flex flex-col items-center">
                <div className="flex items-end gap-0.5 h-4">
                  {[40, 60, 45, 80, 55, 70, 90].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-blue-500 rounded-t opacity-60 hover:opacity-100 transition-opacity"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">KL</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {stockInfo?.volume ? `${(stockInfo.volume / 1000000).toFixed(2)}M` : '--'}
                </span>
              </div>
            </div>
            {/* Market Cap with trend */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-500/20">
              <Layers size={14} className="text-purple-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold">Vốn hóa</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {simplizeData?.market_cap ? `${(simplizeData.market_cap / 1000000000000).toFixed(1)}T` : '--'}
                </span>
              </div>
            </div>
            {/* P/E with indicator */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-500/20">
              <div className="relative">
                <Activity size={14} className="text-emerald-500" />
                {simplizeData?.pe_ratio && simplizeData.pe_ratio < 15 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">P/E</span>
                <span className={`text-xs font-bold tabular-nums ${
                  simplizeData?.pe_ratio && simplizeData.pe_ratio < 15 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.pe_ratio?.toFixed(1) || '--'}
                </span>
              </div>
            </div>
            {/* Last Update with live indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Clock size={10} />
              <span>{lastUpdate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Technical Indicators */}
      {showMobileIndicators && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 animate-slide-up">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-700 max-h-[70vh] overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-500" />
                <span className="font-bold text-slate-900 dark:text-white">Chỉ số PTKT</span>
              </div>
              <button 
                onClick={() => setShowMobileIndicators(false)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)] grid grid-cols-2 gap-3">
              <MobileMetricCard label="RS Rating" value={techIndicators.rs !== null ? Math.round(techIndicators.rs).toString() : 'N/A'} color="cyan" />
              <MobileMetricCard label="RSI (14)" value={techIndicators.rsi14 !== null ? Math.round(techIndicators.rsi14).toString() : 'N/A'} color="purple" />
              <MobileMetricCard label="MA20" value={techIndicators.ma20 !== null ? Math.round(techIndicators.ma20).toLocaleString() : 'N/A'} color="blue" />
              <MobileMetricCard label="MACD" value={techIndicators.macd !== null ? techIndicators.macd.toFixed(0) : 'N/A'} color="emerald" />
              <MobileMetricCard label="Biến động" value={techIndicators.volatility !== null ? `${techIndicators.volatility.toFixed(1)}%` : 'N/A'} color="amber" />
              <MobileMetricCard label="Vị thế giá" value={techIndicators.pricePosition !== null ? `${Math.round(techIndicators.pricePosition)}%` : 'N/A'} color="rose" />
            </div>
          </div>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 -z-10"
            onClick={() => setShowMobileIndicators(false)}
          ></div>
        </div>
      )}

      {/* SECTION 2: CANDLESTICK CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Chart - Full width on mobile, 9 cols on desktop */}
        <div className="lg:col-span-9 glass-panel p-0 rounded-2xl flex flex-col h-[450px] sm:h-[500px] lg:h-[600px] border border-slate-200 dark:border-white/5 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-slate-200 dark:border-white/5 z-10 relative bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-md gap-2 sm:gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto shadow-inner w-full sm:w-auto">
              {[
                { id: 'chart', label: 'Biểu đồ', icon: BarChart2 },
                { id: 'earnings', label: 'AI Insight', icon: Sparkles },
                { id: 'news', label: 'Tin tức', icon: Newspaper }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as any)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    viewMode === mode.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                  }`}
                >
                  <mode.icon size={14} /> {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {viewMode === 'chart' && (
                <>
                  {/* Chart Mode Toggle */}
                  <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
                    <button
                      onClick={() => setChartMode('lite')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                        chartMode === 'lite' 
                          ? 'bg-cyan-500 text-white shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                      }`}
                    >
                      ⚡ Lite
                    </button>
                    <button
                      onClick={() => setChartMode('advanced')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                        chartMode === 'advanced' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                      }`}
                    >
                      🎯 Pro
                    </button>
                  </div>

                  {/* AI Monitor Toggle */}
                  <button
                    onClick={() => setShowAlerts(!showAlerts)}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      showAlerts
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
                    }`}
                  >
                    <Zap size={12} className={showAlerts ? "fill-current" : ""} />
                    AI Monitor {showAlerts ? 'ON' : 'OFF'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 w-full min-h-0 relative flex flex-col p-0 bg-slate-50 dark:bg-[#0b0f19]/20">
            {viewMode === 'chart' ? (
              loading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <EmptyState 
                    type="loading" 
                    title="Đang tải biểu đồ"
                    description={`Đang lấy dữ liệu giá cho ${selectedSymbol}...`}
                  />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <EmptyState 
                    type="chart" 
                    title={`Chưa có dữ liệu ${selectedSymbol}`}
                    description="Dữ liệu giá chưa được đồng bộ hoặc mã cổ phiếu không hợp lệ"
                    action="Thử lại"
                    onAction={handleRefresh}
                  />
                </div>
              ) : (
                <>
                  {/* Chart Component */}
                  <div className="flex-1 min-h-0 h-full">
                    {chartMode === 'lite' ? (
                      <LightweightChart 
                        data={chartData.map(d => ({
                          time: d.date,
                          date: new Date(d.date),
                          open: d.open,
                          high: d.high,
                          low: d.low,
                          close: d.close,
                          volume: d.volume
                        }))}
                        symbol={selectedSymbol}
                        isDark={isDark}
                        height={520}
                        currentTimeframe={timeframe}
                        onTimeframeChange={(tf) => setTimeframe(tf)}
                        onSymbolClick={() => setShowSearch(true)}
                        tradingZones={tradingStrategy ? {
                          buyZoneLow: tradingStrategy.buy_zone_low || 0,
                          buyZoneHigh: tradingStrategy.buy_zone_high || 0,
                          stopLoss: tradingStrategy.stop_loss || 0,
                          target1: tradingStrategy.target_1 || 0,
                          target2: tradingStrategy.target_2 || 0,
                          target3: tradingStrategy.target_3 || 0
                        } : undefined}
                      />
                    ) : (
                      <TradingViewChart 
                        data={chartData.map(d => ({
                          time: d.date,
                          date: new Date(d.date),
                          open: d.open,
                          high: d.high,
                          low: d.low,
                          close: d.close,
                          volume: d.volume
                        }))}
                        symbol={selectedSymbol}
                        isDark={isDark}
                        height={520}
                        showVolume={true}
                        showMA={true}
                        currentTimeframe={timeframe}
                        onTimeframeChange={(tf) => setTimeframe(tf)}
                      />
                    )}
                  </div>

                  {/* AI Alerts Overlay - GPT Powered */}
                  {showAlerts && (
                    <div className="absolute top-4 right-4 md:w-72 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                      <div className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/50 dark:to-purple-900/50 p-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tín hiệu AI</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold">GPT</span>
                        </div>
                        {aiLoading ? (
                          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        ) : (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {aiLoading ? (
                          <div className="p-4 text-center">
                            <div className="text-xs text-slate-500">Đang phân tích với AI...</div>
                          </div>
                        ) : aiAlerts.length > 0 ? (
                          aiAlerts.map((alert) => (
                            <div key={alert.id} className="p-3 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                  alert.type === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  alert.type === 'danger' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                }`}>
                                  {alert.title}
                                </span>
                                <div className="flex items-center gap-1">
                                  {alert.confidence && (
                                    <span className="text-[8px] text-slate-400">{Math.round(alert.confidence * 100)}%</span>
                                  )}
                                  <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{alert.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <div className="text-xs text-slate-500">Chưa có tín hiệu mới</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : viewMode === 'earnings' ? (
              <div className="p-4 h-full overflow-auto">
                <AIStockInsight 
                  symbol={selectedSymbol} 
                  isDark={isDark}
                />
              </div>
            ) : (
              <div className="p-4 h-full overflow-auto">
                <StockNewsFeed data={newsData} stockSymbol={selectedSymbol} />
              </div>
            )}
          </div>
        </div>


        {/* Right Sidebar - Fundamentals - Hidden on mobile, shown on lg */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-2 h-[600px]">
          <div className="flex items-center gap-2 text-sm text-slate-500 px-1 shrink-0">
            <Activity size={16} className="text-cyan-500" />
            <span className="font-medium text-slate-900 dark:text-white">Chỉ số PTKT</span>
          </div>
          
          {/* Scrollable Technical Indicators */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <AnimatedMetricCard 
              label="RS Rating" 
              value={techIndicators.rs !== null ? Math.round(techIndicators.rs).toString() : 'N/A'} 
              sub={techIndicators.rs !== null 
                ? (techIndicators.rs >= 80 ? 'Rất mạnh' : techIndicators.rs >= 60 ? 'Mạnh' : techIndicators.rs >= 40 ? 'Trung bình' : 'Yếu')
                : undefined}
              status={techIndicators.rs !== null 
                ? (techIndicators.rs >= 70 ? 'strong' : techIndicators.rs < 40 ? 'weak' : 'neutral')
                : undefined}
              type="rs"
            />
            <AnimatedMetricCard 
              label="RSI (14)" 
              value={techIndicators.rsi14 !== null ? Math.round(techIndicators.rsi14).toString() : 'N/A'} 
              sub={techIndicators.rsi14 !== null 
                ? (techIndicators.rsi14 > 70 ? 'Quá mua' : techIndicators.rsi14 < 30 ? 'Quá bán' : 'Trung tính')
                : undefined}
              status={techIndicators.rsi14 !== null 
                ? (techIndicators.rsi14 > 70 ? 'bullish' : techIndicators.rsi14 < 30 ? 'bearish' : 'neutral')
                : undefined}
              type="rsi"
            />
            <AnimatedMetricCard 
              label="MA20" 
              value={techIndicators.ma20 !== null ? Math.round(techIndicators.ma20).toLocaleString('vi-VN') : 'N/A'} 
              sub={techIndicators.ma20 !== null && stockInfo
                ? (stockInfo.price > techIndicators.ma20 ? '↑ Trên MA' : '↓ Dưới MA')
                : undefined}
              status={techIndicators.ma20 !== null && stockInfo
                ? (stockInfo.price > techIndicators.ma20 ? 'bullish' : 'bearish')
                : undefined}
              type="ma"
            />
            <AnimatedMetricCard 
              label="MACD" 
              value={techIndicators.macd !== null ? techIndicators.macd.toFixed(0) : 'N/A'} 
              sub={techIndicators.macd !== null && techIndicators.macdSignal !== null
                ? (techIndicators.macd > techIndicators.macdSignal ? '↑ Bullish' : '↓ Bearish')
                : undefined}
              status={techIndicators.macd !== null && techIndicators.macdSignal !== null
                ? (techIndicators.macd > techIndicators.macdSignal ? 'bullish' : 'bearish')
                : undefined}
              type="macd"
            />
            <AnimatedMetricCard 
              label="Biến động" 
              value={techIndicators.volatility !== null ? `${techIndicators.volatility.toFixed(1)}%` : 'N/A'} 
              sub="Năm hóa"
              type="volatility"
            />
            <AnimatedMetricCard 
              label="Thay đổi 5D" 
              value={techIndicators.priceChange5d !== null 
                ? `${techIndicators.priceChange5d >= 0 ? '+' : ''}${techIndicators.priceChange5d.toFixed(1)}%` 
                : 'N/A'} 
              status={techIndicators.priceChange5d !== null 
                ? (techIndicators.priceChange5d > 0 ? 'bullish' : techIndicators.priceChange5d < 0 ? 'bearish' : 'neutral')
                : undefined}
              type="change"
            />
            <AnimatedMetricCard 
              label="KL TB 20" 
              value={techIndicators.avgVolume20 !== null 
                ? `${(techIndicators.avgVolume20 / 1000000).toFixed(2)}M` 
                : 'N/A'} 
              type="volume"
            />
            <AnimatedMetricCard 
              label="Vị thế giá" 
              value={techIndicators.pricePosition !== null 
                ? `${Math.round(techIndicators.pricePosition)}%` 
                : 'N/A'} 
              sub="Trong biên độ"
              type="position"
            />
            
            {/* AI Confidence Meter */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <AIConfidenceMeter 
                confidence={
                  aiAlerts[0]?.confidence 
                    ? aiAlerts[0].confidence * 100 
                    : aiAnalysis?.confidence || 75
                }
                label="Độ tin cậy AI"
                size={100}
              />
            </div>
            
            {/* Sector Heatmap Mini */}
            <div className="mt-3">
              <SectorHeatmapMini currentSector={simplizeData?.industry} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2.5: THÔNG TIN CƠ BẢN CỔ PHIẾU */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin cơ bản</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng quan về cổ phiếu {selectedSymbol}</p>
            </div>
          </div>
          {/* Simplize Scores - Gradient Score Rings in horizontal row */}
          {simplizeData && (
            <div className="hidden md:flex flex-row items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
              <GradientScoreRing 
                score={(simplizeData.valuation_point || 0) * 20} 
                label="Định giá" 
                size={56}
                strokeWidth={5}
              />
              <GradientScoreRing 
                score={(simplizeData.growth_point || 0) * 20} 
                label="Tăng trưởng" 
                size={56}
                strokeWidth={5}
              />
              <GradientScoreRing 
                score={(simplizeData.performance_point || 0) * 20} 
                label="Hiệu suất" 
                size={56}
                strokeWidth={5}
              />
              <GradientScoreRing 
                score={(simplizeData.financial_health_point || 0) * 20} 
                label="Sức khỏe" 
                size={56}
                strokeWidth={5}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Thông tin công ty */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Globe size={16} className="text-blue-500" />
              Thông tin công ty
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tên công ty</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium text-right max-w-[60%]">
                  {simplizeData?.name_vi || stockInfo?.name || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Mã CK</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{selectedSymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Sàn giao dịch</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium">
                  {simplizeData?.stock_exchange || companies.find(c => c.symbol === selectedSymbol)?.exchange || 'HOSE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Ngành</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium text-right max-w-[60%]">
                  {simplizeData?.industry || companies.find(c => c.symbol === selectedSymbol)?.industry || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Lĩnh vực</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium text-right max-w-[60%]">
                  {simplizeData?.sector || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">CP lưu hành</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium">
                  {simplizeData?.outstanding_shares 
                    ? `${(simplizeData.outstanding_shares / 1000000).toFixed(0)}M`
                    : companies.find(c => c.symbol === selectedSymbol)?.outstanding_shares 
                      ? `${(companies.find(c => c.symbol === selectedSymbol)!.outstanding_shares! / 1000000).toFixed(0)}M`
                      : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Free Float</span>
                <span className="text-xs text-slate-900 dark:text-white font-medium">
                  {simplizeData?.free_float_rate ? `${simplizeData.free_float_rate.toFixed(1)}%` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Chỉ số định giá */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-purple-500" />
              Chỉ số định giá
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Vốn hóa</span>
                <span className="text-sm text-slate-900 dark:text-white font-bold">
                  {simplizeData?.market_cap 
                    ? `${(simplizeData.market_cap / 1000000000000).toFixed(2)}T`
                    : stockInfo?.marketCap 
                      ? `${(stockInfo.marketCap / 1000000000000).toFixed(2)}T`
                      : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">P/E</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 dark:text-white font-bold">
                    {simplizeData?.pe_ratio?.toFixed(2) || '--'}
                  </span>
                  {simplizeData?.pe_ratio && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      simplizeData.pe_ratio < 10 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      simplizeData.pe_ratio < 20 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {simplizeData.pe_ratio < 10 ? 'Rẻ' : simplizeData.pe_ratio < 20 ? 'TB' : 'Cao'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">P/B</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 dark:text-white font-bold">
                    {simplizeData?.pb_ratio?.toFixed(2) || '--'}
                  </span>
                  {simplizeData?.pb_ratio && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      simplizeData.pb_ratio < 1 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      simplizeData.pb_ratio < 2 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {simplizeData.pb_ratio < 1 ? 'Rẻ' : simplizeData.pb_ratio < 2 ? 'TB' : 'Cao'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">EPS</span>
                <span className="text-sm text-slate-900 dark:text-white font-bold">
                  {simplizeData?.eps 
                    ? `${Math.round(simplizeData.eps).toLocaleString('vi-VN')}`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Book Value</span>
                <span className="text-sm text-slate-900 dark:text-white font-bold">
                  {simplizeData?.book_value ? `${Math.round(simplizeData.book_value).toLocaleString('vi-VN')}` : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Cổ tức</span>
                <span className={`text-sm font-bold ${simplizeData?.dividend_yield && simplizeData.dividend_yield > 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {simplizeData?.dividend_yield ? `${simplizeData.dividend_yield.toFixed(2)}%` : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Beta (5Y)</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.beta_5y && simplizeData.beta_5y > 1.2 ? 'text-rose-600 dark:text-rose-400' : 
                  simplizeData?.beta_5y && simplizeData.beta_5y < 0.8 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.beta_5y ? simplizeData.beta_5y.toFixed(2) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Chỉ số hiệu quả */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Chỉ số hiệu quả
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">ROE</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    simplizeData?.roe && simplizeData.roe > 15 
                      ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {simplizeData?.roe 
                      ? `${simplizeData.roe.toFixed(1)}%`
                      : '--'}
                  </span>
                  {simplizeData?.roe && simplizeData.roe > 15 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Tốt
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">ROA</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.roa && simplizeData.roa > 5 
                    ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.roa 
                    ? `${simplizeData.roa.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tăng trưởng DT (5Y)</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.revenue_5y_growth && simplizeData.revenue_5y_growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.revenue_5y_growth && simplizeData.revenue_5y_growth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.revenue_5y_growth 
                    ? `${simplizeData.revenue_5y_growth > 0 ? '+' : ''}${simplizeData.revenue_5y_growth.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tăng trưởng LN (5Y)</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.net_income_5y_growth && simplizeData.net_income_5y_growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.net_income_5y_growth && simplizeData.net_income_5y_growth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.net_income_5y_growth 
                    ? `${simplizeData.net_income_5y_growth > 0 ? '+' : ''}${simplizeData.net_income_5y_growth.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tăng trưởng DT (QoQ)</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.revenue_qoq_growth && simplizeData.revenue_qoq_growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.revenue_qoq_growth && simplizeData.revenue_qoq_growth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.revenue_qoq_growth 
                    ? `${simplizeData.revenue_qoq_growth > 0 ? '+' : ''}${simplizeData.revenue_qoq_growth.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tăng trưởng LN (QoQ)</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.net_income_qoq_growth && simplizeData.net_income_qoq_growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.net_income_qoq_growth && simplizeData.net_income_qoq_growth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.net_income_qoq_growth 
                    ? `${simplizeData.net_income_qoq_growth > 0 ? '+' : ''}${simplizeData.net_income_qoq_growth.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Biến động giá */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-amber-500" />
              Biến động giá
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">7 ngày</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.price_chg_7d && simplizeData.price_chg_7d > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.price_chg_7d && simplizeData.price_chg_7d < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.price_chg_7d 
                    ? `${simplizeData.price_chg_7d > 0 ? '+' : ''}${simplizeData.price_chg_7d.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">30 ngày</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.price_chg_30d && simplizeData.price_chg_30d > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.price_chg_30d && simplizeData.price_chg_30d < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.price_chg_30d 
                    ? `${simplizeData.price_chg_30d > 0 ? '+' : ''}${simplizeData.price_chg_30d.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">YTD</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.price_chg_ytd && simplizeData.price_chg_ytd > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.price_chg_ytd && simplizeData.price_chg_ytd < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.price_chg_ytd 
                    ? `${simplizeData.price_chg_ytd > 0 ? '+' : ''}${simplizeData.price_chg_ytd.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">1 năm</span>
                <span className={`text-sm font-bold ${
                  simplizeData?.price_chg_1y && simplizeData.price_chg_1y > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                  simplizeData?.price_chg_1y && simplizeData.price_chg_1y < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {simplizeData?.price_chg_1y 
                    ? `${simplizeData.price_chg_1y > 0 ? '+' : ''}${simplizeData.price_chg_1y.toFixed(1)}%`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tín hiệu PTKT</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  simplizeData?.ta_signal_1d === 'MUA' || simplizeData?.ta_signal_1d === 'MUA MẠNH' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  simplizeData?.ta_signal_1d === 'BÁN' || simplizeData?.ta_signal_1d === 'BÁN MẠNH' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {simplizeData?.ta_signal_1d || '--'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Mức rủi ro</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  simplizeData?.overall_risk_level === 'Thấp' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  simplizeData?.overall_risk_level === 'Cao' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                  'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {simplizeData?.overall_risk_level || '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI INTELLIGENCE DECK */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        style={{ isolation: 'isolate' }}
      >
        {/* SenAI Health - Cải tiến */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-teal-500/20 min-h-[240px] overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-500/5 dark:to-emerald-500/5 p-3 sm:p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <BrainCircuit size={16} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">
                  Chẩn đoán SenAI
                </span>
                <span className="text-[10px] text-slate-500">Phân tích AI tổng hợp</span>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm ${
                aiAnalysis?.recommendation === 'MUA'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                  : aiAnalysis?.recommendation === 'BÁN'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
              }`}
            >
              {aiAnalysis?.recommendation || 'THEO DÕI'}
            </span>
          </div>
          <div className="p-3 sm:p-4 flex-1 grid grid-cols-3 gap-2 sm:gap-3">
            <SenAIGauge
              value={aiAnalysis?.rating || 0}
              label="Rating"
              color="#14b8a6"
              isDark={isDark}
            />
            <SenAIGauge
              value={aiAnalysis?.score || 0}
              label="Score"
              color="#10b981"
              isDark={isDark}
            />
            <SenAIGauge
              value={aiAnalysis?.signal || 0}
              label="Signal"
              color="#f59e0b"
              isDark={isDark}
            />
          </div>
          {/* Confidence bar */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500">Độ tin cậy</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{aiAnalysis?.confidence || 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${aiAnalysis?.confidence || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Probability Engine - Cải tiến UI */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-blue-500/20 min-h-[240px] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 p-3 sm:p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Xác suất & Rủi ro
              </span>
              <span className="text-[10px] text-slate-500">Đánh giá ngắn hạn</span>
            </div>
          </div>
          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center space-y-3">
            {/* Nắm giữ tối ưu */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 p-3 rounded-xl border border-blue-200 dark:border-blue-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Nắm giữ tối ưu
                </span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {riskAnalysis?.optimal_holding_days || '--'}
                <span className="text-xs font-normal text-slate-500 ml-1">ngày</span>
              </span>
            </div>

            {/* Xác suất tăng */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Xác suất tăng</span>
                  <span className={`font-bold ${
                    (riskAnalysis?.upside_probability || 0) >= 60 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : (riskAnalysis?.upside_probability || 0) >= 45 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {riskAnalysis?.upside_probability?.toFixed(1) || '--'}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (riskAnalysis?.upside_probability || 0) >= 60 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                        : (riskAnalysis?.upside_probability || 0) >= 45 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                    }`}
                    style={{ width: `${riskAnalysis?.upside_probability || 0}%` }}
                  />
                </div>
              </div>

              {/* Rủi ro điều chỉnh */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Rủi ro điều chỉnh</span>
                  <span className={`font-bold ${
                    (riskAnalysis?.downside_risk || 0) <= 15 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : (riskAnalysis?.downside_risk || 0) <= 25 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {riskAnalysis?.downside_risk?.toFixed(1) || '--'}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (riskAnalysis?.downside_risk || 0) <= 15 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                        : (riskAnalysis?.downside_risk || 0) <= 25 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (riskAnalysis?.downside_risk || 0) * 2.5)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy - Cải tiến */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-indigo-500/20 min-h-[240px] overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 p-3 sm:p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Target size={16} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">
                  Chiến lược giao dịch
                </span>
                <span className="text-[10px] text-slate-500">Vùng giá khuyến nghị</span>
              </div>
            </div>
            {tradingStrategy?.strategy_type && (
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm ${
                  tradingStrategy.strategy_type === 'Theo xu hướng' ||
                  tradingStrategy.strategy_type === 'Breakout'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                    : tradingStrategy.strategy_type === 'Đứng ngoài' ||
                        tradingStrategy.strategy_type === 'Chốt lời'
                      ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                      : tradingStrategy.strategy_type === 'Bắt đáy'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                }`}
              >
                {tradingStrategy.strategy_type}
              </span>
            )}
          </div>

          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center space-y-2">
            {/* Vùng mua */}
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-200 dark:border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Vùng mua</span>
                  {tradingStrategy?.buy_zone_strength && (
                    <span className={`text-[9px] font-bold ${
                      tradingStrategy.buy_zone_strength === 'STRONG' ? 'text-emerald-600' :
                      tradingStrategy.buy_zone_strength === 'WEAK' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {tradingStrategy.buy_zone_strength === 'STRONG' ? '● Mạnh' : tradingStrategy.buy_zone_strength === 'WEAK' ? '● Yếu' : '● TB'}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                {tradingStrategy
                  ? `${tradingStrategy.buy_zone_low?.toLocaleString()} - ${tradingStrategy.buy_zone_high?.toLocaleString()}`
                  : '--'}
              </span>
            </div>

            {/* Cắt lỗ */}
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-500/10 dark:to-red-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-300">Cắt lỗ</span>
                  {tradingStrategy?.stop_loss_percent && (
                    <span className="text-[9px] font-bold text-rose-600">-{tradingStrategy.stop_loss_percent}%</span>
                  )}
                </div>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                &lt; {tradingStrategy?.stop_loss?.toLocaleString() || '--'}
              </span>
            </div>

            {/* Mục tiêu */}
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Mục tiêu</span>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                {tradingStrategy
                  ? `${tradingStrategy.target_1?.toLocaleString()} → ${tradingStrategy.target_2?.toLocaleString()}`
                  : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: BROKER CONSENSUS */}
      <div className="glass-panel p-4 rounded-2xl border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Đồng thuận từ CTCK
            </h3>
            <span className="text-xs text-slate-500">Cập nhật: Hôm nay</span>
          </div>
          
          {/* Average Target Price Summary */}
          {(brokerRecommendations.length > 0 || brokerData.length > 0) && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Giá mục tiêu TB</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {(() => {
                    if (brokerRecommendations.length > 0) {
                      const validPrices = brokerRecommendations.filter(r => r.target_price);
                      if (validPrices.length === 0) return '--';
                      const avg = validPrices.reduce((sum, r) => sum + (r.target_price || 0), 0) / validPrices.length;
                      return Math.round(avg).toLocaleString();
                    } else if (brokerData.length > 0) {
                      const avg = brokerData.reduce((sum, r) => sum + parseFloat(r.price.replace(',', '')) * 1000, 0) / brokerData.length;
                      return Math.round(avg).toLocaleString();
                    }
                    return '--';
                  })()}
                </p>
              </div>
              <div className="h-10 w-px bg-slate-300 dark:bg-slate-600"></div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Số CTCK</p>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {brokerRecommendations.length > 0 ? brokerRecommendations.length : brokerData.length}
                </p>
              </div>
              {stockInfo && (
                <>
                  <div className="h-10 w-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Upside</p>
                    <p className={`text-xl font-bold ${(() => {
                      const avgTarget = brokerRecommendations.length > 0
                        ? brokerRecommendations.filter(r => r.target_price).reduce((sum, r) => sum + (r.target_price || 0), 0) / 
                          (brokerRecommendations.filter(r => r.target_price).length || 1)
                        : brokerData.length > 0
                          ? brokerData.reduce((sum, r) => sum + parseFloat(r.price.replace(',', '')) * 1000, 0) / brokerData.length
                          : 0;
                      const upside = stockInfo.price > 0 ? ((avgTarget - stockInfo.price) / stockInfo.price) * 100 : 0;
                      return upside >= 0 ? 'text-emerald-500' : 'text-rose-500';
                    })()}`}>
                      {(() => {
                        const avgTarget = brokerRecommendations.length > 0
                          ? brokerRecommendations.filter(r => r.target_price).reduce((sum, r) => sum + (r.target_price || 0), 0) / 
                            (brokerRecommendations.filter(r => r.target_price).length || 1)
                          : brokerData.length > 0
                            ? brokerData.reduce((sum, r) => sum + parseFloat(r.price.replace(',', '')) * 1000, 0) / brokerData.length
                            : 0;
                        const upside = stockInfo.price > 0 ? ((avgTarget - stockInfo.price) / stockInfo.price) * 100 : 0;
                        return `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%`;
                      })()}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 pl-2">Ngày</th>
                <th className="py-3">Công ty CK</th>
                <th className="py-3">Hành động</th>
                <th className="py-3">Giá mục tiêu</th>
                <th className="py-3">Luận điểm</th>
              </tr>
            </thead>
            <tbody>
              {brokerRecommendations.length > 0
                ? brokerRecommendations.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/5 text-sm"
                    >
                      <td className="py-4 pl-2 text-slate-600 dark:text-slate-300 font-mono">
                        {new Date(row.recommendation_date).toLocaleDateString(
                          'vi-VN'
                        )}
                      </td>
                      <td className="py-4 text-slate-800 dark:text-white font-medium">
                        {row.broker_code}
                      </td>
                      <td
                        className={`py-4 font-bold ${
                          row.action === 'MUA' || row.action === 'KHẢ QUAN'
                            ? 'text-emerald-500'
                            : row.action === 'BÁN' || row.action === 'TIÊU CỰC'
                              ? 'text-rose-500'
                              : 'text-amber-500'
                        }`}
                      >
                        {row.action}
                      </td>
                      <td className="py-4 text-slate-600 dark:text-slate-200 font-mono">
                        {row.target_price?.toLocaleString()}
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                        {row.rationale}
                      </td>
                    </tr>
                  ))
                : brokerData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/5 text-sm"
                    >
                      <td className="py-4 pl-2 text-slate-600 dark:text-slate-300 font-mono">
                        {row.date}
                      </td>
                  <td className="py-4 text-slate-800 dark:text-white font-medium">{row.firm}</td>
                  <td className={`py-4 font-bold ${row.color}`}>{row.action}</td>
                  <td className="py-4 text-slate-600 dark:text-slate-200 font-mono">{row.price}</td>
                  <td className="py-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Modal */}
      <FinancialDetailsModal 
        isOpen={showFinancialModal} 
        onClose={() => setShowFinancialModal(false)} 
        isDark={isDark}
        stockInfo={stockInfo}
      />

      {/* Search Stock Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-indigo-500" />
                Tìm kiếm cổ phiếu
              </h3>
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Nhập mã cổ phiếu hoặc tên công ty..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Results */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {searchLoading ? (
                <div className="px-4 py-12 text-center">
                  <div className="animate-spin w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500">Đang tìm kiếm...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 font-medium sticky top-0">
                    Kết quả tìm kiếm ({searchResults.length})
                  </div>
                  {searchResults.map((company) => (
                    <button
                      key={company.symbol}
                      onClick={() => selectStock(company.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group border-b border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-md">
                          <img 
                            src={`https://finance.vietstock.vn/image/${company.symbol}`}
                            alt={company.symbol}
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${company.symbol.slice(0, 3)}</span>`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{company.symbol}</span>
                            {company.is_vn100 && (
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                                VN100
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 block">
                            {company.company_name}
                          </span>
                          <span className="text-xs text-slate-400">{company.industry}</span>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
                </>
              ) : searchQuery.length > 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="text-slate-300 dark:text-slate-600 mb-3">
                    <Search size={48} className="mx-auto" />
                  </div>
                  <p className="text-base text-slate-500 font-medium">Không tìm thấy kết quả</p>
                  <p className="text-sm text-slate-400 mt-1">Thử tìm kiếm với mã hoặc tên khác</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 font-medium sticky top-0">
                    Cổ phiếu phổ biến (VN100)
                  </div>
                  {companies.slice(0, 10).map((company) => (
                    <button
                      key={company.symbol}
                      onClick={() => selectStock(company.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group border-b border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-md">
                          <img 
                            src={`https://finance.vietstock.vn/image/${company.symbol}`}
                            alt={company.symbol}
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${company.symbol.slice(0, 3)}</span>`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{company.symbol}</span>
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                              VN100
                            </span>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 block">
                            {company.company_name}
                          </span>
                          <span className="text-xs text-slate-400">{company.industry}</span>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAnalysis;
