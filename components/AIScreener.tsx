import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Filter, Activity, Zap, ArrowUpRight, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Gauge, RefreshCw, SlidersHorizontal, X, Brain,
  LayoutGrid, Table, GitCompare, Plus, Minus, AlertTriangle, CheckCircle, Eye,
  Clock, Target, Award, BarChart2, Star, Shield, Flame, MessageSquare, Wand2,
  DollarSign,
} from 'lucide-react';
import {
  getVN100Companies, getAllTechnicalIndicators, getAllAIAnalysis, getAllSimplizeCompanyData, Company, TechnicalIndicators, AIAnalysis, SimplizeCompanyData,
} from '../services/supabaseClient';
import { parseNaturalLanguageFilter, quickSuggestions } from '../services/openaiService';

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
  aiScore: number; // SENAI Recommendation Score
  // Fundamental data
  pe: number | null;
  pb: number | null;
  roe: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
  debtToEquity: number | null;
  // New fields from Simplize
  dividendYield: number | null;
  marketCap: number | null;
  beta: number | null;
  valuationPoint: number | null;
  growthPoint: number | null;
  financialHealthPoint: number | null;
  dividendPoint: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  priceChangeYtd: number | null;
}

interface FilterConfig {
  rsMin: number; rsMax: number; rsiMin: number; rsiMax: number;
  trendShort: string; trendMedium: string;
  aboveMa20: boolean | null; aboveMa50: boolean | null;
  goldenCross: boolean; minScore: number;
  sectors?: string[];
  // Fundamental filters
  peMin: number | null; peMax: number | null;
  pbMin: number | null; pbMax: number | null;
  roeMin: number | null;
  epsGrowthMin: number | null;
  revenueGrowthMin: number | null;
  profitGrowthMin: number | null;
  debtToEquityMax: number | null;
  // New filters - Simplize scores
  dividendYieldMin: number | null;
  marketCapMin: number | null; // in billions
  marketCapMax: number | null;
  betaMin: number | null;
  betaMax: number | null;
  // Simplize quality scores (0-5)
  valuationPointMin: number | null;
  growthPointMin: number | null;
  financialHealthPointMin: number | null;
  dividendPointMin: number | null;
  // Price change filters
  priceChange7dMin: number | null;
  priceChange30dMin: number | null;
  priceChangeYtdMin: number | null;
  // AI Score filter
  aiScoreMin: number | null;
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
  // Fundamental defaults
  peMin: null, peMax: null,
  pbMin: null, pbMax: null,
  roeMin: null,
  epsGrowthMin: null,
  revenueGrowthMin: null,
  profitGrowthMin: null,
  debtToEquityMax: null,
  // New filter defaults
  dividendYieldMin: null,
  marketCapMin: null,
  marketCapMax: null,
  betaMin: null,
  betaMax: null,
  valuationPointMin: null,
  growthPointMin: null,
  financialHealthPointMin: null,
  dividendPointMin: null,
  priceChange7dMin: null,
  priceChange30dMin: null,
  priceChangeYtdMin: null,
  aiScoreMin: null,
};

