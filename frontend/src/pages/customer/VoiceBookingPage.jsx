import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { Mic, Send, Bot, User, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

export function VoiceBookingPage() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [createdJob, setCreatedJob] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await api.startVoiceBooking();
      if (res.success) {
        setSessionId(res.sessionId);
        setMessages([{ role: 'assistant', text: res.message, timestamp: new Date() }]);
        setQuickReplies(res.quickReplies || []);
      }
    } catch (err) {
      setMessages([{ role: 'assistant', text: 'Failed to start booking session. Please try again.', timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !sessionId) return;
    const userMsg = { role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setQuickReplies([]);
    setLoading(true);

    try {
      const res = await api.sendVoiceInput(sessionId, text);
      if (res.success) {
        const botMsg = { role: 'assistant', text: res.message, timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setQuickReplies(res.quickReplies || []);
        if (res.job) {
          setBookingComplete(true);
          setCreatedJob(res.job);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, there was an error. Please try again.', timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Sahakar Voice Booking Assistant</h2>
            <p className="text-blue-200 text-xs">Hindi / English — Describe your problem naturally</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && !bookingComplete && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-2">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qr.payload || qr.text)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200 transition-colors"
              >
                {qr.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {bookingComplete ? (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold text-sm">Booking Confirmed!</span>
            </div>
            {createdJob && (
              <div className="bg-white rounded-lg p-3 text-xs space-y-1 border border-green-200">
                <p><strong>Job Code:</strong> {createdJob.code}</p>
                <p><strong>Service:</strong> {createdJob.serviceCategory}</p>
                <p><strong>Status:</strong> {createdJob.status}</p>
                <p><strong>OTP:</strong> {createdJob.otp}</p>
              </div>
            )}
            <button
              onClick={() => { setBookingComplete(false); setMessages([]); startSession(); }}
              className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> New Booking
            </button>
          </div>
        ) : (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              onClick={startVoiceRecording}
              disabled={isRecording || loading}
              className={`p-2.5 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Speak in Hindi or English"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder="Type or speak: 'Mera kitchen tap leak ho raha hai'..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default VoiceBookingPage;
