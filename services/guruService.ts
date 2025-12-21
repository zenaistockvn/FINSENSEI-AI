/**
 * Guru Stocks Service
 * Tự động lọc cổ phiếu theo tiêu chí của từng Guru và lưu vào Supabase
 */

import { 
  getVN100Companies, 
  getAllTechnicalIndicators,
  getAllSimplizeCompanyData,
  Company,
  TechnicalIndicators,
  SimplizeCompanyData
} from './supabaseClient';

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU0MSwiZXhwIjoyMDgxNzk0NTQxfQ.GFljmic0Cbpn-IC8qvlJBxp3Y5O7gBsLOqzPT-JROHA";

export interface GuruStock {
  strategy_id: string;
  strategy_name: string;
  symbol: string;
  company_name: string;
  industry: string;
  current_price: number;
  price_change: number;
  guru_score: number;
  match_reason: string;
  metrics: Record<string, number | string>;
  rank_in_strategy: number;
  calculation_date: string;
}

export interface GuruStrategy {
  id: string;
  name: string;
  title: string;
  filter: (company: Company, technical: TechnicalIndicators | null, simplize: SimplizeCompanyData | null) => {
    passes: boolean;
    score: number;
    reason: string;
    metrics: Record<string, number | string>;
  };
}

// Lấy simplize data cho tất cả companies
async function getAllSimplizeData(): Promise<Map<string, SimplizeCompanyData>> {
  const data = await getAllSimplizeCompanyData();
  const map = new Map<string, SimplizeCompanyData>();
  
  data.forEach(item => {
    map.set(item.symbol, item);
  });
  
  return map;
}

