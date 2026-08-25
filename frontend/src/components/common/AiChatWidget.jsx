import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Sparkles,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Send,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AiChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load initial suggestions and status
  useEffect(() => {
    if (user) {
      loadSuggestions();
      loadAiStatus();
    }
  }, [user]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const loadSuggestions = async () => {
    try {
      const res = await api.getAiSuggestions();
      if (res.success && Array.isArray(res.suggestions)) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      console.warn('[AI Widget] Failed to load suggestions:', err.message);
    }
  };

  const loadAiStatus = async () => {
    try {
      const res = await api.getAiStatus();
      if (res.success) {
        setAiStatus(res);
      }
    } catch (err) {
      console.warn('[AI Widget] Status check notice:', err.message);
    }
  };

  const handleSend = async (customText) => {
    const textToSend = (customText || message).trim();
    if (!textToSend || loading) return;

    setError(null);
    const userMsg = { role: 'user', text: textToSend, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setMessage('');
    setLoading(true);

    try {
      // Build conversation history format
      const history = messages.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await api.chatWithAi({
        message: textToSend,
        history
      });

      if (res.success) {
        const assistantMsg = {
          role: 'assistant',
          text: res.reply,
          toolsUsed: res.toolsUsed || [],
          model: res.model,
          metadata: res.metadata,
          timestamp: new Date().toISOString()
        };
        setMessages([...updatedMessages, assistantMsg]);
      } else {
        throw new Error(res.reply || res.message || 'Unable to reach assistant');
      }
    } catch (err) {
      console.error('[AI Chat Error]:', err);
      setError(err.message || 'AI assistant is temporarily unavailable. Please try again.');
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          text: 'The AI assistant is temporarily unavailable. Please try again in a moment or rephrase your request.',
          isError: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to format assistant message with highlights and list rendering
  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet list items
          if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
            const content = line.trim().replace(/^[•\-*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-blue-900 font-bold text-base leading-none">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
              </div>
            );
          }

          // Numbered items
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="font-semibold text-blue-950">{line.trim().match(/^\d+\./)[0]}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.trim().replace(/^\d+\.\s*/, '')) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  // Safe inline markdown parser (bold, currency, stars)
  const formatInlineMarkdown = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-950">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
      .replace(/(₹\s*[\d,]+)/g, '<span class="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-xs">$1</span>')
      .replace(/(⭐\s*[\d.]+)/g, '<span class="font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded text-xs">$1</span>');
  };

  if (!user) return null;

  const roleLabel = {
    customer: 'Customer Mode',
    worker: 'Worker Mode',
    society_admin: 'Society Admin Mode',
    federation_admin: 'Federation Admin Mode',
    platform_admin: 'Platform Admin Mode'
  }[user.role] || 'User Mode';

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-blue-700/50 group"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold tracking-wide">AI Assistant</p>
            <p className="text-[10px] text-blue-200 font-medium">Gemini 3.7 Flash</p>
          </div>
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'w-[94vw] sm:w-[620px] h-[85vh] max-h-[750px]'
              : 'w-[94vw] sm:w-[420px] h-[560px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm truncate">Cooperative AI Assistant</h3>
                  <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold rounded-md">
                    Gemini
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate">{roleLabel} • Live DB Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore window size' : 'Expand window'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Cooperative Integrity Banner */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-3.5 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
              <span className="font-medium">Ministry of Cooperation / NCCT Platform</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Database className="w-3 h-3" />
              <span>Read-Only</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.length === 0 ? (
              <div className="space-y-4 pt-2">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-950 font-semibold">
                    <Sparkles className="w-4 h-4 text-blue-900" />
                    <span>Welcome, {user.name}!</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    I am your platform AI assistant. I query live cooperative records to help you find verified workers, understand bookings, inspect fair allocation rationale, and explore workforce forecasts.
                  </p>
                </div>

                {/* Role-Specific Suggested Prompts */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                      Suggested Questions:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(prompt)}
                          className="text-left text-xs bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-800 font-medium px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-between group"
                        >
                          <span>{prompt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs ${
                      m.role === 'user'
                        ? 'bg-blue-900 text-white rounded-br-xs'
                        : m.isError
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-xs'
                        : 'bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    {/* Tool Execution Tag */}
                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {m.toolsUsed.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200/60 rounded-md text-[10px] font-semibold"
                          >
                            <Database className="w-2.5 h-2.5" />
                            Live Query: {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {m.role === 'user' ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    ) : (
                      renderMessageContent(m.text)
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-1 mt-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2 pt-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900/10 flex items-center justify-center border border-blue-900/20 text-blue-900 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-900 animate-pulse"></span>
                    <span className="font-medium text-slate-700">Querying live cooperative database...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Strip when in conversation */}
          {messages.length > 0 && suggestions.length > 0 && !loading && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Prompts:</span>
              {suggestions.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about cooperative services, workers, or bookings...`}
                rows={1}
                maxLength={1200}
                className="w-full pl-3.5 pr-12 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:bg-white resize-none text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || loading}
                className="absolute right-1.5 p-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-blue-900 text-white rounded-lg transition-colors flex items-center justify-center"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
              <span>Read-only queries • Real database sync</span>
              <span>{message.length}/1200</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default AiChatWidget;
