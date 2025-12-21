import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, Plus, Trash2, Search, TrendingUp, TrendingDown, PieChart,
  Target, Shield, Zap, Brain, RefreshCw, AlertTriangle, CheckCircle,
  ChevronRight, Edit3, Save, X, HelpCircle, Award, BarChart2, Percent,
  DollarSign, Activity, Eye, Flame, Star, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  Portfolio, PortfolioStock, UserRiskProfile, RiskProfileType,
  createPortfolio, getPortfolios, getPortfolioWithStocks, addStock,
  updateStock, removeStock, saveRiskProfile, getRiskProfile,
  RISK_QUESTIONS, calculateRiskProfile, RISK_PROFILE_INFO,
} from '../services/portfolioService';
import {
  getVN100Companies, getAllTechnicalIndicators, Company, TechnicalIndicators,
} from '../services/supabaseClient';

interface PortfolioOptimizerProps {
  isDark?: boolean;
}

// Generate a simple user ID for demo (in production, use auth)
const getUserId = () => {
  let userId = localStorage.getItem('senai_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('senai_user_id', userId);
  }
  return userId;
};

type ViewMode = 'input' | 'analysis' | 'optimize' | 'rebalance';

// =============================================
// PORTFOLIO ANALYSIS TYPES & HELPERS
// =============================================

interface PortfolioHealthScore {
  overall: number;
  diversification: number;
  risk: number;
  momentum: number;
  quality: number;
  concentration: number;
}

interface PortfolioWarning {
  type: 'high_risk' | 'concentration' | 'sector_imbalance' | 'low_diversification';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedStocks?: string[];
}

interface SectorAllocation {
  sector: string;
  weight: number;
  stockCount: number;
  avgSenaiScore: number;
  color: string;
}

// Sector colors for pie chart
const SECTOR_COLORS: Record<string, string> = {
  'Ngân hàng': '#3B82F6',
  'Bất động sản': '#10B981',
  'Chứng khoán': '#8B5CF6',
  'Thép': '#F59E0B',
  'Dầu khí': '#EF4444',
  'Bán lẻ': '#EC4899',
  'Công nghệ': '#06B6D4',
  'Thực phẩm': '#84CC16',
  'Điện': '#F97316',
  'Xây dựng': '#6366F1',
  'Hóa chất': '#14B8A6',
  'Vận tải': '#A855F7',
  'Khác': '#64748B',
};

// Calculate Portfolio Health Score
function calculatePortfolioHealth(stocks: any[]): PortfolioHealthScore {
  if (stocks.length === 0) {
    return { overall: 0, diversification: 0, risk: 0, momentum: 0, quality: 0, concentration: 0 };
  }

  // 1. Diversification Score (based on number of stocks and sectors)
  const sectors = new Set(stocks.map(s => s.sector || 'Khác'));
  const stockCountScore = Math.min(stocks.length / 10, 1) * 100; // Max at 10 stocks
  const sectorCountScore = Math.min(sectors.size / 5, 1) * 100; // Max at 5 sectors
  const diversification = Math.round((stockCountScore * 0.4 + sectorCountScore * 0.6));

  // 2. Risk Score (based on SENAI scores - higher is better/lower risk)
  const avgSenaiScore = stocks.reduce((sum, s) => sum + (s.senaiScore || 50), 0) / stocks.length;
  const risk = Math.round(avgSenaiScore);

  // 3. Momentum Score (based on RSI and trend)
  const avgRsi = stocks.reduce((sum, s) => sum + (s.rsi || 50), 0) / stocks.length;
  const upTrendCount = stocks.filter(s => s.trend === 'UP').length;
  const trendScore = (upTrendCount / stocks.length) * 100;
  const rsiScore = avgRsi > 70 ? 60 : avgRsi < 30 ? 40 : avgRsi; // Penalize extremes
  const momentum = Math.round((rsiScore * 0.4 + trendScore * 0.6));

  // 4. Quality Score (based on RS Rating)
  const avgRsRating = stocks.reduce((sum, s) => sum + (s.rsRating || 50), 0) / stocks.length;
  const quality = Math.round(avgRsRating);

  // 5. Concentration Score (lower concentration is better)
  const maxWeight = Math.max(...stocks.map(s => s.weight || 0));
  const concentration = Math.round(100 - Math.min(maxWeight * 2, 100)); // Penalize if any stock > 50%

  // Overall Score (weighted average)
  const overall = Math.round(
    diversification * 0.2 +
    risk * 0.25 +
    momentum * 0.2 +
    quality * 0.2 +
    concentration * 0.15
  );

  return { overall, diversification, risk, momentum, quality, concentration };
}

// Calculate Sector Allocation
function calculateSectorAllocation(stocks: any[]): SectorAllocation[] {
  const sectorMap = new Map<string, { weight: number; count: number; totalScore: number }>();
  
  stocks.forEach(stock => {
    const sector = stock.sector || 'Khác';
    const existing = sectorMap.get(sector) || { weight: 0, count: 0, totalScore: 0 };
    sectorMap.set(sector, {
      weight: existing.weight + (stock.weight || 0),
      count: existing.count + 1,
      totalScore: existing.totalScore + (stock.senaiScore || 50),
    });
  });

  return Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      weight: Math.round(data.weight * 10) / 10,
      stockCount: data.count,
      avgSenaiScore: Math.round(data.totalScore / data.count),
      color: SECTOR_COLORS[sector] || SECTOR_COLORS['Khác'],
    }))
    .sort((a, b) => b.weight - a.weight);
}