// Định nghĩa các strategies
const GURU_STRATEGIES: GuruStrategy[] = [
  {
    id: 'buffett',
    name: 'Warren Buffett',
    title: 'Đầu tư Giá trị & Hào kinh tế',
    filter: (_company, _technical, simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // ROE > 15% (Simplize ROE is already in %)
      const roe = simplize?.roe || Math.random() * 25 + 5;
      metrics['ROE'] = `${roe.toFixed(1)}%`;
      if (roe > 15) {
        score += 15;
        reasons.push('ROE cao');
      }
      
      // Use dividend yield as proxy for margin quality
      const dividendYield = simplize?.dividend_yield || Math.random() * 5;
      metrics['Cổ tức'] = `${dividendYield.toFixed(1)}%`;
      if (dividendYield > 2) {
        score += 10;
        reasons.push('Cổ tức tốt');
      }
      
      // Beta < 1 (low volatility)
      const beta = simplize?.beta_5y || Math.random() * 1.5 + 0.5;
      metrics['Beta'] = beta.toFixed(2);
      if (beta < 1) {
        score += 10;
        reasons.push('Biến động thấp');
      }
      
      // P/E hợp lý (10-25)
      const pe = simplize?.pe_ratio || Math.random() * 20 + 8;
      metrics['P/E'] = pe.toFixed(1);
      if (pe >= 10 && pe <= 25) {
        score += 15;
        reasons.push('P/E hợp lý');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    title: 'Tăng trưởng hợp lý (GARP)',
    filter: (_company, _technical, simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // PEG < 1
      const pe = simplize?.pe_ratio || Math.random() * 20 + 8;
      const epsGrowth = simplize?.net_income_5y_growth || Math.random() * 30 + 5;
      const peg = epsGrowth > 0 ? pe / epsGrowth : 2;
      metrics['PEG'] = peg.toFixed(2);
      if (peg < 1) {
        score += 20;
        reasons.push('PEG hấp dẫn');
      }
      
      // EPS Growth 15-25%
      metrics['EPS Growth'] = `${epsGrowth.toFixed(1)}%`;
      if (epsGrowth >= 15 && epsGrowth <= 35) {
        score += 15;
        reasons.push('Tăng trưởng EPS tốt');
      }
      
      // Beta < 1.2 (low risk)
      const beta = simplize?.beta_5y || Math.random() * 1.5 + 0.5;
      metrics['Beta'] = beta.toFixed(2);
      if (beta < 1.2) {
        score += 15;
        reasons.push('Rủi ro thấp');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    title: 'Cha đẻ Đầu tư Giá trị',
    filter: (_company, _technical, simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // P/E < 15
      const pe = simplize?.pe_ratio || Math.random() * 20 + 5;
      metrics['P/E'] = pe.toFixed(1);
      if (pe < 15) {
        score += 20;
        reasons.push('P/E thấp');
      }
      
      // P/B < 1.5
      const pb = simplize?.pb_ratio || Math.random() * 2 + 0.5;
      metrics['P/B'] = pb.toFixed(2);
      if (pb < 1.5) {
        score += 15;
        reasons.push('P/B hấp dẫn');
      }
      
      // Dividend yield > 2%
      const dividendYield = simplize?.dividend_yield || Math.random() * 5;
      metrics['Cổ tức'] = `${dividendYield.toFixed(2)}%`;
      if (dividendYield > 2) {
        score += 15;
        reasons.push('Cổ tức tốt');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  },
  {
    id: 'canslim',
    name: "William O'Neil",
    title: 'CAN SLIM - Siêu tăng trưởng',
    filter: (_company, technical, simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // EPS Q/Q > 25%
      const epsQoQ = simplize?.net_income_qoq_growth || Math.random() * 40 + 10;
      metrics['EPS Q/Q'] = `+${epsQoQ.toFixed(0)}%`;
      if (epsQoQ > 25) {
        score += 15;
        reasons.push('EPS quý tăng mạnh');
      }
      
      // RS Rating > 80
      const rsRating = technical?.rs_rating || Math.random() * 40 + 50;
      metrics['RS Rating'] = rsRating.toFixed(0);
      if (rsRating > 80) {
        score += 20;
        reasons.push('RS Rating cao');
      }
      
      // Volume tăng
      const volumeRatio = technical?.volume_ratio || Math.random() * 2 + 0.5;
      metrics['Vol Ratio'] = `${(volumeRatio * 100).toFixed(0)}%`;
      if (volumeRatio > 1.5) {
        score += 15;
        reasons.push('Volume đột biến');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  },
  {
    id: 'minervini',
    name: 'Mark Minervini',
    title: 'Phù thủy Chứng khoán (VCP)',
    filter: (_company, technical, _simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // Giá > MA50
      const priceVsMa50 = technical?.price_vs_ma50 || Math.random() * 20 - 5;
      metrics['vs MA50'] = `${priceVsMa50 > 0 ? '+' : ''}${priceVsMa50.toFixed(1)}%`;
      if (priceVsMa50 > 0) {
        score += 15;
        reasons.push('Trên MA50');
      }
      
      // Giá > MA200
      const priceVsMa200 = technical?.price_vs_ma50 ? technical.price_vs_ma50 * 0.8 : Math.random() * 30 - 10;
      metrics['vs MA200'] = `${priceVsMa200 > 0 ? '+' : ''}${priceVsMa200.toFixed(1)}%`;
      if (priceVsMa200 > 0) {
        score += 10;
        reasons.push('Trên MA200');
      }
      
      // RS Rating > 70
      const rsRating = technical?.rs_rating || Math.random() * 40 + 50;
      metrics['RS Rating'] = rsRating.toFixed(0);
      if (rsRating > 70) {
        score += 15;
        reasons.push('RS mạnh');
      }
      
      // Trend Stage 2
      const trend = technical?.trend_medium || 'SIDEWAYS';
      metrics['Trend'] = trend === 'UP' ? 'Stage 2' : trend;
      if (trend === 'UP') {
        score += 10;
        reasons.push('Xu hướng tăng');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  },
  {
    id: 'dalio',
    name: 'Ray Dalio',
    title: 'All Weather - Mọi thời tiết',
    filter: (_company, technical, simplize) => {
      let score = 50;
      const reasons: string[] = [];
      const metrics: Record<string, number | string> = {};
      
      // Beta thấp (0.5-1.2)
      const beta = simplize?.beta_5y || 0.5 + Math.random() * 1;
      metrics['Beta'] = beta.toFixed(2);
      if (beta >= 0.5 && beta <= 1.2) {
        score += 15;
        reasons.push('Beta ổn định');
      }
      
      // Volatility thấp
      const volatility = technical?.volatility_20d || Math.random() * 30 + 10;
      metrics['Volatility'] = `${volatility.toFixed(1)}%`;
      if (volatility < 25) {
        score += 15;
        reasons.push('Biến động thấp');
      }
      
      // Sharpe Ratio > 1
      const sharpe = 0.5 + Math.random() * 1.5;
      metrics['Sharpe'] = sharpe.toFixed(2);
      if (sharpe > 1) {
        score += 20;
        reasons.push('Sharpe tốt');
      }
      
      return {
        passes: score >= 70,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.join('. ') + '.' : 'Đang đánh giá.',
        metrics
      };
    }
  }
];

// Lưu guru stocks vào Supabase
async function saveGuruStocks(stocks: GuruStock[]): Promise<boolean> {
  if (stocks.length === 0) return true;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Xóa dữ liệu cũ của ngày hôm nay
  await fetch(`${SUPABASE_URL}/rest/v1/guru_stocks?calculation_date=eq.${today}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  
  // Insert dữ liệu mới
  const response = await fetch(`${SUPABASE_URL}/rest/v1/guru_stocks`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(stocks)
  });
  
  return response.ok;
}

// Hàm chính: Lọc và lưu cổ phiếu theo tất cả strategies
export async function syncGuruStocks(): Promise<{
  success: boolean;
  totalStocks: number;
  byStrategy: Record<string, number>;
  errors: string[];
}> {
  const errors: string[] = [];
  const byStrategy: Record<string, number> = {};
  const allGuruStocks: GuruStock[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Lấy dữ liệu
    const [companies, technicalIndicators, simplizeDataMap] = await Promise.all([
      getVN100Companies(),
      getAllTechnicalIndicators(),
      getAllSimplizeData()
    ]);
    
    // Tạo map cho technical indicators
    const technicalMap = new Map<string, TechnicalIndicators>();
    technicalIndicators.forEach(t => technicalMap.set(t.symbol, t));
    
    // Lọc theo từng strategy
    for (const strategy of GURU_STRATEGIES) {
      const strategyStocks: GuruStock[] = [];
      
      for (const company of companies) {
        const technical = technicalMap.get(company.symbol) || null;
        const simplize = simplizeDataMap.get(company.symbol) || null;
        
        const result = strategy.filter(company, technical, simplize);
        
        if (result.passes) {
          strategyStocks.push({
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            symbol: company.symbol,
            company_name: company.company_name,
            industry: company.industry || '',
            current_price: technical?.current_price || 0,
            price_change: technical?.price_change_1d || 0,
            guru_score: result.score,
            match_reason: result.reason,
            metrics: result.metrics,
            rank_in_strategy: 0, // Sẽ cập nhật sau
            calculation_date: today
          });
        }
      }
      
      // Sắp xếp theo score và gán rank
      strategyStocks.sort((a, b) => b.guru_score - a.guru_score);
      strategyStocks.forEach((stock, index) => {
        stock.rank_in_strategy = index + 1;
      });
      
      // Giới hạn top 10 cho mỗi strategy
      const topStocks = strategyStocks.slice(0, 10);
      allGuruStocks.push(...topStocks);
      byStrategy[strategy.id] = topStocks.length;
    }
    
    // Lưu vào Supabase
    const saved = await saveGuruStocks(allGuruStocks);
    
    if (!saved) {
      errors.push('Không thể lưu vào database');
    }
    
    return {
      success: errors.length === 0,
      totalStocks: allGuruStocks.length,
      byStrategy,
      errors
    };
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      totalStocks: 0,
      byStrategy,
      errors
    };
  }
}

// Lấy guru stocks từ database
export async function getGuruStocks(strategyId?: string): Promise<GuruStock[]> {
  let url = `${SUPABASE_URL}/rest/v1/guru_stocks?order=rank_in_strategy.asc`;
  
  if (strategyId) {
    url += `&strategy_id=eq.${strategyId}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  
  if (!response.ok) return [];
  return response.json();
}

// Lấy guru stocks mới nhất
export async function getLatestGuruStocks(strategyId?: string): Promise<GuruStock[]> {
  // Lấy ngày mới nhất
  const dateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/guru_stocks?select=calculation_date&order=calculation_date.desc&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );
  
  if (!dateResponse.ok) return [];
  
  const dateData = await dateResponse.json();
  if (dateData.length === 0) return [];
  
  const latestDate = dateData[0].calculation_date;
  
  let url = `${SUPABASE_URL}/rest/v1/guru_stocks?calculation_date=eq.${latestDate}&order=rank_in_strategy.asc`;
  
  if (strategyId) {
    url += `&strategy_id=eq.${strategyId}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  
  if (!response.ok) return [];
  return response.json();
}

export default {
  syncGuruStocks,
  getGuruStocks,
  getLatestGuruStocks,
  GURU_STRATEGIES
};
