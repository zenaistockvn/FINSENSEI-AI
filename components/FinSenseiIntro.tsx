import React from 'react';
import { Sparkles, Bot, Brain, TrendingUp, MessageCircle, Zap, Shield, BarChart3 } from 'lucide-react';

interface FinSenseiIntroProps {
  isDark?: boolean;
  onTrySen?: () => void;
}

const FinSenseiIntro: React.FC<FinSenseiIntroProps> = ({ isDark = true, onTrySen }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border-t border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.08)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
          {/* Logo & Title */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30 flex-shrink-0">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                FinSensei AI
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full uppercase tracking-wider">
                  Beta
                </span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nền tảng phân tích chứng khoán thông minh hàng đầu Việt Nam
              </p>
            </div>
          </div>

          {/* CTA Button - Desktop */}
          {onTrySen && (
            <button
              onClick={onTrySen}
              className="hidden md:flex py-3 px-6 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 items-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle size={18} />
              Trò chuyện với SEN
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Description + SEN highlight */}
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-violet-600 dark:text-violet-400">FinSensei AI</span> kết hợp 
              dữ liệu thị trường real-time với trí tuệ nhân tạo tiên tiến, giúp bạn đưa ra quyết định đầu tư 
              sáng suốt và tối ưu hóa danh mục hiệu quả.
            </p>

            {/* SEN Assistant Card */}
            <div className="bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-cyan-500/10 dark:from-violet-500/20 dark:via-indigo-500/15 dark:to-cyan-500/20 rounded-xl p-4 border border-violet-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    Gặp gỡ "SEN ơi" 
                    <span className="text-base">👋</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trợ lý ảo AI thông minh của bạn
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hỏi <span className="font-semibold text-cyan-600 dark:text-cyan-400">"SEN ơi"</span> bất cứ điều gì: 
                phân tích cổ phiếu, chiến lược đầu tư, tin tức thị trường. SEN hỗ trợ bạn 24/7!
              </p>
            </div>
          </div>

          {/* Right: Features Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Brain size={18} className="text-violet-500" />
              </div>
              <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">Phân tích AI</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Đánh giá cổ phiếu bằng AI</p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">Dự báo xu hướng</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Nhận diện cơ hội sớm</p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap size={18} className="text-amber-500" />
              </div>
              <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">Real-time</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Dữ liệu cập nhật liên tục</p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <BarChart3 size={18} className="text-cyan-500" />
              </div>
              <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">Tối ưu danh mục</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Quản lý portfolio thông minh</p>
            </div>
          </div>
        </div>

        {/* CTA Button - Mobile */}
        {onTrySen && (
          <button
            onClick={onTrySen}
            className="md:hidden w-full mt-5 py-3 px-4 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
          >
            <MessageCircle size={18} />
            Trò chuyện với SEN ngay
          </button>
        )}
      </div>
    </div>
  );
};

export default FinSenseiIntro;
