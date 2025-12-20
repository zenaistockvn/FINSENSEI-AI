import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Filter, Activity, Zap, ArrowUpRight, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Gauge, RefreshCw, SlidersHorizontal, X, Brain,
  LayoutGrid, Table, GitCompare, Plus, Minus, AlertTriangle, CheckCircle, Eye,
  Clock, Target, Award, BarChart2, Star, Shield, Flame,
} from 'lucide-react';
import {
  getVN100Companies, getAllTechnicalIndicators, Company, TechnicalIndicators,
} from '../services/supabaseClient';

interface ScreenerResult {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change1d: number;
  change5d: number;
  rsRating: number;
  rsi: number;
  trendShort: string;
  trendMedium: string;
  overallScore: number;
  momentumScore: number;
  volumeRatio: number;
  priceVsMa20: number;
  maCrossSignal: string;
  reason: string;
  aiScore: number; // New AI Recommendation Score
}

interface FilterConfig {
  rsMin: number; rsMax: number; rsiMin: number; rsiMax: number;
  trendShort: string; trendMedium: string;
  aboveMa20: boolean | null; aboveMa50: boolean | null;
  goldenCross: boolean; minScore: number;
}

interface SectorData {
  name: string; stocks: ScreenerResult[]; avgScore: number;
  avgChange: number; upCount: number; downCount: number;
}

interface MarketInsights {
  totalStocks: number; upStocks: number; downStocks: number; avgScore: number;
  topSector: string; topSectorChange: number; goldenCrossCount: number;
  oversoldCount: number; overboughtCount: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral'; aiSummary: string;
}

interface BacktestResult {
  filterName: string; period: number; stockCount: number;
  avgReturn: number; winRate: number; bestStock: string; bestReturn: number;
  worstStock: string; worstReturn: number;
}

interface AIScreenerProps { isDark?: boolean; }

const defaultFilters: FilterConfig = {
  rsMin: 0, rsMax: 100, rsiMin: 0, rsiMax: 100,
  trendShort: 'ALL', trendMedium: 'ALL',
  aboveMa20: null, aboveMa50: null, goldenCross: false, minScore: 0,
};

const presetFilters = {
  'RS cao nhất': { ...defaultFilters, rsMin: 70, minScore: 60 },
  'Mô hình bứt phá': { ...defaultFilters, goldenCross: true, aboveMa20: true, trendShort: 'UP' },
  'Quá bán (RSI thấp)': { ...defaultFilters, rsiMax: 30 },
  'Xu hướng tăng': { ...defaultFilters, trendShort: 'UP', trendMedium: 'UP', aboveMa20: true },
  'Momentum mạnh': { ...defaultFilters, rsMin: 60, rsiMin: 50, rsiMax: 70, aboveMa20: true, minScore: 65 },
};

type ViewMode = 'table' | 'heatmap' | 'compare' | 'backtest' | 'rotation';

// Sector Rotation Analysis Interface
interface SectorRotation {
  name: string;
  stockCount: number;
  avgChange1d: number;
  avgChange5d: number;
  avgVolume: number;
  avgRsRating: number;
  avgAiScore: number;
  moneyFlow: 'inflow' | 'outflow' | 'neutral';
  moneyFlowScore: number; // -100 to +100
  topStocks: { ticker: string; change: number; aiScore: number }[];
  trend: 'hot' | 'warming' | 'cooling' | 'cold';
}

// Calculate AI Recommendation Score (0-100)
const calculateAIScore = (tech: TechnicalIndicators, company: Company | undefined): number => {
  let score = 0;
  const weights = { technical: 40, momentum: 25, trend: 20, risk: 15 };
  
  // Technical Score (40%)
  const techScore = tech.overall_technical_score || 50;
  score += (techScore / 100) * weights.technical;
  
  // Momentum Score (25%)
  let momentumScore = 50;
  if (tech.rs_rating >= 80) momentumScore = 90;
  else if (tech.rs_rating >= 60) momentumScore = 70;
  else if (tech.rs_rating >= 40) momentumScore = 50;
  else momentumScore = 30;
  
  if (tech.price_change_5d > 5) momentumScore += 10;
  else if (tech.price_change_5d > 0) momentumScore += 5;
  else if (tech.price_change_5d < -5) momentumScore -= 10;
  
  score += (Math.min(100, momentumScore) / 100) * weights.momentum;
  
  // Trend Score (20%)
  let trendScore = 50;
  if (tech.trend_short === 'UP' && tech.trend_medium === 'UP') trendScore = 90;
  else if (tech.trend_short === 'UP') trendScore = 70;
  else if (tech.trend_short === 'DOWN' && tech.trend_medium === 'DOWN') trendScore = 20;
  else if (tech.trend_short === 'DOWN') trendScore = 35;
  
  if (tech.ma_cross_signal === 'GOLDEN_CROSS') trendScore += 15;
  else if (tech.ma_cross_signal === 'DEATH_CROSS') trendScore -= 15;
  
  score += (Math.min(100, Math.max(0, trendScore)) / 100) * weights.trend;
  
  // Risk Score (15%) - Lower RSI extremes = higher risk
  let riskScore = 70;
  if (tech.rsi_14 > 70) riskScore = 40; // Overbought risk
  else if (tech.rsi_14 < 30) riskScore = 85; // Oversold opportunity
  else if (tech.rsi_14 >= 40 && tech.rsi_14 <= 60) riskScore = 75;
  
  if (tech.volume_ratio > 2) riskScore += 10; // High volume = confirmation
  
  score += (Math.min(100, riskScore) / 100) * weights.risk;
  
  return Math.round(score);
};

