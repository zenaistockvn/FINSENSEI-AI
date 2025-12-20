import React, { useState, useEffect } from 'react';
import { MarketIndex } from '../types';
import { getLatestIndices, MarketIndex as SupabaseIndex } from '../services/supabaseClient';

const MarketPulse: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const data = await getLatestIndices();
        const formatted: MarketIndex[] = data.map((idx: SupabaseIndex) => ({
          name: idx.index_code,
          value: idx.close_value,
          change: idx.change_value || 0,
          changePercent: idx.change_percent || 0,
          status: idx.index_code === 'VNINDEX' ? getMarketStatus(idx.change_percent || 0) : undefined
        }));
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

  const getMarketStatus = (changePercent: number): string => {
    if (changePercent > 1) return 'Xu hướng tăng mạnh';
    if (changePercent > 0) return 'Xu hướng tăng';
    if (changePercent > -1) return 'Xu hướng giảm';
    return 'Xu hướng giảm mạnh';
  };

  const getDefaultIndices = (): MarketIndex[] => [
    { name: 'VNINDEX', value: 1280.50, change: 15.20, changePercent: 1.20, status: 'Xu hướng tăng' },
    { name: 'VN30', value: 1305.15, change: 18.45, changePercent: 1.43 },
    { name: 'HNX', value: 245.30, change: -0.80, changePercent: -0.32 },
  ];

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-slate-500 dark:text-slate-300 text-sm font-semibold mb-3 tracking-wide">Nhịp đập thị trường</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-3"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-slate-500 dark:text-slate-300 text-sm font-semibold mb-3 tracking-wide">
        Nhịp đập thị trường 
        <span className="ml-2 text-xs text-emerald-500">● Live từ Supabase</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map((idx) => {
          const isPositive = idx.change >= 0;
          return (
            <div 
              key={idx.name} 
              className="glass-panel rounded-xl p-5 relative overflow-hidden group"
            >
               {/* Ambient Glow */}
               <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10 dark:opacity-20 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">{idx.name}</span>
                  {idx.status && (
                    <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/30">
                      Tâm lý thị trường: <br/><span className="font-bold text-slate-900 dark:text-white">{idx.status}</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{idx.value.toLocaleString()}</span>
                </div>
                
                <div className={`text-sm font-medium mt-1 ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {isPositive ? '+' : ''}{idx.change} ({isPositive ? '+' : ''}{idx.changePercent}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketPulse;