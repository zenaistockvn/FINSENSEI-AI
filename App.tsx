import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MarketPulse from './components/MarketPulse';
import StockHealth from './components/StockHealth';
import SmartRankings from './components/SmartRankings';
import ChatWidget from './components/ChatWidget';
import AIScreener from './components/AIScreener';
import StockAnalysis from './components/StockAnalysis';
import GuruPortfolios from './components/GuruPortfolios';
import SenAssistant from './components/SenAssistant';
import UserProfile from './components/UserProfile';
import { StockData, NewsItem, User, PlanType } from './types';
import { getTopMovers, getVN100Companies, Company } from './services/supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User State - Init as null to simulate fetching
  const [user, setUser] = useState<User | null>(null);
  
  // Stock data from Supabase
  const [currentStock, setCurrentStock] = useState<StockData | null>(null);

  useEffect(() => {
    // Simulate API Fetch for user
    const fetchUserData = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser({
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@gmail.com',
            avatar: 'https://i.pravatar.cc/150?img=11',
            plan: 'basic',
            memberSince: '15/05/2024'
        });
    };
    
    // Fetch real stock data from Supabase
    const fetchStockData = async () => {
      try {
        const [movers, companies] = await Promise.all([
          getTopMovers(1),
          getVN100Companies()
        ]);
        
        if (movers.length > 0) {
          const topStock = movers[0];
          const company = companies.find((c: Company) => c.symbol === topStock.symbol);
          
          const priceChange = topStock.close_price - topStock.open_price;
          const changePercent = topStock.open_price > 0 
            ? (priceChange / topStock.open_price) * 100 
            : 0;
          
          setCurrentStock({
            ticker: topStock.symbol,
            name: company?.company_name || topStock.symbol,
            price: topStock.close_price * 1000,
            change: Math.round(priceChange * 1000),
            changePercent: Math.round(changePercent * 100) / 100,
            currency: 'VND',
            rsRating: Math.min(95, Math.floor(topStock.volume / 100000)),
            fundamentalScore: 70 + Math.floor(Math.random() * 20)
          });
        } else {
          // Fallback to default stock if no data
          setCurrentStock({
            ticker: 'VNM',
            name: 'Vinamilk',
            price: 68000,
            change: 500,
            changePercent: 0.74,
            currency: 'VND',
            rsRating: 85,
            fundamentalScore: 78
          });
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        // Fallback
        setCurrentStock({
          ticker: 'VNM',
          name: 'Vinamilk',
          price: 68000,
          change: 500,
          changePercent: 0.74,
          currency: 'VND',
          rsRating: 85,
          fundamentalScore: 78
        });
      }
    };
    
    fetchUserData();
    fetchStockData();
  }, []);

  const handleUpgrade = (plan: PlanType) => {
    // In a real app, this would trigger a payment gateway
    if (confirm(`Bạn có chắc chắn muốn nâng cấp lên gói ${plan.toUpperCase()}?`)) {
        setUser(prev => prev ? ({ ...prev, plan }) : null);
        alert('Nâng cấp thành công! Chào mừng bạn đến với gói ' + plan.toUpperCase());
    }
  };

  // News data (can be fetched from API later)
  const currentNews: NewsItem[] = [
    { id: 1, source: 'VnExpress', title: 'Tin tức NHNN', summary: 'Ngân hàng Nhà nước giảm lãi suất điều hành, NHNN thông báo giảm lãi suất tái cấp vốn...' },
    { id: 2, source: 'Cafef', title: 'Thị trường tăng điểm', summary: 'Thị trường chứng khoán Việt Nam vượt mốc 1,300 điểm, thanh khoản tăng...' },
    { id: 3, source: 'NDH', title: 'Tin tức xuất khẩu', summary: 'Doanh nghiệp xuất khẩu hưởng lợi từ tỷ giá. Các công ty ngành thủy sản, dệt may...' },
  ];

  const toggleTheme = () => setIsDark(!isDark);

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <MarketPulse />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StockHealth stock={currentStock || undefined} news={currentNews} isDark={isDark} />
              <SmartRankings />
            </div>
            <div className="glass-panel p-8 rounded-2xl flex items-center justify-center border-t border-slate-200 dark:border-white/5 opacity-60">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">Khu vực phân tích nâng cao</h3>
                    <p className="text-slate-500">Nhiều biểu đồ dữ liệu hơn sẽ xuất hiện ở đây.</p>
                </div>
            </div>
          </div>
        );
      case 'analysis':
        return <StockAnalysis isDark={isDark} />;
      case 'screener':
        return <AIScreener isDark={isDark} />;
      case 'guru':
        return <GuruPortfolios isDark={isDark} />;
      case 'sen_assistant':
        return <SenAssistant isDark={isDark} />;
      case 'profile':
        return <UserProfile user={user} onUpgrade={handleUpgrade} isDark={isDark} />;
      case 'portfolio':
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-4 opacity-30">💼</div>
              <p className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">Danh mục SENAI</p>
              <p>Tính năng quản lý danh mục đang được phát triển.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-4 opacity-30">🚧</div>
              <p className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">Sắp ra mắt</p>
              <p>Mô-đun {activeTab} hiện đang được phát triển.</p>
            </div>
          </div>
        );
    }
  };

  // Loading Screen
  if (!user) {
    return (
      <div className={`flex h-screen items-center justify-center bg-slate-50 dark:bg-[#050511] transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
         <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse tracking-wide">Đang tải dữ liệu người dùng...</p>
         </div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#050511] text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:text-indigo-200 transition-colors duration-300">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-100 transition-opacity" 
              style={{ 
                backgroundImage: `radial-gradient(circle at 50% 50%, ${isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(148, 163, 184, 0.2)'} 1px, transparent 1px)`, 
                backgroundSize: '40px 40px' 
              }}>
          </div>
          
          {/* Ambient colored spots */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <TopBar 
            isDark={isDark} 
            toggleTheme={toggleTheme} 
            user={user} 
            onProfileClick={() => setActiveTab('profile')}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onSelectStock={(symbol) => {
              setActiveTab('analysis');
              // Dispatch custom event for StockAnalysis to pick up
              window.dispatchEvent(new CustomEvent('selectStock', { detail: symbol }));
            }}
          />

          {/* 
              Main Content Container 
              - If SenAssistant is active: Remove padding and max-width to allow full screen.
              - Else: Keep standard dashboard padding and constraints.
          */}
          <div className={`flex-1 overflow-y-auto z-10 scroll-smooth ${activeTab === 'sen_assistant' ? 'p-0 overflow-hidden' : 'p-4 md:p-8'}`}>
            <div className={`${activeTab === 'sen_assistant' ? 'h-full w-full' : 'max-w-7xl mx-auto h-full'}`}>
              {renderContent()}
            </div>
          </div>

          {/* Hide Floating Chat Widget if we are on the dedicated Chat Page or Profile Page */}
          {activeTab !== 'sen_assistant' && activeTab !== 'profile' && <ChatWidget />}
        </main>
      </div>
    </div>
  );
};

export default App;