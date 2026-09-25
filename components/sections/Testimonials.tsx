"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "../layout/Container";
import { Badge } from "@/components/ui/badge";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { TrendingUp, Leaf, ChevronLeft, ChevronRight, Quote } from "lucide-react";

// Self-contained rich story data — no need to touch constants/index.ts
const STORY_TESTIMONIALS = [
  {
    id: 1,
    name: "Ahmed Khan",
    role: "Wheat Farmer",
    location: "Punjab, PK",
    avatar: "AK",
    problem: "Persistent aphid infestation was destroying nearly half my wheat crop every season. Conventional sprays weren't working.",
    solution: "Switched to AgriShield Pro based on AI diagnosis. Applied the recommended foliar spray dosage on schedule.",
    quote: "After using AgroSphere, our crop yield increased by 32% in a single season. I couldn't believe the difference.",
    result: { label: "Yield Increase", value: "+32%", icon: TrendingUp },
    product: "AgriShield Pro",
    tag: "Pest Control",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Orchard Owner",
    location: "California, US",
    avatar: "SJ",
    problem: "Fungal blight was spreading across my apple orchard and I was reluctant to use harsh chemicals on organic-certified land.",
    solution: "Applied BioGrow Organic Spray, EcoGreen-certified, which eliminated the blight without revoking organic status.",
    quote: "BioGrow Organic Spray has completely transformed how I manage pest control without harming the environment or my certification.",
    result: { label: "Crop Loss Reduced", value: "−85%", icon: Leaf },
    product: "BioGrow Organic Spray",
    tag: "Organic Farming",
    tagColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: 3,
    name: "Rajesh Kumar",
    role: "Rice Cultivator",
    location: "Haryana, IN",
    avatar: "RK",
    problem: "Unpredictable fungal outbreaks in paddy fields after monsoon were causing massive post-harvest losses.",
    solution: "Used CropGuard Max fungicide after consulting the AgroSphere AI chatbot for exact disease diagnosis.",
    quote: "Fast delivery and expert agriculture support. Their team guided me perfectly to exactly the right fungicide for my paddy.",
    result: { label: "Post-harvest Savings", value: "₹2.3L", icon: TrendingUp },
    product: "CropGuard Max",
    tag: "Fungal Disease",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

export function Testimonials() {
  const { ref, controls, variants } = useScrollReveal();
  const [activeIndex, setActiveIndex] = useState(0);

  const active = STORY_TESTIMONIALS[activeIndex];
  const ResultIcon = active.result.icon;

  const prev = () => setActiveIndex((i) => (i === 0 ? STORY_TESTIMONIALS.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === STORY_TESTIMONIALS.length - 1 ? 0 : i + 1));

  return (
    <section className="py-24 section-padding bg-gradient-to-b from-white to-green-50/40 overflow-hidden">
      <Container>

        {/* Header */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={variants}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white px-4 py-1.5 text-sm font-semibold tracking-wide uppercase shadow-md shadow-[#4CAF50]/30 border-none transition-transform hover:-translate-y-0.5">
            Real Stories
          </Badge>
          <h2
            className="text-3xl md:text-4xl text-black mb-4"
            style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
          >
            Farmers Who <span className="text-[#4CAF50]">Transformed Their Fields</span>
          </h2>
          <p className="text-lg text-foreground/70">
            Not just reviews — real case studies from real growers who used AgroSphere to solve specific crop problems.
          </p>
        </motion.div>

        {/* Story Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white border border-zinc-100 rounded-[32px] shadow-2xl shadow-green-900/5 overflow-hidden">

              {/* Top Tag Bar */}
              <div className="bg-[#1B5E20] px-8 py-4 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${active.tagColor}`}>
                  {active.tag}
                </span>
                <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Case Study</span>
              </div>

              {/* Main Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                {/* Left: Big Quote + Journey */}
                <div className="lg:col-span-7 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-zinc-100">
                  {/* Big Quote */}
                  <div className="relative mb-10">
                    <Quote className="absolute -top-2 -left-2 text-[#4CAF50]/15 w-16 h-16" />
                    <p className="text-xl md:text-2xl font-bold text-zinc-800 leading-tight pl-8 italic">
                      "{active.quote}"
                    </p>
                  </div>

                  {/* Problem → Solution Journey */}
                  <div className="space-y-5">
                    <div className="flex gap-4 items-start group">
                      <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                        <span className="text-red-500 text-xs font-extrabold">!</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">The Problem</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{active.problem}</p>
                      </div>
                    </div>

                    <div className="ml-3.5 w-px h-5 bg-gradient-to-b from-red-200 to-[#4CAF50]/30" />

                    <div className="flex gap-4 items-start group">
                      <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                        <span className="text-[#4CAF50] text-xs font-extrabold">✓</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#4CAF50] mb-1">The Solution</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{active.solution}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Result + Author */}
                <div className="lg:col-span-5 p-8 md:p-10 flex flex-col justify-between bg-zinc-50/50">

                  {/* Result Callout */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
                      <ResultIcon size={14} className="text-[#4CAF50]" />
                      Result
                    </p>
                    <p className="text-5xl font-extrabold text-[#1B5E20] leading-none mb-1">
                      {active.result.value}
                    </p>
                    <p className="text-sm font-semibold text-zinc-500">{active.result.label}</p>
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <p className="text-xs text-zinc-400">Product Used</p>
                      <p className="text-sm font-bold text-[#4CAF50]">{active.product}</p>
                    </div>
                  </div>

                  {/* Author Info (subtle) */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#1B5E20] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                      {active.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{active.name}</p>
                      <p className="text-xs text-zinc-400">{active.role} · {active.location}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Navigation Footer */}
              <div className="px-8 py-5 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex gap-2">
                  {STORY_TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? "w-8 h-2.5 bg-[#4CAF50]"
                          : "w-2.5 h-2.5 bg-zinc-200 hover:bg-zinc-400"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prev}
                    className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-[#1B5E20] hover:text-white hover:border-[#1B5E20] transition-all duration-300"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={next}
                    className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-[#1B5E20] hover:text-white hover:border-[#1B5E20] transition-all duration-300"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </Container>
    </section>
  );
}
