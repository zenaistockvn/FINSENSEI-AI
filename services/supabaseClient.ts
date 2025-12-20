/**
 * Supabase Client Configuration
 * Kết nối với database chứa dữ liệu VN100
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// Types
export interface Company {
  id: string;
  symbol: string;
  company_name: string;
  company_name_en?: string;
  exchange: string;
  industry: string;
  sector?: string;
  outstanding_shares?: number;
  logo_url?: string;
  is_vn100: boolean;
  is_active: boolean;
}

// Helper function to get company logo URL
export function getCompanyLogoUrl(symbol: string): string {
  // Primary: Vietstock
  return `https://finance.vietstock.vn/image/${symbol}`;
}

// Alternative logo sources
export function getCompanyLogoUrlAlt(symbol: string, source: 'vietstock' | 'simplize' = 'vietstock'): string {
  switch (source) {
    case 'simplize':
      return `https://simplize.vn/api/company/logo/${symbol}`;
    default:
      return `https://finance.vietstock.vn/image/${symbol}`;
  }
}

export interface StockPrice {
  id: string;
  symbol: string;
  trading_date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  value?: number;
}

export interface MarketIndex {
  id: string;
  index_code: string;
  trading_date: string;
  open_value: number;
  high_value: number;
  low_value: number;
  close_value: number;
  volume: number;
  value?: number;
  change_value?: number;
  change_percent?: number;
}

export interface FinancialRatio {
  id: string;
  symbol: string;
  year: number;
  quarter?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  roe?: number;
  roa?: number;
  eps?: number;
  gross_margin?: number;
  net_margin?: number;
  debt_to_equity?: number;
  revenue_growth?: number;
  profit_growth?: number;
}

export interface StockNews {
  id: number;
  symbol: string | null;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  ai_summary: string;
  category: string;
  created_at: string;
}

export interface AIAnalysis {
  id: number;
  symbol: string;
  analysis_date: string;
  rating: number;
  score: number;
  signal: number;
  recommendation: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface RiskAnalysis {
  id: number;
  symbol: string;
  analysis_date: string;
  optimal_holding_days: number;
  upside_probability: number;
  downside_risk: number;
  volatility: number;
  beta: number;
  sharpe_ratio: number;
  max_drawdown: number;
  created_at: string;
  updated_at: string;
}

export interface TradingStrategy {
  id: number;
  symbol: string;
  analysis_date: string;
  buy_zone_low: number;
  buy_zone_high: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number;
  support_1: number;
  support_2: number;
  resistance_1: number;
  resistance_2: number;
  strategy_type: string;
  strategy_note: string;
  created_at: string;
  updated_at: string;
}

export interface TechnicalIndicators {
  id: number;
  symbol: string;
  calculation_date: string;
  current_price: number;
  price_change_1d: number;
  price_change_5d: number;
  price_change_20d: number;
  price_change_60d: number;
  rs_rating: number;
  rs_rank: number;
  ma20: number;
  ma50: number;
  ma200: number;
  price_vs_ma20: number;
  price_vs_ma50: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  volatility_20d: number;
  atr_14: number;
  volume_avg_20d: number;
  volume_ratio: number;
  price_position: number;
  high_52w: number;
  low_52w: number;
  distance_from_high: number;
  trend_short: 'UP' | 'DOWN' | 'SIDEWAYS';
  trend_medium: 'UP' | 'DOWN' | 'SIDEWAYS';
  ma_cross_signal: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NONE';
  momentum_score: number;
  trend_score: number;
  volume_score: number;
  overall_technical_score: number;
  created_at: string;
  updated_at: string;
}

export interface BrokerRecommendation {
  id: number;
  symbol: string;
  recommendation_date: string;
  broker_code: string;
  broker_name: string;
  action: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'KHẢ QUAN' | 'TRUNG LẬP' | 'TIÊU CỰC';
  target_price: number;
  previous_target: number;
  rationale: string;
  report_url: string;
  created_at: string;
}

// API Functions
async function fetchFromSupabase<T>(endpoint: string, params: string = ""): Promise<T[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}${params ? `?${params}` : ""}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

// Companies
export async function getCompanies(): Promise<Company[]> {
  return fetchFromSupabase<Company>("companies", "is_active=eq.true&order=symbol.asc");
}

export async function getVN100Companies(): Promise<Company[]> {
  return fetchFromSupabase<Company>("companies", "is_vn100=eq.true&is_active=eq.true&order=symbol.asc");
}

export async function getCompanyBySymbol(symbol: string): Promise<Company | null> {
  const data = await fetchFromSupabase<Company>("companies", `symbol=eq.${symbol}`);
  return data[0] || null;
}

export async function searchCompanies(query: string): Promise<Company[]> {
  return fetchFromSupabase<Company>(
    "companies", 
    `or=(symbol.ilike.*${query}*,company_name.ilike.*${query}*)&is_active=eq.true&limit=10`
  );
}

// Stock Prices
export async function getStockPrices(symbol: string, limit: number = 30): Promise<StockPrice[]> {
  return fetchFromSupabase<StockPrice>(
    "stock_prices", 
    `symbol=eq.${symbol}&order=trading_date.desc&limit=${limit}`
  );
}

export async function getLatestPrice(symbol: string): Promise<StockPrice | null> {
  const data = await fetchFromSupabase<StockPrice>(
    "stock_prices", 
    `symbol=eq.${symbol}&order=trading_date.desc&limit=1`
  );
  return data[0] || null;
}

export async function getMultipleLatestPrices(symbols: string[]): Promise<StockPrice[]> {
  // Get latest price for each symbol
  const promises = symbols.map(symbol => getLatestPrice(symbol));
  const results = await Promise.all(promises);
  return results.filter((p): p is StockPrice => p !== null);
}

// Market Indices
export async function getMarketIndices(limit: number = 30): Promise<MarketIndex[]> {
  return fetchFromSupabase<MarketIndex>(
    "market_indices", 
    `order=trading_date.desc&limit=${limit}`
  );
}

export async function getLatestIndices(): Promise<MarketIndex[]> {
  // Get latest date first
  const latest = await fetchFromSupabase<MarketIndex>(
    "market_indices",
    "order=trading_date.desc&limit=1"
  );
  
  if (latest.length === 0) return [];
  
  const latestDate = latest[0].trading_date;
  return fetchFromSupabase<MarketIndex>(
    "market_indices",
    `trading_date=eq.${latestDate}&order=index_code.asc`
  );
}

export async function getIndexHistory(indexCode: string, limit: number = 30): Promise<MarketIndex[]> {
  return fetchFromSupabase<MarketIndex>(
    "market_indices",
    `index_code=eq.${indexCode}&order=trading_date.desc&limit=${limit}`
  );
}

// Financial Ratios
export async function getFinancialRatios(symbol: string): Promise<FinancialRatio[]> {
  return fetchFromSupabase<FinancialRatio>(
    "financial_ratios",
    `symbol=eq.${symbol}&order=year.desc,quarter.desc`
  );
}

export async function getLatestFinancialRatio(symbol: string): Promise<FinancialRatio | null> {
  const data = await fetchFromSupabase<FinancialRatio>(
    "financial_ratios",
    `symbol=eq.${symbol}&order=year.desc,quarter.desc&limit=1`
  );
  return data[0] || null;
}

// Stock News
export async function getStockNews(symbol?: string, limit: number = 10): Promise<StockNews[]> {
  let params = `order=published_at.desc&limit=${limit}`;
  if (symbol) {
    // Get news for specific stock OR general market news
    params = `or=(symbol.eq.${symbol},symbol.is.null)&${params}`;
  }
  return fetchFromSupabase<StockNews>("stock_news", params);
}

export async function getMarketNews(limit: number = 10): Promise<StockNews[]> {
  return fetchFromSupabase<StockNews>(
    "stock_news",
    `symbol=is.null&order=published_at.desc&limit=${limit}`
  );
}

export async function getAllNews(limit: number = 20): Promise<StockNews[]> {
  return fetchFromSupabase<StockNews>(
    "stock_news",
    `order=published_at.desc&limit=${limit}`
  );
}

// Top Movers - Get stocks with highest volume/change
export async function getTopMovers(limit: number = 10): Promise<StockPrice[]> {
  // Get latest trading date
  const latest = await fetchFromSupabase<StockPrice>(
    "stock_prices",
    "order=trading_date.desc&limit=1"
  );
  
  if (latest.length === 0) return [];
  
  const latestDate = latest[0].trading_date;
  return fetchFromSupabase<StockPrice>(
    "stock_prices",
    `trading_date=eq.${latestDate}&order=volume.desc&limit=${limit}`
  );
}

// Dashboard Summary
export interface DashboardSummary {
  indices: MarketIndex[];
  topMovers: StockPrice[];
  totalCompanies: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [indices, topMovers, companies] = await Promise.all([
    getLatestIndices(),
    getTopMovers(10),
    getVN100Companies()
  ]);
  
  return {
    indices,
    topMovers,
    totalCompanies: companies.length
  };
}

// AI Analysis
export async function getAIAnalysis(symbol: string): Promise<AIAnalysis | null> {
  const data = await fetchFromSupabase<AIAnalysis>(
    "ai_analysis",
    `symbol=eq.${symbol}&order=analysis_date.desc&limit=1`
  );
  return data[0] || null;
}

// Risk Analysis
export async function getRiskAnalysis(symbol: string): Promise<RiskAnalysis | null> {
  const data = await fetchFromSupabase<RiskAnalysis>(
    "risk_analysis",
    `symbol=eq.${symbol}&order=analysis_date.desc&limit=1`
  );
  return data[0] || null;
}

// Trading Strategy
export async function getTradingStrategy(symbol: string): Promise<TradingStrategy | null> {
  const data = await fetchFromSupabase<TradingStrategy>(
    "trading_strategy",
    `symbol=eq.${symbol}&order=analysis_date.desc&limit=1`
  );
  return data[0] || null;
}

// Broker Recommendations
export async function getBrokerRecommendations(symbol: string, limit: number = 10): Promise<BrokerRecommendation[]> {
  return fetchFromSupabase<BrokerRecommendation>(
    "broker_recommendations",
    `symbol=eq.${symbol}&order=recommendation_date.desc&limit=${limit}`
  );
}

// Technical Indicators
export async function getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators | null> {
  const data = await fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `symbol=eq.${symbol}&order=calculation_date.desc&limit=1`
  );
  return data[0] || null;
}

export async function getAllTechnicalIndicators(): Promise<TechnicalIndicators[]> {
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `order=calculation_date.desc,overall_technical_score.desc`
  );
}

export async function getTopRSStocks(limit: number = 20): Promise<TechnicalIndicators[]> {
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `order=rs_rating.desc.nullslast&limit=${limit}`
  );
}

export async function getStocksAboveMA(maType: 'ma20' | 'ma50' = 'ma20'): Promise<TechnicalIndicators[]> {
  const field = maType === 'ma20' ? 'price_vs_ma20' : 'price_vs_ma50';
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `${field}=gt.0&order=${field}.desc`
  );
}

export async function getOversoldStocks(): Promise<TechnicalIndicators[]> {
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `rsi_14=lt.30&order=rsi_14.asc`
  );
}

export async function getOverboughtStocks(): Promise<TechnicalIndicators[]> {
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `rsi_14=gt.70&order=rsi_14.desc`
  );
}

export async function getGoldenCrossStocks(): Promise<TechnicalIndicators[]> {
  return fetchFromSupabase<TechnicalIndicators>(
    "technical_indicators",
    `ma_cross_signal=eq.GOLDEN_CROSS&order=overall_technical_score.desc`
  );
}

// Get all analysis data for a stock
export interface StockAnalysisData {
  aiAnalysis: AIAnalysis | null;
  riskAnalysis: RiskAnalysis | null;
  tradingStrategy: TradingStrategy | null;
  brokerRecommendations: BrokerRecommendation[];
}

export async function getStockAnalysisData(symbol: string): Promise<StockAnalysisData> {
  const [aiAnalysis, riskAnalysis, tradingStrategy, brokerRecommendations] = await Promise.all([
    getAIAnalysis(symbol),
    getRiskAnalysis(symbol),
    getTradingStrategy(symbol),
    getBrokerRecommendations(symbol)
  ]);

  return {
    aiAnalysis,
    riskAnalysis,
    tradingStrategy,
    brokerRecommendations
  };
}

export default {
  getCompanies,
  getVN100Companies,
  getCompanyBySymbol,
  searchCompanies,
  getStockPrices,
  getLatestPrice,
  getMultipleLatestPrices,
  getMarketIndices,
  getLatestIndices,
  getIndexHistory,
  getFinancialRatios,
  getLatestFinancialRatio,
  getTopMovers,
  getDashboardSummary,
  getStockNews,
  getMarketNews,
  getAllNews,
  getAIAnalysis,
  getRiskAnalysis,
  getTradingStrategy,
  getBrokerRecommendations,
  getStockAnalysisData,
  getTechnicalIndicators,
  getAllTechnicalIndicators,
  getTopRSStocks,
  getStocksAboveMA,
  getOversoldStocks,
  getOverboughtStocks,
  getGoldenCrossStocks
};
