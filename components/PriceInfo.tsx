import React from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface PriceInfoProps {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  prevClose?: number;
  isDark?: boolean;
}

const PriceInfo: React.FC<PriceInfoProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  open,
  high,
  low,
  volume,
  prevClose,
  isDark = true
}) => {
  const isUp = change >= 0;
  
  const formatPrice = (p: number) => p.toLocaleString('vi-VN');
  const formatVolume = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
    return v.toString();
  };

  return (
    <div className={`flex items-center gap-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Symbol & Price */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
          isDark ? 'bg-indigo-600' : 'bg-indigo-500'
        } text-white`}>
          {symbol.slice(0, 3)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{formatPrice(price)}</span>
            <span className={`text-sm font-medium flex items-center gap-1 px-2 py-0.5 rounded ${
              isUp 
                ? 'text-emerald-500 bg-emerald-500/10' 
                : 'text-rose-500 bg-rose-500/10'
            }`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
          {name && (
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {name}
            </span>
          )}
        </div>
      </div>
      
      {/* OHLC */}
      <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {open !== undefined && (
          <div className="flex flex-col">
            <span className="uppercase text-[10px] font-medium opacity-60">Mở</span>
            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatPrice(open)}</span>
          </div>
        )}
        {high !== undefined && (
          <div className="flex flex-col">
            <span className="uppercase text-[10px] font-medium opacity-60">Cao</span>
            <span className="text-emerald-500">{formatPrice(high)}</span>
          </div>
        )}
        {low !== undefined && (
          <div className="flex flex-col">
            <span className="uppercase text-[10px] font-medium opacity-60">Thấp</span>
            <span className="text-rose-500">{formatPrice(low)}</span>
          </div>
        )}
        {prevClose !== undefined && (
          <div className="flex flex-col">
            <span className="uppercase text-[10px] font-medium opacity-60">TC</span>
            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatPrice(prevClose)}</span>
          </div>
        )}
        {volume !== undefined && (
          <div className="flex flex-col">
            <span className="uppercase text-[10px] font-medium opacity-60">KL</span>
            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatVolume(volume)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceInfo;
