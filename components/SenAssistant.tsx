import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Mic, Zap, TrendingUp, Lightbulb, RefreshCw, Paperclip, Menu, Plus, MessageSquare, MoreVertical, Edit3, Trash2, X } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';

interface SenAssistantProps {
    isDark?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    date: string;
}

const SenAssistant: React.FC<SenAssistantProps> = ({ isDark = true }) => {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([
      {
          id: '1',
          title: 'Phân tích mã FPT',
          date: 'Hôm nay',
          messages: [
              { role: 'user', text: 'Phân tích mã FPT' },
              { role: 'model', text: 'FPT đang trong xu hướng tăng dài hạn mạnh mẽ. **Kết quả kinh doanh Q3/2024** ghi nhận doanh thu tăng 23% nhờ mảng xuất khẩu phần mềm.' }
          ]
      },
      {
          id: '2',
          title: 'Xu hướng VNINDEX',
          date: 'Hôm qua',
          messages: [
              { role: 'user', text: 'Thị trường sập à Sen?' },
              { role: 'model', text: 'Hiện tại **VNINDEX** đang có nhịp điều chỉnh kỹ thuật tại vùng 1280 điểm. Chưa có dấu hiệu gãy trend trung hạn. Bạn nên quan sát mốc hỗ trợ 1250.' }
          ]
      }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Initialize sidebar based on screen width
  const [isSidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Resize
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

  // Helper to get current messages
  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, loading, currentSessionId]);

  // Create new chat
  const handleNewChat = () => {
      setCurrentSessionId(null);
      setInput('');
      if (inputRef.current) inputRef.current.focus();
      // On mobile, close sidebar after clicking new chat
      if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;
    
    setLoading(true);
    let sessionId = currentSessionId;
    let newSessionCreated = false;

    // Create session if not exists
    if (!sessionId) {
        sessionId = Date.now().toString();
        const newSession: ChatSession = {
            id: sessionId,
            title: text.length > 30 ? text.substring(0, 30) + '...' : text,
            date: 'Hôm nay',
            messages: []
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(sessionId);
        newSessionCreated = true;
    }

    // Add User Message
    const userMsg: ChatMessage = { role: 'user', text: text };
    
    setSessions(prev => prev.map(s => 
        s.id === sessionId 
        ? { ...s, messages: [...s.messages, userMsg] }
        : s
    ));
    
    setInput('');

    try {
        const responseText = await getFinancialAdvice(text);
        const modelMsg: ChatMessage = { role: 'model', text: responseText };

        setSessions(prev => prev.map(s => 
            s.id === sessionId 
            ? { ...s, messages: [...s.messages, modelMsg] }
            : s
        ));
    } catch (error) {
        // Handle error
    } finally {
        setLoading(false);
    }
  };

  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-indigo-600 dark:text-indigo-400 font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  const SuggestionCard = ({ icon: Icon, text, onClick }: { icon: any, text: string, onClick: () => void }) => (
      <button 
        onClick={onClick}
        className="text-left bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col gap-2 h-32 justify-between border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
      >
          <div className="bg-white dark:bg-slate-700 p-2 rounded-full w-fit shadow-sm">
            <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{text}</span>
      </button>
  );

  const selectSession = (id: string) => {
      setCurrentSessionId(id);
      if (window.innerWidth < 768) setSidebarOpen(false);
  }

  return (
    <div className="flex h-full bg-white dark:bg-[#0b0f19] relative animate-fade-in-up">
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
            <div 
                className="md:hidden absolute inset-0 bg-black/50 z-20 backdrop-blur-sm transition-opacity"
                onClick={() => setSidebarOpen(false)}
            ></div>
        )}

        {/* LEFT SIDEBAR (History) */}
        <div className={`
            absolute md:relative z-30 h-full
            ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'}
            transition-all duration-300 ease-in-out
            bg-slate-50 dark:bg-[#0f1523] border-r border-slate-200 dark:border-white/5
            flex flex-col
            overflow-hidden
        `}>
            {/* Inner Sidebar Container to fix width when collapsing */}
            <div className="w-64 h-full flex flex-col">
                {/* New Chat Button */}
                <div className="p-4">
                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-full transition-colors text-sm font-medium"
                    >
                        <Plus size={18} />
                        <span className="whitespace-nowrap">Cuộc trò chuyện mới</span>
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
                    <p className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gần đây</p>
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => selectSession(session.id)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-colors group ${
                                    currentSessionId === session.id 
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                            >
                                <MessageSquare size={16} className="flex-shrink-0" />
                                <span className="truncate flex-1">{session.title}</span>
                                {/* Hover Options (Mock) */}
                                <MoreVertical size={14} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* User Profile / Bottom Sidebar */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        Hà Nội • Cập nhật từ dữ liệu thời gian thực
                    </div>
                </div>
            </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col relative h-full min-w-0">
            {/* Top Bar */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 rounded-lg transition-colors">
                        Sen 2.5 Flash <MoreVertical size={14} className="opacity-50" />
                    </span>
                </div>
                <div className="flex items-center gap-2">
                     <div className="bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        Pro Mode
                    </div>
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
                {currentSessionId === null ? (
                    // EMPTY STATE (GREETING)
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-7xl mx-auto w-full">
                        <div className="mb-10 text-center space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2">
                                Xin chào, Sen đây
                            </h1>
                            <p className="text-xl text-slate-400 font-medium">Hôm nay tôi có thể giúp gì cho danh mục của bạn?</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            <SuggestionCard 
                                icon={TrendingUp} 
                                text="Phân tích kỹ thuật mã VCB" 
                                onClick={() => handleSend("Phân tích kỹ thuật mã VCB")}
                            />
                            <SuggestionCard 
                                icon={Lightbulb} 
                                text="So sánh P/E ngành bank" 
                                onClick={() => handleSend("So sánh P/E các ngân hàng lớn hiện tại")}
                            />
                            <SuggestionCard 
                                icon={Zap} 
                                text="Tin vĩ mô nổi bật" 
                                onClick={() => handleSend("Tổng hợp tin vĩ mô nổi bật hôm nay")}
                            />
                             <SuggestionCard 
                                icon={Bot} 
                                text="Tạo bộ lọc cổ phiếu" 
                                onClick={() => handleSend("Tạo bộ lọc cổ phiếu tăng trưởng lợi nhuận > 20%")}
                            />
                        </div>
                    </div>
                ) : (
                    // MESSAGES
                    <div ref={scrollRef} className="flex-1 px-4 sm:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
                        {currentMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                    msg.role === 'model' 
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                    {msg.role === 'model' ? <Sparkles size={16} /> : <span className="text-xs font-bold">ME</span>}
                                </div>

                                {/* Content */}
                                <div className={`max-w-[85%] space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    <div className={`text-sm font-bold mb-1 ${msg.role === 'user' ? 'hidden' : 'text-slate-900 dark:text-white'}`}>Sen Assistant</div>
                                    <div className={`prose dark:prose-invert max-w-none text-[15px] leading-7 ${
                                        msg.role === 'user' 
                                        ? 'bg-slate-100 dark:bg-slate-800 py-2.5 px-4 rounded-2xl rounded-tr-sm inline-block text-left' 
                                        : 'text-slate-700 dark:text-slate-200'
                                    }`}>
                                        <div className="whitespace-pre-wrap">{formatText(msg.text)}</div>
                                    </div>
                                    {msg.role === 'model' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><Edit3 size={14} /></button>
                                            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><RefreshCw size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                             <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 text-white shadow-lg">
                                    <Sparkles size={16} />
                                </div>
                                <div className="flex items-center gap-1 mt-3">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Footer */}
            <div className="p-4 sm:p-6 bg-white dark:bg-[#0b0f19] flex-shrink-0">
                <div className="max-w-5xl mx-auto relative">
                     <div className={`bg-slate-100 dark:bg-[#1e293b] rounded-3xl flex items-end p-2 transition-all ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                         <button className="p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors m-1">
                            <Plus size={20} />
                         </button>
                         <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Nhập câu hỏi cho Sen..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white px-2 py-4 max-h-32 overflow-y-auto resize-none"
                            style={{ minHeight: '56px' }}
                         />
                         <div className="flex items-center gap-1 m-1">
                             <button className="p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                                <Mic size={20} />
                             </button>
                             {input.trim() ? (
                                 <button 
                                    onClick={() => handleSend()}
                                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                 >
                                    <Send size={18} />
                                 </button>
                             ) : null}
                         </div>
                     </div>
                     <p className="text-center text-[10px] text-slate-400 mt-3">
                        Sen có thể mắc lỗi. Vui lòng kiểm chứng thông tin quan trọng.
                     </p>
                </div>
            </div>

        </div>
    </div>
  );
};

export default SenAssistant;