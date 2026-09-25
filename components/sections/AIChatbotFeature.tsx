"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Bot, Sparkles, MessageSquareText, ArrowRight } from "lucide-react";

export function AIChatbotFeature() {
  const { ref, controls, variants } = useScrollReveal();

  return (
    <section className="bg-[#1B5E20] relative overflow-hidden py-16 border-t border-white/10">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-400/20 via-transparent to-transparent opacity-60" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 lg:p-12 shadow-2xl overflow-hidden relative">

          {/* Subtle grid pattern inside card */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Content */}
            <motion.div
              ref={ref}
              initial="hidden"
              animate={controls}
              variants={variants}
              className="text-left space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-white text-sm font-semibold border border-green-400/30">
                <Sparkles size={16} />
                <span>New Feature</span>
              </div>

              <h2
                className="text-3xl md:text-5xl text-white tracking-tight leading-[1.1]"
                style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
              >
                Meet Your Personal <br className="hidden md:block" />
                <span className="text-[#4CAF50]">Agronomy AI Assistant</span>
              </h2>

              <p className="text-lg text-white/70 max-w-lg leading-relaxed">
                Not sure which medicine your crop needs? Simply describe the symptoms, disease, or upload a photo. Our intelligent AI Chatbot will guide you to the exact chemical formulation and dosage suited for your specific crop.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white shadow-lg shadow-green-900/50 h-14 px-8 rounded-full text-base group transition-all duration-300">
                  <MessageSquareText className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Chat With AI Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* Right Content - Visual Representation */}
            <motion.div
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, scale: 0.9, rotateY: 15 },
                visible: { opacity: 1, scale: 1, rotateY: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.3 } }
              } as any}
              className="relative perspective-1000"
            >
              {/* Chat Interface Mockup */}
              <div className="relative w-full max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 transform transition-transform duration-500 hover:scale-105">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#1B5E20] flex items-center justify-center shadow-inner">
                    <Bot className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">AgroSphere AI</h3>
                    <p className="text-green-300 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      Online - Ready to help
                    </p>
                  </div>
                </div>

                {/* Chat Bubbles */}
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 w-[85%] border border-white/5">
                    <p className="text-white/90 text-sm">Hello! I'm your virtual agronomist. What crop issue are you facing today?</p>
                  </div>

                  <div className="bg-[#4CAF50]/20 rounded-2xl rounded-tr-sm p-4 w-[80%] ml-auto border border-[#4CAF50]/30">
                    <p className="text-white text-sm">My tomato leaves are turning yellow with dark spots.</p>
                  </div>

                  <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 w-[90%] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <p className="text-white/90 text-sm mb-2">Based on your description, this looks like <strong className="text-green-300">Early Blight (Alternaria solani)</strong>.</p>
                    <p className="text-white/70 text-xs">I recommend using <strong>CropGuard Max</strong> fungicide. Would you like the dosage chart?</p>
                  </div>
                </div>

                {/* Input Area Mockup */}
                <div className="mt-8 relative">
                  <div className="w-full h-12 bg-black/20 rounded-full border border-white/10 flex items-center px-4">
                    <span className="text-white/30 text-sm">Type your crop problem here...</span>
                    <div className="w-8 h-8 rounded-full bg-[#4CAF50] ml-auto flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-[#1B5E20]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Instant Fix</p>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