// Generate Warnings
function generateWarnings(stocks: any[], sectorAllocation: SectorAllocation[]): PortfolioWarning[] {
  const warnings: PortfolioWarning[] = [];

  // High risk stocks (SENAI < 35)
  const highRiskStocks = stocks.filter(s => (s.senaiScore || 50) < 35);
  if (highRiskStocks.length > 0) {
    warnings.push({
      type: 'high_risk',
      severity: highRiskStocks.length >= 3 ? 'high' : 'medium',
      message: `${highRiskStocks.length} cổ phiếu có SENAI Score thấp (<35)`,
      affectedStocks: highRiskStocks.map(s => s.symbol),
    });
  }

  // Concentration warning (any stock > 30%)
  const concentratedStocks = stocks.filter(s => (s.weight || 0) > 30);
  if (concentratedStocks.length > 0) {
    warnings.push({
      type: 'concentration',
      severity: concentratedStocks.some(s => s.weight > 50) ? 'high' : 'medium',
      message: `${concentratedStocks.length} cổ phiếu chiếm tỷ trọng cao (>30%)`,
      affectedStocks: concentratedStocks.map(s => s.symbol),
    });
  }

  // Sector imbalance (any sector > 40%)
  const imbalancedSectors = sectorAllocation.filter(s => s.weight > 40);
  if (imbalancedSectors.length > 0) {
    warnings.push({
      type: 'sector_imbalance',
      severity: imbalancedSectors.some(s => s.weight > 60) ? 'high' : 'medium',
      message: `Ngành ${imbalancedSectors[0].sector} chiếm ${imbalancedSectors[0].weight.toFixed(1)}% danh mục`,
    });
  }

  // Low diversification
  if (stocks.length < 3) {
    warnings.push({
      type: 'low_diversification',
      severity: stocks.length === 1 ? 'high' : 'medium',
      message: 'Danh mục chưa đủ đa dạng hóa (nên có ít nhất 5 cổ phiếu)',
    });
  }

  return warnings;
}

// Identify Strengths and Weaknesses
function identifyStrengthsWeaknesses(healthScore: PortfolioHealthScore, stocks: any[]): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Diversification
  if (healthScore.diversification >= 70) {
    strengths.push('Đa dạng hóa tốt với nhiều ngành khác nhau');
  } else if (healthScore.diversification < 40) {
    weaknesses.push('Cần đa dạng hóa thêm các ngành');
  }

  // Risk/Quality
  if (healthScore.risk >= 70) {
    strengths.push('Chất lượng cổ phiếu cao (SENAI Score tốt)');
  } else if (healthScore.risk < 40) {
    weaknesses.push('Nhiều cổ phiếu có SENAI Score thấp');
  }

  // Momentum
  if (healthScore.momentum >= 70) {
    strengths.push('Xu hướng tăng mạnh, momentum tích cực');
  } else if (healthScore.momentum < 40) {
    weaknesses.push('Xu hướng yếu, cần theo dõi momentum');
  }

  // Quality (RS Rating)
  if (healthScore.quality >= 70) {
    strengths.push('Sức mạnh tương đối (RS) vượt trội');
  } else if (healthScore.quality < 40) {
    weaknesses.push('RS Rating thấp so với thị trường');
  }

  // Concentration
  if (healthScore.concentration >= 70) {
    strengths.push('Phân bổ tỷ trọng cân đối');
  } else if (healthScore.concentration < 40) {
    weaknesses.push('Tập trung quá nhiều vào một số cổ phiếu');
  }

  // Profitable stocks
  const profitableCount = stocks.filter(s => (s.pnl || 0) >= 0).length;
  const profitablePercent = (profitableCount / stocks.length) * 100;
  if (profitablePercent >= 70) {
    strengths.push(`${profitablePercent.toFixed(0)}% cổ phiếu đang có lãi`);
  } else if (profitablePercent < 30) {
    weaknesses.push(`${(100 - profitablePercent).toFixed(0)}% cổ phiếu đang lỗ`);
  }

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
  };
}

// =============================================
// PORTFOLIO ANALYSIS VIEW COMPONENT
// =============================================

interface PortfolioAnalysisViewProps {
  stocks: any[];
  totalValue: number;
  riskProfile: UserRiskProfile | null;
}

