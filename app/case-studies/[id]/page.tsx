"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { CASE_STUDIES } from "@/data/case-studies";
import { PRODUCTS } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Target, 
  Zap, 
  ShoppingCart, 
  Star,
  ChevronRight,
  Quote
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export default function CaseStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const study = CASE_STUDIES.find(s => s.id === id);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [sliderPos, setSliderPos] = useState(50);
  const [added, setAdded] = useState(false);

  if (!study) notFound();

  const handleAddToCart = () => {
    if (study.productId) {
      addToCart(study.productId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const productUsed = PRODUCTS.find(p => p.id === study.productId);
  const similarCases = CASE_STUDIES.filter(s => s.id !== id && s.tags.some(t => study.tags.includes(t))).slice(0, 3);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white selection:bg-green-200">
      <Container>
        {/* Navigation */}
        <Link 
          href="/case-studies" 
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-green-600 transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Farm Results
        </Link>

        {/* 1. SNAPSHOT (TOP) */}
        <div className="grid lg:grid-cols-2 gap-16 mb-24">
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {study.tags.map(tag => (
                <Badge key={tag} className="bg-green-100 text-green-700 border-none px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-black leading-[1.1] mb-8 tracking-tight">
              {study.problem}
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Crop</div>
                <div className="text-lg font-bold text-black">{study.crop}</div>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Location</div>
                <div className="text-lg font-bold text-black">{study.location}</div>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Duration</div>
                <div className="text-lg font-bold text-black">{study.duration}</div>
              </div>
              <div className="p-6 rounded-3xl bg-green-600 text-white shadow-xl shadow-green-600/20 col-span-2 md:col-span-1">
                <div className="text-[10px] font-black text-green-200 uppercase tracking-widest mb-2">Result</div>
                <div className="text-lg font-bold">{study.yieldIncrease} Yield ↑</div>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="mt-12 p-8 rounded-3xl border-2 border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black text-black uppercase tracking-wider">Confidence Meter</span>
                <span className="text-sm font-black text-green-600 uppercase tracking-wider">Success Rate: {study.successRate}%</span>
              </div>
              <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${study.successRate}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl border border-zinc-100">
             <Image src={study.afterImage} alt="Main Result" fill className="object-cover" />
             <div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl">
               <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Impact</div>
               <div className="text-xl font-black text-black">90% Pests Removed</div>
             </div>
          </div>
        </div>

        {/* 2. VISUAL TIMELINE */}
        <div className="mb-32">
          <h2 className="text-3xl font-black text-black mb-16 text-center">Recovery <span className="text-green-600">Timeline</span></h2>
          <div className="relative max-w-4xl mx-auto px-6">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-100 -translate-x-1/2 hidden md:block" />
            
            <div className="space-y-12">
              {study.timeline.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.2 }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse text-right"}`}
                >
                  <div className="flex-1 md:w-1/2 hidden md:block" />
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white border-4 border-green-600 flex items-center justify-center font-black text-green-600 shadow-lg shrink-0">
                    {idx + 1}
                  </div>
                  <div className={`flex-1 md:w-1/2 p-8 rounded-3xl border border-zinc-100 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 ${idx % 2 === 0 ? "text-left" : "text-left md:text-right"}`}>
                    <div className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Day {item.day}</div>
                    <h4 className="text-xl font-bold text-black mb-2">{item.title}</h4>
                    <p className="text-zinc-500 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. BEFORE / AFTER (IMMERSIVE) */}
        <div className="mb-32">
          <h2 className="text-3xl font-black text-black mb-12 text-center">Interactive <span className="text-green-600">Visual Proof</span></h2>
          <div className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl border border-zinc-100 group">
             <Image src={study.afterImage} alt="After" fill className="object-cover" />
             <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <Image src={study.beforeImage} alt="Before" fill className="object-cover" />
            </div>
            
            {/* Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1.5 bg-white cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-[6px] border-green-600/20">
                <div className="flex gap-1.5">
                  <div className="w-1 h-4 bg-green-600 rounded-full" />
                  <div className="w-1 h-4 bg-green-600 rounded-full" />
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

            {/* Floating Labels */}
            <div className="absolute bottom-10 left-10 z-10">
              <div className="px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/20 text-white font-black text-sm uppercase tracking-widest shadow-2xl">
                The Problem
              </div>
            </div>
            <div className="absolute bottom-10 right-10 z-10">
              <div className="px-6 py-3 bg-green-600/60 backdrop-blur-xl rounded-full border border-white/20 text-white font-black text-sm uppercase tracking-widest shadow-2xl">
                The Solution
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* 4. FARMER VOICE */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-black text-black mb-12">Farmer's <span className="text-green-600">Experience</span></h2>
            <div className="relative p-12 rounded-[40px] bg-zinc-50 border border-zinc-100 overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/5 blur-[80px] rounded-full group-hover:bg-green-400/10 transition-colors" />
              
              <div className="relative z-10">
                <Quote size={64} className="text-green-600/20 mb-8" />
                <blockquote className="text-2xl md:text-3xl font-bold text-zinc-800 leading-tight mb-12 italic">
                  "This solution saved my entire crop. I was losing hope after the pest attack, but AgroSphere turned it around in just a week. The yield I got was better than last year!"
                </blockquote>
                
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                    <Image src={study.farmer.avatar} alt={study.farmer.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-black">{study.farmer.name}</div>
                    <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{study.location} • {study.crop} Farmer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. PRODUCT USED (CRITICAL) */}
          <div>
            <h2 className="text-3xl font-black text-black mb-12">Apply <span className="text-green-600">Plan</span></h2>
            {productUsed && (
              <div className="relative group">
                <div className="rounded-[32px] overflow-hidden border border-zinc-100 bg-white shadow-2xl hover:shadow-green-900/10 transition-all duration-500 flex flex-col">
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl" />

                  {/* Product Image */}
                  <div className="relative h-64 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {/* Floating Badge */}
                    <div className="absolute top-6 left-6 bg-green-600 text-white text-[10px] px-3 py-1 rounded-full shadow z-20 font-black uppercase tracking-widest">
                      {productUsed.category}
                    </div>

                    <Image
                      src={productUsed.image}
                      alt={productUsed.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Floating Glass Panel */}
                  <div className="relative -mt-16 mx-4 mb-4 z-10 flex-grow flex flex-col">
                    <div className="backdrop-blur-xl bg-white/70 border border-white/40 shadow-xl rounded-2xl p-6 transition-all duration-300 group-hover:shadow-2xl flex-grow flex flex-col">
                      {/* Top Row */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-black-900">
                          {productUsed.name}
                        </h3>

                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={16} fill="currentColor" />
                          <span className="text-xs font-semibold text-black-800">
                            {productUsed.rating}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-black-800/70 mb-6 line-clamp-2 leading-relaxed">
                        {productUsed.description}
                      </p>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-2xl font-black text-black-700">
                          ${productUsed.price}
                        </span>

                        <Button 
                          onClick={handleAddToCart}
                          className={`rounded-full px-6 py-5 h-auto font-black shadow-xl transition-all duration-300 ${
                            added 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                          }`}
                        >
                          {added ? "Added!" : (
                            <span className="flex items-center gap-2">
                              Use This Solution <ShoppingCart size={18} />
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Border */}
                  <div className="absolute inset-0 rounded-[32px] ring-1 ring-transparent group-hover:ring-green-400/40 transition-all duration-300 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. SIMILAR CASES */}
        <div className="mt-32 border-t border-zinc-100 pt-32">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black text-black">Similar <span className="text-green-600">Transformations</span></h2>
            <Link href="/case-studies" className="text-sm font-black text-green-600 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {similarCases.map((s) => (
              <Link key={s.id} href={`/case-studies/${s.id}`}>
                <div className="group rounded-[40px] overflow-hidden bg-white border border-zinc-100 hover:border-green-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full p-3">
                  <div className="relative h-48 rounded-[32px] overflow-hidden">
                    <Image src={s.afterImage} alt={s.problem} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{s.crop} • {s.location}</div>
                    <h3 className="text-lg font-bold text-black mb-4 group-hover:text-green-600 transition-colors leading-tight line-clamp-2">{s.problem}</h3>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-50">
                       <span className="text-xs font-black text-green-700 uppercase tracking-tighter">{s.yieldIncrease} Increase</span>
                       <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-green-600 group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                       </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── NEXT STEPS GUIDANCE ── */}
        <div className="mt-32 max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[48px] bg-zinc-900 text-white text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full" />
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Ready to achieve similar <span className="text-green-400">success?</span></h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto font-medium">Connect with our experts or use our precision tools to start your recovery journey today.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/nearby-help">
                <Button size="lg" className="h-14 px-8 rounded-full bg-green-600 hover:bg-green-500 text-white font-black">
                  Find Nearest Expert
                </Button>
              </Link>
              <Link href="/precision-dose">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-zinc-700 text-white hover:bg-white hover:text-black transition-colors font-black">
                  Calculate My Dose
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
