
import React, { useState, useEffect, useMemo } from 'react';
import { Award, BookOpen, TrendingUp, DollarSign, Activity, Users, ArrowRight, CheckCircle2, Zap, Target, Shield, Briefcase, Eye, Search, Layers, Anchor, Flame, Gem, Filter, SortAsc, SortDesc, BarChart3, TrendingDown, RefreshCw } from 'lucide-react';

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

interface GuruStockFromDB {
  strategy_id: string;
  strategy_name: string;
  symbol: string;
  company_name: string;
  industry: string;
  current_price: number;
  price_change: number;
  guru_score: number;
  match_reason: string;
  metrics: Record<string, string | number>;
  rank_in_strategy: number;
  calculation_date: string;
}

interface GuruPortfoliosProps {
    isDark?: boolean;
}

type SortField = 'score' | 'change' | 'price';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'positive' | 'negative' | 'high_score';

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const GuruPortfolios: React.FC<GuruPortfoliosProps> = ({ isDark = true }) => {
  const [activeStrategy, setActiveStrategy] = useState<string>('buffett');
  const [stocksByStrategy, setStocksByStrategy] = useState<Map<string, GuruStock[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch guru stocks from Supabase
  const fetchGuruStocks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/guru_stocks?order=calculation_date.desc,rank_in_strategy.asc&limit=100`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data: GuruStockFromDB[] = await response.json();
      
      // Group by strategy
      const grouped = new Map<string, GuruStock[]>();
      
      data.forEach(stock => {
        const guruStock: GuruStock = {
          ticker: stock.symbol,
          company: stock.company_name,
          price: stock.current_price || 0,
          change: stock.price_change || 0,
          score: stock.guru_score,
          reason: stock.match_reason,
          metrics: Object.entries(stock.metrics || {}).map(([label, value]) => ({
            label,
            value: String(value)
          }))
        };
        
        if (!grouped.has(stock.strategy_id)) {
          grouped.set(stock.strategy_id, []);
        }
        grouped.get(stock.strategy_id)!.push(guruStock);
      });
      
      setStocksByStrategy(grouped);
      
      if (data.length > 0) {
        setLastUpdated(data[0].calculation_date);
      }
      
    } catch (error) {
      console.error('Error fetching guru stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuruStocks();
  }, []);

  // Get stocks for a strategy from database
  const getStrategyStocks = (strategyId: string): GuruStock[] => {
    return stocksByStrategy.get(strategyId) || [];
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
      id: 'lynch',
      name: 'Peter Lynch',
      title: 'Tăng trưởng hợp lý (GARP)',
      description: 'Tìm kiếm cổ phiếu tăng trưởng với P/E hợp lý. Đầu tư vào những gì bạn hiểu - các doanh nghiệp quen thuộc trong cuộc sống hàng ngày.',
      icon: Target,
      color: 'text-blue-500',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      criteria: [
        'PEG Ratio < 1 (P/E / Tốc độ tăng trưởng EPS)',
        'Tăng trưởng EPS 15-25%/năm liên tục',
        'Nợ/Vốn chủ sở hữu < 35%',
        'Doanh nghiệp dễ hiểu, quen thuộc'
      ],
      stocks: getStrategyStocks('lynch')
    },
    {
      id: 'graham',
      name: 'Benjamin Graham',
      title: 'Cha đẻ Đầu tư Giá trị',
      description: 'Mua cổ phiếu dưới giá trị nội tại với biên an toàn (Margin of Safety). Tập trung vào các công ty có tài chính vững mạnh và định giá rẻ.',
      icon: Shield,
      color: 'text-emerald-500',
      gradient: 'from-emerald-500 via-green-500 to-teal-600',
      criteria: [
        'P/E < 15 và P/B < 1.5',
        'Current Ratio > 2 (Khả năng thanh toán)',
        'Cổ tức liên tục nhiều năm',
        'Không lỗ trong 5 năm gần nhất'
      ],
      stocks: getStrategyStocks('graham')
    },
    {
      id: 'canslim',
      name: "William O'Neil",
      title: 'CAN SLIM - Siêu tăng trưởng',
      description: 'Kết hợp phân tích cơ bản và kỹ thuật để tìm cổ phiếu tăng trưởng mạnh. Mua khi breakout khỏi nền giá với volume tăng đột biến.',
      icon: Flame,
      color: 'text-orange-500',
      gradient: 'from-orange-500 via-red-500 to-orange-600',
      criteria: [
        'EPS quý gần nhất tăng > 25%',
        'EPS hàng năm tăng > 25% trong 3 năm',
        'Sản phẩm/dịch vụ mới, đột phá',
        'RS Rating > 80 (Sức mạnh tương đối)'
      ],
      stocks: getStrategyStocks('canslim')
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
        'Khối lượng cạn kiệt (Dry up) ở lần thu hẹp cuối',
        'RS Rating > 70'
      ],
      stocks: getStrategyStocks('minervini')
    },
    {
      id: 'dalio',
      name: 'Ray Dalio',
      title: 'All Weather - Mọi thời tiết',
      description: 'Xây dựng danh mục cân bằng có thể hoạt động tốt trong mọi điều kiện kinh tế. Đa dạng hóa theo loại tài sản và tương quan.',
      icon: Anchor,
      color: 'text-indigo-500',
      gradient: 'from-indigo-500 via-purple-500 to-indigo-600',
      criteria: [
        'Beta thấp, ít biến động so với thị trường',
        'Tương quan thấp giữa các cổ phiếu',
        'Cổ tức ổn định, dòng tiền đều đặn',
        'Phân bổ đa ngành, đa lĩnh vực'
      ],
      stocks: getStrategyStocks('dalio')
    }
  ];

  const currentStrategy = strategies.find(s => s.id === activeStrategy) || strategies[0];

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let stocks = [...currentStrategy.stocks];
    
    // Apply search filter
    if (searchQuery) {
      stocks = stocks.filter(s => 
        s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    switch (filterType) {
      case 'positive':
        stocks = stocks.filter(s => s.change >= 0);
        break;
      case 'negative':
        stocks = stocks.filter(s => s.change < 0);
        break;
      case 'high_score':
        stocks = stocks.filter(s => s.score >= 85);
        break;
    }
    
    // Apply sorting
    stocks.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return (a[sortField] - b[sortField]) * multiplier;
    });
    
    return stocks;
  }, [currentStrategy.stocks, searchQuery, filterType, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border-t border-slate-200 dark:border-white/5">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                    <Award size={32} />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh mục Guru</h1>
                    <p className="text-slate-500 dark:text-slate-400">Học từ những huyền thoại đầu tư. AI lọc cổ phiếu theo các trường phái kinh điển.</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                      <span className="text-xs text-slate-500">
                        Cập nhật: {new Date(lastUpdated).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <button
                      onClick={fetchGuruStocks}
                      disabled={loading}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      title="Làm mới dữ liệu"
                    >
                      <RefreshCw size={18} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                    </button>
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

            {/* Filter & Sort Toolbar */}
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã cổ phiếu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <div className="flex gap-1">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'positive', label: 'Tăng', icon: TrendingUp },
                      { id: 'negative', label: 'Giảm', icon: TrendingDown },
                      { id: 'high_score', label: 'Score ≥85' }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setFilterType(filter.id as FilterType)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                          filterType === filter.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {filter.icon && <filter.icon size={12} />}
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-slate-400" />
                  <div className="flex gap-1">
                    {[
                      { id: 'score', label: 'Điểm' },
                      { id: 'change', label: '% Thay đổi' },
                      { id: 'price', label: 'Giá' }
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => toggleSort(sort.id as SortField)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                          sortField === sort.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sort.label}
                        {sortField === sort.id && (
                          sortOrder === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Results count */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Hiển thị {filteredAndSortedStocks.length} / {currentStrategy.stocks.length} cổ phiếu
                </span>
                {(searchQuery || filterType !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                )}
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
                ) : filteredAndSortedStocks.length > 0 ? (
                    filteredAndSortedStocks.map((stock) => (
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
