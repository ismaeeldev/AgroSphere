"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { CASE_STUDIES } from "@/data/case-studies";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Target, Zap, Sprout, Bug, Wind, Droplets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Before/After Slider Component for Hero
function HeroSlider({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative w-full aspect-[16/10] md:aspect-square lg:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl group border border-white/20">
      <Image src={after} alt="After" fill className="object-cover" />
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <Image src={before} alt="Before" fill className="object-cover" />
      </div>
      
      {/* Draggable handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 group-hover:bg-green-400 transition-colors"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-green-500/30">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-green-600 rounded-full" />
            <div className="w-1 h-3 bg-green-600 rounded-full" />
          </div>
        </div>
      </div>

      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderPos} 
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
      />

      {/* Labels */}
      <div className="absolute bottom-6 left-6 z-10 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
        BEFORE
      </div>
      <div className="absolute bottom-6 right-6 z-10 px-4 py-2 bg-green-500/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
        AFTER
      </div>
    </div>
  );
}

export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  
  const filters = [
    { label: "All", icon: <Sprout size={16} /> },
    { label: "🐛 Pest Attack", icon: <Bug size={16} /> },
    { label: "🍂 Leaf Disease", icon: <Wind size={16} /> },
    { label: "🌾 Low Yield", icon: <Target size={16} /> },
    { label: "💧 Soil Issues", icon: <Droplets size={16} /> },
  ];

  const filteredCases = activeFilter === "All" 
    ? CASE_STUDIES 
    : CASE_STUDIES.filter(c => c.tags.some(tag => tag.includes(activeFilter.split(" ").pop()!)));

  return (
    <div className="min-h-screen pt-28 pb-20 bg-zinc-50/50 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-300/10 blur-[120px] rounded-full -z-10" />

      <Container>
        {/* HERO SECTION */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge className="mb-6 bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase">
              Proof, Not Promises 🌱
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold text-black leading-[1.1] mb-6 tracking-tight">
              Real Results from <span className="text-[#4CAF50]">Real Farms</span>
            </h1>
            <p className="text-xl text-zinc-600 mb-8 max-w-xl leading-relaxed">
              See how farmers transformed crop health using AgroSphere solutions. Our data-driven results prove that precision agriculture changes lives.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-black">95%</div>
                  <div className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Success Rate</div>
                </div>
              </div>
              <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                  <Sprout size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-black">+25%</div>
                  <div className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Yield Growth</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <HeroSlider 
              before={CASE_STUDIES[0].beforeImage} 
              after={CASE_STUDIES[0].afterImage} 
            />
          </motion.div>
        </div>

        {/* PROBLEM-BASED FILTER */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {filters.map((filter) => (
              <motion.button
                key={filter.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(filter.label)}
                className={`px-6 py-3 rounded-full flex items-center gap-2 text-sm font-bold transition-all duration-300 border ${
                  activeFilter === filter.label
                    ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/30 scale-105"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                {filter.icon}
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CASE CARDS GRID */}
        <motion.div 
          layout
          className="grid md:grid-cols-2 lg:grid-cols-2 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredCases.map((study, idx) => (
              <motion.div
                key={study.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Link href={`/case-studies/${study.id}`}>
                  <Card className="group relative rounded-[40px] border-white/40 bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_70px_rgba(76,175,80,0.15)] transition-all duration-700 cursor-pointer border h-full p-4 flex flex-col md:flex-row gap-4">
                    
                    {/* Visual Side (Padded & Rounded) */}
                    <div className="md:w-[45%] relative rounded-[32px] overflow-hidden aspect-[4/3] md:aspect-auto shadow-inner group-hover:shadow-2xl transition-all duration-700">
                      <Image 
                        src={study.afterImage} 
                        alt={study.problem} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      
                      {/* Premium Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* Floating Badge */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <Badge className="bg-white/95 backdrop-blur-md text-[#1B5E20] border-none shadow-xl px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter w-fit">
                          ⚡ Fast Recovery
                        </Badge>
                      </div>

                      {/* Before Preview Hover (Glassy Reveal) */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                         <Image 
                          src={study.beforeImage} 
                          alt="Before" 
                          fill 
                          className="object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                           <div className="px-6 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/30 text-white text-[10px] font-black tracking-[0.2em] uppercase">
                             PRE-TREATMENT
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="p-6 md:w-[55%] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <MapPin size={14} />
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{study.location} • {study.crop} SUCCESS</span>
                        </div>
                        
                        <h3 className="text-2xl font-extrabold text-black mb-6 group-hover:text-[#4CAF50] transition-colors leading-tight">
                          {study.problem}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 rounded-3xl bg-zinc-50 border border-zinc-100/50 group-hover:bg-white group-hover:border-green-100 transition-all">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Solution</div>
                            <div className="text-xs font-bold text-green-800 truncate">
                              {study.solution}
                            </div>
                          </div>
                          <div className="p-4 rounded-3xl bg-zinc-50 border border-zinc-100/50 group-hover:bg-white group-hover:border-green-100 transition-all">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Impact</div>
                            <div className="text-xs font-bold text-green-800">
                              {study.yieldIncrease} Yield ↑
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-zinc-100/50">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={study.farmer.avatar} alt={study.farmer.name} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-black">{study.farmer.name}</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Farmer</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-[#4CAF50] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-green-500/30">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* CTA BOTTOM */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-12 rounded-[40px] bg-[#1B5E20] relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Want these results for <span className="text-[#4CAF50]">Your Farm?</span></h2>
            <p className="text-green-100/70 mb-10 max-w-2xl mx-auto">Our experts are ready to diagnose your crop issues and provide a tailor-made recovery plan today.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-bold px-8 py-6 h-auto text-lg shadow-xl shadow-green-900/40 border-none">
                Get Free Consultation
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-bold px-8 py-6 h-auto text-lg backdrop-blur-md bg-white/5">
                Browse Products
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
