import React, { useState, useEffect } from 'react';
import { StockData, NewsItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
          
          // Calculate change from open to close
          const priceChange = topStock.close_price - topStock.open_price;
          const changePercent = topStock.open_price > 0 
            ? (priceChange / topStock.open_price) * 100 
            : 0;
          
          setStock({
            ticker: topStock.symbol,
            name: company?.company_name || topStock.symbol,
            price: topStock.close_price * 1000,
            change: Math.round(priceChange * 1000),
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
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      </div>
    );
  }
  const rsData = [
    { name: 'Score', value: stock.rsRating },
    { name: 'Remaining', value: 100 - stock.rsRating }
  ];
  const COLORS = ['#06b6d4', isDark ? '#1e293b' : '#cbd5e1']; // Cyan and dark slate (or light slate in light mode)

  return (
    <div className="glass-panel rounded-2xl p-6 col-span-1 lg:col-span-2 flex flex-col h-full border-t border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
            <h3 className="text-lg font-bold text-cyan-700 dark:text-cyan-50">{stock.ticker} <span className="text-slate-500 font-normal text-sm ml-2">({stock.name})</span></h3>
            
            <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{stock.price.toLocaleString()} {stock.currency}</span>
                <span className={`text-lg font-medium ${stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                </span>
            </div>
        </div>
        
        {/* Gauge Chart */}
        <div className="relative w-40 h-40 flex-shrink-0 mx-auto md:mx-0 mt-4 md:mt-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={rsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={70}
                        startAngle={200}
                        endAngle={-20}
                        dataKey="value"
                        cornerRadius={10}
                        stroke="none"
                    >
                        {rsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-xs uppercase">Chỉ số RS</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stock.rsRating}<span className="text-slate-500 text-sm">/100</span></span>
            </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-300">Chỉ số RS (Sức mạnh giá)</span>
                <span className="text-slate-900 dark:text-white font-bold">{stock.rsRating}/100</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                    style={{ width: `${stock.rsRating}%` }}
                ></div>
            </div>
        </div>
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-300">Cơ bản</span>
                <span className="text-slate-900 dark:text-white font-bold">{stock.fundamentalScore}/100</span>
            </div>
             <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" 
                    style={{ width: `${stock.fundamentalScore}%` }}
                ></div>
            </div>
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Tin tức thị trường</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {news.map((item: NewsItem) => (
                <div key={item.id} className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-white/5 p-3 rounded-lg cursor-pointer shadow-sm dark:shadow-none">
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold mb-1">{item.source}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed">{item.summary}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StockHealth;