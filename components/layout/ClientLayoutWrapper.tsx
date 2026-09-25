"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = pathname === "/login" || pathname === "/signup" || pathname === "/chatbot";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      {!isFullPage && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!isFullPage && <Footer />}
    </div>
  );
}
