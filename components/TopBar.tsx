import React from 'react';
import { Search, Bell, ChevronLeft, Sun, Moon, Crown, Star } from 'lucide-react';
import { User } from '../types';

interface TopBarProps {
  isDark: boolean;
  toggleTheme: () => void;
  user: User;
  onProfileClick: () => void;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ isDark, toggleTheme, user, onProfileClick, onMenuClick }) => {
  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
           <div className="space-y-1.5">
             <span className="block w-6 h-0.5 bg-current"></span>
             <span className="block w-6 h-0.5 bg-current"></span>
             <span className="block w-6 h-0.5 bg-current"></span>
           </div>
        </button>
        <button className="hidden md:flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" />
          </div>
          <input
            type="text"
            className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block w-64 pl-10 p-2 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            placeholder="Tìm kiếm mã hoặc phân tích..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0b0f19]"></span>
        </button>
        
        {/* User Profile Trigger */}
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
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
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px] relative">
            <img 
              src={user.avatar} 
              alt="Profile" 
              className="h-full w-full rounded-full object-cover border-2 border-white dark:border-[#0b0f19]"
            />
            {/* Status Indicator */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0b0f19] rounded-full"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default TopBar;