"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "🌱 Need crop help?",
  "📷 Diagnose crop instantly",
  "⚡ AgroSphere AI assistant",
];

export function ChatbotFAB() {
  const pathname = usePathname();
  const [msgIndex, setMsgIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Tooltip display cycle
    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (pathname === "/chatbot") return null;

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <Link href="/chatbot" className="group block focus:outline-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {/* 5. GLASS SHELL / SPECIAL BACKPLATE */}
          <div className="absolute inset-[-8px] bg-white/5 backdrop-blur-md rounded-full pointer-events-none" />

          {/* 4. FUTURISTIC DOUBLE ORBIT RINGS */}
          {/* Slow Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-14px] rounded-full border border-green-500/10 border-t-green-500/30 blur-[1px]"
          />
          {/* Fast Inner Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-6px] rounded-full border border-emerald-400/10 border-r-emerald-400/40 blur-[0.5px]"
          />

          {/* 7. AI PULSE BEACON (Box Shadow) */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0px rgba(76,175,80,0.0)",
                "0 0 30px rgba(76,175,80,0.4)",
                "0 0 0px rgba(76,175,80,0.0)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full"
          />

          {/* PREMIUM LIQUID GLOW */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-[-30px] pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4CAF50_0%,transparent_70%)] blur-2xl opacity-40" />
          </motion.div>

          {/* 3. ACTIVE AI SCAN SWEEP EFFECT */}
          <div className="relative w-14 h-14 flex items-center justify-center rounded-full overflow-hidden">
            {/* The Scan Beam */}
            <motion.div
              animate={{
                top: ["-100%", "200%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-green-400/30 to-transparent rotate-[-45deg] blur-md z-10"
            />

            <Image
              src="/images/chatbot_icon.png"
              alt="AgroSphere AI"
              width={56}
              height={56}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 relative z-20 drop-shadow-[0_8px_16px_rgba(76,175,80,0.3)]"
            />
          </div>

          {/* 2. PROACTIVE AUTO-CYCLING TOOLTIP */}
          <div className="absolute right-18 top-1/2 -translate-y-1/2 pointer-events-none">
            <AnimatePresence mode="wait">
              {(showTooltip || true) && ( // Keeping it slightly visible or using the showTooltip logic
                <motion.div
                  key={msgIndex}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.8 }}
                  className="bg-[#1B5E20]/95 backdrop-blur-md border border-green-400/30 text-white px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  {MESSAGES[msgIndex]}

                  {/* Tooltip Tail */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-l-[6px] border-l-[#1B5E20] border-y-[6px] border-y-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
