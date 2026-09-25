import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Leaf, Info } from "lucide-react";
import { ScanContext } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "user" | "bot";
interface Message {
  id: string;
  role: Role;
  text: string;
  ts: string;
}

// ─── Mock Knowledge Base ─────────────────────────────────────────────────────
const RESPONSES: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["protect", "protection", "pesticide", "pest"],
    answer: "🌾 For optimal crop protection, use AgriShield Pro for broad-spectrum pest control. Apply early morning or late evening. Always wear PPE and follow the dosage guide on the label.",
  },
  {
    keywords: ["fungicide", "fungal", "mold", "disease", "blight"],
    answer: "🍃 Fungal diseases are best managed with CropGuard Max. Apply preventively 7–10 days before expected wet weather. Our EcoGreen line is certified for organic fields.",
  },
  {
    keywords: ["fertilizer", "fertilise", "nutrient", "growth", "yield"],
    answer: "📈 Pair our Smart Fertilizer range with your regular pesticide schedule. Balanced NPK ratios improve yield by up to 32%. Check our crop-specific guides in the dashboard.",
  },
  {
    keywords: ["organic", "eco", "natural", "safe", "certified"],
    answer: "🌿 Our EcoGreen lineup is fully ISO-certified for organic farming. Look for the green leaf badge on any product to confirm organic compatibility.",
  },
  {
    keywords: ["delivery", "shipping", "order", "fast"],
    answer: "🚚 We offer nationwide fast delivery — most orders reach your farm within 2–3 business days. Bulk orders qualify for our express farm-door delivery service.",
  },
  {
    keywords: ["rain", "weather", "water", "irrigation"],
    answer: "🌧️ Our premium formulations feature advanced rainfast technology. If the product dries for at least 2 hours before rainfall, efficacy is maintained. No re-application needed!",
  },
  {
    keywords: ["price", "cost", "discount", "bulk", "offer"],
    answer: "💰 We offer tiered bulk pricing for cooperatives and large-scale farmers. Contact our sales team via the Contact section for a custom quote.",
  },
  {
    keywords: ["hello", "hi", "hey", "start"],
    answer: "👋 Hello, farmer! I'm your AgroSphere assistant. Ask me anything about crop protection, products, delivery, or organic farming. How can I help?",
  },
];

const FALLBACK = "🌱 Great question! Our AI agronomist team will have a precise answer for you soon. In the meantime, visit our Contact section for expert support.";

function getResponse(input: string, context?: ScanContext | null): string {
  const lower = input.toLowerCase();

  // Context-aware logic
  if (context && (lower.includes("fix") || lower.includes("this") || lower.includes("help") || lower.includes("what"))) {
    return `Based on your scanned crop returning "${context.issue}", I recommend applying ${context.recommendation}. ${context.aiTip}`;
  }

  for (const { keywords, answer } of RESPONSES) {
    if (keywords.some((kw) => lower.includes(kw))) return answer;
  }
  return FALLBACK;
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  scanContext: ScanContext | null;
  clearContext: () => void;
}

export function ChatMode({ scanContext, clearContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "👋 Hi! I'm your AgroSphere assistant. Ask me anything about crop protection, products, or smart farming!",
      ts: timestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, scanContext]);

  // If scanContext is newly added, we don't necessarily push a message, but we show a badge.
  // The badge acts as visual proof to the user that AI is aware.

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text, ts: timestamp() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setTyping(false);
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        text: getResponse(text, scanContext),
        ts: timestamp(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, delay);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8faf8] relative" style={{ backgroundImage: "radial-gradient(#1B5E20 0.5px, transparent 0.5px)", backgroundSize: "18px 18px" }}>

      {/* Context Badge */}
      <AnimatePresence>
        {scanContext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-2 left-4 right-4 z-20 bg-white/90 backdrop-blur-md rounded-xl p-3 border border-green-200 shadow-[0_4px_12px_rgba(76,175,80,0.1)] flex justify-between items-start"
          >
            <div className="flex gap-2">
              <div className="mt-0.5 text-[#4CAF50]">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#1B5E20]">Crop context attached</span>
                <p className="text-zinc-600 truncate max-w-[200px]">{scanContext.issue}</p>
              </div>
            </div>
            <button onClick={clearContext} className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 text-zinc-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Adds padding to top if context badge is present so messages don't hide behind it */}
        {scanContext && <div className="h-12 flex-shrink-0" />}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium shadow-sm
                  ${msg.role === "user"
                    ? "bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] text-white rounded-br-sm"
                    : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-sm"
                  }
                `}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.ts}</span>
            </motion.div>
          ))}

          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-start gap-2"
            >
              <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] text-zinc-400 self-end mb-1">typing…</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-zinc-100 flex items-center gap-2 rounded-b-3xl">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about crops, products…"
            disabled={typing}
            className="
              w-full h-10 pl-4 pr-4 rounded-full text-sm
              bg-zinc-50 border border-zinc-200
              focus:outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20
              transition-all duration-200 text-zinc-700 placeholder:text-zinc-400
              disabled:opacity-60
            "
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={send}
          disabled={typing || !input.trim()}
          className="
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            bg-gradient-to-br from-[#2E7D32] to-[#4CAF50]
            shadow-[0_4px_16px_rgba(76,175,80,0.4)]
            hover:shadow-[0_6px_20px_rgba(76,175,80,0.6)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
}