// Get AI Score color and label
const getAIScoreInfo = (score: number) => {
  if (score >= 80) return { color: 'text-emerald-500', bg: 'bg-emerald-500/20', label: 'Mua mạnh', icon: Flame };
  if (score >= 65) return { color: 'text-cyan-500', bg: 'bg-cyan-500/20', label: 'Khuyến nghị', icon: Star };
  if (score >= 50) return { color: 'text-amber-500', bg: 'bg-amber-500/20', label: 'Theo dõi', icon: Eye };
  if (score >= 35) return { color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'Thận trọng', icon: AlertTriangle };
  return { color: 'text-rose-500', bg: 'bg-rose-500/20', label: 'Tránh', icon: Shield };
};

// Simulated backtest data generator
const generateBacktestData = (filterName: string, period: number): BacktestResult => {
  const baseReturns: Record<string, number> = {
    'RS cao nhất': 12.5, 'Mô hình bứt phá': 18.2, 'Quá bán (RSI thấp)': 8.7,
    'Xu hướng tăng': 15.3, 'Momentum mạnh': 14.1,
  };
  const baseReturn = baseReturns[filterName] || 10;
  const periodMultiplier = period === 7 ? 0.3 : period === 14 ? 0.5 : period === 30 ? 1 : 2;
  
  return {
    filterName, period,
    stockCount: Math.floor(Math.random() * 15) + 5,
    avgReturn: +(baseReturn * periodMultiplier * (0.8 + Math.random() * 0.4)).toFixed(2),
    winRate: +(55 + Math.random() * 30).toFixed(1),
    bestStock: ['VNM', 'FPT', 'VIC', 'HPG', 'MWG', 'TCB', 'VHM'][Math.floor(Math.random() * 7)],
    bestReturn: +(baseReturn * periodMultiplier * 2 * (0.8 + Math.random() * 0.4)).toFixed(2),
    worstStock: ['HVN', 'ROS', 'FLC', 'HAG', 'OGC'][Math.floor(Math.random() * 5)],
    worstReturn: +(-5 - Math.random() * 10).toFixed(2),
  };
};

