/**
 * Portfolio Service - Quản lý danh mục đầu tư
 * Kết nối với Supabase để lưu trữ và truy xuất dữ liệu portfolio
 */

const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

// =============================================
// TYPES
// =============================================

export interface PortfolioStock {
  id?: string;
  portfolio_id?: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  buy_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields (not stored)
  currentPrice?: number;
  value?: number;
  weight?: number;
  pnl?: number;
  pnlPercent?: number;
  senaiScore?: number;
  sector?: string;
  companyName?: string;
}

export interface Portfolio {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  stocks?: PortfolioStock[];
  // Computed fields
  totalValue?: number;
  totalCost?: number;
  totalPnl?: number;
  totalPnlPercent?: number;
}

export type RiskProfileType = 'conservative' | 'balanced' | 'growth' | 'aggressive';

export interface UserRiskProfile {
  id?: string;
  user_id: string;
  profile_type: RiskProfileType;
  score: number;
  answers?: Record<string, number>;
  rebalance_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

// =============================================
// PORTFOLIO CRUD
// =============================================

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<Portfolio | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_portfolios`, {
      method: 'POST',
      headers,
      body: JSON.stringify(portfolio)
    });
    
    if (!response.ok) {
      console.error('Error creating portfolio:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return null;
  }
}

export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_portfolios?user_id=eq.${userId}&order=created_at.desc`,
      { headers }
    );
    
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

export async function getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_portfolios?id=eq.${portfolioId}`,
      { headers }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
}

export async function updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_portfolios?id=eq.${portfolioId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return null;
  }
}

export async function deletePortfolio(portfolioId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_portfolios?id=eq.${portfolioId}`,
      { method: 'DELETE', headers }
    );
    return response.ok;
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return false;
  }
}

// =============================================
// PORTFOLIO STOCKS CRUD
// =============================================

export async function addStock(stock: Omit<PortfolioStock, 'id' | 'created_at' | 'updated_at'>): Promise<PortfolioStock | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_stocks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(stock)
    });
    
    if (!response.ok) {
      console.error('Error adding stock:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error adding stock:', error);
    return null;
  }
}

export async function getPortfolioStocks(portfolioId: string): Promise<PortfolioStock[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/portfolio_stocks?portfolio_id=eq.${portfolioId}&order=symbol.asc`,
      { headers }
    );
    
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio stocks:', error);
    return [];
  }
}

export async function updateStock(stockId: string, updates: Partial<PortfolioStock>): Promise<PortfolioStock | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/portfolio_stocks?id=eq.${stockId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error updating stock:', error);
    return null;
  }
}

export async function removeStock(stockId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/portfolio_stocks?id=eq.${stockId}`,
      { method: 'DELETE', headers }
    );
    return response.ok;
  } catch (error) {
    console.error('Error removing stock:', error);
    return false;
  }
}

// Upsert stock (add or update if exists)
export async function upsertStock(portfolioId: string, stock: Omit<PortfolioStock, 'id' | 'portfolio_id' | 'created_at' | 'updated_at'>): Promise<PortfolioStock | null> {
  try {
    // Check if stock exists
    const existingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/portfolio_stocks?portfolio_id=eq.${portfolioId}&symbol=eq.${stock.symbol}`,
      { headers }
    );
    
    const existing = await existingResponse.json();
    
    if (existing && existing.length > 0) {
      // Update existing
      return updateStock(existing[0].id, stock);
    } else {
      // Add new
      return addStock({ ...stock, portfolio_id: portfolioId });
    }
  } catch (error) {
    console.error('Error upserting stock:', error);
    return null;
  }
}

// =============================================
// RISK PROFILE
// =============================================

export async function saveRiskProfile(profile: Omit<UserRiskProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserRiskProfile | null> {
  try {
    // Check if profile exists for user
    const existingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_risk_profiles?user_id=eq.${profile.user_id}`,
      { headers }
    );
    
    const existing = await existingResponse.json();
    
    if (existing && existing.length > 0) {
      // Update existing
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_risk_profiles?user_id=eq.${profile.user_id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(profile)
        }
      );
      
      if (!response.ok) return null;
      const data = await response.json();
      return data[0] || null;
    } else {
      // Create new
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_risk_profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data[0] || null;
    }
  } catch (error) {
    console.error('Error saving risk profile:', error);
    return null;
  }
}

