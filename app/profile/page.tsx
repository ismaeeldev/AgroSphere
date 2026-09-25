"use client";

import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/layout/Container";
import { motion } from "framer-motion";
import { User, Mail, Calendar, ShieldCheck, MapPin, Edit3, ArrowLeft, Settings, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#4CAF50]/10 border-t-[#4CAF50] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F7F0] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-3xl shadow-xl border border-green-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900">Access Denied</h1>
          <p className="text-zinc-500">Please log in to your AgroSphere account to view your farmer profile.</p>
          <Link href="/login" className="block pt-2">
            <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-full px-8 py-6 w-full font-bold shadow-lg shadow-green-500/20">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] pt-28 pb-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-100/50 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#4CAF50] transition-colors font-medium group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full border-green-100 hover:bg-green-50 text-green-700">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-green-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Award className="w-32 h-32 text-[#4CAF50]" />
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2.5rem] bg-[#4CAF50] p-1.5 flex items-center justify-center shadow-2xl shadow-green-200">
                      <div className="w-full h-full rounded-[2.2rem] bg-white flex items-center justify-center text-5xl md:text-6xl font-black text-[#1B5E20]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white border-4 border-[#F8FAF8] flex items-center justify-center shadow-xl">
                      <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 text-center md:text-left space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-[#4CAF50] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        Elite Agro-Partner
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight leading-[0.95] mb-4">
                        {user.name}
                      </h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-zinc-500 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-[#4CAF50]" />
                          </div>
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-zinc-100 pl-5">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#4CAF50]" />
                          </div>
                          <span>Farmer since {new Date(user.createdAt).getFullYear()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <Button className="bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-full px-8 h-14 font-bold shadow-xl shadow-green-500/20 text-lg transition-transform hover:scale-105 active:scale-95">
                        <Edit3 className="w-5 h-5 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="ghost" className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full px-8 h-14 font-bold border border-zinc-100">
                        Public View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details Section */}
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-green-50">
                <h3 className="text-xl font-extrabold text-zinc-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#4CAF50]">
                    <User className="w-5 h-5" />
                  </span>
                  Farmer Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { label: "Account Status", value: "Verified Professional", icon: ShieldCheck },
                    { label: "Primary Location", value: "Sargodha, Pakistan", icon: MapPin },
                    { label: "Member ID", value: user.id.slice(0, 8).toUpperCase(), icon: Award },
                    { label: "Email Frequency", value: "Weekly Summary", icon: Mail },
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 bg-[#FBFDFB] rounded-2xl border border-green-50/50 hover:border-green-200 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="w-4 h-4 text-[#4CAF50]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{item.label}</span>
                      </div>
                      <div className="font-bold text-zinc-800">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Stats */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-[#1B5E20] to-[#113B13] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <h3 className="text-lg font-bold mb-6 opacity-80 uppercase tracking-widest text-sm">Agriculture Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2 opacity-60">
                      <span>Farm Trust Score</span>
                      <span>98%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "98%" }}
                        className="h-full bg-[#4CAF50]"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-3xl font-black mb-1">Elite</div>
                    <div className="text-xs opacity-50 uppercase tracking-widest font-bold">Account Tier</div>
                  </div>
                  <div className="pt-4">
                    <Button className="w-full bg-white text-[#1B5E20] hover:bg-green-50 rounded-xl font-bold py-6">
                      View Farming Analytics
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100">
                <h3 className="font-black text-zinc-900 mb-4 uppercase tracking-widest text-xs">Security Check</h3>
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-900">2FA is Off</div>
                    <div className="text-[10px] text-red-700">Enable for extra safety</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
