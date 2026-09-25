"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Camera, Check, Leaf } from "lucide-react";
import Image from "next/image";

import { ChatbotMode, ScanContext } from "./chatbot/types";
import { ModeSwitcher } from "./chatbot/ModeSwitcher";
import { ChatMode } from "./chatbot/ChatMode";
import { ScanMode } from "./chatbot/ScanMode";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatbotMode>("chat");
  const [scanContext, setScanContext] = useState<ScanContext | null>(null);

  // Smart FAB Hint
  const [hint, setHint] = useState<"chat" | "scan">("chat");

  useEffect(() => {
    if (open) return;
    const timer = setInterval(() => {
      setHint((h) => (h === "chat" ? "scan" : "chat"));
    }, 4000);
    return () => clearInterval(timer);
  }, [open]);

  const handleScanComplete = (ctx: ScanContext) => {
    setScanContext(ctx);
  };

  const clearScanContext = () => {
    setScanContext(null);
  };

  // Switch to chat and optionally pass context
  const handleAskAI = (ctx?: ScanContext) => {
    if (ctx) setScanContext(ctx);
    setMode("chat");
  };

  // Directional anim logic for modes
  const direction = mode === "scan" ? 1 : -1;

  const modeVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
      filter: "blur(4px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.3, type: "spring" as const, stiffness: 350, damping: 30 }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 30 : -30,
      opacity: 0,
      filter: "blur(4px)",
      transition: { duration: 0.2 }
    })
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">

      {/* ── Main Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="
              w-[360px] max-w-[calc(100vw-2rem)]
              h-[550px]
              rounded-[2rem] overflow-hidden
              border border-zinc-200/60
              shadow-[0_24px_64px_rgba(27,94,32,0.18)]
              flex flex-col bg-white
            "
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1B5E20, #4CAF50)" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
                  <Leaf className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-[15px] leading-none tracking-wide text-shadow-sm">AgroSphere AI</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse shadow-[0_0_8px_#86efac]" />
                    <span className="text-green-100 text-[10px] font-bold uppercase tracking-widest">Active System</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 transition-colors flex items-center justify-center relative z-10 backdrop-blur-sm"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="bg-gradient-to-b from-[#4CAF50]/5 to-white pb-2 flex-shrink-0">
              <ModeSwitcher mode={mode} setMode={setMode} />
            </div>

            {/* Modes Carousel Container */}
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={mode}
                  custom={direction}
                  variants={modeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  {mode === "chat" ? (
                    <ChatMode scanContext={scanContext} clearContext={clearScanContext} />
                  ) : (
                    <ScanMode onScanComplete={handleScanComplete} onAskAI={handleAskAI} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Smart FAB (Floating Action Button) ─────────────────────────── */}
      <motion.button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setMode("chat");
        }}
        whileTap={{ scale: 0.95 }}
        className="relative z-50 flex items-center justify-center group focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {open ? (
            /* Close State */
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center border border-zinc-100 hover:shadow-2xl hover:bg-zinc-50 transition-all"
            >
              <X className="w-6 h-6 text-[#1B5E20]" />
            </motion.div>
          ) : (
            /* Smart Hint State - Pill Expansion */
            <motion.div
              key="smart-fab"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
              transition={{
                duration: 0.4,
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
              }}
              className="relative flex items-center bg-white rounded-full p-2 pr-4 cursor-pointer shadow-[0_12px_30px_rgba(27,94,32,0.25)] border border-green-100 hover:shadow-[0_16px_40px_rgba(27,94,32,0.35)] transition-all group-hover:scale-105"
            >
              {/* Dynamic pulse behind icon */}
              <div className="absolute left-2 w-12 h-12 bg-[#4CAF50]/30 rounded-full blur-[16px] animate-pulse pointer-events-none" />

              <div className="relative w-12 h-12 flex-shrink-0 bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] rounded-full flex items-center justify-center shadow-inner">
                <AnimatePresence mode="wait">
                  {hint === "chat" ? (
                    <motion.div key="icon-chat" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="icon-scan" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                      <Camera className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="ml-3 overflow-hidden min-w-[75px]">
                <AnimatePresence mode="wait">
                  {hint === "chat" ? (
                    <motion.p key="text-chat" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-sm font-bold text-[#1B5E20]">
                      Ask AI
                    </motion.p>
                  ) : (
                    <motion.p key="text-scan" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-sm font-bold text-[#1B5E20]">
                      Scan Crop
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-0.5">AgroSphere</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
