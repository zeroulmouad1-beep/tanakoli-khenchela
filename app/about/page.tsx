"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Info, ChevronRight, Bus, MapPin, Users, Shield } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

// TK Logo Component - same as splash screen
function TKLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tkGradientAbout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="70%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="tkGradientLightAbout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="roadGradientAbout" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glowAbout" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadowAbout" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      <circle cx="100" cy="100" r="90" fill="white" fillOpacity="0.1" />
      <circle cx="100" cy="100" r="88" stroke="url(#tkGradientLightAbout)" strokeWidth="2" strokeOpacity="0.5" fill="none" />
      
      <g filter="url(#shadowAbout)">
        <rect x="35" y="45" width="130" height="22" rx="11" fill="url(#tkGradientAbout)" />
        <line x1="50" y1="56" x2="65" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="80" y1="56" x2="95" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="110" y1="56" x2="125" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="140" y1="56" x2="150" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        
        <path d="M88 67 L112 67 L118 145 L82 145 Z" fill="url(#roadGradientAbout)" />
        <line x1="100" y1="75" x2="100" y2="90" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="100" y1="100" x2="100" y2="115" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="100" y1="125" x2="100" y2="138" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </g>
      
      <g filter="url(#glowAbout)" transform="translate(72, 95)">
        <rect x="0" y="5" width="56" height="28" rx="6" fill="white" />
        <rect x="4" y="0" width="48" height="8" rx="4" fill="white" />
        <rect x="6" y="10" width="10" height="10" rx="2" fill="url(#tkGradientAbout)" opacity="0.8" />
        <rect x="19" y="10" width="10" height="10" rx="2" fill="url(#tkGradientAbout)" opacity="0.8" />
        <rect x="32" y="10" width="10" height="10" rx="2" fill="url(#tkGradientAbout)" opacity="0.8" />
        <rect x="44" y="10" width="8" height="10" rx="2" fill="url(#tkGradientAbout)" opacity="0.6" />
        <circle cx="14" cy="35" r="6" fill="#1E293B" />
        <circle cx="14" cy="35" r="3" fill="#64748B" />
        <circle cx="42" cy="35" r="6" fill="#1E293B" />
        <circle cx="42" cy="35" r="3" fill="#64748B" />
        <circle cx="50" cy="25" r="2.5" fill="#FCD34D" />
      </g>
      
      <g opacity="0.15">
        <path d="M145 75 L165 55" stroke="url(#tkGradientAbout)" strokeWidth="8" strokeLinecap="round" />
        <path d="M145 75 L165 95" stroke="url(#tkGradientAbout)" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

const features = [
  {
    icon: Bus,
    title: "تتبع مباشر",
    description: "متابعة الحافلات في الوقت الفعلي",
  },
  {
    icon: MapPin,
    title: "خرائط تفاعلية",
    description: "عرض المحطات والمسارات",
  },
  {
    icon: Users,
    title: "خدمة المواطنين",
    description: "تسهيل التنقل الحضري",
  },
  {
    icon: Shield,
    title: "موثوقية عالية",
    description: "بيانات دقيقة ومحدثة",
  },
]

export default function AboutPage() {
  const router = useRouter()

  return (
    <PageTransition>
      <main className="min-h-screen bg-background pb-40">
        <AppHeader />
        
        <div className="px-4 pt-20">
          {/* Back Button */}
          <motion.button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-5 w-5" />
            <span>رجوع</span>
          </motion.button>

          {/* Page Header */}
          <motion.div
            className="mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">حول التطبيق</h1>
              <p className="text-sm text-muted-foreground">بطاقة التعريف</p>
            </div>
          </motion.div>

          {/* Logo Card - Identity Card */}
          <motion.div
            className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Gradient Orbs Background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              {/* Large Logo */}
              <motion.div
                className="relative mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div
                  className="absolute -inset-4 rounded-full opacity-40"
                  style={{
                    background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)"
                  }}
                />
                <div className="relative flex h-36 w-36 items-center justify-center rounded-[1.5rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
                  <TKLogo className="h-32 w-32" />
                </div>
              </motion.div>

              {/* App Name */}
              <motion.h2
                className="mb-2 bg-gradient-to-r from-emerald-300 via-white to-blue-300 bg-clip-text text-3xl font-bold text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                تنقلي خنشلة
              </motion.h2>
              
              <motion.p
                className="mb-4 text-lg font-medium text-white/80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Tanakoli Khenchela
              </motion.p>

              {/* Project Description */}
              <motion.p
                className="mb-6 text-sm leading-relaxed text-white/60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                مشروع تحديث النقل الحضري
              </motion.p>

              {/* Version Badge */}
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">الإصدار 1.0.0</span>
                <span className="text-xs text-emerald-400/70">(Stable Demo)</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="mb-6 rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="mb-4 text-lg font-bold text-foreground">مميزات التطبيق</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex flex-col items-center rounded-xl bg-muted/50 p-4 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                >
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-foreground">{feature.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Organization Info */}
          <motion.div
            className="rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="mb-4 text-lg font-bold text-foreground">المؤسسة</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Bus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">ETUS Khenchela</p>
                  <p className="text-sm text-muted-foreground">مؤسسة النقل الحضري وشبه الحضري</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  ولاية خنشلة - الجزائر
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  جميع الحقوق محفوظة 2024 - 2025
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <BottomNav />
      </main>
    </PageTransition>
  )
}
