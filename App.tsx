import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginPage from './components/LoginPage';
import { User, PlanType } from './types';
import { supabase, getUserProfile, onAuthStateChange, signOut } from './services/authService';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Lazy load heavy components for better performance
const MarketPulse = lazy(() => import('./components/MarketPulse'));
const SmartRankings = lazy(() => import('./components/SmartRankings'));
const MarketSentimentGauge = lazy(() => import('./components/MarketSentimentGauge'));
const FinSenseiIntro = lazy(() => import('./components/FinSenseiIntro'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));
const AIScreener = lazy(() => import('./components/AIScreener'));
const StockAnalysis = lazy(() => import('./components/StockAnalysis'));
const GuruPortfolios = lazy(() => import('./components/GuruPortfolios'));
const SenAssistant = lazy(() => import('./components/SenAssistant'));
const UserProfileComponent = lazy(() => import('./components/UserProfile'));
const PortfolioOptimizer = lazy(() => import('./components/PortfolioOptimizer'));
const AccumulationTool = lazy(() => import('./components/AccumulationTool'));

// Loading fallback component
const LoadingFallback: React.FC<{ height?: string }> = ({ height = '200px' }) => (
  <div
    className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"
    style={{ height }}
    role="status"
    aria-label="Đang tải..."
  >
    <span className="sr-only">Đang tải...</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);

  // User State
  const [user, setUser] = useState<User | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
          setIsAuthenticated(true);
          await loadUserProfile(session.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      if (user) {
        setAuthUser(user);
        setIsAuthenticated(true);
        await loadUserProfile(user);
      } else {
        setAuthUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from Supabase
  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const profile = await getUserProfile(authUser.id);

      // Convert Supabase profile to app User type
      const appUser: User = {
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=fff`,
        plan: (profile?.plan as PlanType) || 'basic',
        memberSince: new Date(authUser.created_at).toLocaleDateString('vi-VN')
      };

      setUser(appUser);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback user data
      setUser({
        name: authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff`,
        plan: 'basic',
        memberSince: new Date().toLocaleDateString('vi-VN')
      });
    }
  };

  const handleUpgrade = (plan: PlanType) => {
    if (confirm(`Bạn có chắc chắn muốn nâng cấp lên gói ${plan.toUpperCase()}?`)) {
      setUser(prev => prev ? ({ ...prev, plan }) : null);
      alert('Nâng cấp thành công! Chào mừng bạn đến với gói ' + plan.toUpperCase());
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setAuthUser(null);
    setIsAuthenticated(false);
  };

  const toggleTheme = () => setIsDark(!isDark);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToAnalysis = (e: CustomEvent) => {
      setActiveTab('analysis');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('selectStock', { detail: e.detail }));
      }, 100);
    };

    window.addEventListener('navigateToAnalysis', handleNavigateToAnalysis as EventListener);
    return () => {
      window.removeEventListener('navigateToAnalysis', handleNavigateToAnalysis as EventListener);
    };
  }, []);

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in-up">
            {/* Row 1: Nhịp đập thị trường */}
            <Suspense fallback={<LoadingFallback height="120px" />}>
              <MarketPulse />
            </Suspense>

            {/* Row 2: Giới thiệu FinSensei AI */}
            <Suspense fallback={<LoadingFallback height="280px" />}>
              <FinSenseiIntro isDark={isDark} onTrySen={() => setActiveTab('sen_assistant')} />
            </Suspense>

            {/* Row 3: Tâm lý thị trường + Top cổ phiếu */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<LoadingFallback height="320px" />}>
                <MarketSentimentGauge isDark={isDark} />
              </Suspense>

              <Suspense fallback={<LoadingFallback height="320px" />}>
                <SmartRankings />
              </Suspense>
            </div>
          </div>
        );
      case 'analysis':
        return (
          <Suspense fallback={<LoadingFallback height="600px" />}>
            <StockAnalysis isDark={isDark} />
          </Suspense>
        );
      case 'screener':
        return (
          <Suspense fallback={<LoadingFallback height="500px" />}>
            <AIScreener isDark={isDark} />
          </Suspense>
        );
      case 'guru':
        return (
          <Suspense fallback={<LoadingFallback height="500px" />}>
            <GuruPortfolios isDark={isDark} />
          </Suspense>
        );
      case 'sen_assistant':
        return (
          <Suspense fallback={<LoadingFallback height="100%" />}>
            <SenAssistant isDark={isDark} />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingFallback height="400px" />}>
            <UserProfileComponent user={user} onUpgrade={handleUpgrade} isDark={isDark} />
          </Suspense>
        );
      case 'portfolio':
        return (
          <Suspense fallback={<LoadingFallback height="500px" />}>
            <PortfolioOptimizer isDark={isDark} />
          </Suspense>
        );
      case 'accumulation':
        return (
          <Suspense fallback={<LoadingFallback height="600px" />}>
            <AccumulationTool isDark={isDark} />
          </Suspense>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]" role="status">
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-4 opacity-30" aria-hidden="true">🚧</div>
              <p className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">Sắp ra mắt</p>
              <p>Mô-đun {activeTab} hiện đang được phát triển.</p>
            </div>
          </div>
        );
    }
  };

  // Auth Loading Screen
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-400 font-medium animate-pulse tracking-wide">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Show Login Page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Loading user data
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
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>

      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#050511] text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:text-indigo-200 transition-colors duration-300">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        <main id="main-content" className="flex-1 flex flex-col h-full overflow-hidden relative" role="main" aria-label="Nội dung chính">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-100 transition-opacity"
            aria-hidden="true"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, ${isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(148, 163, 184, 0.2)'} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}>
          </div>

          {/* Ambient colored spots */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" aria-hidden="true"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" aria-hidden="true"></div>

          <TopBar
            isDark={isDark}
            toggleTheme={toggleTheme}
            user={user}
            onProfileClick={() => setActiveTab('profile')}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onSelectStock={(symbol) => {
              setActiveTab('analysis');
              window.dispatchEvent(new CustomEvent('selectStock', { detail: symbol }));
            }}
            onLogout={handleLogout}
          />

          {/* Main Content Container */}
          <div
            className={`flex-1 overflow-y-auto z-10 scroll-smooth safe-area-inset ${activeTab === 'sen_assistant'
                ? 'p-0 overflow-hidden'
                : 'p-2 md:p-4'
              }`}
            role="region"
            aria-label={`Trang ${activeTab}`}
          >
            <div className={`${activeTab === 'sen_assistant'
                ? 'h-full w-full'
                : 'w-full h-full'
              }`}>
              {renderContent()}
            </div>
          </div>

          {activeTab !== 'sen_assistant' && activeTab !== 'profile' && (
            <Suspense fallback={null}>
              <ChatWidget />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
