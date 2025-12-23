/**
 * Simplize Price Service - Lấy giá cổ phiếu từ Simplize API
 * Ưu tiên lấy từ database đã sync, fallback sang API trực tiếp
 */

import { getSimplizeCompanyData } from './supabaseClient';

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
 * Lấy giá từ Simplize API trực tiếp
 * API summary trả về giá đúng VND (VD: 27050 = 27,050 VND)
 */
async function fetchSimplizeAPI(symbol: string): Promise<StockPrice | null> {
  try {
    // Dùng endpoint summary (ổn định hơn)
    const response = await fetch(
      `https://api.simplize.vn/api/company/summary/${symbol.toLowerCase()}`
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const d = result.data;

    if (!d || !d.priceClose) {
      return null;
    }

    // API summary trả về giá đúng VND, KHÔNG cần nhân 1000
    return {
      symbol: symbol.toUpperCase(),
      price: d.priceClose || 0,
      change: d.netChange || 0,
      changePercent: d.pctChange || 0,
      open: d.priceOpen || d.priceClose || 0,
      high: d.priceHigh || d.priceClose || 0,
      low: d.priceLow || d.priceClose || 0,
      volume: d.volume || 0,
      value: 0,
      ceiling: d.priceCeiling || 0,
      floor: d.priceFloor || 0,
      reference: d.priceReferrance || d.priceClose || 0,
      avgPrice: d.priceClose || 0,
      foreignBuy: 0,
      foreignSell: 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching Simplize API for ${symbol}:`, error);
    return null;
  }
}

/**
 * Lấy giá từ database Supabase (đã sync từ Simplize API)
 * Trong giờ giao dịch: ưu tiên API trực tiếp để có giá realtime
 * Ngoài giờ: lấy từ database
 */
export async function getSimplizePrice(symbol: string): Promise<StockPrice | null> {
  try {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isMarketHours = day >= 1 && day <= 5 && hour >= 9 && hour < 15;
    
    // Trong giờ giao dịch: ưu tiên API để có giá realtime
    if (isMarketHours) {
      const apiPrice = await fetchSimplizeAPI(symbol);
      if (apiPrice) {
        console.log(`[Realtime] ${symbol}: ${apiPrice.price.toLocaleString()} (${apiPrice.changePercent > 0 ? '+' : ''}${apiPrice.changePercent.toFixed(2)}%)`);
        return apiPrice;
      }
    }
    
    // Ngoài giờ hoặc API fail: lấy từ database đã sync
    const data = await getSimplizeCompanyData(symbol.toUpperCase());
    
    if (data && data.price_close > 0) {
      return {
        symbol: symbol.toUpperCase(),
        price: data.price_close || 0,
        change: data.net_change || 0,
        changePercent: data.pct_change || 0,
        open: data.price_open || data.price_close || 0,
        high: data.price_high || data.price_close || 0,
        low: data.price_low || data.price_close || 0,
        volume: data.volume || 0,
        value: 0,
        ceiling: data.price_ceiling || 0,
        floor: data.price_floor || 0,
        reference: data.price_reference || data.price_close || 0,
        avgPrice: data.price_close || 0,
        foreignBuy: 0,
        foreignSell: 0,
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    }
    
    // Fallback sang API trực tiếp
    console.log(`No DB data for ${symbol}, fetching from Simplize API...`);
    return fetchSimplizeAPI(symbol);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return fetchSimplizeAPI(symbol);
  }
}

/**
 * Lấy thông tin tổng quan từ database
 */
export async function getSimplizeSummary(symbol: string): Promise<StockSummary | null> {
  try {
    const data = await getSimplizeCompanyData(symbol.toUpperCase());
    
    if (!data) {
      return null;
    }
    
    return {
      symbol: symbol.toUpperCase(),
      name: data.name_vi || '',
      exchange: data.stock_exchange || 'HOSE',
      industry: data.industry || '',
      marketCap: data.market_cap || 0,
      pe: data.pe_ratio || 0,
      pb: data.pb_ratio || 0,
      eps: data.eps || 0,
      roe: data.roe || 0,
      roa: data.roa || 0,
      dividendYield: data.dividend_yield || 0,
      beta: data.beta_5y || 0,
    };
  } catch (error) {
    console.error(`Error fetching summary for ${symbol}:`, error);
    return null;
  }
}

/**
 * Lấy giá nhiều mã cùng lúc
 */
export async function getMultipleSimplizePrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();
  
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
