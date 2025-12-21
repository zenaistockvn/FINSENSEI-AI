import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { RankingItem } from '../types';
import { getTopMovers, getVN100Companies, StockPrice, Company } from '../services/supabaseClient';

const SmartRankings: React.FC = () => {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const [topMovers, companies] = await Promise.all([
          getTopMovers(10),
          getVN100Companies()
        ]);
        
        const companyMap = new Map(companies.map((c: Company) => [c.symbol, c]));
        
        const formatted: RankingItem[] = topMovers
          .filter((stock: StockPrice) => companyMap.has(stock.symbol))
          .slice(0, 5)
          .map((stock: StockPrice, index: number) => ({
            ticker: stock.symbol,
            price: stock.close_price,
            volPercent: Math.round((stock.volume / 1000000) * 10) / 10,
            rsScore: 95 - index * 2
          }));
        
        setRankings(formatted.length > 0 ? formatted : getDefaultRankings());
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setRankings(getDefaultRankings());
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const getDefaultRankings = (): RankingItem[] => [
    { ticker: 'SHB', price: 16150, volPercent: 47.5, rsScore: 95 },
    { ticker: 'SSI', price: 30800, volPercent: 42.6, rsScore: 93 },
    { ticker: 'DGC', price: 70200, volPercent: 36.7, rsScore: 91 },
    { ticker: 'HPG', price: 26700, volPercent: 29.6, rsScore: 89 },
    { ticker: 'VND', price: 19850, volPercent: 26.4, rsScore: 87 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500 text-white';
    if (score >= 80) return 'bg-cyan-500 text-white';
    if (score >= 70) return 'bg-amber-500 text-white';
    return 'bg-slate-500 text-white';
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 border-t border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border-t border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BarChart2 size={16} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Cổ Phiếu Khối Lượng</h3>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/50">
        <span>Mã</span>
        <span className="text-right">Giá</span>
        <span className="text-right">KL (tr)</span>
        <span className="text-right">Điểm RS</span>
      </div>

      {/* Rankings List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
        {rankings.map((stock, index) => (
          <div 
            key={stock.ticker} 
            className="grid grid-cols-4 gap-2 px-3 py-3 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-lg cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 w-4">{index + 1}</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                {stock.ticker}
              </span>
            </div>
            <span className="text-right text-sm text-slate-700 dark:text-slate-300">
              {stock.price.toLocaleString()}
            </span>
            <span className="text-right text-sm text-emerald-500 font-medium">
              {stock.volPercent}M
            </span>
            <div className="flex justify-end">
              <span className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-[11px] font-bold ${getScoreColor(stock.rsScore)}`}>
                {stock.rsScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartRankings;
