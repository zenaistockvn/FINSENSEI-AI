import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronLeft, Sun, Moon, Crown, Star, Clock, Calendar, LogOut } from 'lucide-react';
import { User } from '../types';
import SearchModal from './SearchModal';

interface TopBarProps {
  isDark: boolean;
  toggleTheme: () => void;
  user: User;
  onProfileClick: () => void;
  onMenuClick: () => void;
  onSelectStock?: (symbol: string) => void;
  onLogout?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ isDark, toggleTheme, user, onProfileClick, onMenuClick, onSelectStock, onLogout }) => {
  // Realtime clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === '/' && !e.ctrlKey && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format date and time in Vietnamese
  const formatDate = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = days[date.getDay()];
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${day}, ${d}/${m}/${y}`;
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Check if market is open (9:00 - 15:00, Mon-Fri)
  const isMarketOpen = () => {
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 15;
  };

  const handleSelectStock = (symbol: string) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
    setShowSearchModal(false);
  };
  // Sample notifications
  const notifications = [
    { id: 1, type: 'price', message: 'VNM đạt mức giá mục tiêu 68,000', time: '2 phút trước', read: false },
    { id: 2, type: 'news', message: 'Tin mới: NHNN giảm lãi suất điều hành', time: '15 phút trước', read: false },
    { id: 3, type: 'alert', message: 'FPT tăng 3% trong phiên sáng', time: '1 giờ trước', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-20 transition-colors duration-300" role="banner">
      {/* Left Section */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          aria-label="Mở menu"
          aria-expanded={false}
          className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all active:scale-95 focus-visible-ring"
        >
           <div className="space-y-1.5" aria-hidden="true">
             <span className="block w-5 h-0.5 bg-current rounded-full"></span>
             <span className="block w-5 h-0.5 bg-current rounded-full"></span>
             <span className="block w-5 h-0.5 bg-current rounded-full"></span>
           </div>
        </button>

        {/* Back Button - Desktop */}
        <button 
          aria-label="Quay lại"
          className="hidden md:flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-lg active:scale-95 focus-visible-ring"
        >
          <ChevronLeft size={20} />
        </button>
        
        {/* Search Box - Click to open modal */}
        <button 
          onClick={() => setShowSearchModal(true)}
          aria-label="Tìm kiếm cổ phiếu (Ctrl+K)"
          className={`relative group transition-all duration-300 w-64 hover:w-72 focus-visible-ring`}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm rounded-xl w-full pl-10 pr-12 py-2.5 text-left transition-all group-hover:border-indigo-500/50 group-hover:ring-2 group-hover:ring-indigo-500/20">
            Tìm mã CK, công ty...
          </div>
          {/* Keyboard shortcut hint */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-opacity bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400`}>
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Center Section - Date & Time */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Date */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {formatDate(currentTime)}
          </span>
        </div>

        {/* Time with Market Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <Clock size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
            {formatTime(currentTime)}
          </span>
          {/* Market Status Indicator */}
          <div className={`flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-300 dark:border-slate-600`}>
            <div className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <span className={`text-xs font-medium ${isMarketOpen() ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {isMarketOpen() ? 'Đang giao dịch' : 'Đóng cửa'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Time Display */}
        <div className="flex lg:hidden items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums">
            {formatTime(currentTime).slice(0, 5)}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen() ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
        </div>

        {/* Theme Toggle with Animation */}
        <button 
          onClick={toggleTheme}
          aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          aria-pressed={isDark}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90 focus-visible-ring"
        >
          <div className="relative w-5 h-5" aria-hidden="true">
            <Sun size={20} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} />
            <Moon size={20} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`} />
          </div>
        </button>

        {/* Notifications with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="true"
            className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90 focus-visible-ring"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-[#0b0f19] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} aria-hidden="true"></div>
              <div 
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden animate-fade-in-up"
                role="menu"
                aria-label="Danh sách thông báo"
              >
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Thông báo</span>
                  <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notif.type === 'price' ? 'bg-emerald-500' :
                          notif.type === 'news' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <button className="w-full py-2 text-sm text-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* User Profile Trigger with Enhanced Hover */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label={`Hồ sơ người dùng: ${user.name}`}
            className="flex items-center gap-2 md:gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 active:scale-95 focus-visible-ring"
          >
            <div className="hidden md:flex flex-col items-end mr-1">
               <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.name}</span>
               <div className="flex items-center gap-1 mt-1">
                   {user.plan === 'expert' && <Crown size={10} className="text-indigo-500 fill-indigo-500" />}
                   {user.plan === 'vip' && <Star size={10} className="text-amber-500 fill-amber-500" />}
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${
                       user.plan === 'expert' ? 'text-indigo-500' : user.plan === 'vip' ? 'text-amber-500' : 'text-slate-500'
                   }`}>
                       {user.plan}
                   </span>
               </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px] relative group">
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="h-full w-full rounded-full object-cover border-2 border-white dark:border-[#0b0f19] transition-transform group-hover:scale-105"
              />
              {/* Status Indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0b0f19] rounded-full"></div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} aria-hidden="true"></div>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden animate-fade-in-up">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { onProfileClick(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Crown size={16} className="text-slate-400" />
                    <span>Hồ sơ & Gói dịch vụ</span>
                  </button>
                  {onLogout && (
                    <button 
                      onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectStock={handleSelectStock}
        isDark={isDark}
      />
    </header>
  );
};

export default TopBar;
