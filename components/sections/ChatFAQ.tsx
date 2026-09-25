"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "../layout/Container";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Bot, Sparkles, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const FAQ_DATA = [
  {
    id: "q1",
    question: "Is it safe for my crops?",
    answer: "Yes! All our products are ISO-certified and rigorously tested. When used according to our dosage chart, they are 100% safe and highly effective.",
  },
  {
    id: "q2",
    question: "How fast is delivery?",
    answer: "We offer Nationwide Fast Delivery. Most orders are processed within 24 hours and delivered directly to your farm within 2-3 business days.",
  },
  {
    id: "q3",
    question: "Do you provide agronomy support?",
    answer: "Absolutely! Our expert agronomists are available 24/7. You can also use our AI Chatbot for instant diagnosis.",
  },
  {
    id: "q4",
    question: "Do you offer bulk discounts?",
    answer: "Yes, we provide special business pricing for large-scale farmers and cooperatives. Contact our sales team for a custom quote.",
  },
  {
    id: "q5",
    question: "Is it safe for organic farming?",
    answer: "Our 'EcoGreen' lineup is specifically certified for organic farming. Just look for the green leaf badge on our products.",
  },
  {
    id: "q6",
    question: "What if it rains after application?",
    answer: "Our premium products feature advanced rainfast technology. As long as it dries for 2 hours before rainfall, the application remains fully effective.",
  },
  {
    id: "q7",
    question: "Can I mix it with fertilizers?",
    answer: "Yes, our formulations are highly compatible. However, we always recommend a small jar test before mixing with unverified third-party chemicals.",
  },
  {
    id: "q8",
    question: "How do I apply the products?",
    answer: "Most of our products are designed for foliar spray or drip irrigation. Always refer to the exact label on your bottle for detailed application instructions and optimal timings.",
  }
];

export function ChatFAQ() {
  const { ref, controls, variants } = useScrollReveal();
  
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", sender: "bot", text: "Hello! I'm your AgroSphere Assistant. What would you like to know about our premium crop protection?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isTyping]);

  const handleAsk = (faqId: string) => {
    if (isTyping) return;
    
    // Check if the question was already asked
    if (messages.some(m => m.id === `u-${faqId}`)) return;

    const faq = FAQ_DATA.find(f => f.id === faqId);
    if (!faq) return;

    // Add user message
    setMessages(prev => [...prev, { id: `u-${faqId}`, sender: "user", text: faq.question }]);
    setIsTyping(true);

    // Simulate AI thinking and typing duration
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: `b-${faqId}`, sender: "bot", text: faq.answer }]);
    }, 1200); 
  }

  return (
    <section className="bg-background relative py-24 section-padding overflow-hidden">
      <Container className="relative z-10">
        
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={variants}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white px-4 py-1.5 min-text-sm font-semibold tracking-wide uppercase shadow-md shadow-[#4CAF50]/30 border-none transition-transform hover:-translate-y-0.5">
            Interactive FAQ
          </Badge>
          <h2
            className="text-3xl md:text-4xl text-black mb-4"
            style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
          >
            Have Questions? <span className="text-[#4CAF50]">Ask the AI</span>
          </h2>
          <p className="text-lg text-foreground/70">
            Select a question below to instantly get answers from our virtual agronomist. Highly responsive, highly intelligent.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FAQ Suggestions Panel (Left / Top) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest mb-2 pl-2 flex items-center gap-2">
              <Sparkles size={14} className="text-[#4CAF50]" /> Suggested Prompts
            </h3>
            
            {FAQ_DATA.map((faq) => {
              const isAsked = messages.some(m => m.id === `u-${faq.id}`);
              return (
                 <button
                  key={faq.id}
                  onClick={() => handleAsk(faq.id)}
                  disabled={isTyping || isAsked}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                    ${isAsked 
                      ? "opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-200" 
                      : "bg-white border-zinc-200 hover:border-[#4CAF50]/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    }
                  `}
                 >
                   <span className={`text-sm font-bold transition-colors ${isAsked ? "text-zinc-400" : "text-zinc-700 group-hover:text-[#1B5E20]"}`}>
                     "{faq.question}"
                   </span>
                   {!isAsked && <Send className="w-4 h-4 text-[#4CAF50] opacity-0 group-hover:opacity-100 transition-opacity" />}
                 </button>
              )
            })}
          </div>

          {/* Chat Interface Mockup (Right / Bottom) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="lg:col-span-8 bg-zinc-50 border border-zinc-200/60 rounded-[32px] overflow-hidden shadow-2xl shadow-green-900/5 flex flex-col h-[550px] relative"
          >
            
            {/* Premium Chat Header */}
            <div className="bg-[#1B5E20] p-5 flex items-center gap-4 shadow-md z-10">
               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                 <Bot className="text-white w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-white font-extrabold text-lg">AgroSphere Support</h3>
                  <p className="text-green-300 text-xs flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4CAF50]"></span>
                    Agent Online
                  </p>
               </div>
            </div>

            {/* Chat Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              // Add a very subtle agriculture-themed dot pattern purely via CSS
              style={{ 
                backgroundImage: 'radial-gradient(#1B5E20 0.8px, transparent 0.8px)', 
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                backgroundColor: '#fafafa',
                opacity: 0.95
              }}
            >
               <AnimatePresence initial={false}>
                 {messages.map((msg) => (
                   <motion.div
                     key={msg.id}
                     initial={{ opacity: 0, y: 15, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                     className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                   >
                     <div className={`
                       max-w-[80%] p-4 rounded-2xl shadow-sm relative
                       ${msg.sender === "user" 
                          ? "bg-[#4CAF50] text-white rounded-br-sm ml-auto" 
                          : "bg-white border border-zinc-200/80 text-zinc-800 rounded-tl-sm mr-auto"
                       }
                     `}>
                       <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                     </div>
                   </motion.div>
                 ))}

                 {/* Typing Indicator */}
                 {isTyping && (
                   <motion.div
                     key="typing"
                     initial={{ opacity: 0, y: 15, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ duration: 0.2 }}
                     className="flex justify-start"
                   >
                     <div className="bg-white border border-zinc-200/80 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                       <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
