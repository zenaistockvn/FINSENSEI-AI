/**
 * VCI Service - Lấy dữ liệu giá cổ phiếu
 * Ưu tiên: Database Supabase > Cafef API
 * (VCI API bị chặn 403)
 */

import { getStockPrices } from './supabaseClient';

export interface VCICandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Lấy dữ liệu từ database Supabase (đã sync từ VCI/Cafef)
 */
async function getFromDatabase(symbol: string, days: number): Promise<VCICandle[]> {
  try {
    const prices = await getStockPrices(symbol.toUpperCase(), days);
    
    if (prices.length === 0) {
      return [];
    }
    
    // Convert và reverse để có thứ tự từ cũ đến mới
    return prices
      .map(p => ({
        date: p.trading_date,
        open: p.open_price,
        high: p.high_price,
        low: p.low_price,
        close: p.close_price,
        volume: p.volume
      }))
      .reverse();
  } catch (error) {
    console.error(`Error fetching from database for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fallback: Lấy dữ liệu từ Cafef API
 */
async function getCafefHistory(symbol: string, days: number): Promise<VCICandle[]> {
  try {
    const url = `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${symbol.toUpperCase()}&StartDate=&EndDate=&PageIndex=1&PageSize=${days}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Cafef API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.Data?.Data || data.Data.Data.length === 0) {
      return [];
    }

    // Cafef date format: DD/MM/YYYY -> convert to YYYY-MM-DD
    // Cafef price is in thousands (26.7 = 26,700 VND)
    return data.Data.Data.map((item: any) => {
      const parts = item.Ngay.split('/');
      const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return {
        date: isoDate,
        open: item.GiaMoCua * 1000,
        high: item.GiaCaoNhat * 1000,
        low: item.GiaThapNhat * 1000,
        close: item.GiaDongCua * 1000,
        volume: item.KhoiLuongKhopLenh
      };
    }).reverse(); // Cafef trả về mới nhất trước, cần đảo lại
  } catch (error) {
    console.error(`Error fetching Cafef data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Lấy dữ liệu chart - ưu tiên Database, fallback Cafef
 */
export async function getChartData(symbol: string, days: number = 365): Promise<VCICandle[]> {
  // Ưu tiên lấy từ database (đã sync)
  let data = await getFromDatabase(symbol, days);
  
  // Nếu database không có, thử Cafef
  if (data.length === 0) {
    console.log(`No database data for ${symbol}, trying Cafef...`);
    data = await getCafefHistory(symbol, days);
  }
  
  return data;
}

/**
 * Lấy dữ liệu lịch sử (alias cho getChartData)
 */
export async function getVCIHistory(symbol: string, days: number = 365): Promise<VCICandle[]> {
  return getChartData(symbol, days);
}

export default {
  getVCIHistory,
  getChartData
};
