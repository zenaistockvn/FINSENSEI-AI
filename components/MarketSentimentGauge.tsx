import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, AlertTriangle } from 'lucide-react';

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
      const score = Math.floor(Math.random() * 40) + 35;
      
      const getSentimentData = (score: number): SentimentData => {
        if (score <= 20) {
          return {
            score, level: 'extreme_fear', label: 'Cực kỳ Sợ hãi',
            description: 'Thị trường hoảng loạn',
            advice: 'Cơ hội mua vào cho nhà đầu tư dài hạn',
            color: 'text-rose-500', bgColor: 'from-rose-500 to-rose-600',
            icon: <AlertTriangle size={16} />
          };
        } else if (score <= 40) {
          return {
            score, level: 'fear', label: 'Sợ hãi',
            description: 'Nhà đầu tư thận trọng',
            advice: 'Xem xét tích lũy dần các cổ phiếu tốt',
            color: 'text-orange-500', bgColor: 'from-orange-500 to-orange-600',
            icon: <TrendingDown size={16} />
          };
        } else if (score <= 60) {
          return {
            score, level: 'neutral', label: 'Trung lập',
            description: 'Thị trường cân bằng',
            advice: 'Giữ vững chiến lược đầu tư hiện tại',
            color: 'text-amber-500', bgColor: 'from-amber-500 to-amber-600',
            icon: <Minus size={16} />
          };
        } else if (score <= 80) {
          return {
            score, level: 'greed', label: 'Tham lam',
            description: 'Nhà đầu tư lạc quan',
            advice: 'Cân nhắc chốt lời một phần',
            color: 'text-emerald-500', bgColor: 'from-emerald-500 to-emerald-600',
            icon: <TrendingUp size={16} />
          };
        } else {
          return {
            score, level: 'extreme_greed', label: 'Cực kỳ Tham lam',
            description: 'Thị trường quá nóng',
            advice: 'Cẩn thận, có thể điều chỉnh',
            color: 'text-green-400', bgColor: 'from-green-400 to-green-500',
            icon: <Zap size={16} />
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
      <div className="glass-panel rounded-2xl p-5 border-t border-indigo-500/20 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  const needleRotation = (sentiment.score / 100) * 180 - 90;

  return (
    <div className="glass-panel rounded-2xl p-5 border-t border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Activity size={16} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tâm lý Thị trường</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Fear & Greed Index</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Gauge Container */}
      <div className="relative flex flex-col items-center">
        {/* Semi-circle gauge */}
        <div className="relative w-44 h-22 overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            
            {/* Background track */}
            <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="8" strokeLinecap="round" />
            
            {/* Colored arc */}
            <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="url(#gaugeGradient)" strokeWidth="8" strokeLinecap="round" />

            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick, i) => {
              const angle = (tick / 100) * 180 - 180;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 33 * Math.cos(rad);
              const y1 = 50 + 33 * Math.sin(rad);
              const x2 = 50 + 28 * Math.cos(rad);
              const y2 = 50 + 28 * Math.sin(rad);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
              );
            })}
          </svg>

          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)`, width: '2px', height: '36px' }}
          >
            <div className={`w-full h-full bg-gradient-to-t ${sentiment.bgColor} rounded-full shadow-lg`}></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-500"></div>
          </div>
        </div>

        {/* Score & Label */}
        <div className="mt-3 text-center">
          <div className={`text-3xl font-bold ${sentiment.color}`}>{sentiment.score}</div>
          <div className={`flex items-center justify-center gap-1.5 ${sentiment.color} mt-1`}>
            {sentiment.icon}
            <span className="text-sm font-bold">{sentiment.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sentiment.description}</p>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between w-full mt-3 px-2">
          <span className="text-[10px] text-rose-500 font-medium">0</span>
          <span className="text-[10px] text-orange-500 font-medium">25</span>
          <span className="text-[10px] text-amber-500 font-medium">50</span>
          <span className="text-[10px] text-emerald-500 font-medium">75</span>
          <span className="text-[10px] text-green-500 font-medium">100</span>
        </div>

        {/* Advice Box */}
        <div className="w-full mt-3 p-2.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-[11px] text-slate-600 dark:text-slate-300 text-center">
            {sentiment.advice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentGauge;
