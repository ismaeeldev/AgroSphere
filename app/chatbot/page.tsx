"use client";

import { useState } from "react";
import { Sidebar } from "@/components/chatbot/Sidebar";
import { ChatInterface } from "@/components/chatbot/ChatInterface";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function ChatbotPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar currentChatId="1" />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#1B5E20] z-[101] md:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-[102]">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar currentChatId="1" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        <ChatInterface onMenuClick={toggleSidebar} />
      </div>
    </div>
  );
}
