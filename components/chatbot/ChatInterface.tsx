"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Paperclip, Mic, X, Leaf, Sparkles, User, Info, ArrowDown, Menu } from "lucide-react";

type Role = "user" | "bot";
interface Message {
  id: string;
  role: Role;
  text: string;
  ts: string;
  image?: string;
  file?: string;
}

interface Props {
  onMenuClick?: () => void;
}

export function ChatInterface({ onMenuClick }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "bot", text: "Welcome to AgroSphere Intelligence! 👋 I'm ready to assist you with crop diagnosis, product recommendations, and smart farming advice. How are your fields looking today?", ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    /**
     * ============================================================================
     * TEMPORARY / SAMPLE AREA: AI FETCH LOGIC
     * ============================================================================
     * This logic calls the internal /api/chat proxy which uses GPT-3.5 Turbo.
     * Future replacement plan: Use a dedicated AgroSphere backend service.
     * ============================================================================
     */
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data.text,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "⚠️ I'm having trouble connecting to the field sensors (OpenAI API). Please check your connection or API key.",
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
    // ============================================================================
  };

  return (
    <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#1B5E20 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      {/* Header */}
      <header className="h-16 md:h-20 border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-zinc-50 text-zinc-600 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm md:text-lg text-zinc-900 leading-none">AgroSphere AI</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-zinc-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all">
            <Info className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8 scroll-smooth relative z-10 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2.5 md:gap-4 max-w-[85%] md:max-w-[70%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-[#1B5E20]" : "bg-white border border-zinc-200"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#4CAF50]" />}
                </div>
                <div className="space-y-1.5">
                  <div className={`
                    p-3.5 md:p-5 rounded-2xl md:rounded-3xl text-sm leading-relaxed shadow-sm
                    ${msg.role === "user"
                      ? "bg-[#1B5E20] text-white rounded-tr-none"
                      : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-none"}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] md:text-[10px] font-bold text-zinc-400 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>{msg.ts}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-2.5 md:gap-4 max-w-[85%] md:max-w-[70%]">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#4CAF50]" />
              </div>
              <div className="bg-zinc-50 border border-zinc-100 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-[#4CAF50] rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-4 md:p-8 bg-white relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Toolbar for image/file upload - adjusted for mobile */}
            <div className="absolute left-2 md:left-4 bottom-[60px] md:bottom-[75px] flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-all transform translate-y-2 group-focus-within:translate-y-0 z-30">
              <button className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-[#1B5E20] hover:border-[#1B5E20]/30 transition-all shadow-xl">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-[#1B5E20] hover:border-[#1B5E20]/30 transition-all shadow-xl">
                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              {/* <button className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-[#1B5E20] hover:border-[#1B5E20]/30 transition-all shadow-xl">
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </button> */}
            </div>

            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question..."
              className="
                w-full p-4 md:p-6 pr-14 md:pr-20 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-zinc-100 
                bg-zinc-50 text-zinc-800 text-sm md:text-base placeholder:text-zinc-400
                focus:outline-none focus:border-[#4CAF50] focus:ring-4 focus:ring-[#4CAF50]/10
                transition-all resize-none shadow-sm
              "
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="
                absolute right-2 md:right-4 top-1/2 -translate-y-1/2
                w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1B5E20] text-white
                flex items-center justify-center shadow-lg
                disabled:opacity-50 disabled:grayscale transition-all
                hover:scale-105 active:scale-95
              "
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <p className="text-center mt-2.5 md:mt-4 text-[9px] md:text-[10px] text-zinc-400 font-medium uppercase tracking-widest leading-tight">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
