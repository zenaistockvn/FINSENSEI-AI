export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  rsRating: number;
  fundamentalScore: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  status?: string; // e.g., "Confirmed Uptrend"
}

export interface NewsItem {
  id: number;
  source: string;
  title: string;
  summary: string;
}

export interface RankingItem {
  ticker: string;
  price: number;
  volPercent: number;
  rsScore: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type PlanType = 'basic' | 'vip' | 'expert';

export interface User {
  name: string;
  email: string;
  avatar: string;
  plan: PlanType;
  memberSince: string;
}