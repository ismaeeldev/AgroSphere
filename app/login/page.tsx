"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Leaf } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      login(data.token, data.user);
      toast("Welcome back! Login successful", "success");
      router.push("/");
    } catch (error: any) {
      toast(error.message || "An error occurred during login", "error");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  } as const;
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  } as const;

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Visual Panel ── */}
      <div className="hidden lg:block lg:w-[45%] xl:w-1/2 h-screen sticky top-0">
        <AuthVisual
          heading="Welcome Back, Farmer 🌱"
          subheading="Protect your crops with intelligence. Log in to access smart agronomy tools and personalised crop insights."
        />
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div className="flex-1 h-screen overflow-y-auto flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 px-6 py-12">

        {/* Soft background orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full max-w-md z-10"
        >
          {/* Mobile logo (visible only when visual is hidden) */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8 lg:hidden">
            <Leaf className="w-7 h-7 text-[#4CAF50]" />
            <span className="text-2xl font-extrabold text-[#1B5E20]" style={{ fontFamily: '"Segoe UI", sans-serif' }}>
              Agri<span className="text-[#4CAF50]">Vision</span>
            </span>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-green-900/10 p-8 md:p-10"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1
                className="text-2xl md:text-3xl text-[#1B5E20] mb-2"
                style={{ fontFamily: '"Segoe UI", sans-serif', fontWeight: 800 }}
              >
                Sign In
              </h1>
              <p className="text-sm text-zinc-500">
                Don't have an account?{" "}
                <Link href="/signup" className="text-[#4CAF50] font-semibold hover:underline">
                  Create one free
                </Link>
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-zinc-600">Email Address</Label>
                <div
                  className={`relative rounded-xl transition-all duration-300 ${
                    focused === "email" ? "ring-2 ring-[#4CAF50]/40" : ""
                  }`}
                >
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused === "email" ? "text-[#4CAF50]" : "text-zinc-400"}`} />
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className="pl-10 h-12 rounded-xl border-zinc-200 bg-white/80 focus-visible:ring-0 focus-visible:border-[#4CAF50] transition-all duration-300 text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-zinc-600">Password</Label>
                  <Link href="#" className="text-xs text-[#4CAF50] font-medium hover:underline">Forgot password?</Link>
                </div>
                <div
                  className={`relative rounded-xl transition-all duration-300 ${
                    focused === "password" ? "ring-2 ring-[#4CAF50]/40" : ""
                  }`}
                >
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused === "password" ? "text-[#4CAF50]" : "text-zinc-400"}`} />
                  <Input
                    name="password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className="pl-10 pr-10 h-12 rounded-xl border-zinc-200 bg-white/80 focus-visible:ring-0 focus-visible:border-[#4CAF50] transition-all duration-300 text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#4CAF50] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-white text-base relative overflow-hidden group
                    bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]
                    shadow-[0_4px_20px_rgba(76,175,80,0.4)]
                    hover:shadow-[0_6px_28px_rgba(76,175,80,0.6)]
                    hover:scale-[1.02] transition-all duration-300 disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-xs text-zinc-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </motion.div>

            {/* OAuth placeholder */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              {["Google", "GitHub"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="h-11 rounded-xl border border-zinc-200 bg-white/80 hover:bg-white hover:border-[#4CAF50]/40 transition-all duration-200 text-sm font-semibold text-zinc-700 hover:scale-[1.02]"
                >
                  {provider}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
