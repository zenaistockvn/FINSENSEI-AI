import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MarketIndex } from '../types';
import { getLatestIndices, MarketIndex as SupabaseIndex } from '../services/supabaseClient';

// Mini Sparkline Chart Component
const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean; width?: number; height?: number }> = ({ 
  data, isPositive, width = 60, height = 24 
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = isPositive ? '#10b981' : '#ef4444';
  const gradientId = `gradient-${isPositive ? 'up' : 'down'}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={color}
      />
    </svg>
  );
};

// Generate mock sparkline data based on current value and change
const generateSparklineData = (currentValue: number, changePercent: number): number[] => {
  const points = 12;
  const data: number[] = [];
  const startValue = currentValue / (1 + changePercent / 100);
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = startValue + (currentValue - startValue) * progress;
    const noise = (Math.random() - 0.5) * (currentValue * 0.005);
    data.push(trend + noise);
  }
  data[data.length - 1] = currentValue; // Ensure last point is exact
  return data;
};

const MarketPulse: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const data = await getLatestIndices();
        const formatted: MarketIndex[] = data.map((idx: SupabaseIndex) => {
          const closeValue = idx.close_value;
          const changeValue = idx.change_value || 0;
          
          // Tính % thay đổi: change / (close - change) * 100
          // Vì previousClose = closeValue - changeValue
          const previousClose = closeValue - changeValue;
          const calculatedPercent = previousClose > 0 
            ? (changeValue / previousClose) * 100 
            : 0;
          
          // Ưu tiên dùng change_percent từ DB nếu có, nếu không thì tính
          const changePercent = idx.change_percent !== null && idx.change_percent !== undefined
            ? idx.change_percent
            : calculatedPercent;
          
          return {
            name: idx.index_code,
            value: closeValue,
            change: changeValue,
            changePercent: changePercent,
          };
        });
        setIndices(formatted.length > 0 ? formatted : getDefaultIndices());
      } catch (error) {
        console.error('Error fetching indices:', error);
        setIndices(getDefaultIndices());
      } finally {
        setLoading(false);
      }
    };
    fetchIndices();
  }, []);

  const getDefaultIndices = (): MarketIndex[] => [
    { name: 'VNINDEX', value: 1280.50, change: 15.20, changePercent: 1.20 },
    { name: 'VN30', value: 1305.15, change: 18.45, changePercent: 1.43 },
  ];

  // Generate sparkline data for each index
  const sparklineData = useMemo(() => {
    const data: Record<string, number[]> = {};
    indices.forEach(idx => {
      data[idx.name] = generateSparklineData(idx.value, idx.changePercent);
    });
    return data;
  }, [indices]);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-4 border-t border-cyan-500/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28 animate-pulse"></div>
          </div>
          <div className="flex-1 flex gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex-1 h-14 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mainIndices = indices
    .filter((idx: MarketIndex) => ['VNINDEX', 'VN30'].includes(idx.name))
    .sort((a: MarketIndex, b: MarketIndex) => {
      if (a.name === 'VNINDEX') return -1;
      if (b.name === 'VNINDEX') return 1;
      return 0;
    })
    .slice(0, 2);

  return (
    <div className="glass-panel rounded-xl p-4 border-t border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Header */}
        <div className="flex items-center gap-2 sm:min-w-[160px]">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Activity size={14} className="text-cyan-500" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Nhịp đập thị trường</span>
        </div>

        {/* Index Cards - Horizontal */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {mainIndices.map((idx: MarketIndex) => {
            const isPositive = idx.change >= 0;
            const chartData = sparklineData[idx.name] || [];
            
            return (
              <div 
                key={idx.name} 
                className="relative flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
              >
                {/* Ambient Glow */}
                <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-[30px] opacity-20 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                {/* Info */}
                <div className="relative z-10 flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{idx.name}</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {idx.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span className="text-xs font-bold">
                      {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-[10px] opacity-70">
                      ({isPositive ? '+' : ''}{idx.change.toFixed(2)})
                    </span>
                  </div>
                </div>
                
                {/* Mini Chart */}
                <div className="relative z-10 flex-shrink-0">
                  <MiniSparkline data={chartData} isPositive={isPositive} width={50} height={28} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