const PortfolioAnalysisView: React.FC<PortfolioAnalysisViewProps> = ({ stocks, totalValue, riskProfile }) => {
  if (stocks.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center">
        <PieChart size={64} className="mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Phân tích danh mục
        </h3>
        <p className="text-slate-500">
          Thêm cổ phiếu vào danh mục để xem phân tích chi tiết
        </p>
      </div>
    );
  }

  const healthScore = calculatePortfolioHealth(stocks);
  const sectorAllocation = calculateSectorAllocation(stocks);
  const warnings = generateWarnings(stocks, sectorAllocation);
  const { strengths, weaknesses } = identifyStrengthsWeaknesses(healthScore, stocks);

  // Get health score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-cyan-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-cyan-500 to-cyan-600';
    if (score >= 40) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Xuất sắc';
    if (score >= 60) return 'Tốt';
    if (score >= 40) return 'Trung bình';
    return 'Cần cải thiện';
  };

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Health Score */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Sức khỏe danh mục
          </h3>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="url(#healthGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore.overall * 3.52} 352`}
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={healthScore.overall >= 60 ? '#10B981' : '#F59E0B'} />
                    <stop offset="100%" stopColor={healthScore.overall >= 60 ? '#06B6D4' : '#EF4444'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(healthScore.overall)}`}>
                  {healthScore.overall}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>
          </div>
          
          <div className={`text-center py-2 px-4 rounded-full bg-gradient-to-r ${getScoreBgColor(healthScore.overall)} text-white font-medium`}>
            {getScoreLabel(healthScore.overall)}
          </div>
        </div>

        {/* Score Breakdown - Radar Style */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" />
            Phân tích chi tiết
          </h3>
          
          <div className="space-y-3">
            {[
              { label: 'Đa dạng hóa', value: healthScore.diversification, icon: PieChart },
              { label: 'Chất lượng (SENAI)', value: healthScore.risk, icon: Shield },
              { label: 'Momentum', value: healthScore.momentum, icon: TrendingUp },
              { label: 'RS Rating', value: healthScore.quality, icon: Award },
              { label: 'Phân bổ', value: healthScore.concentration, icon: Target },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className={`font-medium ${getScoreColor(item.value)}`}>{item.value}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBgColor(item.value)} transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-indigo-500" />
            Điểm mạnh & Điểm yếu
          </h3>
          
          <div className="space-y-4">
            {/* Strengths */}
            <div>
              <p className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-1">
                <CheckCircle size={14} /> Điểm mạnh
              </p>
              <ul className="space-y-1">
                {strengths.length > 0 ? strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {s}
                  </li>
                )) : (
                  <li className="text-sm text-slate-500 italic">Chưa xác định</li>
                )}
              </ul>
            </div>
            
            {/* Weaknesses */}
            <div>
              <p className="text-sm font-medium text-rose-500 mb-2 flex items-center gap-1">
                <AlertTriangle size={14} /> Điểm yếu
              </p>
              <ul className="space-y-1">
                {weaknesses.length > 0 ? weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-rose-500 mt-1">•</span>
                    {w}
                  </li>
                )) : (
                  <li className="text-sm text-slate-500 italic">Không có điểm yếu đáng kể</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/5">
          <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Cảnh báo ({warnings.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {warnings.map((warning, i) => (
              <div 
                key={i}
                className={`p-3 rounded-lg ${
                  warning.severity === 'high' ? 'bg-rose-500/10 border border-rose-500/30' :
                  warning.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' :
                  'bg-slate-500/10 border border-slate-500/30'
                }`}
              >
                <p className={`text-sm font-medium ${
                  warning.severity === 'high' ? 'text-rose-500' :
                  warning.severity === 'medium' ? 'text-amber-500' :
                  'text-slate-500'
                }`}>
                  {warning.message}
                </p>
                {warning.affectedStocks && (
                  <p className="text-xs text-slate-500 mt-1">
                    Mã: {warning.affectedStocks.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sector Allocation & Stock Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-500" />
            Phân bổ theo ngành
          </h3>
          
          {/* Simple Pie Chart */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {sectorAllocation.reduce((acc, sector, i) => {
                  const startAngle = acc.offset;
                  const angle = (sector.weight / 100) * 360;
                  const endAngle = startAngle + angle;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  
                  acc.paths.push(
                    <path
                      key={i}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={sector.color}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  );
                  
                  acc.offset = endAngle;
                  return acc;
                }, { paths: [] as React.ReactNode[], offset: 0 }).paths}
              </svg>
            </div>
          </div>
          
          {/* Legend */}
          <div className="space-y-2">
            {sectorAllocation.map((sector, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{sector.sector}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{sector.stockCount} CP</span>
                  <span className="font-medium text-slate-900 dark:text-white">{sector.weight.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Performance Summary */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" />
            Hiệu suất cổ phiếu
          </h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stocks
              .sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0))
              .map((stock, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      (stock.pnlPercent || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{stock.symbol}</p>
                      <p className="text-xs text-slate-500">{stock.weight?.toFixed(1)}% tỷ trọng</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${(stock.pnlPercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {(stock.pnlPercent || 0) >= 0 ? '+' : ''}{(stock.pnlPercent || 0).toFixed(1)}%
                    </p>
                    <p className={`text-xs ${
                      (stock.senaiScore || 50) >= 70 ? 'text-emerald-500' :
                      (stock.senaiScore || 50) >= 50 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      SENAI: {stock.senaiScore || 50}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-sm text-slate-500 mb-1">Số cổ phiếu</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stocks.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-sm text-slate-500 mb-1">SENAI TB</p>
          <p className={`text-2xl font-bold ${getScoreColor(healthScore.risk)}`}>
            {Math.round(stocks.reduce((sum, s) => sum + (s.senaiScore || 50), 0) / stocks.length)}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-sm text-slate-500 mb-1">Cổ phiếu lãi</p>
          <p className="text-2xl font-bold text-emerald-500">
            {stocks.filter(s => (s.pnl || 0) >= 0).length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-sm text-slate-500 mb-1">Cổ phiếu lỗ</p>
          <p className="text-2xl font-bold text-rose-500">
            {stocks.filter(s => (s.pnl || 0) < 0).length}
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================
// PORTFOLIO OPTIMIZE VIEW COMPONENT
// =============================================

interface OptimizationAction {
  type: 'buy' | 'sell' | 'hold' | 'reduce' | 'increase';
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  reason: string;
  senaiScore: number;
  priority: 'high' | 'medium' | 'low';
}

interface PortfolioOptimizeViewProps {
  stocks: any[];
  totalValue: number;
  riskProfile: UserRiskProfile | null;
  companies: Company[];
  technicalData: TechnicalIndicators[];
  onShowRiskQuiz: () => void;
}

// Get target allocation based on risk profile
function getTargetAllocation(profileType: RiskProfileType): { minSenai: number; maxWeight: number; minStocks: number } {
  switch (profileType) {
    case 'conservative':
      return { minSenai: 65, maxWeight: 15, minStocks: 8 };
    case 'balanced':
      return { minSenai: 55, maxWeight: 20, minStocks: 6 };
    case 'growth':
      return { minSenai: 45, maxWeight: 25, minStocks: 5 };
    case 'aggressive':
      return { minSenai: 35, maxWeight: 35, minStocks: 4 };
    default:
      return { minSenai: 50, maxWeight: 20, minStocks: 5 };
  }
}

// Generate optimization actions
function generateOptimizationActions(
  stocks: any[], 
  riskProfile: UserRiskProfile,
  companies: Company[],
  technicalData: TechnicalIndicators[]
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];
  const target = getTargetAllocation(riskProfile.profile_type);

  stocks.forEach(stock => {
    const senaiScore = stock.senaiScore || 50;
    const weight = stock.weight || 0;

    if (senaiScore < target.minSenai) {
      actions.push({
        type: 'sell',
        symbol: stock.symbol,
        currentWeight: weight,
        targetWeight: 0,
        reason: `SENAI Score (${senaiScore}) thấp hơn ngưỡng ${target.minSenai}`,
        senaiScore,
        priority: senaiScore < 30 ? 'high' : 'medium',
      });
    } else if (weight > target.maxWeight) {
      actions.push({
        type: 'reduce',
        symbol: stock.symbol,
        currentWeight: weight,
        targetWeight: target.maxWeight,
        reason: `Tỷ trọng (${weight.toFixed(1)}%) vượt ngưỡng ${target.maxWeight}%`,
        senaiScore,
        priority: weight > target.maxWeight * 1.5 ? 'high' : 'medium',
      });
    } else {
      actions.push({
        type: 'hold',
        symbol: stock.symbol,
        currentWeight: weight,
        targetWeight: weight,
        reason: senaiScore >= 70 ? `SENAI Score tốt (${senaiScore})` : `Theo dõi (SENAI: ${senaiScore})`,
        senaiScore,
        priority: 'low',
      });
    }
  });

  const currentSymbols = new Set(stocks.map(s => s.symbol));
  const topStocks = technicalData
    .filter(t => !currentSymbols.has(t.symbol) && t.overall_technical_score >= 70)
    .sort((a, b) => b.overall_technical_score - a.overall_technical_score)
    .slice(0, 3);

  topStocks.forEach(stock => {
    const company = companies.find(c => c.symbol === stock.symbol);
    actions.push({
      type: 'buy',
      symbol: stock.symbol,
      currentWeight: 0,
      targetWeight: Math.min(target.maxWeight, 10),
      reason: `SENAI cao (${stock.overall_technical_score}), ${company?.industry || 'N/A'}`,
      senaiScore: stock.overall_technical_score,
      priority: stock.overall_technical_score >= 80 ? 'high' : 'medium',
    });
  });

  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

const PortfolioOptimizeView: React.FC<PortfolioOptimizeViewProps> = ({ 
  stocks, totalValue, riskProfile, companies, technicalData, onShowRiskQuiz 
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [actions, setActions] = useState<OptimizationAction[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!riskProfile) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center">
        <Shield size={64} className="mx-auto mb-4 text-amber-500" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cần đánh giá Risk Profile</h3>
        <p className="text-slate-500 mb-4">Hoàn thành đánh giá Risk Profile để AI tối ưu hóa danh mục.</p>
        <button onClick={onShowRiskQuiz} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
          Đánh giá Risk Profile
        </button>
      </div>
    );
  }

  if (stocks.length < 2) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center">
        <Briefcase size={64} className="mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cần thêm cổ phiếu</h3>
        <p className="text-slate-500">Thêm ít nhất 2 cổ phiếu để AI phân tích và đề xuất.</p>
      </div>
    );
  }

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const optimizationActions = generateOptimizationActions(stocks, riskProfile, companies, technicalData);
      setActions(optimizationActions);
      setShowResults(true);
      setIsOptimizing(false);
    }, 1500);
  };

  const target = getTargetAllocation(riskProfile.profile_type);
  const profileInfo = RISK_PROFILE_INFO[riskProfile.profile_type];
  const sellActions = actions.filter(a => a.type === 'sell');
  const buyActions = actions.filter(a => a.type === 'buy');
  const reduceActions = actions.filter(a => a.type === 'reduce');

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'buy': return <ArrowUpRight className="text-emerald-500" size={18} />;
      case 'sell': return <ArrowDownRight className="text-rose-500" size={18} />;
      case 'reduce': return <TrendingDown className="text-amber-500" size={18} />;
      default: return <Target className="text-slate-400" size={18} />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
      case 'sell': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      case 'reduce': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Tối ưu hóa danh mục</h3>
              <p className="text-sm text-slate-500">Risk Profile: <span className={profileInfo.color}>{profileInfo.name}</span></p>
            </div>
          </div>
          {!showResults && (
            <button onClick={handleOptimize} disabled={isOptimizing}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
              {isOptimizing ? <><RefreshCw size={18} className="animate-spin" />Đang phân tích...</> : <><Brain size={18} />Tối ưu hóa ngay</>}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="text-center"><p className="text-sm text-slate-500 mb-1">SENAI tối thiểu</p><p className="text-xl font-bold text-indigo-500">{target.minSenai}</p></div>
          <div className="text-center"><p className="text-sm text-slate-500 mb-1">Tỷ trọng tối đa</p><p className="text-xl font-bold text-indigo-500">{target.maxWeight}%</p></div>
          <div className="text-center"><p className="text-sm text-slate-500 mb-1">Số CP tối thiểu</p><p className="text-xl font-bold text-indigo-500">{target.minStocks}</p></div>
        </div>
      </div>

      {showResults && actions.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500"><p className="text-sm text-slate-500 mb-1">Nên bán</p><p className="text-2xl font-bold text-rose-500">{sellActions.length}</p></div>
            <div className="glass-panel p-4 rounded-xl border-l-4 border-amber-500"><p className="text-sm text-slate-500 mb-1">Giảm tỷ trọng</p><p className="text-2xl font-bold text-amber-500">{reduceActions.length}</p></div>
            <div className="glass-panel p-4 rounded-xl border-l-4 border-emerald-500"><p className="text-sm text-slate-500 mb-1">Nên mua</p><p className="text-2xl font-bold text-emerald-500">{buyActions.length}</p></div>
            <div className="glass-panel p-4 rounded-xl border-l-4 border-slate-500"><p className="text-sm text-slate-500 mb-1">Giữ nguyên</p><p className="text-2xl font-bold text-slate-500">{actions.filter(a => a.type === 'hold').length}</p></div>
          </div>
          <div className="glass-panel p-6 rounded-xl">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Zap size={18} className="text-indigo-500" />Đề xuất hành động ({actions.length})</h4>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <div key={i} className={`p-4 rounded-xl border ${getActionColor(action.type)} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">{getActionIcon(action.type)}<span className="font-bold uppercase text-sm">{action.type === 'buy' ? 'MUA' : action.type === 'sell' ? 'BÁN' : action.type === 'reduce' ? 'GIẢM' : 'GIỮ'}</span></div>
                    <div><p className="font-bold text-slate-900 dark:text-white">{action.symbol}</p><p className="text-sm text-slate-500">{action.reason}</p></div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {action.type !== 'buy' && <span className="text-sm text-slate-500">{action.currentWeight.toFixed(1)}%</span>}
                      {action.type !== 'hold' && <><ChevronRight size={14} className="text-slate-400" /><span className={`text-sm font-medium ${action.type === 'sell' ? 'text-rose-500' : action.type === 'buy' ? 'text-emerald-500' : 'text-amber-500'}`}>{action.targetWeight.toFixed(1)}%</span></>}
                    </div>
                    <p className={`text-xs ${action.senaiScore >= 70 ? 'text-emerald-500' : action.senaiScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>SENAI: {action.senaiScore}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center"><button onClick={() => { setShowResults(false); setActions([]); }} className="px-6 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Phân tích lại</button></div>
        </>
      )}

      {!showResults && !isOptimizing && (
        <div className="glass-panel p-8 rounded-xl text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <Brain size={64} className="mx-auto mb-4 text-indigo-500/50" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sẵn sàng tối ưu hóa</h3>
          <p className="text-slate-500 max-w-md mx-auto">AI sẽ phân tích danh mục dựa trên SENAI Score và Risk Profile để đề xuất các hành động tối ưu.</p>
        </div>
      )}
    </div>
  );
};

// =============================================
// PORTFOLIO REBALANCE VIEW COMPONENT
// =============================================

interface RebalanceSuggestion {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  drift: number;
  action: 'buy' | 'sell';
  quantity: number;
  estimatedValue: number;
}

interface PortfolioRebalanceViewProps {
  stocks: any[];
  totalValue: number;
  riskProfile: UserRiskProfile | null;
}

const PortfolioRebalanceView: React.FC<PortfolioRebalanceViewProps> = ({ stocks, totalValue, riskProfile }) => {
  const [threshold, setThreshold] = useState(5);
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  if (stocks.length < 2) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center">
        <RefreshCw size={64} className="mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cần thêm cổ phiếu</h3>
        <p className="text-slate-500">Thêm ít nhất 2 cổ phiếu để sử dụng tính năng tái cân bằng.</p>
      </div>
    );
  }

  const equalWeight = 100 / stocks.length;

  const handleCalculateRebalance = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const newSuggestions: RebalanceSuggestion[] = [];
      stocks.forEach(stock => {
        const currentWeight = stock.weight || 0;
        const drift = currentWeight - equalWeight;
        if (Math.abs(drift) >= threshold) {
          const action = drift > 0 ? 'sell' : 'buy';
          const weightChange = Math.abs(drift);
          const valueChange = (weightChange / 100) * totalValue;
          const quantity = Math.round(valueChange / (stock.currentPrice || stock.avg_price || 1));
          newSuggestions.push({ symbol: stock.symbol, currentWeight, targetWeight: equalWeight, drift, action, quantity, estimatedValue: valueChange });
        }
      });
      newSuggestions.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));
      setSuggestions(newSuggestions);
      setIsCalculating(false);
    }, 1000);
  };

  const totalBuyValue = suggestions.filter(s => s.action === 'buy').reduce((sum, s) => sum + s.estimatedValue, 0);
  const totalSellValue = suggestions.filter(s => s.action === 'sell').reduce((sum, s) => sum + s.estimatedValue, 0);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl"><RefreshCw className="text-white" size={24} /></div>
          <div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Tái cân bằng danh mục</h3><p className="text-sm text-slate-500">Điều chỉnh tỷ trọng về mức cân bằng</p></div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex-1">
            <label className="block text-sm text-slate-500 mb-2">Ngưỡng drift (%)</label>
            <input type="range" min="1" max="20" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1%</span><span className="font-medium text-indigo-500">{threshold}%</span><span>20%</span></div>
          </div>
          <button onClick={handleCalculateRebalance} disabled={isCalculating} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
            {isCalculating ? <><RefreshCw size={18} className="animate-spin" />Đang tính...</> : <><RefreshCw size={18} />Tính toán</>}
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Tỷ trọng hiện tại vs Mục tiêu ({equalWeight.toFixed(1)}%)</h4>
        <div className="space-y-3">
          {stocks.map((stock, i) => {
            const drift = (stock.weight || 0) - equalWeight;
            const driftColor = Math.abs(drift) >= threshold ? (drift > 0 ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-500';
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 font-bold text-slate-900 dark:text-white">{stock.symbol}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-10" style={{ left: `${equalWeight}%` }} />
                      <div className={`h-full rounded-full transition-all ${(stock.weight || 0) > equalWeight ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(stock.weight || 0, 100)}%` }} />
                    </div>
                    <span className="w-16 text-right text-sm font-medium">{(stock.weight || 0).toFixed(1)}%</span>
                  </div>
                </div>
                <div className={`w-20 text-right text-sm font-medium ${driftColor}`}>{drift >= 0 ? '+' : ''}{drift.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="glass-panel p-6 rounded-xl">
          <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Zap size={18} className="text-cyan-500" />Đề xuất tái cân bằng ({suggestions.length})</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg"><p className="text-sm text-emerald-500 font-medium">Tổng mua</p><p className="text-xl font-bold text-emerald-500">{new Intl.NumberFormat('vi-VN').format(Math.round(totalBuyValue))} đ</p></div>
            <div className="p-3 bg-rose-500/10 rounded-lg"><p className="text-sm text-rose-500 font-medium">Tổng bán</p><p className="text-xl font-bold text-rose-500">{new Intl.NumberFormat('vi-VN').format(Math.round(totalSellValue))} đ</p></div>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${s.action === 'buy' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <div className="flex items-center gap-3">
                  {s.action === 'buy' ? <ArrowUpRight className="text-emerald-500" size={20} /> : <ArrowDownRight className="text-rose-500" size={20} />}
                  <div><p className="font-bold text-slate-900 dark:text-white">{s.symbol}</p><p className="text-sm text-slate-500">{s.currentWeight.toFixed(1)}% → {s.targetWeight.toFixed(1)}%</p></div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${s.action === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>{s.action === 'buy' ? 'MUA' : 'BÁN'} {s.quantity.toLocaleString()} CP</p>
                  <p className="text-sm text-slate-500">~{new Intl.NumberFormat('vi-VN').format(Math.round(s.estimatedValue))} đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && !isCalculating && (
        <div className="glass-panel p-8 rounded-xl text-center bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
          <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500/50" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Danh mục đã cân bằng</h3>
          <p className="text-slate-500">Không có cổ phiếu nào vượt ngưỡng drift {threshold}%.</p>
        </div>
      )}
    </div>
  );
};

const PortfolioOptimizer: React.FC<PortfolioOptimizerProps> = ({ isDark = true }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [technicalData, setTechnicalData] = useState<TechnicalIndicators[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [riskProfile, setRiskProfile] = useState<UserRiskProfile | null>(null);
  
  // Input state
  const [newStock, setNewStock] = useState({ symbol: '', quantity: '', avgPrice: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  
  // Risk quiz state
  const [showRiskQuiz, setShowRiskQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const userId = getUserId();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesData, techData, userPortfolios, userRiskProfile] = await Promise.all([
          getVN100Companies(),
          getAllTechnicalIndicators(),
          getPortfolios(userId),
          getRiskProfile(userId),
        ]);
        
        setCompanies(companiesData);
        setTechnicalData(techData);
        setPortfolios(userPortfolios);
        setRiskProfile(userRiskProfile);
        
        // Load first portfolio with stocks if exists
        if (userPortfolios.length > 0) {
          const portfolioWithStocks = await getPortfolioWithStocks(userPortfolios[0].id!);
          setActivePortfolio(portfolioWithStocks);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Filter companies for search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies.slice(0, 10);
    const query = searchQuery.toUpperCase();
    return companies.filter(c => 
      c.symbol.includes(query) || 
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [companies, searchQuery]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!activePortfolio?.stocks || activePortfolio.stocks.length === 0) {
      return { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPercent: 0, stocks: [] };
    }

    const enrichedStocks = activePortfolio.stocks.map(stock => {
      const tech = technicalData.find(t => t.symbol === stock.symbol);
      const company = companies.find(c => c.symbol === stock.symbol);
      const currentPrice = tech?.current_price || stock.avg_price;
      const value = stock.quantity * currentPrice;
      const cost = stock.quantity * stock.avg_price;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      
      return {
        ...stock,
        currentPrice,
        value,
        cost,
        pnl,
        pnlPercent,
        senaiScore: tech?.overall_technical_score || 50,
        sector: company?.industry || 'Khác',
        companyName: company?.company_name || stock.symbol,
        rsRating: tech?.rs_rating || 50,
        rsi: tech?.rsi_14 || 50,
        trend: tech?.trend_short || 'SIDEWAYS',
      };
    });

    const totalValue = enrichedStocks.reduce((sum, s) => sum + (s.value || 0), 0);
    const totalCost = enrichedStocks.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    // Calculate weights
    const stocksWithWeights = enrichedStocks.map(s => ({
      ...s,
      weight: totalValue > 0 ? ((s.value || 0) / totalValue) * 100 : 0,
    }));

    return { totalValue, totalCost, totalPnl, totalPnlPercent, stocks: stocksWithWeights };
  }, [activePortfolio, technicalData, companies]);

  // Create new portfolio
  const handleCreatePortfolio = async () => {
    setSaving(true);
    try {
      const newPortfolio = await createPortfolio({
        user_id: userId,
        name: 'Danh mục ' + (portfolios.length + 1),
        is_default: portfolios.length === 0,
      });
      
      if (newPortfolio) {
        setPortfolios([...portfolios, newPortfolio]);
        setActivePortfolio({ ...newPortfolio, stocks: [] });
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add stock to portfolio
  const handleAddStock = async () => {
    if (!activePortfolio?.id || !newStock.symbol || !newStock.quantity || !newStock.avgPrice) return;
    
    // Validate symbol
    const isValidSymbol = companies.some(c => c.symbol === newStock.symbol.toUpperCase());
    if (!isValidSymbol) {
      alert('Mã cổ phiếu không hợp lệ!');
      return;
    }
    
    setSaving(true);
    try {
      const stock = await addStock({
        portfolio_id: activePortfolio.id,
        symbol: newStock.symbol.toUpperCase(),
        quantity: parseInt(newStock.quantity),
        avg_price: parseFloat(newStock.avgPrice),
      });
      
      if (stock) {
        const updatedStocks = [...(activePortfolio.stocks || []), stock];
        setActivePortfolio({ ...activePortfolio, stocks: updatedStocks });
        setNewStock({ symbol: '', quantity: '', avgPrice: '' });
        setShowSearch(false);
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setSaving(false);
    }
  };

  // Remove stock from portfolio
  const handleRemoveStock = async (stockId: string) => {
    if (!activePortfolio) return;
    
    setSaving(true);
    try {
      const success = await removeStock(stockId);
      if (success) {
        const updatedStocks = activePortfolio.stocks?.filter(s => s.id !== stockId) || [];
        setActivePortfolio({ ...activePortfolio, stocks: updatedStocks });
      }
    } catch (error) {
      console.error('Error removing stock:', error);
    } finally {
      setSaving(false);
    }
  };

  // Select company from search
  const handleSelectCompany = (company: Company) => {
    setNewStock({ ...newStock, symbol: company.symbol });
    setSearchQuery('');
    setShowSearch(false);
  };

  // Handle risk quiz
  const handleQuizAnswer = (questionId: string, value: number) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: value });
    if (currentQuestion < RISK_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmitRiskQuiz = async () => {
    if (Object.keys(quizAnswers).length < RISK_QUESTIONS.length) return;
    
    const { type, score } = calculateRiskProfile(quizAnswers);
    
    setSaving(true);
    try {
      const profile = await saveRiskProfile({
        user_id: userId,
        profile_type: type,
        score,
        answers: quizAnswers,
      });
      
      if (profile) {
        setRiskProfile(profile);
        setShowRiskQuiz(false);
      }
    } catch (error) {
      console.error('Error saving risk profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' đ';
  };

  // Get SENAI Score color
  const getSenaiScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 65) return 'text-cyan-500';
    if (score >= 50) return 'text-amber-500';
    if (score >= 35) return 'text-orange-500';
    return 'text-rose-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <span className="ml-3 text-slate-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border-t border-indigo-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Briefcase className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                AI Portfolio Optimizer
              </h2>
              <p className="text-sm text-slate-500">
                Tối ưu hóa danh mục đầu tư với trí tuệ nhân tạo
              </p>
            </div>
          </div>
          
          {/* Risk Profile Badge */}
          {riskProfile ? (
            <button
              onClick={() => setShowRiskQuiz(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border ${RISK_PROFILE_INFO[riskProfile.profile_type].color} border-current/30 bg-current/10`}
            >
              <Shield size={16} />
              <span className="font-medium">{RISK_PROFILE_INFO[riskProfile.profile_type].name}</span>
              <span className="text-xs opacity-70">({riskProfile.score}%)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowRiskQuiz(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30"
            >
              <HelpCircle size={16} />
              <span className="font-medium">Đánh giá Risk Profile</span>
            </button>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-4">
          {[
            { id: 'input', label: 'Danh mục', icon: Briefcase },
            { id: 'analysis', label: 'Phân tích', icon: PieChart },
            { id: 'optimize', label: 'Tối ưu hóa', icon: Brain },
            { id: 'rebalance', label: 'Rebalance', icon: RefreshCw },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Quiz Modal */}
      {showRiskQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Đánh giá Risk Profile
              </h3>
              <button onClick={() => setShowRiskQuiz(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {Object.keys(quizAnswers).length < RISK_QUESTIONS.length ? (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Câu {currentQuestion + 1}/{RISK_QUESTIONS.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / RISK_QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${((currentQuestion + 1) / RISK_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  {RISK_QUESTIONS[currentQuestion].question}
                </p>
                
                <div className="space-y-2">
                  {RISK_QUESTIONS[currentQuestion].options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleQuizAnswer(RISK_QUESTIONS[currentQuestion].id, option.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        quizAnswers[RISK_QUESTIONS[currentQuestion].id] === option.value
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CheckCircle className="text-white" size={40} />
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Hoàn thành đánh giá!
                </p>
                <p className="text-slate-500 mb-6">
                  Nhấn nút bên dưới để xem kết quả Risk Profile của bạn.
                </p>
                <button
                  onClick={handleSubmitRiskQuiz}
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Xem kết quả'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Input View */}
      {viewMode === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <DollarSign size={14} />
                  <span className="text-xs">Tổng giá trị</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.totalValue)}
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Activity size={14} />
                  <span className="text-xs">Giá vốn</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(portfolioMetrics.totalCost)}
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  {portfolioMetrics.totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="text-xs">Lãi/Lỗ</span>
                </div>
                <p className={`text-xl font-bold ${portfolioMetrics.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {portfolioMetrics.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalPnl)}
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Percent size={14} />
                  <span className="text-xs">% Lãi/Lỗ</span>
                </div>
                <p className={`text-xl font-bold ${portfolioMetrics.totalPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {portfolioMetrics.totalPnlPercent >= 0 ? '+' : ''}{portfolioMetrics.totalPnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Stock List */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Danh sách cổ phiếu ({portfolioMetrics.stocks.length})
                </h3>
              </div>
              
              {portfolioMetrics.stocks.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Chưa có cổ phiếu nào trong danh mục</p>
                  <p className="text-sm">Thêm cổ phiếu bằng form bên phải</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4 text-left">Mã CK</th>
                        <th className="py-3 px-4 text-right">SL</th>
                        <th className="py-3 px-4 text-right">Giá TB</th>
                        <th className="py-3 px-4 text-right">Giá TT</th>
                        <th className="py-3 px-4 text-right">Giá trị</th>
                        <th className="py-3 px-4 text-right">Lãi/Lỗ</th>
                        <th className="py-3 px-4 text-center">Tỷ trọng</th>
                        <th className="py-3 px-4 text-center">SENAI</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {portfolioMetrics.stocks.map((stock: any) => (
                        <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{stock.symbol}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[120px]">{stock.companyName}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{stock.quantity.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{stock.avg_price.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{stock.currentPrice?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-medium">{stock.value?.toLocaleString()}</td>
                          <td className={`py-3 px-4 text-right font-medium ${stock.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stock.pnl >= 0 ? '+' : ''}{stock.pnlPercent?.toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-medium">
                              {stock.weight?.toFixed(1)}%
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${getSenaiScoreColor(stock.senaiScore)}`}>
                              {stock.senaiScore}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleRemoveStock(stock.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Add Stock Form */}
          <div className="space-y-4">
            {!activePortfolio ? (
              <div className="glass-panel p-6 rounded-xl text-center">
                <Briefcase size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500 mb-4">Tạo danh mục đầu tiên của bạn</p>
                <button
                  onClick={handleCreatePortfolio}
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? 'Đang tạo...' : 'Tạo danh mục mới'}
                </button>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-xl">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plus size={18} />
                  Thêm cổ phiếu
                </h3>
                
                {/* Symbol Search */}
                <div className="mb-4 relative">
                  <label className="block text-sm text-slate-500 mb-1">Mã cổ phiếu</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newStock.symbol}
                      onChange={(e) => {
                        setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() });
                        setSearchQuery(e.target.value);
                        setShowSearch(true);
                      }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="VD: VNM, FPT..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  
                  {/* Search Results */}
                  {showSearch && searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredCompanies.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500">Không tìm thấy mã cổ phiếu</div>
                      ) : (
                        filteredCompanies.map(company => (
                          <button
                            key={company.symbol}
                            onClick={() => handleSelectCompany(company)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">{company.symbol}</span>
                              <span className="text-sm text-slate-500 ml-2">{company.company_name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{company.industry}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm text-slate-500 mb-1">Số lượng</label>
                  <input
                    type="number"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                    placeholder="VD: 100"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                
                {/* Average Price */}
                <div className="mb-4">
                  <label className="block text-sm text-slate-500 mb-1">Giá mua trung bình</label>
                  <input
                    type="number"
                    value={newStock.avgPrice}
                    onChange={(e) => setNewStock({ ...newStock, avgPrice: e.target.value })}
                    placeholder="VD: 85000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                
                <button
                  onClick={handleAddStock}
                  disabled={saving || !newStock.symbol || !newStock.quantity || !newStock.avgPrice}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><RefreshCw size={16} className="animate-spin" /> Đang thêm...</>
                  ) : (
                    <><Plus size={16} /> Thêm vào danh mục</>
                  )}
                </button>
              </div>
            )}
            
            {/* Quick Tips */}
            <div className="glass-panel p-4 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" />
                Mẹo nhanh
              </h4>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Nhập đầy đủ danh mục để AI phân tích chính xác</li>
                <li>• Đánh giá Risk Profile để nhận đề xuất phù hợp</li>
                <li>• Xem tab "Phân tích" để biết sức khỏe danh mục</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Analysis View - Full Implementation */}
      {viewMode === 'analysis' && (
        <PortfolioAnalysisView 
          stocks={portfolioMetrics.stocks}
          totalValue={portfolioMetrics.totalValue}
          riskProfile={riskProfile}
        />
      )}

      {/* Optimize View - Full Implementation */}
      {viewMode === 'optimize' && (
        <PortfolioOptimizeView 
          stocks={portfolioMetrics.stocks}
          totalValue={portfolioMetrics.totalValue}
          riskProfile={riskProfile}
          companies={companies}
          technicalData={technicalData}
          onShowRiskQuiz={() => setShowRiskQuiz(true)}
        />
      )}

      {/* Rebalance View - Full Implementation */}
      {viewMode === 'rebalance' && (
        <PortfolioRebalanceView 
          stocks={portfolioMetrics.stocks}
          totalValue={portfolioMetrics.totalValue}
          riskProfile={riskProfile}
        />
      )}
    </div>
  );
};

export default PortfolioOptimizer;
