import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RefreshCw, Maximize2, Minimize2, Mic } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Chào bạn! Mình là Sen đây. Bạn cần Sen hỗ trợ thông tin gì về thị trường hôm nay không?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested prompts for quick action
  const suggestions = [
    "Phân tích mã FPT",
    "Xu hướng VNINDEX",
    "Top ngân hàng tốt",
    "Cổ phiếu cổ tức cao"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage = text;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
        const response = await getFinancialAdvice(userMessage);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Sen đang gặp chút khó khăn khi kết nối. Bạn thử lại sau nhé." }]);
    } finally {
        setLoading(false);
    }
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Simple formatter to handle bold text from AI (e.g. **text**)
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-indigo-600 dark:text-indigo-300 font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
        isExpanded 
            ? 'inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4' 
            : 'bottom-6 right-6 flex flex-col items-end'
    }`}>
      
      {/* Main Chat Window */}
      {(isOpen || isExpanded) && (
        <div 
            className={`
                glass-panel flex flex-col overflow-hidden shadow-2xl animate-fade-in-up transition-all duration-300
                bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl
                border border-indigo-500/30
                ${isExpanded ? 'w-full max-w-4xl h-[80vh] rounded-2xl' : 'w-[360px] md:w-[400px] h-[550px] rounded-2xl mb-4'}
            `}
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 p-4 flex justify-between items-center z-10">
            {/* Animated Header Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-600/20 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Bot className="text-white" size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0f172a] rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Sen ơi !</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                    <Sparkles size={10} /> Trợ lý ảo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
               <button 
                onClick={() => setMessages([{ role: 'model', text: 'Chào bạn! Mình là Sen đây. Bạn cần Sen hỗ trợ thông tin gì về thị trường hôm nay không?' }])}
                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={toggleExpand}
                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors hidden md:block"
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth custom-scrollbar relative">
             {/* Background decorative elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

             {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 relative z-10 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={16} className="text-indigo-500" />
                    </div>
                )}

                <div 
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{formatText(msg.text)}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 animate-fade-in-up">
                 <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-indigo-500" />
                 </div>
                 <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5 shadow-sm">
                    <span className="text-xs text-slate-400 mr-2 font-medium">Sen đang suy nghĩ</span>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
          </div>

          {/* Suggestions (only if few messages) */}
          {messages.length < 3 && !loading && (
             <div className="px-5 pb-2 flex gap-2 overflow-x-auto custom-scrollbar relative z-10">
                {suggestions.map((s) => (
                    <button 
                        key={s}
                        onClick={() => handleSend(s)}
                        className="flex-shrink-0 text-xs bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 transition-colors flex items-center gap-1"
                    >
                        <Sparkles size={10} /> {s}
                    </button>
                ))}
             </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/5 relative z-20">
            <div className="relative flex items-end gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all flex items-center">
                     <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Hỏi Sen về thị trường..."
                        className="flex-1 bg-transparent text-slate-900 dark:text-white px-4 py-3 text-sm focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                        disabled={loading}
                    />
                    <button className="p-2 mr-1 text-slate-400 hover:text-indigo-500 transition-colors">
                        <Mic size={18} />
                    </button>
                </div>
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
                >
                    <Send size={20} className={loading ? 'opacity-0' : 'opacity-100'} />
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-600">
                    Sen có thể mắc lỗi. Vui lòng kiểm chứng thông tin quan trọng.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isExpanded && !isOpen && (
        <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 pl-4 pr-6 py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all duration-300"
        >
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"></div>
            
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot size={20} className="text-white animate-pulse" />
                </div>
            </div>
            
            <div className="flex flex-col items-start">
                <span className="text-xs font-medium opacity-80">Trợ lý ảo</span>
                <span className="text-sm font-bold">Sen ơi !</span>
            </div>

            <div className="absolute inset-0 rounded-full border border-white/10 dark:border-black/5 pointer-events-none"></div>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;