"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Container } from "../layout/Container";
import { ArrowRight, Leaf, Sprout, ShieldCheck } from "lucide-react";
import Image from "next/image";


export function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-100 to-green-120 pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Background Texture overlay defined in globals.css */}
      <div className="absolute inset-0 bg-agriculture-pattern pointer-events-none" />

      {/* 🖼️ Rich Layered Hero Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Background Image */}
        <Image
          src="/hero_bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.50] blur-[0.5px] scale-105"
        />

        {/* Gradient Blend */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/80 via-green-50/60 to-green-100/80" />

        {/* Radial Focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.4),transparent_60%)]" />

        {/* Organic Blob */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-green-300/20 blur-3xl rounded-full" />

        {/* Light Sweep Animation */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.25)_50%,transparent_70%)] opacity-30 animate-[shine_8s_linear_infinite]" />

      </div>

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-20 left-10 text-primary/20"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Leaf size={64} />
      </motion.div>
      <motion.div
        className="absolute bottom-40 right-10 text-accent/20"
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
      >
        <Sprout size={80} />
      </motion.div>
      <motion.div
        className="absolute top-40 right-1/3 text-secondary/20 hidden lg:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 2 }}
      >
        <ShieldCheck size={48} />
      </motion.div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sprout size={16} />
              <span>Certified Crop Protection</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl md:text-4xl lg:text-5xl text-black tracking-tight leading-[1.1] mb-6"
              style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
            >
              Smart Crop Protection <br className="hidden md:block" />
              for Modern <span className="text-[#4CAF50]">Agriculture</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-foreground/70 max-w-xl mb-8 leading-relaxed">
              AgroSphere provides trusted pesticide and crop protection solutions used by farmers worldwide to ensure healthier, stronger yields.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Primary CTA — gradient fill, glow shadow, shimmer on hover */}
              <Button
                size="lg"
                className="relative overflow-hidden h-14 px-9 rounded-full text-base font-bold text-white group
    bg-gradient-to-r from-[#2E7D32] via-[#43A047] to-[#66BB6A]
    shadow-[0_6px_30px_rgba(76,175,80,0.5)]
    hover:shadow-[0_10px_40px_rgba(76,175,80,0.7)]
    hover:scale-[1.05]
    transition-all duration-300"
              >
                {/* Glow layer */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition duration-300" />

                {/* Better shine sweep */}
                <span className="absolute -left-20 top-0 h-full w-20 bg-white/30 blur-md rotate-12 
    group-hover:left-[120%] transition-all duration-700" />

                <span className="relative z-10 flex items-center">
                  Explore Products
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </Button>

              {/* Secondary CTA — glass border, soft fill reveal */}
              <Button
                size="lg"
                variant="outline"
                className="relative overflow-hidden h-14 px-9 rounded-full text-base font-semibold group
    border-[1.5px] border-[#4CAF50]/40
    text-[#1B5E20]
    bg-white/10 backdrop-blur-md

    transition-all duration-300 ease-out

    hover:bg-[#4CAF50]/10
    hover:border-[#4CAF50]
    hover:text-[#1B5E20]
    hover:scale-[1.05]
    hover:shadow-[0_8px_25px_rgba(76,175,80,0.25)]"
              >
                {/* subtle hover glow */}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 
    bg-gradient-to-r from-green-400/10 to-emerald-500/10 transition duration-300" />

                <span className="relative z-10 flex items-center">
                  View Categories
                  <ArrowRight className="ml-2 w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              {/* Fallback image placeholder in case user doesn't have image yet */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1B5E20] to-[#4CAF50] flex items-center justify-center">
                <Leaf className="w-32 h-32 text-white/50" />
              </div>
              Optional: <Image src="/hero_image.png" alt="Agriculture field" fill className="object-cover" priority />
            </div>

            {/* Floating Element over Image */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-primary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">100% Certified</p>
                <p className="text-xs text-foreground/60">Quality Assured</p>
              </div>
            </motion.div>

            {/* 🌿 Glassmorphism Stats Bubble — Top Right */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              className="absolute -top-14 -right-8 z-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
              >
                <div
                  className="rounded-2xl px-5 py-4 flex flex-col gap-3 min-w-[170px] relative overflow-hidden"
                  style={{
                    background: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1px solid rgba(76, 175, 80, 0.35)",
                    boxShadow: "0 8px 32px rgba(27, 94, 32, 0.18), 0 0 0 1px rgba(255,255,255,0.15) inset",
                  }}
                >
                  {/* Stat Row 1 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #4CAF50, #1B5E20)" }}
                    >
                      <span className="text-white text-xs font-extrabold">📈</span>
                    </div>
                    <div>
                      <p className="text-black font-extrabold text-sm leading-none">+32% Yield</p>
                      <p className="text-black/80 text-[10px] font-medium mt-0.5">Increase Proven</p>
                    </div>
                  </div>

                  {/* Green divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-[#4CAF50]/30 to-transparent" />

                  {/* Stat Row 2 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #C9A227, #a07a10)" }}
                    >
                      <span className="text-white text-xs font-extrabold">🌍</span>
                    </div>
                    <div>
                      <p className="text-black font-extrabold text-sm leading-none">15+ Regions</p>
                      <p className="text-black/80 text-[10px] font-medium mt-0.5">Trusted Globally</p>
                    </div>
                  </div>

                  {/* Ambient glow orb */}
                  <div
                    className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(76,175,80,0.25), transparent 70%)" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
