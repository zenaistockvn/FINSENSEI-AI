import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, AlertTriangle, Info } from 'lucide-react';

interface MarketSentimentGaugeProps {
  isDark?: boolean;
}

type SentimentLevel = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

interface SentimentData {
  score: number;
  level: SentimentLevel;
  label: string;
  description: string;
  advice: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const MarketSentimentGauge: React.FC<MarketSentimentGaugeProps> = ({ isDark = true }) => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateSentiment = () => {
      // In real app, this would come from market data analysis
      const score = Math.floor(Math.random() * 40) + 35; // 35-75 range for demo
      
      const getSentimentData = (score: number): SentimentData => {
        if (score <= 20) {
          return {
            score,
            level: 'extreme_fear',
            label: 'Cực kỳ Sợ hãi',
            description: 'Thị trường hoảng loạn',
            advice: 'Cơ hội mua vào cho nhà đầu tư dài hạn',
            color: 'text-rose-500',
            bgColor: 'from-rose-500 to-rose-600',
            icon: <AlertTriangle size={18} />
          };
        } else if (score <= 40) {
          return {
            score,
            level: 'fear',
            label: 'Sợ hãi',
            description: 'Nhà đầu tư thận trọng',
            advice: 'Xem xét tích lũy dần các cổ phiếu tốt',
            color: 'text-orange-500',
            bgColor: 'from-orange-500 to-orange-600',
            icon: <TrendingDown size={18} />
          };
        } else if (score <= 60) {
          return {
            score,
            level: 'neutral',
            label: 'Trung lập',
            description: 'Thị trường cân bằng',
            advice: 'Giữ vững chiến lược đầu tư hiện tại',
            color: 'text-amber-500',
            bgColor: 'from-amber-500 to-amber-600',
            icon: <Minus size={18} />
          };
        } else if (score <= 80) {
          return {
            score,
            level: 'greed',
            label: 'Tham lam',
            description: 'Nhà đầu tư lạc quan',
            advice: 'Cân nhắc chốt lời một phần',
            color: 'text-emerald-500',
            bgColor: 'from-emerald-500 to-emerald-600',
            icon: <TrendingUp size={18} />
          };
        } else {
          return {
            score,
            level: 'extreme_greed',
            label: 'Cực kỳ Tham lam',
            description: 'Thị trường quá nóng',
            advice: 'Cẩn thận, có thể điều chỉnh',
            color: 'text-green-400',
            bgColor: 'from-green-400 to-green-500',
            icon: <Zap size={18} />
          };
        }
      };

      setSentiment(getSentimentData(score));
      setLoading(false);
    };

    calculateSentiment();
    const interval = setInterval(calculateSentiment, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !sentiment) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-4"></div>
        <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  const needleRotation = (sentiment.score / 100) * 180 - 90;

  return (
    <div className="glass-panel rounded-2xl p-6 border-t border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.08)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
            <Activity size={16} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tâm lý Thị trường
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Fear & Greed Index
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>

      {/* Gauge Container */}
      <div className="relative flex flex-col items-center">
        {/* Semi-circle gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background track */}
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="10"
              strokeLinecap="round"
            />
            
            {/* Colored arc */}
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick, i) => {
              const angle = (tick / 100) * 180 - 180;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 35 * Math.cos(rad);
              const y1 = 50 + 35 * Math.sin(rad);
              const x2 = 50 + 30 * Math.cos(rad);
              const y2 = 50 + 30 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isDark ? '#475569' : '#94a3b8'}
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
            style={{ 
              transform: `translateX(-50%) rotate(${needleRotation}deg)`,
              width: '3px',
              height: '40px'
            }}
          >
            <div className={`w-full h-full bg-gradient-to-t ${sentiment.bgColor} rounded-full shadow-lg`}></div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-500 shadow-lg"></div>
          </div>
        </div>

        {/* Score & Label */}
        <div className="mt-4 text-center">
          <div className={`text-4xl font-bold ${sentiment.color} mb-1`}>
            {sentiment.score}
          </div>
          <div className={`flex items-center justify-center gap-2 ${sentiment.color} mb-1`}>
            {sentiment.icon}
            <span className="text-sm font-bold">{sentiment.label}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sentiment.description}
          </p>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between w-full mt-4 px-1">
          <span className="text-[10px] text-rose-500 font-semibold">0</span>
          <span className="text-[10px] text-orange-500 font-medium">25</span>
          <span className="text-[10px] text-amber-500 font-medium">50</span>
          <span className="text-[10px] text-emerald-500 font-medium">75</span>
          <span className="text-[10px] text-green-500 font-semibold">100</span>
        </div>

        {/* Advice Box */}
        <div className="w-full mt-4 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start gap-2">
            <Info size={14} className={`${sentiment.color} flex-shrink-0 mt-0.5`} />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {sentiment.advice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentGauge;
