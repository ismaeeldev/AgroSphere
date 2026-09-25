"use client";

import { motion } from "framer-motion";
import { Plus, MessageSquare, History, Settings, LogOut, Leaf } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  currentChatId?: string;
}

const MOCK_HISTORY = [
  { id: "1", title: "Tomato Blight Treatment", date: "2 hours ago" },
  { id: "2", title: "NPK Ratio for Wheat", date: "Yesterday" },
  { id: "3", title: "Organic Pest Control", date: "3 days ago" },
  { id: "4", title: "Seasonal Planting Guide", date: "May 5" },
];

export function Sidebar({ currentChatId }: SidebarProps) {
  return (
    <aside className="w-80 h-full bg-[#1B5E20] text-white flex flex-col border-r border-white/10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,#4CAF50_0%,transparent_70%)]" />
      </div>

      {/* Header */}
      <div className="p-6 relative z-10">
        <Link href="/" className="flex items-center gap-3 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 transition-transform group-hover:scale-110">
            <Leaf className="w-6 h-6 text-[#7CFF8A]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-none tracking-tight">AgroSphere</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#4CAF50] font-bold mt-1">Intelligence</p>
          </div>
        </Link>

        <button className="w-full py-4 px-4 rounded-2xl bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold flex items-center justify-center gap-3 transition-all shadow-[0_8px_20px_rgba(76,175,80,0.3)] hover:shadow-[0_12px_28px_rgba(76,175,80,0.4)] hover:-translate-y-0.5 active:scale-95">
          <Plus className="w-5 h-5" />
          <span>New Consultation</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 relative z-10 scrollbar-hide">
        <div className="flex items-center gap-2 px-2 py-4 text-white/50 text-[10px] font-bold uppercase tracking-widest">
          <History className="w-3 h-3" />
          <span>Recent History</span>
        </div>

        {MOCK_HISTORY.map((chat) => (
          <button
            key={chat.id}
            className={`
              w-full p-4 rounded-xl flex flex-col gap-1 transition-all group
              ${chat.id === currentChatId ? "bg-white/10 border border-white/20 shadow-lg" : "hover:bg-white/5 border border-transparent"}
            `}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className={`w-4 h-4 ${chat.id === currentChatId ? "text-[#4CAF50]" : "text-white/40 group-hover:text-white/60"}`} />
              <span className="text-sm font-medium truncate">{chat.title}</span>
            </div>
            <span className="text-[10px] text-white/30 ml-7">{chat.date}</span>
          </button>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-6 mt-auto border-t border-white/10 relative z-10 bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 relative group cursor-pointer hover:bg-white/10 transition-all">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#1B5E20] border-2 border-white/20 flex items-center justify-center font-bold text-sm shadow-inner">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">John Doe</p>
            <p className="text-[10px] text-white/40 truncate">Premium Plan</p>
          </div>
          <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all group/logout" title="Log out">
            <LogOut className="w-4 h-4 text-white/40 group-hover/logout:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}
