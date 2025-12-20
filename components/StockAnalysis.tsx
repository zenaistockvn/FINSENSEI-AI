import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Cell, PieChart, Pie, ReferenceLine, Bar
} from 'recharts';
import { 
  TrendingUp, Layers, CheckCircle2, ShieldAlert, Target, 
  Clock, ArrowRight, BrainCircuit, BarChart2, Activity, Zap, X, ChevronDown, FileText, 
  FileSearch, Mic2, ThumbsUp, ThumbsDown, Smile, Newspaper, Globe, Share2, Search
} from 'lucide-react';
import { 
  getVN100Companies, getStockPrices, getCompanyBySymbol, searchCompanies,
  getLatestFinancialRatio, Company, StockPrice, FinancialRatio
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

// --- Shared News Data ---
const SHARED_NEWS_DATA = [
  {
    id: 1, source: "Cafef", time: "2 giờ trước",
    title: "Cổ phiếu tăng mạnh nhờ kết quả kinh doanh vượt kỳ vọng",
    summary: "Doanh thu và lợi nhuận quý gần nhất đều vượt dự báo của giới phân tích.",
    sentiment: "positive",
    aiSummary: "Kết quả kinh doanh tích cực, tác động tốt đến tâm lý nhà đầu tư."
  },
  {
    id: 2, source: "VnEconomy", time: "5 giờ trước",
    title: "Mở rộng hoạt động kinh doanh tại thị trường mới",
    summary: "Công ty đang đẩy mạnh mở rộng quy mô hoạt động tại các thị trường tiềm năng.",
    sentiment: "positive",
    aiSummary: "Chiến lược mở rộng giúp đa dạng hóa nguồn thu, giảm rủi ro tập trung."
  },
  {
    id: 3, source: "Vietstock", time: "1 ngày trước",
    title: "Khối ngoại tiếp tục mua ròng",
    summary: "Dòng tiền từ các quỹ ETF ngoại giúp nâng đỡ thị giá cổ phiếu.",
    sentiment: "neutral",
    aiSummary: "Dòng tiền ngoại ổn định là yếu tố hỗ trợ giá quan trọng."
  },
  {
    id: 4, source: "DanTri", time: "2 ngày trước",
    title: "Áp lực từ biến động vĩ mô",
    summary: "Biến động tỷ giá và lãi suất có thể ảnh hưởng đến biên lợi nhuận ngắn hạn.",
    sentiment: "negative",
    aiSummary: "Rủi ro vĩ mô ngắn hạn cần theo dõi, nhưng nền tảng cơ bản vẫn vững."
  }
];

// --- Sub-Components ---
const AIEarningsInsight = ({ isDark, stockInfo }: { isDark: boolean; stockInfo: StockInfo | null }) => {
  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-3 rounded-lg text-indigo-500 dark:text-indigo-400">
            <FileSearch size={24} />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">
              Phân tích Báo cáo {stockInfo?.symbol || 'N/A'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Nguồn: BCTC Hợp nhất & Biên bản họp ĐHCD</p>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tông giọng Ban lãnh đạo</div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Smile size={16} className="text-emerald-500 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Tự tin (88%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp size={18} className="text-emerald-500 dark:text-emerald-400" />
            <h4 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-sm">Điểm Tích cực</h4>
          </div>
          {[
            { title: "Tăng trưởng Doanh thu", desc: "Doanh thu tăng trưởng ổn định, vượt dự báo của giới phân tích." },
            { title: "Biên lợi nhuận cải thiện", desc: "Biên lãi gộp cải thiện nhờ tối ưu hóa chi phí và nâng cao hiệu quả." },
            { title: "Dòng tiền mạnh", desc: "Dòng tiền từ hoạt động kinh doanh dương, đảm bảo khả năng chi trả." }
          ].map((item, i) => (
            <div key={i} className="bg-emerald-50/50 dark:bg-slate-800/40 p-4 rounded-xl border-l-2 border-emerald-500">
              <p className="text-slate-800 dark:text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown size={18} className="text-rose-500 dark:text-rose-400" />
            <h4 className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-sm">Điểm Tiêu cực</h4>
          </div>
          {[
            { title: "Rủi ro Tỷ giá", desc: "Biến động tỷ giá có thể ảnh hưởng đến lợi nhuận tài chính ngắn hạn." },
            { title: "Chi phí tăng", desc: "Chi phí đầu tư và vận hành tăng, gây áp lực lên biên lợi nhuận ròng." }
          ].map((item, i) => (
            <div key={i} className="bg-rose-50/50 dark:bg-slate-800/40 p-4 rounded-xl border-l-2 border-rose-500">
              <p className="text-slate-800 dark:text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
        <div className="flex gap-4">
          <BrainCircuit size={20} className="text-indigo-500 dark:text-indigo-400 mt-1" />
          <div>
            <h5 className="text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-1">Nhận định AI</h5>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Dựa trên phân tích, cổ phiếu có nền tảng cơ bản vững chắc. Khuyến nghị theo dõi diễn biến vĩ mô.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StockNewsFeed = ({ data, stockSymbol }: { data: any[]; stockSymbol: string }) => {
  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
          <Globe size={18} className="text-indigo-500 dark:text-indigo-400" />
          Tin tức: {stockSymbol}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {data.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded font-bold uppercase">{item.source}</span>
                <span className="text-[10px] text-slate-400">{item.time}</span>
              </div>
              <button className="text-slate-400 hover:text-indigo-500"><Share2 size={14} /></button>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{item.title}</h4>
            <div className={`p-3 rounded-lg border ${
              item.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10' :
              item.sentiment === 'negative' ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/10' :
              'bg-slate-100 dark:bg-slate-700/20 border-slate-200 dark:border-slate-600/10'
            }`}>
              <div className="flex items-start gap-2">
                <BrainCircuit size={14} className={
                  item.sentiment === 'positive' ? 'text-emerald-500' :
                  item.sentiment === 'negative' ? 'text-rose-500' : 'text-slate-400'
                } />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold opacity-70">AI: </span>{item.aiSummary}
                </p>
              </div>
            </div>
          </div>
        ))}
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
  const [selectedSymbol, setSelectedSymbol] = useState('VNM');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('1M');
  const [viewMode, setViewMode] = useState<'chart' | 'earnings' | 'news'>('chart');
  const [showAlerts, setShowAlerts] = useState(true);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [newsFilter, setNewsFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  
  // Data states
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [financialRatio, setFinancialRatio] = useState<FinancialRatio | null>(null);

  // Listen for stock selection from global search
  useEffect(() => {
    const handleSelectStock = (e: CustomEvent) => {
      setSelectedSymbol(e.detail);
    };
    window.addEventListener('selectStock', handleSelectStock as EventListener);
    return () => window.removeEventListener('selectStock', handleSelectStock as EventListener);
  }, []);

  // Fetch companies list
  useEffect(() => {
    const fetchCompanies = async () => {
      const data = await getVN100Companies();
      setCompanies(data);
    };
    fetchCompanies();
  }, []);

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
            marketCap: latestPrice.close_price * 1000000 // Estimate market cap
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
  
  // Filtered news
  const filteredNews = SHARED_NEWS_DATA.filter(item => newsFilter === 'all' || item.sentiment === newsFilter);

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
            {/* Stock Symbol Badge */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              {selectedSymbol.slice(0, 3)}
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
            
            {/* Search Button */}
            <button 
              onClick={() => setShowSearch(true)}
              className="ml-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <Search size={16} />
              <span className="text-sm font-medium">Tìm cổ phiếu</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full lg:w-auto">
            <div className="px-4 border-l border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Vốn hóa</p>
              <p className="text-slate-900 dark:text-white font-medium">
                {stockInfo?.marketCap ? `${(stockInfo.marketCap / 1000000000000).toFixed(1)}T` : 'N/A'}
              </p>
            </div>
            <div className="px-4 border-l border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Khối lượng</p>
              <p className="text-slate-900 dark:text-white font-medium">
                {stockInfo?.volume ? `${(stockInfo.volume / 1000000).toFixed(1)}M` : 'N/A'}
              </p>
            </div>
            <div className="px-4 border-l border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Cao nhất ({timeframe})</p>
              <p className="text-emerald-500 font-medium">
                {chartData.length > 0 ? Math.max(...chartData.map(d => d.high)).toLocaleString('vi-VN') : 'N/A'}
              </p>
            </div>
            <div className="px-4 border-l border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Thấp nhất ({timeframe})</p>
              <p className="text-rose-500 font-medium">
                {chartData.length > 0 ? Math.min(...chartData.map(d => d.low)).toLocaleString('vi-VN') : 'N/A'}
              </p>
            </div>
            <div className="px-4 border-l border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-[10px] uppercase font-bold">TB ({timeframe})</p>
              <p className="text-indigo-500 font-medium">
                {chartData.length > 0 ? Math.round(chartData.reduce((sum, d) => sum + d.close, 0) / chartData.length).toLocaleString('vi-VN') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CANDLESTICK CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 glass-panel p-0 rounded-2xl flex flex-col h-[500px] border border-slate-200 dark:border-white/5 relative overflow-hidden">
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
                <>
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

                  <div className="flex bg-slate-100 dark:bg-slate-900/80 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
                    {['1W', '1M', '3M', '6M', '1Y', '2Y'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                          timeframe === t
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
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
                  <div className="flex-1 min-h-0">
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
                      height={400}
                      showVolume={true}
                      showMA={true}
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
        <div className="lg:col-span-3 flex flex-col gap-2 h-[500px]">
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
            <Layers size={16} className="text-purple-500" />
            <span className="font-medium text-slate-900 dark:text-white">Chỉ số cơ bản</span>
          </div>
          
          {/* Scrollable Metrics */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <MetricCard 
              label="P/E" 
              value={financialRatio?.pe_ratio ? financialRatio.pe_ratio.toFixed(1) : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="P/B" 
              value={financialRatio?.pb_ratio ? financialRatio.pb_ratio.toFixed(2) : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="ROE" 
              value={financialRatio?.roe ? `${(financialRatio.roe * 100).toFixed(1)}%` : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="ROA" 
              value={financialRatio?.roa ? `${(financialRatio.roa * 100).toFixed(1)}%` : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="EPS" 
              value={financialRatio?.eps ? financialRatio.eps.toLocaleString('vi-VN') : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="Biên LN gộp" 
              value={financialRatio?.gross_margin ? `${(financialRatio.gross_margin * 100).toFixed(1)}%` : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="Biên LN ròng" 
              value={financialRatio?.net_margin ? `${(financialRatio.net_margin * 100).toFixed(1)}%` : 'N/A'} 
              icon={Activity} 
            />
            <MetricCard 
              label="Nợ/Vốn CSH" 
              value={financialRatio?.debt_to_equity ? financialRatio.debt_to_equity.toFixed(2) : 'N/A'} 
              icon={Activity} 
            />
          </div>
          
          <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-500/20 text-center">
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-2">Báo cáo tài chính chi tiết</p>
            <button
              onClick={() => setShowFinancialModal(true)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI INTELLIGENCE DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ isolation: 'isolate' }}>
        {/* SenAI Health */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-teal-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-teal-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Chẩn đoán SenAI</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              (stockInfo?.changePercent || 0) >= 0 
                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {(stockInfo?.changePercent || 0) >= 0 ? 'MUA' : 'BÁN'}
            </span>
          </div>
          <div className="p-3 flex-1 grid grid-cols-3 gap-2 overflow-hidden">
            <SenAIGauge value={74} label="Rating" color="#14b8a6" isDark={isDark} />
            <SenAIGauge value={93} label="Score" color="#10b981" isDark={isDark} />
            <SenAIGauge value={55} label="Signal" color="#f59e0b" isDark={isDark} />
          </div>
        </div>

        {/* Probability Engine */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-blue-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 shrink-0">
            <Activity size={18} className="text-blue-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Xác suất & Rủi ro</span>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-center space-y-2 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 p-1.5 rounded-full text-blue-500"><Clock size={14} /></div>
                <span className="text-xs text-slate-600 dark:text-slate-300">Nắm giữ tối ưu</span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">55 <span className="text-[10px] font-normal text-slate-500">ngày</span></span>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500">Xác suất tăng ngắn hạn</span>
                  <span className="text-emerald-500 font-bold">70.7%</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500">Rủi ro điều chỉnh</span>
                  <span className="text-rose-500 font-bold">30.9%</span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[30%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl flex flex-col border border-indigo-500/20 h-[200px] overflow-hidden">
          <div className="bg-white dark:bg-[#0b0f19] p-3 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 shrink-0">
            <Target size={18} className="text-indigo-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Chiến lược giao dịch</span>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-center space-y-2 overflow-hidden">
            {stockInfo && chartData.length > 0 && (
              <>
                <div className="flex items-center justify-between p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-100">Vùng mua</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    {roundVNPrice(Math.min(...chartData.map(d => d.low))).toLocaleString()} - {roundVNPrice(stockInfo.price * 0.98).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-rose-500" />
                    <span className="text-xs font-medium text-rose-700 dark:text-rose-100">Cắt lỗ</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    &lt; {roundVNPrice(Math.min(...chartData.map(d => d.low)) * 0.95).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-100">Mục tiêu</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    {roundVNPrice(stockInfo.price * 1.1).toLocaleString()} - {roundVNPrice(stockInfo.price * 1.2).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: BROKER CONSENSUS */}
      <div className="glass-panel p-6 rounded-2xl border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đồng thuận từ CTCK</h3>
          <span className="text-xs text-slate-500">Cập nhật: Hôm nay</span>
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
              {brokerData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/5 text-sm">
                  <td className="py-4 pl-2 text-slate-600 dark:text-slate-300 font-mono">{row.date}</td>
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {company.symbol.slice(0, 3)}
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {company.symbol.slice(0, 3)}
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
