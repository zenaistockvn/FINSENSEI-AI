/**
 * React Hooks for Supabase Stock Data
 */
import { useState, useEffect, useCallback } from 'react';
import * as supabase from '../supabaseClient';

// Hook: Get all VN100 companies
export function useVN100Companies() {
  const [companies, setCompanies] = useState<supabase.Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await supabase.getVN100Companies();
        setCompanies(data);
      } catch (e) {
        setError('Failed to fetch companies');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { companies, loading, error };
}

// Hook: Get stock prices for a symbol
export function useStockPrices(symbol: string, limit: number = 30) {
  const [prices, setPrices] = useState<supabase.StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await supabase.getStockPrices(symbol, limit);
        setPrices(data);
      } catch (e) {
        setError('Failed to fetch prices');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [symbol, limit]);

  return { prices, loading, error };
}

// Hook: Get market indices
export function useMarketIndices() {
  const [indices, setIndices] = useState<supabase.MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await supabase.getLatestIndices();
        setIndices(data);
      } catch (e) {
        setError('Failed to fetch indices');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabase.getLatestIndices();
      setIndices(data);
    } catch (e) {
      setError('Failed to refresh indices');
    } finally {
      setLoading(false);
    }
  }, []);

  return { indices, loading, error, refresh };
}

// Hook: Get financial ratios for a symbol
export function useFinancialRatios(symbol: string) {
  const [ratios, setRatios] = useState<supabase.FinancialRatio[]>([]);
  const [latestRatio, setLatestRatio] = useState<supabase.FinancialRatio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await supabase.getFinancialRatios(symbol);
        setRatios(data);
        setLatestRatio(data[0] || null);
      } catch (e) {
        setError('Failed to fetch ratios');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [symbol]);

  return { ratios, latestRatio, loading, error };
}

// Hook: Get top movers
export function useTopMovers(limit: number = 10) {
  const [movers, setMovers] = useState<supabase.StockPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await supabase.getTopMovers(limit);
        setMovers(data);
      } catch (e) {
        setError('Failed to fetch top movers');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [limit]);

  return { movers, loading, error };
}

// Hook: Search companies
export function useCompanySearch() {
  const [results, setResults] = useState<supabase.Company[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await supabase.searchCompanies(query);
      setResults(data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}

// Hook: Dashboard summary
export function useDashboardSummary() {
  const [summary, setSummary] = useState<supabase.DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await supabase.getDashboardSummary();
        setSummary(data);
      } catch (e) {
        setError('Failed to fetch dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabase.getDashboardSummary();
      setSummary(data);
    } catch (e) {
      setError('Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, refresh };
}

export default {
  useVN100Companies,
  useStockPrices,
  useMarketIndices,
  useFinancialRatios,
  useTopMovers,
  useCompanySearch,
  useDashboardSummary
};
