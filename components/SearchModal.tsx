import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, X, Clock, TrendingUp, Star, Building2, 
  ArrowRight, Sparkles, History, Bookmark, ChevronRight
} from 'lucide-react';
import { searchCompanies, getVN100Companies, Company } from '../services/supabaseClient';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
  isDark?: boolean;
}

interface RecentSearch {
  symbol: string;
  name: string;
  timestamp: number;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectStock, isDark = true }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['VNM', 'FPT', 'VIC', 'HPG', 'MWG']);
  const [popularStocks] = useState(['VNM', 'FPT', 'VIC', 'HPG', 'MWG', 'TCB', 'VCB', 'MSN']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCompanies(query);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems = results.length || recentSearches.length || popularStocks.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (results.length > 0) {
            handleSelect(results[selectedIndex]);
          } else if (!query && recentSearches.length > 0) {
            handleSelect({ symbol: recentSearches[selectedIndex].symbol, company_name: recentSearches[selectedIndex].name } as Company);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, recentSearches, query, onClose]);

  const handleSelect = useCallback((company: Company) => {
    // Save to recent searches
    const newRecent: RecentSearch = {
      symbol: company.symbol,
      name: company.company_name || company.symbol,
      timestamp: Date.now()
    };
    
    const updated = [newRecent, ...recentSearches.filter(r => r.symbol !== company.symbol)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    onSelectStock(company.symbol);
    onClose();
  }, [recentSearches, onSelectStock, onClose]);

  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-50 animate-scale-in">
        <div className={`rounded-2xl shadow-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {/* Search Input */}
          <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <Search size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã cổ phiếu, tên công ty, ngành..."
              className={`flex-1 bg-transparent text-lg outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className={`p-1 rounded-lg hover:bg-slate-700/50 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                <X size={18} />
              </button>
            )}
            <kbd className={`px-2 py-1 text-xs rounded ${
              isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                      <div className={`h-3 w-40 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div className="p-2">
                <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Kết quả tìm kiếm
                </div>
                {results.map((company, index) => (
                  <button
                    key={company.symbol}
                    onClick={() => handleSelect(company)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedIndex === index
                        ? isDark ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'
                        : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {company.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {company.symbol}
                        </span>
                        {company.industry && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {company.industry}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {company.company_name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => toggleWatchlist(company.symbol, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        watchlist.includes(company.symbol)
                          ? 'text-amber-500'
                          : isDark ? 'text-slate-500 hover:text-amber-500' : 'text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      <Star size={18} fill={watchlist.includes(company.symbol) ? 'currentColor' : 'none'} />
                    </button>
                    <ChevronRight size={16} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <Search size={24} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                </div>
                <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Không tìm thấy kết quả
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Thử tìm với từ khóa khác
                </p>
              </div>
            )}

            {/* Default State - Recent & Popular */}
            {!loading && !query && (
              <div className="p-2 space-y-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <History size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <span className={`text-xs font-medium uppercase tracking-wider ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Tìm kiếm gần đây
                        </span>
                      </div>
                      <button 
                        onClick={clearRecentSearches}
                        className={`text-xs hover:underline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    {recentSearches.slice(0, 5).map((item, index) => (
                      <button
                        key={item.symbol}
                        onClick={() => handleSelect({ symbol: item.symbol, company_name: item.name } as Company)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedIndex === index
                            ? isDark ? 'bg-slate-800' : 'bg-slate-50'
                            : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                        }`}
                      >
                        <Clock size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.symbol}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.name}
                        </span>
                        <ArrowRight size={14} className={`ml-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Watchlist */}
                {watchlist.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Bookmark size={14} className="text-amber-500" />
                      <span className={`text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Danh sách theo dõi
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 px-3">
                      {watchlist.map(symbol => (
                        <button
                          key={symbol}
                          onClick={() => onSelectStock(symbol)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isDark 
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                              : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Stocks */}
                <div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className={`text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Cổ phiếu phổ biến
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 px-3">
                    {popularStocks.map(symbol => (
                      <button
                        key={symbol}
                        onClick={() => onSelectStock(symbol)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isDark 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-4 py-3 border-t text-xs ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>↑↓</kbd>
                Di chuyển
              </span>
              <span className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>Enter</kbd>
                Chọn
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-500" />
              <span>Powered by Finsensei AI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;
