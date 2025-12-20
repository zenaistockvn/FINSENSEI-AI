import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Search, Briefcase, Lightbulb, Hexagon, ChevronLeft, ChevronRight, GraduationCap, Bot, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  // Default isCollapsed to true as requested ("mặc định là ẩn")
  const [isCollapsed, setIsCollapsed] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'analysis', label: 'Phân tích cổ phiếu', icon: TrendingUp },
    { id: 'screener', label: 'Bộ lọc AI', icon: Search },
    { id: 'sen_assistant', label: 'Trợ lý Sen', icon: Bot },
    { id: 'guru', label: 'Danh mục Guru', icon: GraduationCap },
    { id: 'portfolio', label: 'Danh mục SENAI', icon: Briefcase },
    { id: 'knowledge', label: 'Kiến thức', icon: Lightbulb },
  ];

  // Determine effective width and visibility based on device and state
  // Desktop: Controlled by isCollapsed. Mobile: Fixed width when open.
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div 
        className={`
            fixed md:relative z-50 h-full bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-white/10 pt-6 pb-4 transition-all duration-300
            ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
            ${!isMobileOpen ? sidebarWidth : ''}
            flex flex-col
        `}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Desktop Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-20 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-full p-1.5 shadow-lg z-20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header / Logo */}
        <div className={`px-6 mb-10 flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'gap-2'}`}>
          <Hexagon className="w-8 h-8 text-indigo-600 dark:text-indigo-500 fill-indigo-500/20 flex-shrink-0" />
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 whitespace-nowrap">
                Finsensei AI
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
             // Guru Strategy Highlighting Logic
             const isHot = item.id === 'guru' && activeStrategyHasBadge('minervini'); // Simplified for visual, actual logic is inside Guru component
             
             return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative ${
                  activeTab === item.id
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                } ${!isCollapsed || isMobileOpen ? 'hover:scale-105' : ''}`}
              >
                <item.icon size={20} className={`flex-shrink-0 ${item.id === 'sen_assistant' ? 'text-indigo-500 animate-pulse' : ''}`} />
                
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>

                {/* Tooltip for collapsed state (Desktop only) */}
                {isCollapsed && !isMobileOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10 transition-opacity shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Decorative background element at bottom left - Hide when collapsed */}
        {(!isCollapsed || isMobileOpen) && (
           <div className="px-6 mt-auto animate-fade-in-up">
              <div className="relative h-40 w-full opacity-30">
                 <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                   <path fill="#6366F1" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.4,82.2,23.1,71.2,35.1C60.2,47.1,49.5,57.4,37.3,64.3C25.1,71.2,11.4,74.7,-1.2,76.8C-13.8,78.9,-26.6,79.6,-38.1,74.1C-49.6,68.6,-59.8,56.9,-68.2,44C-76.6,31.1,-83.2,17,-82.9,3.3C-82.6,-10.4,-75.4,-23.7,-65.7,-35.1C-56,-46.5,-43.8,-56,-31.1,-63.9C-18.4,-71.8,-5.2,-78.1,6.8,-89.9L44.7,-76.4Z" transform="translate(100 100)" />
                 </svg>
              </div>
           </div>
        )}
      </div>
    </>
  );
};

// Helper for demonstration purposes
const activeStrategyHasBadge = (id: string) => false; 

export default Sidebar;