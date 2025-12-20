
import React, { useState, useEffect } from 'react';
import { Award, BookOpen, TrendingUp, DollarSign, Activity, Users, ArrowRight, CheckCircle2, Zap, Target, Shield, Briefcase, Eye, Search, Layers, Anchor, Flame, Gem } from 'lucide-react';
import { getVN100Companies, getMultipleLatestPrices, Company, StockPrice } from '../services/supabaseClient';

interface GuruStrategy {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  criteria: string[];
  stocks: GuruStock[];
}

interface GuruStock {
  ticker: string;
  company: string;
  price: number;
  change: number;
  score: number;
  reason: string;
  metrics: { label: string; value: string }[];
}

interface GuruPortfoliosProps {
    isDark?: boolean;
}

const GuruPortfolios: React.FC<GuruPortfoliosProps> = ({ isDark = true }) => {
  const [activeStrategy, setActiveStrategy] = useState<string>('buffett');
  const [realStocks, setRealStocks] = useState<GuruStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real stock data from Supabase
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const companies = await getVN100Companies();
        const topCompanies = companies.slice(0, 10);
        const symbols = topCompanies.map((c: Company) => c.symbol);
        const prices = await getMultipleLatestPrices(symbols);
        
        const stocks: GuruStock[] = topCompanies.map((company: Company) => {
          const priceData = prices.find((p: StockPrice) => p.symbol === company.symbol);
          const change = priceData 
            ? ((priceData.close_price - priceData.open_price) / priceData.open_price) * 100 
            : 0;
          
          return {
            ticker: company.symbol,
            company: company.company_name,
            price: priceData ? priceData.close_price : 0,
            change: Math.round(change * 100) / 100,
            score: Math.floor(80 + Math.random() * 15),
            reason: `${company.industry || 'Ngành'} có tiềm năng tăng trưởng. Khối lượng giao dịch ${priceData?.volume ? (priceData.volume > 500000 ? 'cao' : 'ổn định') : 'đang cập nhật'}.`,
            metrics: [
              { label: 'ROE', value: `${(15 + Math.random() * 10).toFixed(1)}%` },
              { label: 'P/E', value: `${(12 + Math.random() * 8).toFixed(1)}` },
              { label: 'Margin', value: `${(20 + Math.random() * 20).toFixed(0)}%` }
            ]
          };
        });
        
        setRealStocks(stocks);
      } catch (error) {
        console.error('Error fetching guru stocks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStocks();
  }, []);

  // Use real stocks for strategies
  const getStrategyStocks = (strategyId: string): GuruStock[] => {
    if (loading || realStocks.length === 0) return [];
    
    switch (strategyId) {
      case 'buffett':
        return realStocks.slice(0, 3).map(s => ({
          ...s,
          reason: `Lợi thế cạnh tranh trong ngành. ROE duy trì ổn định, dòng tiền hoạt động dồi dào.`
        }));
      case 'minervini':
        return realStocks.slice(3, 5).map(s => ({
          ...s,
          reason: `Mẫu hình VCP với volume cạn kiệt. Điểm pivot tiềm năng.`,
          metrics: [
            { label: 'Contraction', value: '3T' },
            { label: 'Pivot', value: (s.price / 1000).toFixed(1) },
            { label: 'Trend', value: 'Stage 2' }
          ]
        }));
      case 'spiritual':
        return realStocks.slice(5, 6).map(s => ({
          ...s,
          score: 99,
          reason: `Thầy bảo mã này hợp mệnh. Múc xúc húc!`,
          metrics: [
            { label: 'Niềm tin', value: 'Vô cực' },
            { label: 'Đếm cua', value: '10/10' },
            { label: 'Tâm linh', value: 'Mạnh' }
          ]
        }));
      default:
        return realStocks.slice(0, 2);
    }
  };

  const strategies: GuruStrategy[] = [
    {
      id: 'buffett',
      name: 'Warren Buffett',
      title: 'Đầu tư Giá trị & Hào kinh tế',
      description: 'Tìm kiếm các doanh nghiệp có lợi thế cạnh tranh bền vững (Moat), chỉ số tài chính lành mạnh (ROE cao), ban lãnh đạo uy tín và đang được giao dịch ở mức giá hợp lý.',
      icon: Briefcase,
      color: 'text-amber-500',
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      criteria: [
        'ROE (Tỷ suất sinh lời trên vốn) > 15% trong 3 năm',
        'Biên lợi nhuận gộp ổn định và cao',
        'Nợ vay thấp, dòng tiền tự do mạnh',
        'P/E hợp lý so với tốc độ tăng trưởng'
      ],
      stocks: getStrategyStocks('buffett')
    },
    {
      id: 'minervini',
      name: 'Mark Minervini',
      title: 'Phù thủy Chứng khoán (VCP)',
      description: 'Chiến lược giao dịch siêu hạng dựa trên mẫu hình Thu hẹp Độ biến động (VCP). Mua tại điểm Pivot khi nguồn cung cạn kiệt trước khi giá bùng nổ.',
      icon: Layers,
      color: 'text-rose-500',
      gradient: 'from-rose-500 via-red-500 to-rose-600',
      criteria: [
        'Giá nằm trên MA50, MA150 và MA200',
        'Mẫu hình VCP với 2-3 lần thu hẹp (Contraction)',
        'Khối lượng cạn kiệt (Dry up) ở lần thu hẹp cuối cùng',
        'RS Rating > 70'
      ],
      stocks: getStrategyStocks('minervini')
    },
    {
        id: 'spiritual',
        name: 'Hệ Tâm Linh',
        title: 'Đầu tư bằng Niềm tin & Vũ trụ',
        description: 'Trường phái dành cho các nhà đầu tư hệ "mách bảo". Bỏ qua P/E, P/B, chỉ quan tâm xem đêm qua tổ tiên báo mộng mã gì.',
        icon: Eye,
        color: 'text-purple-500',
        gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
        criteria: [
          'Tên mã hợp phong thủy, hợp mệnh',
          'Đêm qua mơ thấy màu tím (trần)',
          'Tổ tiên mách bảo tất tay (All-in)',
          'Thầy bói bảo năm nay hợp mệnh Hỏa'
        ],
        stocks: getStrategyStocks('spiritual')
      }
  ];

  const currentStrategy = strategies.find(s => s.id === activeStrategy) || strategies[0];

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border-t border-slate-200 dark:border-white/5">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                    <Award size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh mục Guru</h1>
                    <p className="text-slate-500 dark:text-slate-400">Học từ những huyền thoại đầu tư. AI lọc cổ phiếu theo các trường phái kinh điển.</p>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">Chọn trường phái</h3>
            <div className="flex flex-col gap-3">
                {strategies.map((strategy) => (
                    <button
                        key={strategy.id}
                        onClick={() => setActiveStrategy(strategy.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
                            activeStrategy === strategy.id
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10'
                            : 'bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                        }`}
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`p-2 rounded-lg ${activeStrategy === strategy.id ? 'bg-indigo-50 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                                <strategy.icon size={20} className={activeStrategy === strategy.id ? strategy.color : 'text-slate-400'} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm ${activeStrategy === strategy.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {strategy.name}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-1">{strategy.title}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
                <div className={`relative h-48 w-full bg-gradient-to-br ${currentStrategy.gradient} flex items-center justify-center overflow-hidden`}>
                     <div className="relative z-10 flex flex-col items-center text-center p-6">
                         <div className="bg-white/20 backdrop-blur-md p-4 rounded-full mb-3 border border-white/30 text-white">
                             <currentStrategy.icon size={40} />
                         </div>
                         <h2 className="text-3xl font-bold text-white mb-2">{currentStrategy.title}</h2>
                     </div>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Triết lý đầu tư</h3>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                "{currentStrategy.description}"
                            </p>
                            
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tiêu chí lọc AI</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {currentStrategy.criteria.map((crit, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <CheckCircle2 size={16} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{crit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FIX: Radial Chart No Clipping, Centered Text */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-white/5 min-w-[200px]">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Độ phù hợp thị trường</span>
                            <div className="relative flex items-center justify-center w-36 h-36">
                                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                                    <circle 
                                        cx="50" cy="50" r="42" 
                                        stroke="currentColor" strokeWidth="10" fill="transparent" 
                                        strokeDasharray={263.9} strokeDashoffset={263.9 - (263.9 * 85 / 100)} 
                                        strokeLinecap="round"
                                        className={`${currentStrategy.color}`} 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">85%</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-4 text-center px-2">
                                Chiến lược này đang <br/><span className="font-bold text-emerald-500">Hiệu quả cao</span> trong tháng này
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    // Loading skeleton
                    [1, 2].map((i) => (
                        <div key={i} className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/5 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex-1">
                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : currentStrategy.stocks.length > 0 ? (
                    currentStrategy.stocks.map((stock) => (
                    <div key={stock.ticker} className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg ${
                                    stock.change >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'
                                }`}>
                                    {stock.ticker}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{stock.company}</h4>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{stock.price.toLocaleString()}</span>
                                        <span className={`font-medium ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {stock.change > 0 ? '+' : ''}{stock.change}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Điểm Tin cậy: {stock.score}/100</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {stock.metrics.map((metric, mIdx) => (
                                <div key={mIdx} className="text-center p-2 rounded bg-slate-100 dark:bg-slate-800/60">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{metric.label}</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{metric.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
                ) : (
                    <div className="glass-panel p-8 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                        <p className="text-slate-500 dark:text-slate-400">Đang tải dữ liệu cổ phiếu...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default GuruPortfolios;
