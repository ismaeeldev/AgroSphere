"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search, ShoppingCart, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/constants";
import { Container } from "./Container";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-[#113B13]/95 backdrop-blur-lg border-b border-white/10 shadow-sm py-3"
      )}
    >
      <Container className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Leaf className="h-8 w-8 text-[#4CAF50] transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold tracking-tight text-white">
            Agro<span className="text-[#4CAF50]">Sphere</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-white/80 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#4CAF50] after:transition-transform hover:after:origin-bottom-left hover:after:scale-x-100"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/cart" className="relative group transition-colors hover:text-[#4CAF50] text-white/80">
            <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  key={totalItems} // Forces re-animation on change
                  className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#4CAF50] text-[10px] font-bold text-white shadow-lg shadow-[#4CAF50]/30"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Link href="/chatbot">
            <Button
              className="relative overflow-hidden text-white font-bold
                bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm
                shadow-lg hover:shadow-xl hover:scale-[1.04] transition-all duration-300 gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#4CAF50]" />
              Consult AI
            </Button>
          </Link>
          <div className="h-6 w-px mx-4 bg-white/20" />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger 
                className="group/trigger text-white hover:bg-white/10 flex items-center gap-2 px-2.5 h-10 rounded-xl transition-all duration-300 cursor-pointer outline-none border border-transparent hover:border-white/10 bg-transparent active:scale-95"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white font-bold border-2 border-white/20 shrink-0 group-hover/trigger:scale-110 transition-transform duration-300 z-10 relative">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute inset-0 bg-[#4CAF50]/40 rounded-full blur-md opacity-0 group-hover/trigger:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="max-w-[100px] truncate hidden lg:inline font-bold text-sm">{user.name}</span>
                  <span className="text-[10px] text-white/50 hidden lg:inline">Active Farmer</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 group-hover/trigger:translate-y-0.5 group-hover/trigger:opacity-100 transition-all" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-white/95 backdrop-blur-xl border-green-100 text-zinc-800 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700/50 px-3 py-3">
                    Farmer Dashboard
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-green-50 mx-2" />
                  
                  <Link href="/profile">
                    <DropdownMenuItem className="relative focus:bg-green-50 hover:bg-green-50 cursor-pointer rounded-xl px-3 py-3 transition-all duration-300 gap-3 group outline-none overflow-hidden">
                      {/* Left accent indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4CAF50] scale-y-0 group-hover:scale-y-100 group-focus:scale-y-100 transition-transform duration-300 origin-center" />
                      
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-[#4CAF50] transition-all duration-300">
                        <UserIcon className="h-5 w-5 text-[#4CAF50] group-hover:text-white transition-colors" />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-zinc-800 tracking-tight">My Profile</span>
                        <span className="text-[11px] text-zinc-500 font-medium">Manage your crop profile</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuItem 
                    className="focus:bg-red-50 hover:bg-red-50 cursor-pointer rounded-xl px-3 py-3 gap-3 mt-1 group/logout transition-all duration-300 outline-none"
                    onClick={() => {
                      logout();
                      toast.success("Successfully logged out!");
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover/logout:bg-red-500 transition-all duration-300">
                      <LogOut className="h-5 w-5 text-red-500 group-hover/logout:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm text-red-600 tracking-tight">Log out</span>
                      <span className="text-[11px] text-red-400 font-medium">End your session</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 font-semibold transition-all duration-200">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button
                  className="relative overflow-hidden text-white font-bold
                    bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]
                    shadow-[0_3px_16px_rgba(76,175,80,0.4)]
                    hover:shadow-[0_5px_22px_rgba(76,175,80,0.6)]
                    hover:scale-[1.04] transition-all duration-300"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden transition-colors hover:text-[#4CAF50] text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b overflow-hidden shadow-lg"
          >
            <Container className="py-4 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-base font-medium text-foreground py-2 border-b border-border/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/cart"
                className="flex items-center justify-between text-base font-medium text-foreground py-2 border-b border-border/50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Protection Plan (Cart)</span>
                {totalItems > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white shadow-lg shadow-[#4CAF50]/30">
                    {totalItems}
                  </span>
                )}
              </Link>
                <div className="flex flex-col gap-2 py-2">
                  <Link href="/chatbot" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white font-bold gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50]" />
                      Consult AI Assistant
                    </Button>
                  </Link>
                  {user ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="w-10 h-10 rounded-full bg-[#4CAF50] flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-800">{user.name}</span>
                          <span className="text-xs text-zinc-500">{user.email}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full border-red-200 text-red-600 hover:bg-red-50" 
                        onClick={() => {
                          logout();
                          toast.success("Successfully logged out!");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-2">
                      <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full">Log in</Button>
                      </Link>
                      <Link href="/signup" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