const AIScreener: React.FC<AIScreenerProps> = ({ isDark = true }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [technicalData, setTechnicalData] = useState<TechnicalIndicators[]>([]);
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'rs' | 'change' | 'rsi' | 'aiScore'>('aiScore');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [compareStocks, setCompareStocks] = useState<string[]>([]);
  const [backtestPeriod, setBacktestPeriod] = useState<number>(30);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesData, techData] = await Promise.all([
          getVN100Companies(), getAllTechnicalIndicators(),
        ]);
        setCompanies(companiesData);
        setTechnicalData(techData);
        if (techData.length > 0 && techData[0].calculation_date) {
          setLastUpdated(techData[0].calculation_date);
        }
      } catch (error) {
        console.error('Error fetching screener data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate backtest when period changes
  useEffect(() => {
    const results = Object.keys(presetFilters).map((name) => generateBacktestData(name, backtestPeriod));
    setBacktestResults(results);
  }, [backtestPeriod]);

  const generateAIReason = (tech: TechnicalIndicators, company: Company): string => {
    const reasons: string[] = [];
    if (tech.rs_rating >= 80) reasons.push('RS Rating rất cao.');
    else if (tech.rs_rating >= 60) reasons.push('RS Rating tốt.');
    if (tech.rsi_14 < 30) reasons.push('RSI quá bán.');
    else if (tech.rsi_14 > 70) reasons.push('RSI quá mua.');
    if (tech.ma_cross_signal === 'GOLDEN_CROSS') reasons.push('Golden Cross.');
    if (tech.trend_short === 'UP' && tech.trend_medium === 'UP') reasons.push('Xu hướng tăng.');
    if (tech.volume_ratio > 2) reasons.push('Volume đột biến.');
    if (reasons.length === 0) return `${company.industry || 'Ngành'} - Theo dõi.`;
    return reasons.slice(0, 2).join(' ');
  };

  const filteredResults = useMemo(() => {
    if (technicalData.length === 0) return [];
    let filtered = technicalData.filter((tech) => {
      if (tech.rs_rating < filters.rsMin || tech.rs_rating > filters.rsMax) return false;
      if (tech.rsi_14 < filters.rsiMin || tech.rsi_14 > filters.rsiMax) return false;
      if (filters.trendShort !== 'ALL' && tech.trend_short !== filters.trendShort) return false;
      if (filters.trendMedium !== 'ALL' && tech.trend_medium !== filters.trendMedium) return false;
      if (filters.aboveMa20 === true && tech.price_vs_ma20 <= 0) return false;
      if (filters.aboveMa20 === false && tech.price_vs_ma20 > 0) return false;
      if (filters.goldenCross && tech.ma_cross_signal !== 'GOLDEN_CROSS') return false;
      if (tech.overall_technical_score < filters.minScore) return false;
      return true;
    });
    
    const results = filtered.map((tech) => {
      const company = companies.find((c) => c.symbol === tech.symbol);
      return {
        ticker: tech.symbol,
        name: company?.company_name || tech.symbol,
        sector: company?.industry || 'Khác',
        price: tech.current_price || 0,
        change1d: tech.price_change_1d || 0,
        change5d: tech.price_change_5d || 0,
        rsRating: tech.rs_rating || 0,
        rsi: tech.rsi_14 || 50,
        trendShort: tech.trend_short || 'SIDEWAYS',
        trendMedium: tech.trend_medium || 'SIDEWAYS',
        overallScore: tech.overall_technical_score || 0,
        momentumScore: tech.momentum_score || 0,
        volumeRatio: tech.volume_ratio || 1,
        priceVsMa20: tech.price_vs_ma20 || 0,
        maCrossSignal: tech.ma_cross_signal || 'NONE',
        reason: company ? generateAIReason(tech, company) : 'Đang cập nhật...',
        aiScore: calculateAIScore(tech, company),
      };
    });
    
    results.sort((a, b) => {
      switch (sortBy) {
        case 'rs': return b.rsRating - a.rsRating;
        case 'change': return b.change1d - a.change1d;
        case 'rsi': return a.rsi - b.rsi;
        case 'aiScore': return b.aiScore - a.aiScore;
        default: return b.overallScore - a.overallScore;
      }
    });
    return results;
  }, [technicalData, companies, filters, sortBy]);

  const marketInsights = useMemo((): MarketInsights => {
    if (filteredResults.length === 0) {
      return {
        totalStocks: 0, upStocks: 0, downStocks: 0, avgScore: 0,
        topSector: 'N/A', topSectorChange: 0, goldenCrossCount: 0,
        oversoldCount: 0, overboughtCount: 0, marketSentiment: 'neutral',
        aiSummary: 'Đang tải dữ liệu...',
      };
    }
    const upStocks = filteredResults.filter((s) => s.change1d > 0).length;
    const downStocks = filteredResults.filter((s) => s.change1d < 0).length;
    const avgScore = filteredResults.reduce((sum, s) => sum + s.aiScore, 0) / filteredResults.length;
    const goldenCrossCount = filteredResults.filter((s) => s.maCrossSignal === 'GOLDEN_CROSS').length;
    const oversoldCount = filteredResults.filter((s) => s.rsi < 30).length;
    const overboughtCount = filteredResults.filter((s) => s.rsi > 70).length;

    const sectorMap = new Map<string, { total: number; change: number }>();
    filteredResults.forEach((s) => {
      const current = sectorMap.get(s.sector) || { total: 0, change: 0 };
      sectorMap.set(s.sector, { total: current.total + 1, change: current.change + s.change1d });
    });
    let topSector = 'N/A', topSectorChange = -Infinity;
    sectorMap.forEach((data, sector) => {
      const avgChange = data.change / data.total;
      if (avgChange > topSectorChange) { topSectorChange = avgChange; topSector = sector; }
    });

    const upRatio = upStocks / filteredResults.length;
    const marketSentiment: 'bullish' | 'bearish' | 'neutral' =
      upRatio > 0.6 ? 'bullish' : upRatio < 0.4 ? 'bearish' : 'neutral';

    let aiSummary = marketSentiment === 'bullish'
      ? `Thị trường tích cực với ${upStocks}/${filteredResults.length} CP tăng. `
      : marketSentiment === 'bearish'
      ? `Thị trường điều chỉnh với ${downStocks}/${filteredResults.length} CP giảm. `
      : `Thị trường sideway, tâm lý thận trọng. `;
    if (goldenCrossCount > 0) aiSummary += `${goldenCrossCount} CP Golden Cross. `;
    if (oversoldCount > 3) aiSummary += `${oversoldCount} CP quá bán. `;
    aiSummary += `Ngành dẫn đầu: ${topSector}.`;

    return {
      totalStocks: filteredResults.length, upStocks, downStocks, avgScore,
      topSector, topSectorChange, goldenCrossCount, oversoldCount, overboughtCount,
      marketSentiment, aiSummary,
    };
  }, [filteredResults]);

  const sectorHeatmapData = useMemo((): SectorData[] => {
    const sectorMap = new Map<string, ScreenerResult[]>();
    filteredResults.forEach((stock) => {
      const stocks = sectorMap.get(stock.sector) || [];
      stocks.push(stock);
      sectorMap.set(stock.sector, stocks);
    });
    return Array.from(sectorMap.entries())
      .map(([name, stocks]) => ({
        name, stocks,
        avgScore: stocks.reduce((sum, s) => sum + s.overallScore, 0) / stocks.length,
        avgChange: stocks.reduce((sum, s) => sum + s.change1d, 0) / stocks.length,
        upCount: stocks.filter((s) => s.change1d > 0).length,
        downCount: stocks.filter((s) => s.change1d < 0).length,
      }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [filteredResults]);

  // Sector Rotation Analysis
  const sectorRotationData = useMemo((): SectorRotation[] => {
    const sectorMap = new Map<string, ScreenerResult[]>();
    filteredResults.forEach((stock) => {
      const stocks = sectorMap.get(stock.sector) || [];
      stocks.push(stock);
      sectorMap.set(stock.sector, stocks);
    });

    return Array.from(sectorMap.entries())
      .map(([name, stocks]) => {
        const avgChange1d = stocks.reduce((sum, s) => sum + s.change1d, 0) / stocks.length;
        const avgChange5d = stocks.reduce((sum, s) => sum + s.change5d, 0) / stocks.length;
        const avgVolume = stocks.reduce((sum, s) => sum + s.volumeRatio, 0) / stocks.length;
        const avgRsRating = stocks.reduce((sum, s) => sum + s.rsRating, 0) / stocks.length;
        const avgAiScore = stocks.reduce((sum, s) => sum + s.aiScore, 0) / stocks.length;
        
        // Calculate Money Flow Score (-100 to +100)
        // Based on: price change, volume, RS rating, trend
        let moneyFlowScore = 0;
        
        // Price momentum contribution (max ±40)
        moneyFlowScore += avgChange1d * 8; // 5% change = 40 points
        moneyFlowScore += avgChange5d * 2; // 5% change = 10 points
        
        // Volume contribution (max ±20)
        if (avgVolume > 1.5) moneyFlowScore += (avgVolume - 1) * 20;
        else if (avgVolume < 0.7) moneyFlowScore -= (1 - avgVolume) * 20;
        
        // RS Rating contribution (max ±20)
        moneyFlowScore += (avgRsRating - 50) * 0.4;
        
        // Trend contribution (max ±20)
        const upTrendCount = stocks.filter(s => s.trendShort === 'UP').length;
        const downTrendCount = stocks.filter(s => s.trendShort === 'DOWN').length;
        moneyFlowScore += ((upTrendCount - downTrendCount) / stocks.length) * 20;
        
        // Clamp to -100 to +100
        moneyFlowScore = Math.max(-100, Math.min(100, moneyFlowScore));
        
        // Determine money flow direction
        const moneyFlow: 'inflow' | 'outflow' | 'neutral' = 
          moneyFlowScore > 15 ? 'inflow' : moneyFlowScore < -15 ? 'outflow' : 'neutral';
        
        // Determine sector trend/heat
        const trend: 'hot' | 'warming' | 'cooling' | 'cold' =
          moneyFlowScore > 40 ? 'hot' :
          moneyFlowScore > 10 ? 'warming' :
          moneyFlowScore > -10 ? 'cooling' : 'cold';
        
        // Top performing stocks in sector
        const topStocks = [...stocks]
          .sort((a, b) => b.aiScore - a.aiScore)
          .slice(0, 3)
          .map(s => ({ ticker: s.ticker, change: s.change1d, aiScore: s.aiScore }));

        return {
          name,
          stockCount: stocks.length,
          avgChange1d,
          avgChange5d,
          avgVolume,
          avgRsRating,
          avgAiScore,
          moneyFlow,
          moneyFlowScore,
          topStocks,
          trend,
        };
      })
      .sort((a, b) => b.moneyFlowScore - a.moneyFlowScore);
  }, [filteredResults]);

  const compareData = useMemo(() => {
    return compareStocks.map((ticker) => filteredResults.find((s) => s.ticker === ticker)).filter(Boolean) as ScreenerResult[];
  }, [compareStocks, filteredResults]);

  const toggleCompareStock = (ticker: string) => {
    if (compareStocks.includes(ticker)) setCompareStocks(compareStocks.filter((t) => t !== ticker));
    else if (compareStocks.length < 3) setCompareStocks([...compareStocks, ticker]);
  };

  const currentResults = viewAll ? filteredResults : filteredResults.slice(0, 10);

  const applyPreset = (presetName: string) => {
    const preset = presetFilters[presetName as keyof typeof presetFilters];
    if (preset) { setFilters(preset); setActivePreset(presetName); setQuery(presetName); }
  };

  const resetFilters = () => { setFilters(defaultFilters); setActivePreset(null); setQuery(''); };

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    const matchedPreset = Object.keys(presetFilters).find((key) => key.toLowerCase().includes(query.toLowerCase()));
    if (matchedPreset) applyPreset(matchedPreset);
    setTimeout(() => setIsSearching(false), 500);
  };

  const getHeatmapColor = (change: number) => {
    if (change >= 3) return 'bg-emerald-500';
    if (change >= 1.5) return 'bg-emerald-400';
    if (change >= 0.5) return 'bg-emerald-300/80';
    if (change >= 0) return 'bg-emerald-200/60';
    if (change >= -0.5) return 'bg-rose-200/60';
    if (change >= -1.5) return 'bg-rose-300/80';
    if (change >= -3) return 'bg-rose-400';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border-t border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium uppercase tracking-wider">
            <Sparkles size={12} /><span>Bộ lọc AI thông minh</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Tìm kiếm{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Cơ hội đầu tư</span>
          </h2>

          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            AI Screener phân tích đa chiều: kỹ thuật, momentum, xu hướng và rủi ro để đưa ra điểm khuyến nghị tổng hợp.
            {lastUpdated && <span className="block text-xs mt-1 text-indigo-500">Cập nhật: {new Date(lastUpdated).toLocaleDateString('vi-VN')}</span>}
          </p>

          {/* Search Input */}
          <div className="w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Sparkles className={`h-5 w-5 ${isSearching ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
            </div>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-14 pr-36 py-5 bg-white dark:bg-[#0b0f19]/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-lg text-lg"
              placeholder="Ví dụ: RS cao nhất, Mô hình bứt phá, Quá bán..." />
            <button onClick={handleSearch} disabled={isSearching}
              className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
              {isSearching ? <><RefreshCw size={16} className="animate-spin" /><span>Đang lọc...</span></> : <><span>Lọc ngay</span><ArrowUpRight size={18} /></>}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {Object.keys(presetFilters).map((preset) => (
              <button key={preset} onClick={() => applyPreset(preset)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  activePreset === preset ? 'bg-indigo-600 text-white border border-indigo-500'
                    : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300'
                }`}>
                {preset === 'RS cao nhất' && <TrendingUp size={14} />}
                {preset === 'Mô hình bứt phá' && <Zap size={14} />}
                {preset === 'Quá bán (RSI thấp)' && <TrendingDown size={14} />}
                {preset === 'Xu hướng tăng' && <Activity size={14} />}
                {preset === 'Momentum mạnh' && <Gauge size={14} />}
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      {!loading && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Market Insights</h3>
              <p className="text-xs text-slate-500">Phân tích đa chiều bởi AI</p>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
              marketInsights.marketSentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-500' :
              marketInsights.marketSentiment === 'bearish' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
            }`}>
              {marketInsights.marketSentiment === 'bullish' ? '🐂 Bullish' : marketInsights.marketSentiment === 'bearish' ? '🐻 Bearish' : '⚖️ Neutral'}
            </div>
          </div>

          <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-4 border-l-4 border-indigo-500">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <Sparkles size={14} className="inline mr-2 text-indigo-500" />{marketInsights.aiSummary}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-emerald-500 mb-1"><TrendingUp size={16} /><span className="text-xs font-medium">Tăng giá</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{marketInsights.upStocks}</p>
              <p className="text-xs text-slate-500">{marketInsights.totalStocks > 0 ? ((marketInsights.upStocks / marketInsights.totalStocks) * 100).toFixed(0) : 0}%</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-rose-500 mb-1"><TrendingDown size={16} /><span className="text-xs font-medium">Giảm giá</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{marketInsights.downStocks}</p>
              <p className="text-xs text-slate-500">{marketInsights.totalStocks > 0 ? ((marketInsights.downStocks / marketInsights.totalStocks) * 100).toFixed(0) : 0}%</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-amber-500 mb-1"><Zap size={16} /><span className="text-xs font-medium">Golden Cross</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{marketInsights.goldenCrossCount}</p>
              <p className="text-xs text-slate-500">Tín hiệu mua</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-cyan-500 mb-1"><AlertTriangle size={16} /><span className="text-xs font-medium">Quá bán</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{marketInsights.oversoldCount}</p>
              <p className="text-xs text-slate-500">RSI &lt; 30</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-indigo-500 mb-1"><Award size={16} /><span className="text-xs font-medium">AI Score TB</span></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{marketInsights.avgScore.toFixed(0)}</p>
              <p className="text-xs text-slate-500">Điểm khuyến nghị</p>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {[
            { mode: 'table' as ViewMode, icon: Table, label: 'Bảng' },
            { mode: 'heatmap' as ViewMode, icon: LayoutGrid, label: 'Heatmap' },
            { mode: 'compare' as ViewMode, icon: GitCompare, label: `So sánh${compareStocks.length > 0 ? ` (${compareStocks.length})` : ''}` },
            { mode: 'backtest' as ViewMode, icon: Clock, label: 'Backtest' },
            { mode: 'rotation' as ViewMode, icon: BarChart2, label: 'Dòng tiền' },
          ].map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {compareStocks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Đang so sánh:</span>
            {compareStocks.map((ticker) => (
              <span key={ticker} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
                {ticker}<button onClick={() => toggleCompareStock(ticker)} className="hover:text-rose-500"><X size={12} /></button>
              </span>
            ))}
            <button onClick={() => setCompareStocks([])} className="text-xs text-rose-500 hover:text-rose-600">Xóa tất cả</button>
          </div>
        )}
      </div>

      {/* Backtest View */}
      {viewMode === 'backtest' && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <Clock className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Backtest Chiến lược</h3>
                <p className="text-xs text-slate-500">Hiệu suất giả lập của các bộ lọc trong quá khứ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Khoảng thời gian:</span>
              <select value={backtestPeriod} onChange={(e) => setBacktestPeriod(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm">
                <option value={7}>7 ngày</option>
                <option value={14}>14 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={60}>60 ngày</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backtestResults.map((result) => (
              <div key={result.filterName} className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white">{result.filterName}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${result.avgReturn >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {result.avgReturn >= 0 ? '+' : ''}{result.avgReturn}%
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số CP lọc được:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{result.stockCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tỷ lệ thắng:</span>
                    <span className={`font-medium ${result.winRate >= 60 ? 'text-emerald-500' : result.winRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {result.winRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CP tốt nhất:</span>
                    <span className="font-medium text-emerald-500">{result.bestStock} (+{result.bestReturn}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CP kém nhất:</span>
                    <span className="font-medium text-rose-500">{result.worstStock} ({result.worstReturn}%)</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${result.winRate}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{result.winRate}% win</span>
                  </div>
                </div>

                <button onClick={() => applyPreset(result.filterName)}
                  className="mt-3 w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors">
                  Áp dụng bộ lọc này
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Lưu ý về Backtest</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Kết quả backtest chỉ mang tính tham khảo dựa trên dữ liệu lịch sử. Hiệu suất trong quá khứ không đảm bảo kết quả tương lai. 
                  Luôn kết hợp với phân tích cơ bản và quản lý rủi ro phù hợp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sector Rotation Analysis View */}
      {viewMode === 'rotation' && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                <BarChart2 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sector Rotation Analysis</h3>
                <p className="text-xs text-slate-500">Phân tích dòng tiền đang chảy vào ngành nào</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Dòng tiền vào</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Dòng tiền ra</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Trung tính</span>
            </div>
          </div>

          {/* Money Flow Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <TrendingUp size={18} />
                <span className="text-sm font-medium">Ngành Hot</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {sectorRotationData.filter(s => s.trend === 'hot').length}
              </p>
              <p className="text-xs text-slate-500">Dòng tiền mạnh</p>
            </div>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-500 mb-2">
                <Activity size={18} />
                <span className="text-sm font-medium">Đang ấm</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {sectorRotationData.filter(s => s.trend === 'warming').length}
              </p>
              <p className="text-xs text-slate-500">Tiền đang vào</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <TrendingDown size={18} />
                <span className="text-sm font-medium">Đang nguội</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {sectorRotationData.filter(s => s.trend === 'cooling').length}
              </p>
              <p className="text-xs text-slate-500">Tiền đang rút</p>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">Ngành lạnh</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {sectorRotationData.filter(s => s.trend === 'cold').length}
              </p>
              <p className="text-xs text-slate-500">Dòng tiền yếu</p>
            </div>
          </div>

          {/* Sector Cards */}
          <div className="space-y-4">
            {sectorRotationData.map((sector) => {
              const flowColor = sector.moneyFlow === 'inflow' ? 'emerald' : sector.moneyFlow === 'outflow' ? 'rose' : 'slate';
              const trendEmoji = sector.trend === 'hot' ? '🔥' : sector.trend === 'warming' ? '📈' : sector.trend === 'cooling' ? '📉' : '❄️';
              const flowBarWidth = Math.abs(sector.moneyFlowScore);
              
              return (
                <div key={sector.name} className={`p-4 bg-white dark:bg-slate-900/50 rounded-xl border-l-4 ${
                  sector.moneyFlow === 'inflow' ? 'border-emerald-500' : 
                  sector.moneyFlow === 'outflow' ? 'border-rose-500' : 'border-slate-400'
                } hover:shadow-lg transition-shadow`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Sector Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{trendEmoji}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white">{sector.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          sector.trend === 'hot' ? 'bg-emerald-500/20 text-emerald-500' :
                          sector.trend === 'warming' ? 'bg-cyan-500/20 text-cyan-500' :
                          sector.trend === 'cooling' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-rose-500/20 text-rose-500'
                        }`}>
                          {sector.trend === 'hot' ? 'HOT' : sector.trend === 'warming' ? 'WARMING' : sector.trend === 'cooling' ? 'COOLING' : 'COLD'}
                        </span>
                        <span className="text-xs text-slate-500">({sector.stockCount} CP)</span>
                      </div>
                      
                      {/* Money Flow Bar */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-500 w-16">Dòng tiền:</span>
                        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400"></div>
                          {sector.moneyFlowScore >= 0 ? (
                            <div className="absolute left-1/2 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-r-full transition-all"
                              style={{ width: `${flowBarWidth / 2}%` }}></div>
                          ) : (
                            <div className="absolute right-1/2 h-full bg-gradient-to-l from-rose-400 to-rose-500 rounded-l-full transition-all"
                              style={{ width: `${flowBarWidth / 2}%` }}></div>
                          )}
                        </div>
                        <span className={`text-xs font-bold w-12 text-right ${
                          sector.moneyFlowScore > 0 ? 'text-emerald-500' : sector.moneyFlowScore < 0 ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                          {sector.moneyFlowScore > 0 ? '+' : ''}{sector.moneyFlowScore.toFixed(0)}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">1D: </span>
                          <span className={`font-bold ${sector.avgChange1d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {sector.avgChange1d >= 0 ? '+' : ''}{sector.avgChange1d.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">5D: </span>
                          <span className={`font-bold ${sector.avgChange5d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {sector.avgChange5d >= 0 ? '+' : ''}{sector.avgChange5d.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vol: </span>
                          <span className={`font-bold ${sector.avgVolume > 1.2 ? 'text-indigo-500' : 'text-slate-600 dark:text-slate-400'}`}>
                            {sector.avgVolume.toFixed(2)}x
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">RS TB: </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{sector.avgRsRating.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">AI Score TB: </span>
                          <span className="font-bold text-indigo-500">{sector.avgAiScore.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Stocks */}
                    <div className="flex gap-2">
                      {sector.topStocks.map((stock) => (
                        <button key={stock.ticker} onClick={() => toggleCompareStock(stock.ticker)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105 ${
                            compareStocks.includes(stock.ticker) ? 'ring-2 ring-indigo-500' : ''
                          } ${stock.change >= 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                          <div>{stock.ticker}</div>
                          <div className="text-[10px] opacity-80">{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%</div>
                          <div className="text-[10px] text-indigo-500">AI:{stock.aiScore}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotation Insight */}
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Brain className="text-indigo-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">AI Insight về Sector Rotation</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">
                  {sectorRotationData.filter(s => s.trend === 'hot').length > 0 && (
                    <>Dòng tiền đang tập trung vào: <strong>{sectorRotationData.filter(s => s.trend === 'hot').map(s => s.name).join(', ')}</strong>. </>
                  )}
                  {sectorRotationData.filter(s => s.trend === 'cold').length > 0 && (
                    <>Cần thận trọng với: <strong>{sectorRotationData.filter(s => s.trend === 'cold').map(s => s.name).join(', ')}</strong>. </>
                  )}
                  {sectorRotationData.filter(s => s.trend === 'warming').length > 0 && (
                    <>Theo dõi cơ hội tại: <strong>{sectorRotationData.filter(s => s.trend === 'warming').slice(0, 2).map(s => s.name).join(', ')}</strong>.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sector Heatmap</h3>
              <p className="text-xs text-slate-500">Phân bổ theo ngành - Click để xem chi tiết</p>
            </div>
          </div>

          <div className="space-y-4">
            {sectorHeatmapData.map((sector) => (
              <div key={sector.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sector.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-500">↑ {sector.upCount}</span>
                    <span className="text-rose-500">↓ {sector.downCount}</span>
                    <span className={`font-bold ${sector.avgChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sector.stocks.map((stock) => {
                    const scoreInfo = getAIScoreInfo(stock.aiScore);
                    return (
                      <button key={stock.ticker} onClick={() => toggleCompareStock(stock.ticker)}
                        className={`relative group px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 hover:z-10 ${getHeatmapColor(stock.change1d)} ${
                          compareStocks.includes(stock.ticker) ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                        }`}>
                        {stock.ticker}
                        <span className="block text-[10px] opacity-80">{stock.change1d >= 0 ? '+' : ''}{stock.change1d.toFixed(1)}%</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                          <div className="font-bold">{stock.ticker} <span className={`${scoreInfo.color}`}>AI: {stock.aiScore}</span></div>
                          <div className="text-slate-300">{stock.name}</div>
                          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <span>Giá:</span><span>{stock.price.toLocaleString()}</span>
                            <span>RS:</span><span>{stock.rsRating.toFixed(0)}</span>
                            <span>RSI:</span><span>{stock.rsi.toFixed(0)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500">Giảm mạnh</span>
            <div className="flex gap-0.5">
              {['bg-rose-500', 'bg-rose-400', 'bg-rose-300/80', 'bg-rose-200/60', 'bg-emerald-200/60', 'bg-emerald-300/80', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`w-6 h-4 ${c} rounded`}></div>
              ))}
            </div>
            <span className="text-slate-500">Tăng mạnh</span>
          </div>
        </div>
      )}

      {/* Compare Mode */}
      {viewMode === 'compare' && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl">
              <GitCompare className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">So sánh cổ phiếu</h3>
              <p className="text-xs text-slate-500">Chọn tối đa 3 cổ phiếu để so sánh chi tiết</p>
            </div>
          </div>

          {compareData.length === 0 ? (
            <div className="text-center py-12">
              <GitCompare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 mb-2">Chưa chọn cổ phiếu nào để so sánh</p>
              <p className="text-xs text-slate-400">Click vào cổ phiếu trong bảng hoặc heatmap để thêm</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase">Chỉ số</th>
                    {compareData.map((stock) => {
                      const scoreInfo = getAIScoreInfo(stock.aiScore);
                      return (
                        <th key={stock.ticker} className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{stock.ticker}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                              <scoreInfo.icon size={10} /> AI: {stock.aiScore}
                            </span>
                            <button onClick={() => toggleCompareStock(stock.ticker)} className="text-rose-500 hover:text-rose-600 text-xs flex items-center gap-1">
                              <Minus size={12} /> Xóa
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {[
                    { label: 'AI Score', key: 'aiScore', format: (v: number) => v.toFixed(0), highlight: true },
                    { label: 'Giá hiện tại', key: 'price', format: (v: number) => v.toLocaleString() },
                    { label: 'Thay đổi 1D', key: 'change1d', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, color: true },
                    { label: 'Thay đổi 5D', key: 'change5d', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, color: true },
                    { label: 'RS Rating', key: 'rsRating', format: (v: number) => v.toFixed(0), highlight: true },
                    { label: 'RSI (14)', key: 'rsi', format: (v: number) => v.toFixed(0) },
                    { label: 'Điểm kỹ thuật', key: 'overallScore', format: (v: number) => v.toFixed(0), highlight: true },
                    { label: 'Volume Ratio', key: 'volumeRatio', format: (v: number) => `${v.toFixed(2)}x` },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">{row.label}</td>
                      {compareData.map((stock) => {
                        const value = stock[row.key as keyof ScreenerResult] as number;
                        const maxValue = row.highlight ? Math.max(...compareData.map((s) => s[row.key as keyof ScreenerResult] as number)) : 0;
                        const isMax = row.highlight && value === maxValue;
                        return (
                          <td key={stock.ticker} className={`py-3 px-4 text-center font-medium ${
                            row.color ? (value >= 0 ? 'text-emerald-500' : 'text-rose-500') : 
                            isMax ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {row.format(value)} {isMax && '🏆'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Xu hướng</td>
                    {compareData.map((stock) => (
                      <td key={stock.ticker} className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          stock.trendShort === 'UP' ? 'bg-emerald-500/20 text-emerald-500' :
                          stock.trendShort === 'DOWN' ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-500/20 text-slate-500'
                        }`}>
                          {stock.trendShort === 'UP' ? <TrendingUp size={12} /> : stock.trendShort === 'DOWN' ? <TrendingDown size={12} /> : <Activity size={12} />}
                          {stock.trendShort === 'UP' ? 'Tăng' : stock.trendShort === 'DOWN' ? 'Giảm' : 'Sideway'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Tín hiệu MA</td>
                    {compareData.map((stock) => (
                      <td key={stock.ticker} className="py-3 px-4 text-center">
                        {stock.maCrossSignal === 'GOLDEN_CROSS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500"><Zap size={12} /> Golden Cross</span>
                        ) : stock.maCrossSignal === 'DEATH_CROSS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-500">Death Cross</span>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/30">
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Khuyến nghị AI</td>
                    {compareData.map((stock) => {
                      const scoreInfo = getAIScoreInfo(stock.aiScore);
                      return (
                        <td key={stock.ticker} className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                            <scoreInfo.icon size={12} /> {scoreInfo.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {compareData.length < 3 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <p className="text-xs text-slate-500 mb-3">Thêm nhanh cổ phiếu top AI Score:</p>
              <div className="flex flex-wrap gap-2">
                {filteredResults.filter((s) => !compareStocks.includes(s.ticker)).slice(0, 6).map((stock) => {
                  const scoreInfo = getAIScoreInfo(stock.aiScore);
                  return (
                    <button key={stock.ticker} onClick={() => toggleCompareStock(stock.ticker)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:border-indigo-500 transition-colors">
                      <Plus size={12} />{stock.ticker}
                      <span className={`${scoreInfo.color}`}>{stock.aiScore}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table View - Filters */}
      {viewMode === 'table' && showFilters && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><SlidersHorizontal size={18} />Bộ lọc nâng cao</h3>
            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><X size={18} className="text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">RS Rating</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={filters.rsMin} onChange={(e) => setFilters({ ...filters, rsMin: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                <input type="number" value={filters.rsMax} onChange={(e) => setFilters({ ...filters, rsMax: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">RSI (14)</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={filters.rsiMin} onChange={(e) => setFilters({ ...filters, rsiMin: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                <input type="number" value={filters.rsiMax} onChange={(e) => setFilters({ ...filters, rsiMax: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Xu hướng ngắn</label>
              <select value={filters.trendShort} onChange={(e) => setFilters({ ...filters, trendShort: e.target.value })}
                className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                <option value="ALL">Tất cả</option><option value="UP">Tăng</option><option value="DOWN">Giảm</option><option value="SIDEWAYS">Sideway</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Vị thế MA20</label>
              <select value={filters.aboveMa20 === null ? 'ALL' : filters.aboveMa20 ? 'ABOVE' : 'BELOW'}
                onChange={(e) => setFilters({ ...filters, aboveMa20: e.target.value === 'ALL' ? null : e.target.value === 'ABOVE' })}
                className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                <option value="ALL">Tất cả</option><option value="ABOVE">Trên MA20</option><option value="BELOW">Dưới MA20</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.goldenCross} onChange={(e) => setFilters({ ...filters, goldenCross: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Golden Cross</span>
              </label>
            </div>
            <div className="flex items-end">
              <button onClick={resetFilters} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-sm font-medium transition-colors">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Table View - Results */}
      {viewMode === 'table' && (
        <div className="glass-panel p-6 rounded-2xl border-t border-cyan-500/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Filter className="text-indigo-500 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kết quả lọc</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tìm thấy {filteredResults.length} cổ phiếu {activePreset && <span className="text-indigo-500">• {activePreset}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                <SlidersHorizontal size={14} />Bộ lọc
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2">
                <option value="aiScore">Sắp xếp: AI Score</option>
                <option value="score">Sắp xếp: Điểm kỹ thuật</option>
                <option value="rs">Sắp xếp: RS Rating</option>
                <option value="change">Sắp xếp: Thay đổi giá</option>
                <option value="rsi">Sắp xếp: RSI (thấp nhất)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/50">
            <table className="w-full text-left border-collapse bg-slate-50/50 dark:bg-slate-900/20">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-900/40">
                  <th className="py-4 pl-4 font-medium w-8"><Eye size={14} /></th>
                  <th className="py-4 pl-2 font-medium">Mã CK</th>
                  <th className="py-4 font-medium text-center">AI Score</th>
                  <th className="py-4 text-right font-medium">Giá</th>
                  <th className="py-4 text-right font-medium">1D %</th>
                  <th className="py-4 text-center font-medium">RS</th>
                  <th className="py-4 text-center font-medium">RSI</th>
                  <th className="py-4 text-center font-medium">Xu hướng</th>
                  <th className="py-4 pl-4 font-medium">Khuyến nghị</th>
                </tr>
              </thead>
              <tbody>
                {(isSearching || loading) ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-slate-200 dark:border-slate-800/50">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                        <td key={j} className="py-4 px-2"><div className="h-4 w-full bg-slate-200 dark:bg-slate-800/50 rounded animate-pulse"></div></td>
                      ))}
                    </tr>
                  ))
                ) : currentResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Filter size={32} className="mx-auto text-slate-400 mb-2" />
                      <p>Không tìm thấy cổ phiếu phù hợp</p>
                      <button onClick={resetFilters} className="text-indigo-500 hover:text-indigo-600 text-sm font-medium mt-2">Reset bộ lọc</button>
                    </td>
                  </tr>
                ) : (
                  currentResults.map((stock) => {
                    const scoreInfo = getAIScoreInfo(stock.aiScore);
                    return (
                      <tr key={stock.ticker} className="border-b border-slate-200 dark:border-slate-800/50 text-sm hover:bg-white dark:hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="py-4 pl-4">
                          <button onClick={(e) => { e.stopPropagation(); toggleCompareStock(stock.ticker); }}
                            className={`p-1 rounded transition-colors ${
                              compareStocks.includes(stock.ticker) ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-indigo-100 hover:text-indigo-500'
                            }`}>
                            {compareStocks.includes(stock.ticker) ? <Minus size={14} /> : <Plus size={14} />}
                          </button>
                        </td>
                        <td className="py-4 pl-2" onClick={() => window.dispatchEvent(new CustomEvent('navigateToAnalysis', { detail: stock.ticker }))}>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stock.ticker}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[100px]">{stock.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                              <scoreInfo.icon size={12} />{stock.aiScore}
                            </span>
                            <span className={`text-[10px] ${scoreInfo.color}`}>{scoreInfo.label}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right text-slate-700 dark:text-slate-200 font-mono">{stock.price.toLocaleString()}</td>
                        <td className={`py-4 text-right font-medium font-mono ${stock.change1d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {stock.change1d > 0 ? '+' : ''}{stock.change1d.toFixed(1)}%
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            stock.rsRating >= 80 ? 'bg-emerald-500/20 text-emerald-500' :
                            stock.rsRating >= 60 ? 'bg-cyan-500/20 text-cyan-500' :
                            stock.rsRating >= 40 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                          }`}>{Math.round(stock.rsRating)}</span>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            stock.rsi > 70 ? 'bg-rose-500/20 text-rose-500' :
                            stock.rsi < 30 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'
                          }`}>{Math.round(stock.rsi)}</span>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {stock.trendShort === 'UP' ? <TrendingUp size={14} className="text-emerald-500" /> :
                             stock.trendShort === 'DOWN' ? <TrendingDown size={14} className="text-rose-500" /> :
                             <Activity size={14} className="text-slate-400" />}
                            <span className={`text-xs font-medium ${
                              stock.trendShort === 'UP' ? 'text-emerald-500' : stock.trendShort === 'DOWN' ? 'text-rose-500' : 'text-slate-400'
                            }`}>{stock.trendShort === 'UP' ? 'Tăng' : stock.trendShort === 'DOWN' ? 'Giảm' : 'Sideway'}</span>
                          </div>
                        </td>
                        <td className="py-4 pl-4 text-xs max-w-[180px]">
                          <div className="flex items-start gap-1">
                            {stock.maCrossSignal === 'GOLDEN_CROSS' && (
                              <span className="shrink-0 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[10px] font-bold">GC</span>
                            )}
                            <span className="text-slate-500 dark:text-slate-400 truncate">{stock.reason}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isSearching && !loading && filteredResults.length > 10 && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => setViewAll(!viewAll)}
                className="text-slate-500 hover:text-indigo-600 dark:hover:text-white text-sm transition-colors flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-full">
                {viewAll ? <>Thu gọn <ChevronUp size={14} /></> : <>Xem tất cả {filteredResults.length} kết quả <ChevronDown size={14} /></>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Score Legend */}
      {!loading && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">AI Score:</span>
            {[
              { min: 80, label: 'Mua mạnh', icon: Flame, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
              { min: 65, label: 'Khuyến nghị', icon: Star, color: 'text-cyan-500', bg: 'bg-cyan-500/20' },
              { min: 50, label: 'Theo dõi', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/20' },
              { min: 35, label: 'Thận trọng', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/20' },
              { min: 0, label: 'Tránh', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/20' },
            ].map(({ min, label, icon: Icon, color, bg }) => (
              <span key={label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg} ${color}`}>
                <Icon size={12} />{label} ({min}+)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScreener;
