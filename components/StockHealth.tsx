import React, { useState, useEffect } from 'react';
import { StockData, NewsItem } from '../types';
import { getTopMovers, getVN100Companies, Company } from '../services/supabaseClient';

interface StockHealthProps {
  stock?: StockData;
  news: NewsItem[];
  isDark?: boolean;
}

const StockHealth: React.FC<StockHealthProps> = ({ stock: propStock, news, isDark = true }) => {
  const [stock, setStock] = useState<StockData | null>(propStock || null);
  const [loading, setLoading] = useState(!propStock);

  useEffect(() => {
    if (propStock) {
      setStock(propStock);
      return;
    }

    const fetchTopStock = async () => {
      try {
        const [movers, companies] = await Promise.all([
          getTopMovers(1),
          getVN100Companies()
        ]);
        
        if (movers.length > 0) {
          const topStock = movers[0];
          const company = companies.find((c: Company) => c.symbol === topStock.symbol);
          
          const priceChange = topStock.close_price - topStock.open_price;
          const changePercent = topStock.open_price > 0 
            ? (priceChange / topStock.open_price) * 100 
            : 0;
          
          setStock({
            ticker: topStock.symbol,
            name: company?.company_name || topStock.symbol,
            price: topStock.close_price,
            change: Math.round(priceChange),
            changePercent: Math.round(changePercent * 100) / 100,
            currency: 'VND',
            rsRating: Math.min(95, Math.floor(topStock.volume / 100000)),
            fundamentalScore: 70 + Math.floor(Math.random() * 20)
          });
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStock();
  }, [propStock]);

  if (loading || !stock) {
    return (
      <div className="glass-panel rounded-2xl p-6 col-span-1 lg:col-span-2 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 col-span-1 lg:col-span-2 flex flex-col h-full border-t border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      {/* Header với thông tin cổ phiếu */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cổ phiếu nổi bật hôm nay</span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </div>
        <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-50">
          {stock.ticker} 
          <span className="text-slate-500 font-normal text-sm ml-2">({stock.name})</span>
        </h3>
        
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {stock.price.toLocaleString()} <span className="text-lg font-normal text-slate-500">{stock.currency}</span>
          </span>
          <span className={`text-base font-semibold px-2 py-0.5 rounded ${
            stock.change >= 0 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
              : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
          }`}>
            {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
          </span>
        </div>
      </div>

      {/* Tin tức thị trường */}
      <div className="mt-auto">
        <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Tin tức thị trường
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {news.map((item: NewsItem) => (
            <div 
              key={item.id} 
              className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-white/5 p-3 rounded-lg cursor-pointer shadow-sm dark:shadow-none group"
            >
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold mb-1">{item.source}</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockHealth;