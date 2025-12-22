/**
 * Stock Price Service - Lấy giá cổ phiếu realtime từ TCBS API (miễn phí)
 * Fallback: SSI iBoard API
 */

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  value: number;
  ceiling: number;
  floor: number;
  reference: number;
  avgPrice: number;
  foreignBuy: number;
  foreignSell: number;
  updatedAt: string;
}

export interface StockSummary {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  marketCap: number;
  pe: number;
  pb: number;
  eps: number;
  roe: number;
  roa: number;
  dividendYield: number;
  beta: number;
}

/**
 * Lấy giá realtime từ TCBS API (miễn phí, không cần API key)
 */
export async function getSimplizePrice(symbol: string): Promise<StockPrice | null> {
  try {
    // Sử dụng TCBS API - miễn phí và ổn định
    const response = await fetch(
      `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol.toUpperCase()}/overview`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const d = await response.json();
    
    if (!d || !d.ticker) {
      return null;
    }
    
    // TCBS trả về giá đã nhân 1000, cần chia lại
    const currentPrice = d.price || d.closePrice || 0;
    const refPrice = d.refPrice || d.referencePrice || currentPrice;
    const netChange = currentPrice - refPrice;
    const pctChange = refPrice > 0 ? (netChange / refPrice) * 100 : 0;
    
    return {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      change: netChange,
      changePercent: pctChange,
      open: d.openPrice || d.open || currentPrice,
      high: d.highPrice || d.high || currentPrice,
      low: d.lowPrice || d.low || currentPrice,
      volume: d.volume || d.totalVolume || 0,
      value: d.value || d.totalValue || 0,
      ceiling: d.ceilingPrice || d.ceiling || 0,
      floor: d.floorPrice || d.floor || 0,
      reference: refPrice,
      avgPrice: d.avgPrice || currentPrice,
      foreignBuy: d.foreignBuyVolume || d.foreignBuy || 0,
      foreignSell: d.foreignSellVolume || d.foreignSell || 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching TCBS price for ${symbol}:`, error);
    // Fallback to SSI API
    return getSSIPrice(symbol);
  }
}

/**
 * Fallback: Lấy giá từ SSI iBoard API
 */
async function getSSIPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(
      `https://iboard.ssi.com.vn/dchart/api/1.1/defaultSettings?code=${symbol.toUpperCase()}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const d = data?.data;
    
    if (!d) {
      return null;
    }
    
    const currentPrice = d.lastPrice || d.price || 0;
    const refPrice = d.refPrice || d.reference || currentPrice;
    const netChange = currentPrice - refPrice;
    const pctChange = refPrice > 0 ? (netChange / refPrice) * 100 : 0;
    
    return {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      change: netChange,
      changePercent: pctChange,
      open: d.openPrice || d.open || currentPrice,
      high: d.highPrice || d.high || currentPrice,
      low: d.lowPrice || d.low || currentPrice,
      volume: d.totalVolume || d.volume || 0,
      value: d.totalValue || d.value || 0,
      ceiling: d.ceilingPrice || d.ceiling || 0,
      floor: d.floorPrice || d.floor || 0,
      reference: refPrice,
      avgPrice: d.avgPrice || currentPrice,
      foreignBuy: d.foreignBuyVolume || 0,
      foreignSell: d.foreignSellVolume || 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching SSI price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Lấy thông tin tổng quan từ TCBS API
 */
export async function getSimplizeSummary(symbol: string): Promise<StockSummary | null> {
  try {
    const response = await fetch(
      `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol.toUpperCase()}/overview`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const d = await response.json();
    
    if (!d || !d.ticker) {
      return null;
    }
    
    return {
      symbol: symbol.toUpperCase(),
      name: d.shortName || d.companyName || '',
      exchange: d.exchange || 'HOSE',
      industry: d.industryName || d.industry || '',
      marketCap: d.marketCap || 0,
      pe: d.pe || d.PE || 0,
      pb: d.pb || d.PB || 0,
      eps: d.eps || d.EPS || 0,
      roe: d.roe || d.ROE || 0,
      roa: d.roa || d.ROA || 0,
      dividendYield: d.dividend || d.dividendYield || 0,
      beta: d.beta || 0,
    };
  } catch (error) {
    console.error(`Error fetching TCBS summary for ${symbol}:`, error);
    return null;
  }
}

/**
 * Lấy giá nhiều mã cùng lúc
 */
export async function getMultipleSimplizePrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();
  
  // Fetch in parallel with limit
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => getSimplizePrice(symbol));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((price, index) => {
      if (price) {
        results.set(batch[index].toUpperCase(), price);
      }
    });
  }
  
  return results;
}

export default {
  getSimplizePrice,
  getSimplizeSummary,
  getMultipleSimplizePrices,
};
