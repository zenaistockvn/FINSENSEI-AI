import React, { useState, useEffect } from 'react';
import { Sparkles, Filter, Activity, DollarSign, Zap, BarChart3, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getVN100Companies, getMultipleLatestPrices, Company, StockPrice } from '../services/supabaseClient';

interface ScreenerResult {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  rs: number;
  match: number;
  reason: string;
}

interface AIScreenerProps {
    isDark?: boolean;
}

const AIScreener: React.FC<AIScreenerProps> = ({ isDark = true }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companies = await getVN100Companies();
        const symbols = companies.slice(0, 30).map((c: Company) => c.symbol);
        const prices = await getMultipleLatestPrices(symbols);
        
        const screenerResults: ScreenerResult[] = companies.slice(0, 30).map((company: Company, index: number) => {
          const priceData = prices.find((p: StockPrice) => p.symbol === company.symbol);
          const change = priceData 
            ? ((priceData.close_price - priceData.open_price) / priceData.open_price) * 100 
            : 0;
          const rs = priceData ? Math.min(99, Math.floor(priceData.volume / 50000)) : 50;
          
          return {
            ticker: company.symbol,
            name: company.company_name,
            sector: company.industry || 'Khác',
            price: priceData ? priceData.close_price * 1000 : 0,
            change: Math.round(change * 100) / 100,
            rs: rs,
            match: Math.max(60, 98 - index * 2),
            reason: generateAIReason(company, priceData, change)
          };
        });
        
        // Sort by match score
        screenerResults.sort((a, b) => b.match - a.match);
        setResults(screenerResults);
      } catch (error) {
        console.error('Error fetching screener data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const generateAIReason = (company: Company, priceData: StockPrice | undefined, change: number): string => {
    if (!priceData) return 'Đang cập nhật dữ liệu...';
    
    const reasons = [
      `${company.industry || 'Ngành'} có triển vọng tăng trưởng tốt trong quý tới.`,
      `Khối lượng giao dịch ${priceData.volume > 1000000 ? 'cao' : 'ổn định'}, thanh khoản tốt.`,
      `Giá ${change > 0 ? 'tăng' : 'điều chỉnh'} ${Math.abs(change).toFixed(1)}%, ${change > 0 ? 'xu hướng tích cực' : 'cơ hội tích lũy'}.`,
      `Cổ phiếu ${company.exchange} với nền tảng cơ bản vững chắc.`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const currentResults = viewAll ? results : results.slice(0, 5);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    // Simulate API latency
    setTimeout(() => setIsSearching(false), 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
        {/* Header & Input Section */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border-t border-indigo-500/20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Bộ lọc thị trường AI</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                    Tìm kiếm <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Cơ hội đầu tư</span>
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                    Mô tả tiêu chí cổ phiếu của bạn bằng ngôn ngữ tự nhiên. Finsensei AI sẽ phân tích kỹ thuật, cơ bản và tâm lý thị trường để tìm ra các mã phù hợp nhất.
                </p>
                
                <div className="w-full relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Sparkles className={`h-5 w-5 ${isSearching ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full pl-14 pr-36 py-5 bg-white dark:bg-[#0b0f19]/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.2)] text-lg"
                        placeholder="Ví dụ: Tìm các công ty công nghệ có lợi nhuận tăng trưởng..."
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSearching ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang quét...</span>
                            </>
                        ) : (
                            <>
                                <span>Quét ngay</span>
                                <ArrowUpRight size={18} />
                            </>
                        )}
                    </button>
                </div>
                
                {/* Quick Filters */}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {[
                        { label: 'Mô hình bứt phá', icon: Zap },
                        { label: 'Cơ bản tốt', icon: BarChart3 },
                        { label: 'Cổ tức cao', icon: DollarSign },
                        { label: 'RS cao nhất', icon: Activity }
                    ].map((tag) => (
                        <button 
                            key={tag.label} 
                            onClick={() => setQuery(tag.label)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500/30 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all group"
                        >
                            <tag.icon size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                            {tag.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Results Section */}
        <div className="glass-panel p-6 rounded-2xl border-t border-cyan-500/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Filter className="text-indigo-500 dark:text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kết quả lọc</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tìm thấy {currentResults.length} kết quả phù hợp tiêu chí</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option>Sắp xếp: Độ phù hợp</option>
                        <option>Sắp xếp: Chỉ số RS</option>
                        <option>Sắp xếp: Tăng giá</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/50">
                <table className="w-full text-left border-collapse bg-slate-50/50 dark:bg-slate-900/20">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-900/40">
                            <th className="py-4 pl-6 font-medium">Mã CK</th>
                            <th className="py-4 font-medium">Ngành</th>
                            <th className="py-4 text-right font-medium">Giá</th>
                            <th className="py-4 text-right font-medium">24h %</th>
                            <th className="py-4 text-center font-medium">Chỉ số RS</th>
                            <th className="py-4 text-center font-medium">Độ hợp</th>
                            <th className="py-4 pl-6 font-medium">Nhận định AI</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isSearching || loading ? (
                            // Loading Skeletons
                            [1,2,3,4,5].map(i => (
                                <tr key={i} className="border-b border-slate-200 dark:border-slate-800/50">
                                    <td className="py-4 pl-6"><div className="h-10 w-24 bg-slate-200 dark:bg-slate-800/50 rounded-lg animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800/50 rounded animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800/50 rounded ml-auto animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800/50 rounded ml-auto animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-800/50 rounded mx-auto animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-6 w-12 bg-slate-200 dark:bg-slate-800/50 rounded-full mx-auto animate-pulse"></div></td>
                                    <td className="py-4 pl-6"><div className="h-4 w-full bg-slate-200 dark:bg-slate-800/50 rounded animate-pulse"></div></td>
                                </tr>
                            ))
                         ) : (
                            currentResults.map((stock) => (
                                <tr key={stock.ticker} className="border-b border-slate-200 dark:border-slate-800/50 text-sm hover:bg-white dark:hover:bg-white/5 transition-colors group">
                                    <td className="py-4 pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stock.ticker}</span>
                                            <span className="text-xs text-slate-500">{stock.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-slate-600 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                                            {stock.sector === 'Công nghệ' && <Activity size={10} />}
                                            {stock.sector === 'Tài chính' && <DollarSign size={10} />}
                                            {stock.sector === 'Vật liệu cơ bản' && <BarChart3 size={10} />}
                                            {stock.sector}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right text-slate-700 dark:text-slate-200 font-mono">{stock.price.toLocaleString()}</td>
                                    <td className={`py-4 text-right font-medium font-mono ${stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                        {stock.change > 0 ? '+' : ''}{stock.change}%
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" 
                                                    style={{ width: `${stock.rs}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-white">{stock.rs}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                         <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                             stock.match >= 90 
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20'
                                         }`}>
                                            {stock.match}% Hợp
                                        </span>
                                    </td>
                                    <td className="py-4 pl-6 text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-xs">
                                        {stock.reason}
                                    </td>
                                </tr>
                            ))
                         )}
                    </tbody>
                </table>
            </div>
            
            {!isSearching && !loading && (
                <div className="mt-4 flex justify-center">
                    <button 
                      onClick={() => setViewAll(!viewAll)}
                      className="text-slate-500 hover:text-indigo-600 dark:hover:text-white text-sm transition-colors flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-full"
                    >
                        {viewAll ? (
                           <>
                              Thu gọn <ChevronUp size={14} />
                           </>
                        ) : (
                           <>
                              Xem tất cả {results.length} kết quả <ChevronDown size={14} />
                           </>
                        )}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default AIScreener;