const presetFilters = {
  // === TECHNICAL PRESETS ===
  'RS cao nhất': { ...defaultFilters, rsMin: 70, minScore: 60 },
  'Mô hình bứt phá': { ...defaultFilters, goldenCross: true, aboveMa20: true, trendShort: 'UP' },
  'Quá bán (RSI thấp)': { ...defaultFilters, rsiMax: 30 },
  'Xu hướng tăng': { ...defaultFilters, trendShort: 'UP', trendMedium: 'UP', aboveMa20: true },
  'Momentum mạnh': { ...defaultFilters, rsMin: 60, rsiMin: 50, rsiMax: 70, aboveMa20: true, minScore: 65 },
  
  // === VALUE INVESTING (Warren Buffett style) ===
  'Value - P/E thấp': { ...defaultFilters, peMin: 0, peMax: 12, roeMin: 12, financialHealthPointMin: 3 },
  'Value - P/B thấp': { ...defaultFilters, pbMin: 0, pbMax: 1.5, roeMin: 10 },
  'Deep Value': { ...defaultFilters, peMax: 10, pbMax: 1, valuationPointMin: 4 },
  
  // === GROWTH INVESTING (Peter Lynch style) ===
  'Tăng trưởng mạnh': { ...defaultFilters, revenueGrowthMin: 15, profitGrowthMin: 15, growthPointMin: 3 },
  'GARP (PEG < 1)': { ...defaultFilters, peMax: 20, profitGrowthMin: 20, growthPointMin: 3 },
  'Siêu tăng trưởng': { ...defaultFilters, revenueGrowthMin: 25, profitGrowthMin: 25, priceChange30dMin: 5 },
  
  // === QUALITY INVESTING ===
  'Cổ phiếu chất lượng': { ...defaultFilters, roeMin: 15, financialHealthPointMin: 4, peMax: 25 },
  'ROE cao': { ...defaultFilters, roeMin: 18, financialHealthPointMin: 3 },
  'Blue chip': { ...defaultFilters, marketCapMin: 50000, roeMin: 12, financialHealthPointMin: 4, betaMax: 1.2 },
  
  // === DIVIDEND INVESTING ===
  'Cổ tức cao': { ...defaultFilters, dividendYieldMin: 5, dividendPointMin: 3 },
  'Cổ tức ổn định': { ...defaultFilters, dividendYieldMin: 3, dividendPointMin: 4, financialHealthPointMin: 3 },
  
  // === SIMPLIZE QUALITY SCORES ===
  'Định giá hấp dẫn': { ...defaultFilters, valuationPointMin: 4, peMax: 15, pbMax: 2 },
  'Sức khỏe TC tốt': { ...defaultFilters, financialHealthPointMin: 4, roeMin: 10 },
  'Điểm tổng hợp cao': { ...defaultFilters, valuationPointMin: 3, growthPointMin: 3, financialHealthPointMin: 3 },
  
  // === AI SCORE ===
  'SENAI Score cao': { ...defaultFilters, aiScoreMin: 75 },
  'SENAI Mua mạnh': { ...defaultFilters, aiScoreMin: 80, trendShort: 'UP' },
  'SENAI + Momentum': { ...defaultFilters, aiScoreMin: 65, rsMin: 60, aboveMa20: true },
  
  // === PRICE ACTION ===
  'Tăng giá 7 ngày': { ...defaultFilters, priceChange7dMin: 5, rsMin: 50 },
  'Tăng giá 30 ngày': { ...defaultFilters, priceChange30dMin: 10, trendMedium: 'UP' },
  'Breakout tiềm năng': { ...defaultFilters, priceChange7dMin: 3, rsMin: 70, aboveMa20: true, goldenCross: true },
  
  // === RISK-ADJUSTED ===
  'Beta thấp (phòng thủ)': { ...defaultFilters, betaMax: 0.8, financialHealthPointMin: 3, dividendYieldMin: 2 },
  'Beta cao (tấn công)': { ...defaultFilters, betaMin: 1.3, rsMin: 60, trendShort: 'UP' },
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

// Calculate SENAI Recommendation Score (0-100)
// Tích hợp: Technical (30%), Momentum (20%), Trend (15%), Risk (10%), SenAI Diagnostic (25%)
const calculateSenAIScore = (
  tech: TechnicalIndicators, 
  company: Company | undefined,
  aiAnalysis: AIAnalysis | undefined
): number => {
  let score = 0;
  
  // Nếu có dữ liệu Chẩn đoán SenAI, sử dụng trọng số mới
  if (aiAnalysis && (aiAnalysis.rating || aiAnalysis.score || aiAnalysis.signal)) {
    const weights = { technical: 30, momentum: 20, trend: 15, risk: 10, senaiDiagnostic: 25 };
    
    // Technical Score (30%)
    const techScore = tech.overall_technical_score || 50;
    score += (techScore / 100) * weights.technical;
    
    // Momentum Score (20%)
    let momentumScore = 50;
    if (tech.rs_rating >= 80) momentumScore = 90;
    else if (tech.rs_rating >= 60) momentumScore = 70;
    else if (tech.rs_rating >= 40) momentumScore = 50;
    else momentumScore = 30;
    
    if (tech.price_change_5d > 5) momentumScore += 10;
    else if (tech.price_change_5d > 0) momentumScore += 5;
    else if (tech.price_change_5d < -5) momentumScore -= 10;
    
    score += (Math.min(100, momentumScore) / 100) * weights.momentum;
    
    // Trend Score (15%)
    let trendScore = 50;
    if (tech.trend_short === 'UP' && tech.trend_medium === 'UP') trendScore = 90;
    else if (tech.trend_short === 'UP') trendScore = 70;
    else if (tech.trend_short === 'DOWN' && tech.trend_medium === 'DOWN') trendScore = 20;
    else if (tech.trend_short === 'DOWN') trendScore = 35;
    
    if (tech.ma_cross_signal === 'GOLDEN_CROSS') trendScore += 15;
    else if (tech.ma_cross_signal === 'DEATH_CROSS') trendScore -= 15;
    
    score += (Math.min(100, Math.max(0, trendScore)) / 100) * weights.trend;
    
    // Risk Score (10%)
    let riskScore = 70;
    if (tech.rsi_14 > 70) riskScore = 40;
    else if (tech.rsi_14 < 30) riskScore = 85;
    else if (tech.rsi_14 >= 40 && tech.rsi_14 <= 60) riskScore = 75;
    
    if (tech.volume_ratio > 2) riskScore += 10;
    
    score += (Math.min(100, riskScore) / 100) * weights.risk;
    
    // SenAI Diagnostic Score (25%) - Từ bảng ai_analysis
    const senaiRating = aiAnalysis.rating || 50;
    const senaiScore = aiAnalysis.score || 50;
    const senaiSignal = aiAnalysis.signal || 50;
    const senaiDiagnostic = (senaiRating * 0.4 + senaiScore * 0.35 + senaiSignal * 0.25);
    score += (senaiDiagnostic / 100) * weights.senaiDiagnostic;
    
  } else {
    // Fallback: Không có dữ liệu Chẩn đoán SenAI, dùng công thức cũ
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
    
    // Risk Score (15%)
    let riskScore = 70;
    if (tech.rsi_14 > 70) riskScore = 40;
    else if (tech.rsi_14 < 30) riskScore = 85;
    else if (tech.rsi_14 >= 40 && tech.rsi_14 <= 60) riskScore = 75;
    
    if (tech.volume_ratio > 2) riskScore += 10;
    
    score += (Math.min(100, riskScore) / 100) * weights.risk;
  }
  
  return Math.round(score);
};

// Get SENAI Score color and label
const getSenAIScoreInfo = (score: number) => {
  if (score >= 80) return { color: 'text-emerald-500', bg: 'bg-emerald-500/20', label: 'Mua mạnh', icon: Flame };
  if (score >= 65) return { color: 'text-emerald-400', bg: 'bg-emerald-400/20', label: 'Khuyến nghị', icon: Star };
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
  const [aiAnalysisData, setAiAnalysisData] = useState<AIAnalysis[]>([]);
  const [simplizeData, setSimplizeData] = useState<SimplizeCompanyData[]>([]);
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [activePresets, setActivePresets] = useState<string[]>([]); // Multiple presets combined
  const [combineMode, setCombineMode] = useState(false); // Toggle combine mode
  const [sortBy, setSortBy] = useState<'score' | 'rs' | 'change' | 'rsi' | 'aiScore'>('aiScore');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [compareStocks, setCompareStocks] = useState<string[]>([]);
  const [backtestPeriod, setBacktestPeriod] = useState<number>(30);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [aiFilterExplanation, setAiFilterExplanation] = useState<string | null>(null);
  const [aiFilterConfidence, setAiFilterConfidence] = useState<number>(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesData, techData, aiData, simplizeDataResult] = await Promise.all([
          getVN100Companies(), getAllTechnicalIndicators(), getAllAIAnalysis(), getAllSimplizeCompanyData(),
        ]);
        setCompanies(companiesData);
        setTechnicalData(techData);
        setAiAnalysisData(aiData);
        setSimplizeData(simplizeDataResult);
        
        // Debug log for simplize data
        console.log('📊 Simplize data loaded:', simplizeDataResult.length, 'records');
        if (simplizeDataResult.length === 0) {
          console.warn('⚠️ No simplize company data found. Please sync simplize_company_data table.');
        }
        
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
      // Technical filters
      if (tech.rs_rating < filters.rsMin || tech.rs_rating > filters.rsMax) return false;
      if (tech.rsi_14 < filters.rsiMin || tech.rsi_14 > filters.rsiMax) return false;
      if (filters.trendShort !== 'ALL' && tech.trend_short !== filters.trendShort) return false;
      if (filters.trendMedium !== 'ALL' && tech.trend_medium !== filters.trendMedium) return false;
      if (filters.aboveMa20 === true && tech.price_vs_ma20 <= 0) return false;
      if (filters.aboveMa20 === false && tech.price_vs_ma20 > 0) return false;
      if (filters.goldenCross && tech.ma_cross_signal !== 'GOLDEN_CROSS') return false;
      if (tech.overall_technical_score < filters.minScore) return false;
      
      // Sector filter (from AI)
      if (filters.sectors && filters.sectors.length > 0) {
        const company = companies.find((c) => c.symbol === tech.symbol);
        const stockSector = company?.industry || 'Khác';
        const matchesSector = filters.sectors.some(sector => 
          stockSector.toLowerCase().includes(sector.toLowerCase()) ||
          sector.toLowerCase().includes(stockSector.toLowerCase())
        );
        if (!matchesSector) return false;
      }
      
      // Fundamental filters - using Simplize data
      const simplize = simplizeData.find((s) => s.symbol === tech.symbol);
      if (simplize) {
        if (filters.peMin !== null && (simplize.pe_ratio === null || simplize.pe_ratio < filters.peMin)) return false;
        if (filters.peMax !== null && (simplize.pe_ratio === null || simplize.pe_ratio > filters.peMax)) return false;
        if (filters.pbMin !== null && (simplize.pb_ratio === null || simplize.pb_ratio < filters.pbMin)) return false;
        if (filters.pbMax !== null && (simplize.pb_ratio === null || simplize.pb_ratio > filters.pbMax)) return false;
        // ROE in Simplize is already percentage (15 = 15%)
        if (filters.roeMin !== null && (simplize.roe === null || simplize.roe < filters.roeMin)) return false;
        // Growth rates in Simplize are already percentage
        if (filters.revenueGrowthMin !== null && (simplize.revenue_5y_growth === null || simplize.revenue_5y_growth < filters.revenueGrowthMin)) return false;
        if (filters.profitGrowthMin !== null && (simplize.net_income_5y_growth === null || simplize.net_income_5y_growth < filters.profitGrowthMin)) return false;
        // Simplize doesn't have debt_to_equity directly, skip this filter or use alternative
      } else {
        // If no simplize data and fundamental filters are set, exclude
        if (filters.peMin !== null || filters.peMax !== null || filters.pbMin !== null || 
            filters.pbMax !== null || filters.roeMin !== null || filters.revenueGrowthMin !== null ||
            filters.profitGrowthMin !== null) {
          return false;
        }
      }
      
      // New filters - Simplize specific
      if (simplize) {
        // Dividend yield filter
        if (filters.dividendYieldMin !== null && (simplize.dividend_yield === null || simplize.dividend_yield < filters.dividendYieldMin)) return false;
        
        // Market cap filter (in billions)
        const marketCapBillions = simplize.market_cap ? simplize.market_cap / 1000000000 : null;
        if (filters.marketCapMin !== null && (marketCapBillions === null || marketCapBillions < filters.marketCapMin)) return false;
        if (filters.marketCapMax !== null && (marketCapBillions === null || marketCapBillions > filters.marketCapMax)) return false;
        
        // Beta filter
        if (filters.betaMin !== null && (simplize.beta_5y === null || simplize.beta_5y < filters.betaMin)) return false;
        if (filters.betaMax !== null && (simplize.beta_5y === null || simplize.beta_5y > filters.betaMax)) return false;
        
        // Simplize quality scores (0-5)
        if (filters.valuationPointMin !== null && (simplize.valuation_point === null || simplize.valuation_point < filters.valuationPointMin)) return false;
        if (filters.growthPointMin !== null && (simplize.growth_point === null || simplize.growth_point < filters.growthPointMin)) return false;
        if (filters.financialHealthPointMin !== null && (simplize.financial_health_point === null || simplize.financial_health_point < filters.financialHealthPointMin)) return false;
        if (filters.dividendPointMin !== null && (simplize.dividend_point === null || simplize.dividend_point < filters.dividendPointMin)) return false;
        
        // Price change filters
        if (filters.priceChange7dMin !== null && (simplize.price_chg_7d === null || simplize.price_chg_7d < filters.priceChange7dMin)) return false;
        if (filters.priceChange30dMin !== null && (simplize.price_chg_30d === null || simplize.price_chg_30d < filters.priceChange30dMin)) return false;
        if (filters.priceChangeYtdMin !== null && (simplize.price_chg_ytd === null || simplize.price_chg_ytd < filters.priceChangeYtdMin)) return false;
      } else {
        // If no simplize data and new filters are set, exclude
        if (filters.dividendYieldMin !== null || filters.marketCapMin !== null || filters.marketCapMax !== null ||
            filters.betaMin !== null || filters.betaMax !== null || filters.valuationPointMin !== null ||
            filters.growthPointMin !== null || filters.financialHealthPointMin !== null || filters.dividendPointMin !== null ||
            filters.priceChange7dMin !== null || filters.priceChange30dMin !== null || filters.priceChangeYtdMin !== null) {
          return false;
        }
      }
      
      return true;
    });
    
    const results = filtered.map((tech) => {
      const company = companies.find((c) => c.symbol === tech.symbol);
      const aiAnalysis = aiAnalysisData.find((a) => a.symbol === tech.symbol);
      const simplize = simplizeData.find((s) => s.symbol === tech.symbol);
      const aiScore = calculateSenAIScore(tech, company, aiAnalysis);
      
      // AI Score filter (applied after calculation)
      return {
        ticker: tech.symbol,
        name: simplize?.name_vi || company?.company_name || tech.symbol,
        sector: simplize?.industry || company?.industry || 'Khác',
        price: simplize?.price_close || tech.current_price || 0,
        change1d: simplize?.pct_change || tech.price_change_1d || 0,
        change5d: simplize?.price_chg_7d || tech.price_change_5d || 0,
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
        aiScore,
        // Fundamental data from Simplize
        pe: simplize?.pe_ratio ?? null,
        pb: simplize?.pb_ratio ?? null,
        roe: simplize?.roe ?? null,
        eps: simplize?.eps ?? null,
        revenueGrowth: simplize?.revenue_5y_growth ?? null,
        profitGrowth: simplize?.net_income_5y_growth ?? null,
        debtToEquity: null,
        // New fields from Simplize
        dividendYield: simplize?.dividend_yield ?? null,
        marketCap: simplize?.market_cap ?? null,
        beta: simplize?.beta_5y ?? null,
        valuationPoint: simplize?.valuation_point ?? null,
        growthPoint: simplize?.growth_point ?? null,
        financialHealthPoint: simplize?.financial_health_point ?? null,
        dividendPoint: simplize?.dividend_point ?? null,
        priceChange7d: simplize?.price_chg_7d ?? null,
        priceChange30d: simplize?.price_chg_30d ?? null,
        priceChangeYtd: simplize?.price_chg_ytd ?? null,
      };
    });
    
    // Apply AI Score filter after calculation
    const filteredByAiScore = filters.aiScoreMin !== null 
      ? results.filter(r => r.aiScore >= filters.aiScoreMin!)
      : results;
    
    filteredByAiScore.sort((a, b) => {
      switch (sortBy) {
        case 'rs': return b.rsRating - a.rsRating;
        case 'change': return b.change1d - a.change1d;
        case 'rsi': return a.rsi - b.rsi;
        case 'aiScore': return b.aiScore - a.aiScore;
        default: return b.overallScore - a.overallScore;
      }
    });
    return filteredByAiScore;
  }, [technicalData, companies, aiAnalysisData, simplizeData, filters, sortBy]);

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

  // Combine multiple filter configs - take the most restrictive values
  const combineFilters = (baseFilters: FilterConfig, newPreset: FilterConfig): FilterConfig => {
    return {
      ...baseFilters,
      rsMin: Math.max(baseFilters.rsMin, newPreset.rsMin),
      rsMax: Math.min(baseFilters.rsMax, newPreset.rsMax),
      rsiMin: Math.max(baseFilters.rsiMin, newPreset.rsiMin),
      rsiMax: Math.min(baseFilters.rsiMax, newPreset.rsiMax),
      trendShort: newPreset.trendShort !== 'ALL' ? newPreset.trendShort : baseFilters.trendShort,
      trendMedium: newPreset.trendMedium !== 'ALL' ? newPreset.trendMedium : baseFilters.trendMedium,
      aboveMa20: newPreset.aboveMa20 !== null ? newPreset.aboveMa20 : baseFilters.aboveMa20,
      aboveMa50: newPreset.aboveMa50 !== null ? newPreset.aboveMa50 : baseFilters.aboveMa50,
      goldenCross: baseFilters.goldenCross || newPreset.goldenCross,
      minScore: Math.max(baseFilters.minScore, newPreset.minScore),
      peMin: newPreset.peMin !== null ? (baseFilters.peMin !== null ? Math.max(baseFilters.peMin, newPreset.peMin) : newPreset.peMin) : baseFilters.peMin,
      peMax: newPreset.peMax !== null ? (baseFilters.peMax !== null ? Math.min(baseFilters.peMax, newPreset.peMax) : newPreset.peMax) : baseFilters.peMax,
      pbMin: newPreset.pbMin !== null ? (baseFilters.pbMin !== null ? Math.max(baseFilters.pbMin, newPreset.pbMin) : newPreset.pbMin) : baseFilters.pbMin,
      pbMax: newPreset.pbMax !== null ? (baseFilters.pbMax !== null ? Math.min(baseFilters.pbMax, newPreset.pbMax) : newPreset.pbMax) : baseFilters.pbMax,
      roeMin: newPreset.roeMin !== null ? (baseFilters.roeMin !== null ? Math.max(baseFilters.roeMin, newPreset.roeMin) : newPreset.roeMin) : baseFilters.roeMin,
      revenueGrowthMin: newPreset.revenueGrowthMin !== null ? (baseFilters.revenueGrowthMin !== null ? Math.max(baseFilters.revenueGrowthMin, newPreset.revenueGrowthMin) : newPreset.revenueGrowthMin) : baseFilters.revenueGrowthMin,
      profitGrowthMin: newPreset.profitGrowthMin !== null ? (baseFilters.profitGrowthMin !== null ? Math.max(baseFilters.profitGrowthMin, newPreset.profitGrowthMin) : newPreset.profitGrowthMin) : baseFilters.profitGrowthMin,
      dividendYieldMin: newPreset.dividendYieldMin !== null ? (baseFilters.dividendYieldMin !== null ? Math.max(baseFilters.dividendYieldMin, newPreset.dividendYieldMin) : newPreset.dividendYieldMin) : baseFilters.dividendYieldMin,
      marketCapMin: newPreset.marketCapMin !== null ? (baseFilters.marketCapMin !== null ? Math.max(baseFilters.marketCapMin, newPreset.marketCapMin) : newPreset.marketCapMin) : baseFilters.marketCapMin,
      marketCapMax: newPreset.marketCapMax !== null ? (baseFilters.marketCapMax !== null ? Math.min(baseFilters.marketCapMax, newPreset.marketCapMax) : newPreset.marketCapMax) : baseFilters.marketCapMax,
      betaMin: newPreset.betaMin !== null ? (baseFilters.betaMin !== null ? Math.max(baseFilters.betaMin, newPreset.betaMin) : newPreset.betaMin) : baseFilters.betaMin,
      betaMax: newPreset.betaMax !== null ? (baseFilters.betaMax !== null ? Math.min(baseFilters.betaMax, newPreset.betaMax) : newPreset.betaMax) : baseFilters.betaMax,
      valuationPointMin: newPreset.valuationPointMin !== null ? (baseFilters.valuationPointMin !== null ? Math.max(baseFilters.valuationPointMin, newPreset.valuationPointMin) : newPreset.valuationPointMin) : baseFilters.valuationPointMin,
      growthPointMin: newPreset.growthPointMin !== null ? (baseFilters.growthPointMin !== null ? Math.max(baseFilters.growthPointMin, newPreset.growthPointMin) : newPreset.growthPointMin) : baseFilters.growthPointMin,
      financialHealthPointMin: newPreset.financialHealthPointMin !== null ? (baseFilters.financialHealthPointMin !== null ? Math.max(baseFilters.financialHealthPointMin, newPreset.financialHealthPointMin) : newPreset.financialHealthPointMin) : baseFilters.financialHealthPointMin,
      dividendPointMin: newPreset.dividendPointMin !== null ? (baseFilters.dividendPointMin !== null ? Math.max(baseFilters.dividendPointMin, newPreset.dividendPointMin) : newPreset.dividendPointMin) : baseFilters.dividendPointMin,
      priceChange7dMin: newPreset.priceChange7dMin !== null ? (baseFilters.priceChange7dMin !== null ? Math.max(baseFilters.priceChange7dMin, newPreset.priceChange7dMin) : newPreset.priceChange7dMin) : baseFilters.priceChange7dMin,
      priceChange30dMin: newPreset.priceChange30dMin !== null ? (baseFilters.priceChange30dMin !== null ? Math.max(baseFilters.priceChange30dMin, newPreset.priceChange30dMin) : newPreset.priceChange30dMin) : baseFilters.priceChange30dMin,
      priceChangeYtdMin: newPreset.priceChangeYtdMin !== null ? (baseFilters.priceChangeYtdMin !== null ? Math.max(baseFilters.priceChangeYtdMin, newPreset.priceChangeYtdMin) : newPreset.priceChangeYtdMin) : baseFilters.priceChangeYtdMin,
      aiScoreMin: newPreset.aiScoreMin !== null ? (baseFilters.aiScoreMin !== null ? Math.max(baseFilters.aiScoreMin, newPreset.aiScoreMin) : newPreset.aiScoreMin) : baseFilters.aiScoreMin,
      epsGrowthMin: baseFilters.epsGrowthMin,
      debtToEquityMax: baseFilters.debtToEquityMax,
    };
  };

  const applyPreset = (presetName: string) => {
    const preset = presetFilters[presetName as keyof typeof presetFilters];
    if (!preset) return;
    
    if (combineMode) {
      // Combine mode: toggle preset on/off
      if (activePresets.includes(presetName)) {
        // Remove preset
        const newActivePresets = activePresets.filter(p => p !== presetName);
        setActivePresets(newActivePresets);
        
        if (newActivePresets.length === 0) {
          setFilters(defaultFilters);
          setActivePreset(null);
          setQuery('');
        } else {
          // Recalculate combined filters
          let combinedFilters = defaultFilters;
          newActivePresets.forEach(p => {
            const pFilter = presetFilters[p as keyof typeof presetFilters];
            if (pFilter) combinedFilters = combineFilters(combinedFilters, pFilter);
          });
          setFilters(combinedFilters);
          setActivePreset(newActivePresets.join(' + '));
          setQuery(newActivePresets.join(' + '));
        }
      } else {
        // Add preset
        const newActivePresets = [...activePresets, presetName];
        setActivePresets(newActivePresets);
        
        const combinedFilters = combineFilters(filters, preset);
        setFilters(combinedFilters);
        setActivePreset(newActivePresets.join(' + '));
        setQuery(newActivePresets.join(' + '));
      }
    } else {
      // Single mode: replace current filter
      setFilters(preset);
      setActivePreset(presetName);
      setActivePresets([presetName]);
      setQuery(presetName);
    }
  };

  const resetFilters = () => { 
    setFilters(defaultFilters); 
    setActivePreset(null); 
    setActivePresets([]);
    setQuery(''); 
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setAiError(null);
    setAiFilterExplanation(null);
    
    // First check if it matches a preset
    const matchedPreset = Object.keys(presetFilters).find((key) => 
      key.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchedPreset) {
      applyPreset(matchedPreset);
      setIsSearching(false);
      return;
    }
    
    // If not a preset, use AI to parse natural language
    setIsAiProcessing(true);
    try {
      const result = await parseNaturalLanguageFilter(query);
      setFilters(result.filters);
      setAiFilterExplanation(result.explanation);
      setAiFilterConfidence(result.confidence);
      setActivePreset(null);
    } catch (error) {
      console.error('AI Filter error:', error);
      setAiError(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu');
    } finally {
      setIsAiProcessing(false);
      setIsSearching(false);
    }
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
            <button onClick={handleSearch} disabled={isSearching || isAiProcessing}
              className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
              {isAiProcessing ? (
                <><Brain size={16} className="animate-pulse" /><span>AI đang xử lý...</span></>
              ) : isSearching ? (
                <><RefreshCw size={16} className="animate-spin" /><span>Đang lọc...</span></>
              ) : (
                <><Wand2 size={16} /><span>Lọc AI</span></>
              )}
            </button>
          </div>

          {/* Combine Mode Toggle & Active Presets */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${combineMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    onClick={() => setCombineMode(!combineMode)}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${combineMode ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Kết hợp bộ lọc</span>
                </label>
                {combineMode && (
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                    Click nhiều bộ lọc để kết hợp
                  </span>
                )}
              </div>
              {activePresets.length > 0 && (
                <button onClick={resetFilters} className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
                  <X size={12} /> Xóa tất cả
                </button>
              )}
            </div>
            
            {/* Active Presets Tags */}
            {activePresets.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Đang kết hợp:</span>
                {activePresets.map((preset) => (
                  <span key={preset} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-full">
                    {preset}
                    <button onClick={() => applyPreset(preset)} className="hover:bg-indigo-700 rounded-full p-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <span className="text-[10px] text-indigo-500">= {filteredResults.length} kết quả</span>
              </div>
            )}
          </div>

          {/* Quick Presets - 2 rows with horizontal scroll */}
          <div className="w-full overflow-x-auto custom-scrollbar-horizontal pb-2">
            <div className="flex flex-col gap-2 min-w-max">
              {/* Row 1 */}
              <div className="flex gap-2">
                {Object.keys(presetFilters).slice(0, Math.ceil(Object.keys(presetFilters).length / 2)).map((preset) => {
                  const getIcon = (name: string) => {
                    if (name.includes('RS')) return TrendingUp;
                    if (name.includes('bứt phá') || name.includes('Breakout')) return Zap;
                    if (name.includes('Quá bán')) return TrendingDown;
                    if (name.includes('Xu hướng')) return Activity;
                    if (name.includes('Momentum')) return Gauge;
                    if (name.includes('P/E') || name.includes('P/B') || name.includes('Value') || name.includes('Deep')) return DollarSign;
                    if (name.includes('ROE')) return Target;
                    if (name.includes('Tăng trưởng') || name.includes('GARP') || name.includes('Siêu')) return TrendingUp;
                    if (name.includes('chất lượng') || name.includes('Quality')) return Award;
                    if (name.includes('Cổ tức') || name.includes('Dividend')) return DollarSign;
                    if (name.includes('Blue chip')) return Shield;
                    if (name.includes('SENAI')) return Brain;
                    if (name.includes('Định giá')) return Star;
                    if (name.includes('giá 7') || name.includes('giá 30')) return Flame;
                    if (name.includes('Beta')) return Activity;
                    if (name.includes('Sức khỏe')) return CheckCircle;
                    return Filter;
                  };
                  const Icon = getIcon(preset);
                  const isActive = activePresets.includes(preset);
                  return (
                    <button key={preset} onClick={() => applyPreset(preset)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                      }`}
                      title={preset}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
              {/* Row 2 */}
              <div className="flex gap-2">
                {Object.keys(presetFilters).slice(Math.ceil(Object.keys(presetFilters).length / 2)).map((preset) => {
                  const getIcon = (name: string) => {
                    if (name.includes('RS')) return TrendingUp;
                    if (name.includes('bứt phá') || name.includes('Breakout')) return Zap;
                    if (name.includes('Quá bán')) return TrendingDown;
                    if (name.includes('Xu hướng')) return Activity;
                    if (name.includes('Momentum')) return Gauge;
                    if (name.includes('P/E') || name.includes('P/B') || name.includes('Value') || name.includes('Deep')) return DollarSign;
                    if (name.includes('ROE')) return Target;
                    if (name.includes('Tăng trưởng') || name.includes('GARP') || name.includes('Siêu')) return TrendingUp;
                    if (name.includes('chất lượng') || name.includes('Quality')) return Award;
                    if (name.includes('Cổ tức') || name.includes('Dividend')) return DollarSign;
                    if (name.includes('Blue chip')) return Shield;
                    if (name.includes('SENAI')) return Brain;
                    if (name.includes('Định giá')) return Star;
                    if (name.includes('giá 7') || name.includes('giá 30')) return Flame;
                    if (name.includes('Beta')) return Activity;
                    if (name.includes('Sức khỏe')) return CheckCircle;
                    return Filter;
                  };
                  const Icon = getIcon(preset);
                  const isActive = activePresets.includes(preset);
                  return (
                    <button key={preset} onClick={() => applyPreset(preset)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                      }`}
                      title={preset}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Natural Language Suggestions */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={14} className="text-violet-500" />
              <span className="text-xs text-slate-500">Hoặc hỏi AI bằng ngôn ngữ tự nhiên:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {quickSuggestions.map((suggestion, idx) => (
                <button key={idx} onClick={() => { setQuery(suggestion.text); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-600 dark:text-violet-400 transition-all hover:scale-105">
                  <span>{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Filter Result Banner */}
      {aiFilterExplanation && (
        <div className="glass-panel p-4 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Wand2 className="text-violet-500" size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">AI đã hiểu yêu cầu của bạn</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  aiFilterConfidence >= 0.8 ? 'bg-emerald-500/20 text-emerald-500' :
                  aiFilterConfidence >= 0.6 ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'
                }`}>
                  {(aiFilterConfidence * 100).toFixed(0)}% tin cậy
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{aiFilterExplanation}</p>
            </div>
            <button onClick={() => setAiFilterExplanation(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* AI Error Banner */}
      {aiError && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-500" size={18} />
            <div className="flex-1">
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Không thể xử lý yêu cầu</span>
              <p className="text-xs text-rose-500/80 mt-0.5">{aiError}</p>
            </div>
            <button onClick={() => setAiError(null)} className="p-1 hover:bg-rose-200 dark:hover:bg-rose-900/30 rounded">
              <X size={16} className="text-rose-400" />
            </button>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2 text-indigo-500 mb-1"><Award size={16} /><span className="text-xs font-medium">SENAI Score TB</span></div>
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
                          <span className="text-slate-500">SENAI Score TB: </span>
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
                          <div className="text-[10px] text-indigo-500">SEN:{stock.aiScore}</div>
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
                    const scoreInfo = getSenAIScoreInfo(stock.aiScore);
                    return (
                      <button key={stock.ticker} onClick={() => toggleCompareStock(stock.ticker)}
                        className={`relative group px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 hover:z-10 ${getHeatmapColor(stock.change1d)} ${
                          compareStocks.includes(stock.ticker) ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                        }`}>
                        {stock.ticker}
                        <span className="block text-[10px] opacity-80">{stock.change1d >= 0 ? '+' : ''}{stock.change1d.toFixed(1)}%</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                          <div className="font-bold">{stock.ticker} <span className={`${scoreInfo.color}`}>SEN: {stock.aiScore}</span></div>
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
                      const scoreInfo = getSenAIScoreInfo(stock.aiScore);
                      return (
                        <th key={stock.ticker} className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{stock.ticker}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${scoreInfo.bg} ${scoreInfo.color}`}>
                              <scoreInfo.icon size={10} /> SEN: {stock.aiScore}
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
                    { label: 'SENAI Score', key: 'aiScore', format: (v: number) => v.toFixed(0), highlight: true },
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
                      const scoreInfo = getSenAIScoreInfo(stock.aiScore);
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
              <p className="text-xs text-slate-500 mb-3">Thêm nhanh cổ phiếu top SENAI Score:</p>
              <div className="flex flex-wrap gap-2">
                {filteredResults.filter((s) => !compareStocks.includes(s.ticker)).slice(0, 6).map((stock) => {
                  const scoreInfo = getSenAIScoreInfo(stock.aiScore);
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
          
          {/* Technical Filters */}
          <div className="mb-6">
            <h4 className="text-xs text-indigo-500 uppercase font-bold mb-3 flex items-center gap-2">
              <BarChart2 size={14} /> Phân tích Kỹ thuật
            </h4>
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
            </div>
          </div>

          {/* Fundamental Filters */}
          <div className="mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs text-emerald-500 uppercase font-bold mb-3 flex items-center gap-2">
              <DollarSign size={14} /> Phân tích Cơ bản
              {simplizeData.length === 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[10px] font-normal">
                  Chưa có dữ liệu
                </span>
              )}
            </h4>
            
            {simplizeData.length === 0 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Chưa có dữ liệu Simplize</p>
                    <p className="text-xs text-amber-500/80 mt-0.5">Mở file <code className="bg-amber-500/20 px-1 rounded">create-simplize-table.html</code> để đồng bộ dữ liệu P/E, P/B, ROE...</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">P/E Ratio</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" value={filters.peMin ?? ''} onChange={(e) => setFilters({ ...filters, peMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                  <input type="number" value={filters.peMax ?? ''} onChange={(e) => setFilters({ ...filters, peMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">P/B Ratio</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" step="0.1" value={filters.pbMin ?? ''} onChange={(e) => setFilters({ ...filters, pbMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                  <input type="number" step="0.1" value={filters.pbMax ?? ''} onChange={(e) => setFilters({ ...filters, pbMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">ROE (%) Min</label>
                <input type="number" value={filters.roeMin ?? ''} onChange={(e) => setFilters({ ...filters, roeMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="VD: 15" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">D/E Max</label>
                <input type="number" step="0.1" value={filters.debtToEquityMax ?? ''} onChange={(e) => setFilters({ ...filters, debtToEquityMax: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="VD: 1.5" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Tăng trưởng DT (%) Min</label>
                <input type="number" value={filters.revenueGrowthMin ?? ''} onChange={(e) => setFilters({ ...filters, revenueGrowthMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="VD: 10" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Tăng trưởng LN (%) Min</label>
                <input type="number" value={filters.profitGrowthMin ?? ''} onChange={(e) => setFilters({ ...filters, profitGrowthMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="VD: 15" />
              </div>
            </div>
          </div>

          {/* Simplize Quality Scores */}
          <div className="mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs text-purple-500 uppercase font-bold mb-3 flex items-center gap-2">
              <Star size={14} /> Điểm chất lượng Simplize (0-5)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Định giá
                </label>
                <select value={filters.valuationPointMin ?? ''} onChange={(e) => setFilters({ ...filters, valuationPointMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                  <option value="">Tất cả</option>
                  <option value="3">≥ 3 (Tốt)</option>
                  <option value="4">≥ 4 (Rất tốt)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tăng trưởng
                </label>
                <select value={filters.growthPointMin ?? ''} onChange={(e) => setFilters({ ...filters, growthPointMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                  <option value="">Tất cả</option>
                  <option value="3">≥ 3 (Tốt)</option>
                  <option value="4">≥ 4 (Rất tốt)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Sức khỏe TC
                </label>
                <select value={filters.financialHealthPointMin ?? ''} onChange={(e) => setFilters({ ...filters, financialHealthPointMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                  <option value="">Tất cả</option>
                  <option value="3">≥ 3 (Tốt)</option>
                  <option value="4">≥ 4 (Rất tốt)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Cổ tức
                </label>
                <select value={filters.dividendPointMin ?? ''} onChange={(e) => setFilters({ ...filters, dividendPointMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                  <option value="">Tất cả</option>
                  <option value="3">≥ 3 (Tốt)</option>
                  <option value="4">≥ 4 (Rất tốt)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> SENAI Score
                </label>
                <select value={filters.aiScoreMin ?? ''} onChange={(e) => setFilters({ ...filters, aiScoreMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm">
                  <option value="">Tất cả</option>
                  <option value="50">≥ 50 (Theo dõi)</option>
                  <option value="65">≥ 65 (Khuyến nghị)</option>
                  <option value="80">≥ 80 (Mua mạnh)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Market Cap & Beta */}
          <div className="mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs text-rose-500 uppercase font-bold mb-3 flex items-center gap-2">
              <Target size={14} /> Quy mô & Rủi ro
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Vốn hóa (tỷ VND)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" value={filters.marketCapMin ?? ''} onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                  <input type="number" value={filters.marketCapMax ?? ''} onChange={(e) => setFilters({ ...filters, marketCapMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Beta (5Y)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" step="0.1" value={filters.betaMin ?? ''} onChange={(e) => setFilters({ ...filters, betaMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min" />
                  <input type="number" step="0.1" value={filters.betaMax ?? ''} onChange={(e) => setFilters({ ...filters, betaMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Thay đổi 7D (%)</label>
                <input type="number" value={filters.priceChange7dMin ?? ''} onChange={(e) => setFilters({ ...filters, priceChange7dMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min %" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Thay đổi 30D (%)</label>
                <input type="number" value={filters.priceChange30dMin ?? ''} onChange={(e) => setFilters({ ...filters, priceChange30dMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm" placeholder="Min %" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">{filteredResults.length}</span> cổ phiếu phù hợp
            </div>
            <button onClick={resetFilters} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-sm font-medium transition-colors">Reset tất cả</button>
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
                <option value="aiScore">Sắp xếp: SENAI Score</option>
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
                  <th className="py-4 font-medium text-center">SENAI Score</th>
                  <th className="py-4 text-right font-medium">Giá</th>
                  <th className="py-4 text-right font-medium">1D %</th>
                  {/* Dynamic columns based on active filters */}
                  {(filters.rsMin > 0 || filters.rsMax < 100 || !activePreset) && (
                    <th className="py-4 text-center font-medium">RS</th>
                  )}
                  {(filters.rsiMin > 0 || filters.rsiMax < 100) && (
                    <th className="py-4 text-center font-medium">RSI</th>
                  )}
                  {(filters.peMin !== null || filters.peMax !== null) && (
                    <th className="py-4 text-center font-medium">P/E</th>
                  )}
                  {(filters.pbMin !== null || filters.pbMax !== null) && (
                    <th className="py-4 text-center font-medium">P/B</th>
                  )}
                  {filters.roeMin !== null && (
                    <th className="py-4 text-center font-medium">ROE</th>
                  )}
                  {filters.dividendYieldMin !== null && (
                    <th className="py-4 text-center font-medium">Cổ tức</th>
                  )}
                  {(filters.revenueGrowthMin !== null || filters.profitGrowthMin !== null) && (
                    <th className="py-4 text-center font-medium">Tăng trưởng</th>
                  )}
                  {(filters.valuationPointMin !== null || filters.growthPointMin !== null || filters.financialHealthPointMin !== null) && (
                    <th className="py-4 text-center font-medium">Điểm CL</th>
                  )}
                  {(filters.priceChange7dMin !== null || filters.priceChange30dMin !== null) && (
                    <th className="py-4 text-center font-medium">Biến động</th>
                  )}
                  {(filters.betaMin !== null || filters.betaMax !== null) && (
                    <th className="py-4 text-center font-medium">Beta</th>
                  )}
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
                    <td colSpan={15} className="py-12 text-center text-slate-500">
                      <Filter size={32} className="mx-auto text-slate-400 mb-2" />
                      <p>Không tìm thấy cổ phiếu phù hợp</p>
                      <button onClick={resetFilters} className="text-indigo-500 hover:text-indigo-600 text-sm font-medium mt-2">Reset bộ lọc</button>
                    </td>
                  </tr>
                ) : (
                  currentResults.map((stock) => {
                    const scoreInfo = getSenAIScoreInfo(stock.aiScore);
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
                        {/* Dynamic data columns */}
                        {(filters.rsMin > 0 || filters.rsMax < 100 || !activePreset) && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.rsRating >= 80 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.rsRating >= 60 ? 'bg-cyan-500/20 text-cyan-500' :
                              stock.rsRating >= 40 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                            }`}>{Math.round(stock.rsRating)}</span>
                          </td>
                        )}
                        {(filters.rsiMin > 0 || filters.rsiMax < 100) && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.rsi > 70 ? 'bg-rose-500/20 text-rose-500' :
                              stock.rsi < 30 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'
                            }`}>{Math.round(stock.rsi)}</span>
                          </td>
                        )}
                        {(filters.peMin !== null || filters.peMax !== null) && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.pe && stock.pe < 12 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.pe && stock.pe < 20 ? 'bg-cyan-500/20 text-cyan-500' :
                              stock.pe && stock.pe < 30 ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>{stock.pe?.toFixed(1) || '--'}</span>
                          </td>
                        )}
                        {(filters.pbMin !== null || filters.pbMax !== null) && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.pb && stock.pb < 1 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.pb && stock.pb < 2 ? 'bg-cyan-500/20 text-cyan-500' :
                              stock.pb && stock.pb < 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>{stock.pb?.toFixed(2) || '--'}</span>
                          </td>
                        )}
                        {filters.roeMin !== null && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.roe && stock.roe >= 20 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.roe && stock.roe >= 15 ? 'bg-cyan-500/20 text-cyan-500' :
                              stock.roe && stock.roe >= 10 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'
                            }`}>{stock.roe?.toFixed(1) || '--'}%</span>
                          </td>
                        )}
                        {filters.dividendYieldMin !== null && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.dividendYield && stock.dividendYield >= 5 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.dividendYield && stock.dividendYield >= 3 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-slate-500/20 text-slate-500'
                            }`}>{stock.dividendYield?.toFixed(1) || '--'}%</span>
                          </td>
                        )}
                        {(filters.revenueGrowthMin !== null || filters.profitGrowthMin !== null) && (
                          <td className="py-4 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-[10px] ${stock.revenueGrowth && stock.revenueGrowth > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                DT: {stock.revenueGrowth?.toFixed(0) || '--'}%
                              </span>
                              <span className={`text-[10px] ${stock.profitGrowth && stock.profitGrowth > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                LN: {stock.profitGrowth?.toFixed(0) || '--'}%
                              </span>
                            </div>
                          </td>
                        )}
                        {(filters.valuationPointMin !== null || filters.growthPointMin !== null || filters.financialHealthPointMin !== null) && (
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {filters.valuationPointMin !== null && (
                                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                  stock.valuationPoint && stock.valuationPoint >= 4 ? 'bg-emerald-500/20 text-emerald-500' :
                                  stock.valuationPoint && stock.valuationPoint >= 3 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-slate-500/20 text-slate-500'
                                }`} title="Định giá">{stock.valuationPoint || '-'}</span>
                              )}
                              {filters.growthPointMin !== null && (
                                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                  stock.growthPoint && stock.growthPoint >= 4 ? 'bg-emerald-500/20 text-emerald-500' :
                                  stock.growthPoint && stock.growthPoint >= 3 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-slate-500/20 text-slate-500'
                                }`} title="Tăng trưởng">{stock.growthPoint || '-'}</span>
                              )}
                              {filters.financialHealthPointMin !== null && (
                                <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                  stock.financialHealthPoint && stock.financialHealthPoint >= 4 ? 'bg-emerald-500/20 text-emerald-500' :
                                  stock.financialHealthPoint && stock.financialHealthPoint >= 3 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-slate-500/20 text-slate-500'
                                }`} title="Sức khỏe TC">{stock.financialHealthPoint || '-'}</span>
                              )}
                            </div>
                          </td>
                        )}
                        {(filters.priceChange7dMin !== null || filters.priceChange30dMin !== null) && (
                          <td className="py-4 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              {filters.priceChange7dMin !== null && (
                                <span className={`text-[10px] font-medium ${stock.priceChange7d && stock.priceChange7d > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  7D: {stock.priceChange7d ? (stock.priceChange7d > 0 ? '+' : '') + stock.priceChange7d.toFixed(1) : '--'}%
                                </span>
                              )}
                              {filters.priceChange30dMin !== null && (
                                <span className={`text-[10px] font-medium ${stock.priceChange30d && stock.priceChange30d > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  30D: {stock.priceChange30d ? (stock.priceChange30d > 0 ? '+' : '') + stock.priceChange30d.toFixed(1) : '--'}%
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {(filters.betaMin !== null || filters.betaMax !== null) && (
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              stock.beta && stock.beta < 0.8 ? 'bg-emerald-500/20 text-emerald-500' :
                              stock.beta && stock.beta < 1.2 ? 'bg-cyan-500/20 text-cyan-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>{stock.beta?.toFixed(2) || '--'}</span>
                          </td>
                        )}
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

      {/* SENAI Score Legend */}
      {!loading && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">SENAI Score:</span>
            {[
              { min: 80, label: 'Mua mạnh', icon: Flame, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
              { min: 65, label: 'Khuyến nghị', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
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