export async function getRiskProfile(userId: string): Promise<UserRiskProfile | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_risk_profiles?user_id=eq.${userId}`,
      { headers }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching risk profile:', error);
    return null;
  }
}

// =============================================
// PORTFOLIO WITH STOCKS (Combined)
// =============================================

export async function getPortfolioWithStocks(portfolioId: string): Promise<Portfolio | null> {
  try {
    const [portfolio, stocks] = await Promise.all([
      getPortfolioById(portfolioId),
      getPortfolioStocks(portfolioId)
    ]);
    
    if (!portfolio) return null;
    
    return {
      ...portfolio,
      stocks
    };
  } catch (error) {
    console.error('Error fetching portfolio with stocks:', error);
    return null;
  }
}

export async function getAllPortfoliosWithStocks(userId: string): Promise<Portfolio[]> {
  try {
    const portfolios = await getPortfolios(userId);
    
    const portfoliosWithStocks = await Promise.all(
      portfolios.map(async (portfolio) => {
        const stocks = await getPortfolioStocks(portfolio.id!);
        return { ...portfolio, stocks };
      })
    );
    
    return portfoliosWithStocks;
  } catch (error) {
    console.error('Error fetching all portfolios with stocks:', error);
    return [];
  }
}

// =============================================
// RISK PROFILE CALCULATION
// =============================================

export interface RiskQuestion {
  id: string;
  question: string;
  options: { value: number; label: string }[];
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'investment_horizon',
    question: 'Thời gian đầu tư dự kiến của bạn?',
    options: [
      { value: 1, label: 'Dưới 1 năm' },
      { value: 2, label: '1-3 năm' },
      { value: 3, label: '3-5 năm' },
      { value: 4, label: 'Trên 5 năm' }
    ]
  },
  {
    id: 'loss_tolerance',
    question: 'Nếu danh mục giảm 20%, bạn sẽ?',
    options: [
      { value: 1, label: 'Bán ngay để cắt lỗ' },
      { value: 2, label: 'Bán một phần để giảm rủi ro' },
      { value: 3, label: 'Giữ nguyên và chờ đợi' },
      { value: 4, label: 'Mua thêm để trung bình giá' }
    ]
  },
  {
    id: 'investment_goal',
    question: 'Mục tiêu đầu tư chính của bạn?',
    options: [
      { value: 1, label: 'Bảo toàn vốn' },
      { value: 2, label: 'Thu nhập ổn định (cổ tức)' },
      { value: 3, label: 'Tăng trưởng vốn' },
      { value: 4, label: 'Tối đa hóa lợi nhuận' }
    ]
  },
  {
    id: 'experience',
    question: 'Kinh nghiệm đầu tư chứng khoán của bạn?',
    options: [
      { value: 1, label: 'Chưa có kinh nghiệm' },
      { value: 2, label: 'Dưới 2 năm' },
      { value: 3, label: '2-5 năm' },
      { value: 4, label: 'Trên 5 năm' }
    ]
  },
  {
    id: 'income_stability',
    question: 'Thu nhập của bạn có ổn định không?',
    options: [
      { value: 1, label: 'Không ổn định' },
      { value: 2, label: 'Tương đối ổn định' },
      { value: 3, label: 'Ổn định' },
      { value: 4, label: 'Rất ổn định và có dự phòng' }
    ]
  }
];

export function calculateRiskProfile(answers: Record<string, number>): { type: RiskProfileType; score: number } {
  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const maxScore = RISK_QUESTIONS.length * 4;
  const normalizedScore = Math.round((totalScore / maxScore) * 100);
  
  let type: RiskProfileType;
  if (normalizedScore <= 35) {
    type = 'conservative';
  } else if (normalizedScore <= 55) {
    type = 'balanced';
  } else if (normalizedScore <= 75) {
    type = 'growth';
  } else {
    type = 'aggressive';
  }
  
  return { type, score: normalizedScore };
}

export const RISK_PROFILE_INFO: Record<RiskProfileType, { name: string; description: string; color: string }> = {
  conservative: {
    name: 'Thận trọng',
    description: 'Ưu tiên bảo toàn vốn, chấp nhận lợi nhuận thấp để giảm rủi ro. Phù hợp với cổ phiếu blue-chip, cổ tức cao.',
    color: 'text-blue-500'
  },
  balanced: {
    name: 'Cân bằng',
    description: 'Cân bằng giữa rủi ro và lợi nhuận. Kết hợp cổ phiếu tăng trưởng và cổ phiếu giá trị.',
    color: 'text-emerald-500'
  },
  growth: {
    name: 'Tăng trưởng',
    description: 'Chấp nhận rủi ro cao hơn để đạt lợi nhuận tốt hơn. Tập trung vào cổ phiếu tăng trưởng.',
    color: 'text-amber-500'
  },
  aggressive: {
    name: 'Mạo hiểm',
    description: 'Sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận. Có thể đầu tư vào cổ phiếu đầu cơ.',
    color: 'text-rose-500'
  }
};

export default {
  createPortfolio,
  getPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  addStock,
  getPortfolioStocks,
  updateStock,
  removeStock,
  upsertStock,
  saveRiskProfile,
  getRiskProfile,
  getPortfolioWithStocks,
  getAllPortfoliosWithStocks,
  calculateRiskProfile,
  RISK_QUESTIONS,
  RISK_PROFILE_INFO
};
