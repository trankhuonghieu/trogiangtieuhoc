import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bot, Send, X, Sparkles, Zap } from 'lucide-react';

const BubbleFormattedMessage: React.FC<{ content: string; isUser?: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-purple-950 bg-purple-50 px-1 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-slate-800 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const title = trimmed.replace(/^#+\s*/, '');
          return (
            <h5 key={idx} className="font-extrabold text-xs text-purple-900 mt-2 mb-0.5 border-b border-purple-100 pb-0.5">
              {parseInlineBold(title)}
            </h5>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-purple-600 font-bold shrink-0">•</span>
              <span>{parseInlineBold(trimmed.replace(/^[-*]\s*/, ''))}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap">
            {parseInlineBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const AIChatBubble: React.FC = () => {
  const { showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: 'Xin chào Thầy/Cô! Tôi là Trợ lý AI Sư phạm (Gemini 3.8 Flash siêu tốc). Thầy/Cô cần giải đáp hoặc tư vấn chi tiết nội dung gì hôm nay?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal;
    setInputVal('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [
      ...prev,
      { id: 'usr-' + Date.now(), role: 'user', text: userText, time: nowTime },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Phân tích câu hỏi sau và trả lời ĐẦY ĐỦ, CHI TIẾT, BÁM SÁT 100% TRỌNG TÂM CÂU HỎI với cấu trúc rõ ràng: ${userText}`,
          type: 'general',
        }),
      });
      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'res-' + Date.now(),
          role: 'assistant',
          text: data.content || 'Trợ lý AI luôn sẵn sàng hỗ trợ Thầy/Cô!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: 'Kết nối gián đoạn. Thầy/Cô vui lòng thử lại câu hỏi.',
          time: nowTime,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Circular Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          title="Trợ lý AI Sư phạm Đa Lĩnh Vực"
          aria-label="Mở Trợ lý AI"
        >
          <Bot className="w-7 h-7 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat Box Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col justify-between overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5">
                  <span>Trợ lý AI Sư phạm Đa Lĩnh Vực</span>
                </h4>
                <p className="text-[10px] text-purple-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>Gemini 3.8 Flash • Phản hồi Siêu tốc</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[300px] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <BubbleFormattedMessage content={msg.text} isUser={msg.role === 'user'} />
                  <span className={`block text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-700 italic bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                <span>Trợ lý AI đang phân tích & tổng hợp phản hồi siêu tốc...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi nghiệp vụ hoặc chủ đề cần tư vấn..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl text-xs outline-none focus:border-purple-500 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-md btn-tactile shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
