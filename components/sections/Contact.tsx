"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function Contact() {
  const { ref, controls, variants } = useScrollReveal();

  return (
    <section id="contact" className="section-padding bg-zinc-50 relative">
      <Container>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={variants}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Get In Touch</span>
          <h2 
            className="text-3xl md:text-4xl text-black mb-4"
            style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
          >
            Expert Agriculture <span className="text-[#4CAF50]">Support</span>
          </h2>
          <p className="text-lg text-foreground/70">
            Have questions about our crop solutions? Our agronomists form the core of our support team and are ready to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <motion.div
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
            } as any}
            className="space-y-8"
          >
            {[
              { icon: <MapPin className="text-primary" />, title: "Headquarters", desc: "123 Agro Tech Valley, CA 90210" },
              { icon: <Phone className="text-primary" />, title: "Phone", desc: "+1 (800) 123-FARM" },
              { icon: <Mail className="text-primary" />, title: "Email", desc: "support@agrosphere.com" },
              { icon: <Clock className="text-primary" />, title: "Support Hours", desc: "Mon-Fri: 8AM - 6PM, Sat: 9AM - 2PM" },
            ].map((info, i) => (
              <div key={i} className="flex flex-row items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  {info.icon}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground mb-1">{info.title}</h4>
                  <p className="text-foreground/70 text-base">{info.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0, x: 50 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
            } as any}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">Send us a message</h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">First Name</label>
                  <Input placeholder="John" className="h-12 bg-zinc-50 border-border/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Last Name</label>
                  <Input placeholder="Doe" className="h-12 bg-zinc-50 border-border/50 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email</label>
                <Input type="email" placeholder="john@example.com" className="h-12 bg-zinc-50 border-border/50 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">How can we help?</label>
                <Textarea placeholder="Describe your crop or pest problem..." rows={5} className="bg-zinc-50 border-border/50 rounded-xl resize-none" />
              </div>
              <Button type="submit" className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl">
                Submit Request
              </Button>
            </form>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
