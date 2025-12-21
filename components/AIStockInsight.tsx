/**
 * AI Stock Insight Component
 * Hiển thị phân tích AI cho cổ phiếu
 */

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Database,
  Zap,
} from 'lucide-react';
import {
  analyzeStockWithChart,
  analyzeStockQuick,
  captureChartAsBase64,
  StockFundamentals,
  AIStockAnalysisResult,
} from '../services/aiStockAnalysisService';
import {
  getLatestFinancialRatio,
  getTechnicalIndicators,
  getCompanyBySymbol,
  getLatestPrice,
} from '../services/supabaseClient';

interface AIStockInsightProps {
  symbol: string;
  isDark?: boolean;
  chartRef?: React.RefObject<HTMLElement>;
  onAnalysisComplete?: (result: AIStockAnalysisResult) => void;
}

const AIStockInsight: React.FC<AIStockInsightProps> = ({
  symbol,
  isDark = true,
  chartRef,
  onAnalysisComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIStockAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [useChart, setUseChart] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Fetch và phân tích
  const runAnalysis = async (refresh: boolean = false) => {
    setLoading(true);
    setError(null);
    setForceRefresh(refresh);

    try {
      // Lấy dữ liệu cơ bản
      const [company, price, financials, technicals] = await Promise.all([
        getCompanyBySymbol(symbol),
        getLatestPrice(symbol),
        getLatestFinancialRatio(symbol),
        getTechnicalIndicators(symbol),
      ]);

      if (!company || !price) {
        throw new Error('Không tìm thấy dữ liệu cổ phiếu');
      }

      // Build fundamentals object
      const fundamentals: StockFundamentals = {
        symbol: company.symbol,
        companyName: company.company_name,
        industry: company.industry || 'N/A',
        currentPrice: price.close_price,
        priceChange: price.close_price - price.open_price,
        priceChangePercent: ((price.close_price - price.open_price) / price.open_price) * 100,
        volume: price.volume,
        pe: financials?.pe_ratio ?? undefined,
        pb: financials?.pb_ratio ?? undefined,
        roe: financials?.roe ?? undefined,
        eps: financials?.eps ?? undefined,
        debtToEquity: financials?.debt_to_equity ?? undefined,
        revenueGrowth: financials?.revenue_growth ?? undefined,
        profitGrowth: financials?.profit_growth ?? undefined,
        ma20: technicals?.ma20 ?? undefined,
        ma50: technicals?.ma50 ?? undefined,
        rsi: technicals?.rsi_14 ?? undefined,
        trendShort: technicals?.trend_short ?? undefined,
        trendMedium: technicals?.trend_medium ?? undefined,
      };

      let chartImage: string | undefined;

      // Capture chart nếu có ref và user muốn dùng chart
      if (useChart && chartRef?.current) {
        try {
          chartImage = await captureChartAsBase64(chartRef.current);
        } catch (e) {
          console.warn('Không thể capture chart:', e);
        }
      }

      // Gọi AI phân tích (với forceRefresh nếu user bấm refresh)
      const result = chartImage
        ? await analyzeStockWithChart(fundamentals, chartImage, refresh)
        : await analyzeStockQuick(fundamentals, refresh);

      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân tích');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run khi symbol thay đổi
  useEffect(() => {
    if (symbol) {
      runAnalysis(false); // Load from cache first
    }
  }, [symbol]);

  // Render sentiment badge
  const renderSentimentBadge = (sentiment: string) => {
    const configs: Record<string, { icon: typeof TrendingUp; bgClass: string; textClass: string; text: string }> = {
      BULLISH: { icon: TrendingUp, bgClass: 'bg-emerald-100 dark:bg-emerald-500/20', textClass: 'text-emerald-700 dark:text-emerald-400', text: 'Tích cực' },
      BEARISH: { icon: TrendingDown, bgClass: 'bg-rose-100 dark:bg-rose-500/20', textClass: 'text-rose-700 dark:text-rose-400', text: 'Tiêu cực' },
      NEUTRAL: { icon: Minus, bgClass: 'bg-slate-100 dark:bg-slate-500/20', textClass: 'text-slate-700 dark:text-slate-400', text: 'Trung lập' },
    };

    const config = configs[sentiment] || configs.NEUTRAL;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bgClass} ${config.textClass}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  // Render recommendation badge
  const renderRecommendation = (rec: string) => {
    const config: Record<string, { color: string; bg: string }> = {
      'MUA': { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
      'BÁN': { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20' },
      'NẮM GIỮ': { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20' },
      'THEO DÕI': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    };

    const style = config[rec] || config['THEO DÕI'];

    return (
      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${style.bg} ${style.color}`}>
        {rec}
      </span>
    );
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300
      ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200'}`}>
      
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer
          ${isDark ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg`}>
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-base flex items-center gap-2
              ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Phân tích AI
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                {symbol}
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Powered by GPT-4 Vision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis?.fromCache && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium
              ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <Database size={10} />
              Cache
            </span>
          )}
          {analysis && renderSentimentBadge(analysis.overallSentiment)}
          <button
            onClick={(e) => {
              e.stopPropagation();
              runAnalysis(true); // Force refresh
            }}
            disabled={loading}
            title="Phân tích lại (bỏ qua cache)"
            className={`p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-indigo-500" />
            ) : (
              <RefreshCw size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            )}
          </button>
          {expanded ? (
            <ChevronUp size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          ) : (
            <ChevronDown size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
                <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
              </div>
              <p className={`mt-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                AI đang phân tích {symbol}...
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Đang đọc chart và dữ liệu cơ bản
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className={`flex items-center gap-3 p-4 rounded-xl
              ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-200'}`}>
              <AlertTriangle size={20} className="text-rose-500" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                  Không thể phân tích
                </p>
                <p className={`text-xs ${isDark ? 'text-rose-400/70' : 'text-rose-500'}`}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && !loading && (
            <>
              {/* Summary Card */}
              <div className={`p-4 rounded-xl border
                ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-indigo-500" />
                      <span className={`text-xs font-bold uppercase tracking-wide
                        ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nhận định AI
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed
                      ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {analysis.shortSummary}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderRecommendation(analysis.recommendation)}
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Độ tin cậy:
                      </span>
                      <span className={`text-sm font-bold
                        ${analysis.confidenceScore >= 70 ? 'text-emerald-500' : 
                          analysis.confidenceScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {analysis.confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical & Fundamental Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technical Analysis */}
                <div className={`p-4 rounded-xl border
                  ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} className="text-blue-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Phân tích Kỹ thuật
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Xu hướng', value: analysis.technicalAnalysis.trend },
                      { label: 'Hỗ trợ', value: analysis.technicalAnalysis.support },
                      { label: 'Kháng cự', value: analysis.technicalAnalysis.resistance },
                      { label: 'Mô hình', value: analysis.technicalAnalysis.pattern },
                      { label: 'Tín hiệu', value: analysis.technicalAnalysis.signal },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.label}:
                        </span>
                        <span className={`text-xs text-right flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fundamental Analysis */}
                <div className={`p-4 rounded-xl border
                  ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Phân tích Cơ bản
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Định giá', value: analysis.fundamentalAnalysis.valuation },
                      { label: 'Tăng trưởng', value: analysis.fundamentalAnalysis.growth },
                      { label: 'Tài chính', value: analysis.fundamentalAnalysis.financial },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.label}:
                        </span>
                        <span className={`text-xs text-right flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className={`p-4 rounded-xl border
                  ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      Điểm mạnh
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((item, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2
                        ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className={`p-4 rounded-xl border
                  ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={16} className="text-rose-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                      Rủi ro
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {analysis.risks.map((item, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2
                        ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-rose-500 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target Price */}
              {analysis.targetPrice && (
                <div className={`p-4 rounded-xl border
                  ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-indigo-500" />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Mức giá mục tiêu
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Thấp</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                        {analysis.targetPrice.low.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Trung bình</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {analysis.targetPrice.mid.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cao</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {analysis.targetPrice.high.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={`flex items-center justify-between pt-2 border-t
                ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(analysis.analysisDate).toLocaleDateString('vi-VN')}
                  </p>
                  {analysis.fromCache && (
                    <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      <Database size={12} />
                      Từ cache
                    </span>
                  )}
                  {!analysis.fromCache && (
                    <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <Zap size={12} />
                      Mới phân tích
                    </span>
                  )}
                </div>
                <button
                  onClick={() => runAnalysis(true)}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${isDark ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  Phân tích lại
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIStockInsight;
