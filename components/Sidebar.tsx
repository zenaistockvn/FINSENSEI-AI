import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, TrendingUp, Search, Briefcase, Lightbulb, Hexagon, 
  ChevronLeft, ChevronRight, GraduationCap, Bot, X, Command
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, shortcut: '1' },
    { id: 'analysis', label: 'Phân tích cổ phiếu', icon: TrendingUp, shortcut: '2' },
    { id: 'screener', label: 'Bộ lọc AI', icon: Search, shortcut: '3' },
    { id: 'sen_assistant', label: 'Trợ lý Sen', icon: Bot, shortcut: '4', highlight: true },
    { id: 'guru', label: 'Danh mục Guru', icon: GraduationCap, shortcut: '5' },
    { id: 'portfolio', label: 'Danh mục SENAI', icon: Briefcase, shortcut: '6' },
    { id: 'knowledge', label: 'Kiến thức', icon: Lightbulb, shortcut: '7' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Number keys 1-7 for navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= menuItems.length) {
        e.preventDefault();
        setActiveTab(menuItems[num - 1].id);
      }
      
      // Escape to close mobile menu
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
      
      // Ctrl+K or / for search focus
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Tìm"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, setActiveTab, setIsMobileOpen]);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay with Blur */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div 
        className={`
            fixed md:relative z-50 h-full bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-white/10 pt-6 pb-4 transition-all duration-300 ease-out
            ${isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            ${!isMobileOpen ? sidebarWidth : ''}
            flex flex-col
        `}
        onMouseEnter={() => !isMobileOpen && setIsCollapsed(false)}
        onMouseLeave={() => !isMobileOpen && setIsCollapsed(true)}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
        >
          <X size={20} />
        </button>

        {/* Desktop Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full p-1.5 shadow-lg z-20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header / Logo */}
        <div className={`px-6 mb-8 flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'gap-3'}`}>
          <div className="relative">
            <Hexagon className="w-9 h-9 text-indigo-600 dark:text-indigo-500 fill-indigo-500/20 flex-shrink-0 transition-transform hover:scale-110" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 whitespace-nowrap">
                Finsensei AI
              </span>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
              <Command size={12} />
              <span>Nhấn 1-7 để chuyển nhanh</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:to-purple-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Active Indicator */}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>
              )}

              <div className="relative">
                <item.icon 
                  size={20} 
                  className={`flex-shrink-0 transition-all ${
                    item.highlight ? 'text-indigo-500' : ''
                  } ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} 
                />
                {item.highlight && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 flex-1 text-left ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>

              {/* Keyboard Shortcut Badge */}
              {(!isCollapsed || isMobileOpen) && (
                <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-200/50 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100'
                }`}>
                  {item.shortcut}
                </kbd>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobileOpen && hoveredItem === item.id && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-xl border border-slate-700 dark:border-slate-600 animate-fade-in-up">
                  <div className="flex items-center gap-2">
                    <span>{item.label}</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-700 dark:bg-slate-600 rounded">
                      {item.shortcut}
                    </kbd>
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45 border-l border-b border-slate-700 dark:border-slate-600"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Section - Version & Status */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 mt-4 space-y-3">
            {/* Market Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Hệ thống hoạt động
              </span>
            </div>

            {/* Version */}
            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500">
              Finsensei AI v2.0.0
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
