"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ShieldCheck, Truck, Headphones, Users } from "lucide-react";

const FEATURES = [
  {
    icon: <ShieldCheck size={40} className="text-[#4CAF50]" />,
    title: "Certified Crop Protection",
    desc: "100% genuine, lab-tested agriculture chemicals ensuring no harm to your long-term soil health."
  },
  {
    icon: <Truck size={40} className="text-[#C9A227]" />,
    title: "Fast Nationwide Delivery",
    desc: "Guaranteed fast delivery within 48 hours to remote farming districts and global locations."
  },
  {
    icon: <Headphones size={40} className="text-[#1B5E20]" />,
    title: "Expert Agriculture Support",
    desc: "24/7 on-call agronomists available to help you choose the right pesticide mixture."
  },
  {
    icon: <Users size={40} className="text-blue-500" />,
    title: "Trusted by Farmers",
    desc: "Join thousands of successful farmers relying on AgroSphere's superior crop protection standards."
  }
];

export function WhyChoose() {
  const { ref, controls, variants } = useScrollReveal();

  return (
    <section className="section-padding bg-zinc-50 border-t border-border min-h-screen flex items-center">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={variants}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Our Guarantee</span>
          <h2
            className="text-3xl md:text-4xl text-black mb-4"
            style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
          >
            Why Choose <span className="text-[#4CAF50]">AgroSphere</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
          } as any}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              variants={variants}
              className="relative overflow-hidden group/card flex flex-col items-center text-center p-6 bg-white rounded-3xl shadow-sm border border-border/40 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer"
            >
              {/* Animated Top Border */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#4CAF50] origin-left scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 ease-out" />

              <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 shadow-inner transition-all duration-500 group-hover/card:scale-110 group-hover/card:bg-primary/10 group-hover/card:rotate-3">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 transition-colors duration-500 group-hover/card:text-primary">{feat.title}</h3>
              <p className="text-foreground/70 leading-relaxed text-sm">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
