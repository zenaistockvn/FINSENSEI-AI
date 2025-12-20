import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Mic,
  Zap,
  TrendingUp,
  Lightbulb,
  Plus,
  MessageSquare,
  MoreVertical,
  Menu,
  Crown,
  Lock,
} from 'lucide-react';

interface SenAssistantProps {
  isDark?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
}

const SenAssistant: React.FC<SenAssistantProps> = () => {
  // Mock data for background
  const [sessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Phân tích mã FPT',
      date: 'Hôm nay',
    },
    {
      id: '2',
      title: 'Xu hướng VNINDEX',
      date: 'Hôm qua',
    },
  ]);

  const [isSidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SuggestionCard = ({ icon: Icon, text }: { icon: any; text: string }) => (
    <div className="text-left bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col gap-2 h-32 justify-between border border-transparent opacity-50">
      <div className="bg-white dark:bg-slate-700 p-2 rounded-full w-fit shadow-sm">
        <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{text}</span>
    </div>
  );

  return (
    <div className="flex h-full bg-white dark:bg-[#0b0f19] relative animate-fade-in-up">
      {/* Background Layer - Blurred Old UI */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="flex h-full opacity-85 blur-[0.5px]">
          {/* LEFT SIDEBAR (History) - Blurred */}
          <div
            className={`
            ${isSidebarOpen ? 'w-64' : 'w-0'}
            transition-all duration-300 ease-in-out
            bg-slate-50 dark:bg-[#0f1523] border-r border-slate-200 dark:border-white/5
            flex flex-col overflow-hidden
          `}
          >
            <div className="w-64 h-full flex flex-col">
              <div className="p-4">
                <div className="w-full flex items-center gap-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-full text-sm font-medium">
                  <Plus size={18} />
                  <span className="whitespace-nowrap">Cuộc trò chuyện mới</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <p className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Gần đây
                </p>
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-full text-sm text-slate-600 dark:text-slate-400"
                    >
                      <MessageSquare size={16} className="flex-shrink-0" />
                      <span className="truncate flex-1">{session.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CHAT AREA - Blurred */}
          <div className="flex-1 flex flex-col relative h-full min-w-0">
            <div className="h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 text-slate-500">
                  <Menu size={20} />
                </div>
                <span className="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 px-3 py-1 rounded-lg">
                  Sen 2.5 Flash <MoreVertical size={14} className="opacity-50" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  Pro Mode
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-7xl mx-auto w-full">
              <div className="mb-10 text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2">
                  Xin chào, Sen đây
                </h1>
                <p className="text-xl text-slate-400 font-medium">
                  Hôm nay tôi có thể giúp gì cho danh mục của bạn?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <SuggestionCard icon={TrendingUp} text="Phân tích kỹ thuật mã VCB" />
                <SuggestionCard icon={Lightbulb} text="So sánh P/E ngành bank" />
                <SuggestionCard icon={Zap} text="Tin vĩ mô nổi bật" />
                <SuggestionCard icon={Bot} text="Tạo bộ lọc cổ phiếu" />
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-shrink-0">
              <div className="max-w-5xl mx-auto relative">
                <div className="bg-slate-100 dark:bg-[#1e293b] rounded-3xl flex items-end p-2 opacity-50">
                  <div className="p-3 text-slate-500 dark:text-slate-400 m-1">
                    <Plus size={20} />
                  </div>
                  <div className="flex-1 bg-transparent px-2 py-4 text-slate-400">
                    Nhập câu hỏi cho Sen...
                  </div>
                  <div className="flex items-center gap-1 m-1">
                    <div className="p-3 text-slate-500 dark:text-slate-400">
                      <Mic size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center p-8">
          {/* VIP Badge */}
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <Crown size={48} className="text-amber-400" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-slate-800 border-4 border-amber-500 flex items-center justify-center">
              <Lock size={20} className="text-amber-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trợ lý{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500">
              Sen AI
            </span>
          </h1>

          {/* VIP Notice */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
            <Crown size={16} />
            <span>Tính năng VIP</span>
          </div>

          {/* Description */}
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Hiện tại chỉ dành cho <span className="font-bold text-amber-400">Hội viên VIP</span>.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/50 text-left backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-amber-400" />
                <span className="font-medium text-white">Phân tích AI</span>
              </div>
              <p className="text-xs text-slate-400">Phân tích kỹ thuật & cơ bản tự động</p>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/50 text-left backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} className="text-amber-400" />
                <span className="font-medium text-white">Hỏi đáp 24/7</span>
              </div>
              <p className="text-xs text-slate-400">Trả lời mọi câu hỏi về đầu tư</p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 flex items-center gap-3 mx-auto">
            <Crown size={20} />
            <span>Nâng cấp VIP ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenAssistant;
