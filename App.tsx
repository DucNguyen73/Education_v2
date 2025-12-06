import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  History, 
  Sparkles, 
  BookOpen, 
  Map as MapIcon, 
  Clock 
} from 'lucide-react';
import Card3D from './components/Card3D';
import { ChatMessage, MessageRole, Era } from './types';
import { generateHistoryResponse, generateHistoricalImage } from './services/gemini';
import { playAtmosphere, stopAtmosphere } from './services/audioEngine';

// Predefined Eras
const ERAS: Era[] = [
  { id: 'hong-bang', name: 'Thời Hồng Bàng', yearRange: '2879 - 258 TCN', description: 'Cội nguồn dân tộc, sự tích Con Rồng Cháu Tiên.', color: 'from-amber-700 to-orange-900', musicType: 'ancient' },
  { id: 'pk-bac-thuoc', name: 'Bắc Thuộc', yearRange: '179 TCN - 938', description: 'Ngàn năm đấu tranh giành độc lập.', color: 'from-gray-700 to-slate-900', musicType: 'war' },
  { id: 'dai-viet', name: 'Đại Việt', yearRange: '968 - 1802', description: 'Kỷ nguyên độc lập và phát triển rực rỡ.', color: 'from-yellow-700 to-red-900', musicType: 'peace' },
  { id: 'hien-dai', name: 'Cận - Hiện Đại', yearRange: '1858 - Nay', description: 'Đấu tranh thống nhất và xây dựng đất nước.', color: 'from-cyan-700 to-blue-900', musicType: 'modern' },
];

const App: React.FC = () => {
  const [selectedEra, setSelectedEra] = useState<Era>(ERAS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    setMessages([{
      id: 'init',
      role: MessageRole.MODEL,
      text: `Chào mừng bạn đến với ${selectedEra.name} (${selectedEra.yearRange}). Tôi là người dẫn đường của bạn. Bạn muốn biết gì về thời kỳ này?`,
      timestamp: Date.now()
    }]);
  }, []); // Run once on mount, logic for changing era handled separately

  // Handle Era Switch
  const handleEraChange = (era: Era) => {
    setSelectedEra(era);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: `Chúng ta đã chuyển dịch không gian đến: ${era.name}. Không khí ở đây thật khác biệt...`,
        timestamp: Date.now()
      }
    ]);
    if (isAudioPlaying) {
      playAtmosphere(era.musicType);
    }
  };

  const handleAudioToggle = () => {
    if (isAudioPlaying) {
      stopAtmosphere();
      setIsAudioPlaying(false);
    } else {
      playAtmosphere(selectedEra.musicType);
      setIsAudioPlaying(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Get text response
      const textResponse = await generateHistoryResponse(
        `Trong bối cảnh ${selectedEra.name} (${selectedEra.yearRange}), hãy trả lời: ${userMsg.text}`,
        messages
      );

      // 2. Generate Image (parallel or sequential - sequential for better UX feedback flow here)
      // Check if the user asked for visual content implies image generation
      const shouldGenerateImage = input.toLowerCase().includes('vẽ') || 
                                  input.toLowerCase().includes('hình') || 
                                  input.toLowerCase().includes('xem') ||
                                  input.length > 20; // Generate image for substantial questions for "3D visual" feel

      let imageUrl: string | undefined = undefined;
      
      if (shouldGenerateImage) {
        imageUrl = await generateHistoricalImage(
            `Scene from Vietnam history period ${selectedEra.name}, context: ${userMsg.text}. High quality, atmospheric, 3d render style.`
        );
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: textResponse,
        imageUrl: imageUrl,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden relative selection:bg-rose-500 selection:text-white">
      
      {/* Background Ambience Visuals */}
      <div className={`absolute inset-0 bg-gradient-to-br ${selectedEra.color} opacity-20 transition-colors duration-1000 z-0 pointer-events-none`} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0 pointer-events-none animate-pulse"></div>

      {/* Left Sidebar: Timeline */}
      <div className="w-20 md:w-64 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-md z-10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-center md:justify-start gap-3">
          <History className="w-8 h-8 text-rose-500" />
          <h1 className="hidden md:block font-bold text-xl tracking-wider">SuViet3D</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {ERAS.map((era) => (
            <button
              key={era.id}
              onClick={() => handleEraChange(era)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-300 relative group
                ${selectedEra.id === era.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {selectedEra.id === era.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
              )}
              <Clock className={`w-5 h-5 ${selectedEra.id === era.id ? 'text-rose-400' : ''}`} />
              <div className="hidden md:block text-left">
                <div className="font-semibold text-sm">{era.name}</div>
                <div className="text-xs opacity-60">{era.yearRange}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
            <button 
                onClick={handleAudioToggle}
                className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg border transition-all duration-300
                    ${isAudioPlaying ? 'border-rose-500/50 bg-rose-500/20 text-rose-300' : 'border-white/10 hover:bg-white/5'}
                `}
            >
                {isAudioPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
                <span className="hidden md:inline text-sm font-medium">
                    {isAudioPlaying ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
                </span>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-black/10 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-full">
                    <MapIcon className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                    <h2 className="font-bold text-lg leading-tight">{selectedEra.name}</h2>
                    <p className="text-xs text-gray-400 max-w-md truncate">{selectedEra.description}</p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                GEMINI AI CONNECTED
            </div>
        </header>

        {/* Chat / Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === MessageRole.USER ? 'ml-12' : 'mr-12'}`}>
                        
                        {/* 3D Card Wrapper for Messages */}
                        <Card3D intensity={10} className="h-full">
                            <div className={`
                                relative p-6 rounded-2xl shadow-2xl border
                                ${msg.role === MessageRole.USER 
                                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700 border-indigo-400/30 text-white' 
                                    : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600/30 text-gray-100'
                                }
                            `}>
                                {/* Visual effect for Model messages */}
                                {msg.role === MessageRole.MODEL && (
                                    <div className="absolute -top-3 -left-3 bg-rose-500 p-2 rounded-lg shadow-lg rotate-3 border border-rose-400">
                                        <BookOpen className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {/* Image Content */}
                                {msg.imageUrl && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                                        <div className="relative aspect-video">
                                            <img 
                                                src={msg.imageUrl} 
                                                alt="Historical Visual" 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                <span className="text-xs font-mono text-white/80">AI GENERATED VISUALIZATION</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Text Content */}
                                <div className="prose prose-invert max-w-none serif leading-relaxed">
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                                    ))}
                                </div>
                                
                                {/* Footer Metadata */}
                                <div className="mt-3 flex items-center justify-end gap-2 opacity-50 text-[10px] font-mono uppercase tracking-wider">
                                    {msg.role === MessageRole.MODEL ? 'SuViet AI Guide' : 'Student Explorer'} • {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </Card3D>
                    </div>
                </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-gray-800/50 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                        <Sparkles className="w-5 h-5 text-rose-400 animate-spin" />
                        <span className="text-sm text-gray-400 animate-pulse">Đang tái hiện lịch sử...</span>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-slate-900 to-transparent">
            <div className="max-w-4xl mx-auto relative">
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full opacity-20 pointer-events-none"></div>
                <div className="relative flex items-center gap-2 bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 focus-within:ring-rose-500/50 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Hỏi về lịch sử, nhân vật, sự kiện... (VD: Vua Quang Trung đại phá quân Thanh như thế nào?)"
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium
                            ${!isLoading && input.trim() 
                                ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg hover:scale-105 active:scale-95' 
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        <span>Gửi</span>
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Khám phá quá khứ • Hiểu về tương lai
                    </p>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;