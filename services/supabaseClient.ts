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
  is_vn100: boolean;
  is_active: boolean;
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
  getDashboardSummary
};
