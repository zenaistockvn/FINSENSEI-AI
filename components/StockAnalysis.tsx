import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  getVN100Companies,
  getStockPrices,
  getCompanyBySymbol,
  searchCompanies,
  getLatestFinancialRatio,
  getStockNews,
  getAIAnalysis,
  getRiskAnalysis,
  getTradingStrategy,
  getBrokerRecommendations,
  Company,
  StockPrice,
  FinancialRatio,
  StockNews,
  AIAnalysis,
  RiskAnalysis,
  TradingStrategy,
  BrokerRecommendation,
} from '../services/supabaseClient';
import TradingViewChart from './TradingViewChart';

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
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  
  const filteredData = data.filter(item => filter === 'all' || item.sentiment === filter);
  
  const sentimentCounts = {
    all: data.length,
    positive: data.filter(n => n.sentiment === 'positive').length,
    neutral: data.filter(n => n.sentiment === 'neutral').length,
    negative: data.filter(n => n.sentiment === 'negative').length
  };

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
            <p className="text-slate-500 dark:text-slate-400 text-xs">{data.length} tin tức gần đây</p>
          </div>
        </div>
        
        {/* Sentiment Summary */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{sentimentCounts.positive}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{sentimentCounts.neutral}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{sentimentCounts.negative}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
        {[
          { id: 'all', label: 'Tất cả', count: sentimentCounts.all },
          { id: 'positive', label: 'Tích cực', count: sentimentCounts.positive, color: 'emerald' },
          { id: 'neutral', label: 'Trung lập', count: sentimentCounts.neutral, color: 'slate' },
          { id: 'negative', label: 'Tiêu cực', count: sentimentCounts.negative, color: 'rose' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filter === tab.id 
                ? tab.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                : tab.color === 'rose' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Newspaper size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Chưa có tin tức</p>
            <p className="text-xs text-slate-500">Không tìm thấy tin tức cho mã {stockSymbol}</p>
          </div>
        ) : (
          filteredData.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all group overflow-hidden"
            >
              {/* News Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                      item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      item.sentiment === 'negative' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {item.sentiment === 'positive' ? '↑ Tích cực' : item.sentiment === 'negative' ? '↓ Tiêu cực' : '• Trung lập'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.source}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.time}</span>
                  </div>
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      title="Xem bài gốc"
                    >
                      <Share2 size={14} />
                    </a>
                  )}
                </div>
                
                {/* Title */}
                {item.url ? (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </a>
                ) : (
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                )}
              </div>
              
              {/* AI Summary */}
              <div className={`mx-4 mb-4 p-3 rounded-lg border ${
                item.sentiment === 'positive' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' :
                item.sentiment === 'negative' ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10' :
                'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    item.sentiment === 'positive' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                    item.sentiment === 'negative' ? 'bg-rose-100 dark:bg-rose-500/20' :
                    'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    <BrainCircuit size={12} className={`${
                      item.sentiment === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                      item.sentiment === 'negative' ? 'text-rose-600 dark:text-rose-400' : 
                      'text-slate-500 dark:text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tóm tắt AI</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                      {item.aiSummary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              <span>Cập nhật liên tục</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
              <Globe size={12} />
              Xem tất cả tin tức
            </button>
          </div>
        </div>
      )}
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
  const [showAlerts, setShowAlerts] = useState(true);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [newsFilter, setNewsFilter] = useState<
    'all' | 'positive' | 'neutral' | 'negative'
  >('all');

  // Data states
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [financialRatio, setFinancialRatio] = useState<FinancialRatio | null>(
    null
  );
  const [newsData, setNewsData] = useState<NewsItem[]>([]);

  // AI Analysis states
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [tradingStrategy, setTradingStrategy] =
    useState<TradingStrategy | null>(null);
  const [brokerRecommendations, setBrokerRecommendations] = useState<
    BrokerRecommendation[]
  >([]);

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
        const [ai, risk, strategy, brokers] = await Promise.all([
          getAIAnalysis(selectedSymbol),
          getRiskAnalysis(selectedSymbol),
          getTradingStrategy(selectedSymbol),
          getBrokerRecommendations(selectedSymbol),
        ]);
        setAIAnalysis(ai);
        setRiskAnalysis(risk);
        setTradingStrategy(strategy);
        setBrokerRecommendations(brokers);
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
        // Get company info and financial ratios
        const [company, ratio] = await Promise.all([
          getCompanyBySymbol(selectedSymbol),
          getLatestFinancialRatio(selectedSymbol)
        ]);
        
        setFinancialRatio(ratio);
        
        // Get price history
        const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : timeframe === '2Y' ? 730 : 60;
        const prices = await getStockPrices(selectedSymbol, days);
        
        if (prices.length > 0) {
          const latestPrice = prices[0];
          const prevPrice = prices[1] || prices[0];
          const change = latestPrice.close_price - prevPrice.close_price;
          const changePercent = prevPrice.close_price > 0 
            ? (change / prevPrice.close_price) * 100 
            : 0;
          
          setStockInfo({
            symbol: selectedSymbol,
            name: company?.company_name || selectedSymbol,
            price: latestPrice.close_price, // Price already in VND
            change: change,
            changePercent: Math.round(changePercent * 100) / 100,
            volume: latestPrice.volume,
            // Calculate market cap from outstanding shares * price
            // outstanding_shares is in shares, price is in VND
            marketCap: company?.outstanding_shares 
              ? company.outstanding_shares * latestPrice.close_price 
              : undefined
          });
          
          // Convert to candlestick data with indicators
          const candleData: CandlestickData[] = prices
            .slice()
            .reverse()
            .map((p, index, arr) => {
              // Calculate MA20
              let ma20 = undefined;
              if (index >= 19) {
                const sum = arr.slice(index - 19, index + 1).reduce((acc, item) => acc + item.close_price, 0);
                ma20 = sum / 20; // MA20 in VND
              }
              
              // Calculate RSI (simplified)
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
                open: p.open_price, // Price already in VND
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
          // No data - set defaults
          setStockInfo({
            symbol: selectedSymbol,
            name: company?.company_name || selectedSymbol,
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0
          });
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
  }, [selectedSymbol, timeframe]);

  // AI Alerts
  const aiAlerts = useMemo(() => analyzeTechnicalSignals(chartData), [chartData]);
  
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
    <div className="animate-fade-in-up space-y-6 pb-12">
      
      {/* SECTION 1: HEADER & STOCK SELECTOR */}
      <div className="glass-panel p-5 rounded-2xl border-b border-indigo-200 dark:border-indigo-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Stock Selector */}
          <div className="flex items-center gap-4">
            {/* Stock Logo */}
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-lg">
              <img 
                src={`https://finance.vietstock.vn/image/${selectedSymbol}`}
                alt={selectedSymbol}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback to gradient badge if logo fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">${selectedSymbol.slice(0, 3)}</span>`;
                }}
              />
            </div>
            
            {/* Stock Info */}
            <div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {(stockInfo?.price || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">VND</span>
                  </h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      (stockInfo?.changePercent || 0) >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10' 
                        : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10'
                    }`}>
                      <TrendingUp size={14} className={(stockInfo?.changePercent || 0) < 0 ? 'rotate-180' : ''} />
                      {(stockInfo?.changePercent || 0) > 0 ? '+' : ''}{stockInfo?.changePercent}%
                      <span className="ml-1 text-xs opacity-75">
                        ({(stockInfo?.change || 0) > 0 ? '+' : ''}{(stockInfo?.change || 0).toLocaleString('vi-VN')})
                      </span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{stockInfo?.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats - Enhanced UI */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {/* Vốn hóa */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Vốn hóa</span>
              <span className="text-xs text-slate-900 dark:text-white font-bold">
                {stockInfo?.marketCap ? `${(stockInfo.marketCap / 1000000000000).toFixed(1)}T` : '--'}
              </span>
            </div>
            
            {/* Khối lượng */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">KL</span>
              <span className="text-xs text-slate-900 dark:text-white font-bold">
                {stockInfo?.volume ? `${(stockInfo.volume / 1000000).toFixed(2)}M` : '--'}
              </span>
            </div>
            
            {/* Cao nhất */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Cao</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {chartData.length > 0 ? Math.max(...chartData.map(d => d.high)).toLocaleString('vi-VN') : '--'}
              </span>
            </div>
            
            {/* Thấp nhất */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/30">
              <span className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-bold">Thấp</span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                {chartData.length > 0 ? Math.min(...chartData.map(d => d.low)).toLocaleString('vi-VN') : '--'}
              </span>
            </div>
            
            {/* Trung bình */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold">TB</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {chartData.length > 0 ? Math.round(chartData.reduce((sum, d) => sum + d.close, 0) / chartData.length).toLocaleString('vi-VN') : '--'}
              </span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
            
            {/* P/E */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
              <span className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-bold">P/E</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                {financialRatio?.pe_ratio ? financialRatio.pe_ratio.toFixed(1) : '--'}
              </span>
            </div>
            
            {/* P/B */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
              <span className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-bold">P/B</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                {financialRatio?.pb_ratio ? financialRatio.pb_ratio.toFixed(2) : '--'}
              </span>
            </div>
            
            {/* ROE */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
              <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold">ROE</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {financialRatio?.roe ? `${(financialRatio.roe * 100).toFixed(1)}%` : '--'}
              </span>
            </div>
            
            {/* EPS */}
            <div className="flex flex-col items-center px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
              <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold">EPS</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {financialRatio?.eps ? Math.round(financialRatio.eps).toLocaleString('vi-VN') : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CANDLESTICK CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 glass-panel p-0 rounded-2xl flex flex-col h-[600px] border border-slate-200 dark:border-white/5 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-slate-200 dark:border-white/5 z-10 relative bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-md gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto shadow-inner w-full sm:w-auto">
              {[
                { id: 'chart', label: 'Biểu đồ nến', icon: BarChart2 },
                { id: 'earnings', label: 'Phân tích AI', icon: Mic2 },
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
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 w-full min-h-0 relative flex flex-col p-0 bg-slate-50 dark:bg-[#0b0f19]/20">
            {viewMode === 'chart' ? (
              loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <p>Không có dữ liệu cho mã {selectedSymbol}</p>
                </div>
              ) : (
                <>
                  {/* TradingView-style Chart */}
                  <div className="flex-1 min-h-0 h-full">
                    <TradingViewChart 
                      data={chartData.map(d => ({
                        time: d.date,
                        date: new Date(),
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
                  </div>

                  {/* AI Alerts Overlay */}
                  {showAlerts && aiAlerts.length > 0 && (
                    <div className="absolute top-4 right-4 md:w-72 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                      <div className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/50 dark:to-purple-900/50 p-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tín hiệu AI</span>
                        </div>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {aiAlerts.map((alert) => (
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
                              <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : viewMode === 'earnings' ? (
              <div className="p-4 h-full overflow-auto">
                <AIEarningsInsight isDark={isDark} stockInfo={stockInfo} />
              </div>
            ) : (
              <div className="p-4 h-full overflow-auto">
                <StockNewsFeed data={filteredNews} stockSymbol={selectedSymbol} />
              </div>
            )}
          </div>
        </div>


        {/* Right Sidebar - Fundamentals */}
        <div className="lg:col-span-3 flex flex-col gap-2 h-[600px]">
          {/* News Sentiment Widget */}
          <div className="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-white/5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Newspaper size={14} className="text-slate-400" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cảm xúc Tin tức</span>
              </div>
              <span className="text-xs font-bold text-emerald-500">Tích cực</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="w-[70%] bg-emerald-500 h-full"></div>
                <div className="w-[10%] bg-slate-400 h-full"></div>
                <div className="w-[20%] bg-rose-500 h-full"></div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>70% Bull</span>
              <span>20% Bear</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 px-1 shrink-0">
            <Activity size={16} className="text-cyan-500" />
            <span className="font-medium text-slate-900 dark:text-white">Chỉ số PTKT</span>
          </div>
          
          {/* Scrollable Technical Indicators */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <MetricCard 
              label="RS Rating" 
              value={techIndicators.rs !== null ? Math.round(techIndicators.rs).toString() : 'N/A'} 
              sub={techIndicators.rs !== null 
                ? (techIndicators.rs >= 80 ? 'Rất mạnh' : techIndicators.rs >= 60 ? 'Mạnh' : techIndicators.rs >= 40 ? 'Trung bình' : 'Yếu')
                : undefined}
              icon={TrendingUp} 
            />
            <MetricCard 
              label="RSI (14)" 
              value={techIndicators.rsi14 !== null ? Math.round(techIndicators.rsi14).toString() : 'N/A'} 
              sub={techIndicators.rsi14 !== null 
                ? (techIndicators.rsi14 > 70 ? 'Quá mua' : techIndicators.rsi14 < 30 ? 'Quá bán' : 'Trung tính')
                : undefined}
              icon={Activity} 
            />
            <MetricCard 
              label="MA20" 
              value={techIndicators.ma20 !== null ? Math.round(techIndicators.ma20).toLocaleString('vi-VN') : 'N/A'} 
              sub={techIndicators.ma20 !== null && stockInfo
                ? (stockInfo.price > techIndicators.ma20 ? '↑ Trên MA' : '↓ Dưới MA')
                : undefined}
              icon={Activity} 
            />
            <MetricCard 
              label="MACD" 
              value={techIndicators.macd !== null ? techIndicators.macd.toFixed(0) : 'N/A'} 
              sub={techIndicators.macd !== null && techIndicators.macdSignal !== null
                ? (techIndicators.macd > techIndicators.macdSignal ? '↑ Bullish' : '↓ Bearish')
                : undefined}
              icon={Activity} 
            />
            <MetricCard 
              label="Biến động" 
              value={techIndicators.volatility !== null ? `${techIndicators.volatility.toFixed(1)}%` : 'N/A'} 
              sub="Năm hóa"
              icon={Activity} 
            />
            <MetricCard 
              label="Thay đổi 5D" 
              value={techIndicators.priceChange5d !== null 
                ? `${techIndicators.priceChange5d >= 0 ? '+' : ''}${techIndicators.priceChange5d.toFixed(1)}%` 
                : 'N/A'} 
              icon={TrendingUp} 
            />
            <MetricCard 
              label="KL TB 20" 
              value={techIndicators.avgVolume20 !== null 
                ? `${(techIndicators.avgVolume20 / 1000000).toFixed(2)}M` 
                : 'N/A'} 
              icon={BarChart2} 
            />
            <MetricCard 
              label="Vị thế giá" 
              value={techIndicators.pricePosition !== null 
                ? `${Math.round(techIndicators.pricePosition)}%` 
                : 'N/A'} 
              sub="Trong biên độ"
              icon={Target} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: AI INTELLIGENCE DECK */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ isolation: 'isolate' }}
      >
        {/* SenAI Health */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-teal-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-teal-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Chẩn đoán SenAI
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                aiAnalysis?.recommendation === 'MUA'
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                  : aiAnalysis?.recommendation === 'BÁN'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              {aiAnalysis?.recommendation || 'THEO DÕI'}
            </span>
          </div>
          <div className="p-3 flex-1 grid grid-cols-3 gap-2 overflow-hidden">
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
        </div>

        {/* Probability Engine */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-blue-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 shrink-0">
            <Activity size={18} className="text-blue-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Xác suất & Rủi ro
            </span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-center space-y-2 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 p-1.5 rounded-full text-blue-500">
                  <Clock size={14} />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Nắm giữ tối ưu
                </span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {riskAnalysis?.optimal_holding_days || '--'}{' '}
                <span className="text-[10px] font-normal text-slate-500">
                  ngày
                </span>
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500">Xác suất tăng ngắn hạn</span>
                  <span className="text-emerald-500 font-bold">
                    {riskAnalysis?.upside_probability?.toFixed(1) || '--'}%
                  </span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${riskAnalysis?.upside_probability || 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500">Rủi ro điều chỉnh</span>
                  <span className="text-rose-500 font-bold">
                    {riskAnalysis?.downside_risk?.toFixed(1) || '--'}%
                  </span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${riskAnalysis?.downside_risk || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-indigo-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 shrink-0">
            <Target size={18} className="text-indigo-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Chiến lược giao dịch
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-center space-y-2 overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className="text-teal-600 dark:text-teal-400"
                />
                <span className="text-xs font-medium text-teal-700 dark:text-teal-100">
                  Vùng mua
                </span>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                {tradingStrategy
                  ? `${tradingStrategy.buy_zone_low?.toLocaleString()} - ${tradingStrategy.buy_zone_high?.toLocaleString()}`
                  : stockInfo && chartData.length > 0
                    ? `${roundVNPrice(Math.min(...chartData.map((d) => d.low))).toLocaleString()} - ${roundVNPrice(stockInfo.price * 0.98).toLocaleString()}`
                    : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-500" />
                <span className="text-xs font-medium text-rose-700 dark:text-rose-100">
                  Cắt lỗ
                </span>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                &lt;{' '}
                {tradingStrategy
                  ? tradingStrategy.stop_loss?.toLocaleString()
                  : stockInfo && chartData.length > 0
                    ? roundVNPrice(
                        Math.min(...chartData.map((d) => d.low)) * 0.95
                      ).toLocaleString()
                    : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Target
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-100">
                  Mục tiêu
                </span>
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-sm">
                {tradingStrategy
                  ? `${tradingStrategy.target_1?.toLocaleString()} - ${tradingStrategy.target_2?.toLocaleString()}`
                  : stockInfo
                    ? `${roundVNPrice(stockInfo.price * 1.1).toLocaleString()} - ${roundVNPrice(stockInfo.price * 1.2).toLocaleString()}`
                    : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: BROKER CONSENSUS */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
