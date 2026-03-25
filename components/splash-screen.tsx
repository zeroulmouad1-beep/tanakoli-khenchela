"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Modern TK Logo: Road-path T integrated with sleek bus silhouette
function TKLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Emerald Green to Electric Blue gradient */}
        <linearGradient id="tkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="70%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="tkGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        {/* Drop shadow */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Background circle with glass effect */}
      <circle cx="100" cy="100" r="90" fill="white" fillOpacity="0.1" />
      <circle cx="100" cy="100" r="88" stroke="url(#tkGradientLight)" strokeWidth="2" strokeOpacity="0.5" fill="none" />
      
      {/* Stylized "T" as a road/path */}
      <g filter="url(#shadow)">
        {/* Horizontal road (top of T) */}
        <rect x="35" y="45" width="130" height="22" rx="11" fill="url(#tkGradient)" />
        {/* Road markings on horizontal */}
        <line x1="50" y1="56" x2="65" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="80" y1="56" x2="95" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="110" y1="56" x2="125" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        <line x1="140" y1="56" x2="150" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.7" />
        
        {/* Vertical road (stem of T) with perspective */}
        <path d="M88 67 L112 67 L118 145 L82 145 Z" fill="url(#roadGradient)" />
        {/* Road center line */}
        <line x1="100" y1="75" x2="100" y2="90" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="100" y1="100" x2="100" y2="115" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="100" y1="125" x2="100" y2="138" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </g>
      
      {/* Minimalist Bus Silhouette on the road */}
      <g filter="url(#glow)" transform="translate(72, 95)">
        {/* Bus body */}
        <rect x="0" y="5" width="56" height="28" rx="6" fill="white" />
        {/* Bus roof */}
        <rect x="4" y="0" width="48" height="8" rx="4" fill="white" />
        {/* Windows */}
        <rect x="6" y="10" width="10" height="10" rx="2" fill="url(#tkGradient)" opacity="0.8" />
        <rect x="19" y="10" width="10" height="10" rx="2" fill="url(#tkGradient)" opacity="0.8" />
        <rect x="32" y="10" width="10" height="10" rx="2" fill="url(#tkGradient)" opacity="0.8" />
        {/* Front section */}
        <rect x="44" y="10" width="8" height="10" rx="2" fill="url(#tkGradient)" opacity="0.6" />
        {/* Wheels */}
        <circle cx="14" cy="35" r="6" fill="#1E293B" />
        <circle cx="14" cy="35" r="3" fill="#64748B" />
        <circle cx="42" cy="35" r="6" fill="#1E293B" />
        <circle cx="42" cy="35" r="3" fill="#64748B" />
        {/* Headlight */}
        <circle cx="50" cy="25" r="2.5" fill="#FCD34D" />
      </g>
      
      {/* "K" stylized hint - subtle accent */}
      <g opacity="0.15">
        <path d="M145 75 L165 55" stroke="url(#tkGradient)" strokeWidth="8" strokeLinecap="round" />
        <path d="M145 75 L165 95" stroke="url(#tkGradient)" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// City silhouette pattern for background
function CitySilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="cityGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* City buildings silhouette */}
      <path
        d="M0 200 L0 160 L30 160 L30 140 L50 140 L50 120 L70 120 L70 160 L100 160 L100 100 L120 100 L120 80 L140 80 L140 100 L160 100 L160 140 L200 140 L200 90 L220 90 L220 70 L240 70 L240 90 L260 90 L260 120 L300 120 L300 60 L320 60 L320 40 L340 40 L340 60 L360 60 L360 100 L400 100 L400 130 L450 130 L450 80 L470 80 L470 50 L490 50 L490 30 L510 30 L510 50 L530 50 L530 80 L550 80 L550 110 L600 110 L600 70 L620 70 L620 90 L640 90 L640 130 L700 130 L700 100 L720 100 L720 60 L740 60 L740 40 L760 40 L760 60 L780 60 L780 90 L820 90 L820 140 L860 140 L860 110 L880 110 L880 80 L900 80 L900 60 L920 60 L920 80 L940 80 L940 120 L1000 120 L1000 90 L1020 90 L1020 70 L1040 70 L1040 90 L1060 90 L1060 140 L1100 140 L1100 100 L1120 100 L1120 130 L1160 130 L1160 160 L1200 160 L1200 200 Z"
        fill="url(#cityGradient)"
      />
      {/* Aurès mountains in background */}
      <path
        d="M0 200 L100 180 L200 150 L350 120 L450 140 L550 90 L650 110 L750 70 L850 100 L950 130 L1050 110 L1150 150 L1200 170 L1200 200 Z"
        fill="url(#cityGradient)"
        opacity="0.5"
      />
    </svg>
  )
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showButton, setShowButton] = useState(false)

  // Show button after initial animations complete
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        // GPU acceleration for smooth rendering
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Static Background - no animations */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle radial gradient accent - static */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-blue-900/20" />
        {/* Static gradient orbs - no animation */}
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        {/* City silhouette at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-48 opacity-60">
          <CitySilhouette className="h-full w-full" />
        </div>
      </div>

      {/* Content Container with GPU acceleration */}
      <div 
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
        style={{ transform: "translateZ(0)" }}
      >
        
        {/* Main Logo - single fade-in animation */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Static glow ring - no animation */}
          <div
            className="absolute -inset-8 rounded-full opacity-60"
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)"
            }}
          />
          
          {/* Logo container */}
          <div
            className="relative flex h-44 w-44 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
            style={{
              boxShadow: "0 8px 32px rgba(16,185,129,0.2), 0 0 60px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}
          >
            <TKLogo className="h-40 w-40" />
          </div>
        </motion.div>

        {/* App Name - single fade-in */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          style={{ textRendering: "optimizeLegibility" }}
        >
          <h1 className="bg-gradient-to-r from-emerald-300 via-white to-blue-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent drop-shadow-lg">
            تنقلي خنشلة
          </h1>
          <p className="text-xl font-medium tracking-wide text-white/80">
            Tanakoli Khenchela
          </p>
        </motion.div>

        {/* Tagline - single fade-in */}
        <motion.div
          className="max-w-sm space-y-1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          style={{ textRendering: "optimizeLegibility" }}
        >
          <p className="text-lg font-medium text-white/90">
            مدينتك، نقلك. لنبدأ الرحلة!
          </p>
          <p className="text-sm text-emerald-300/80">
            Your city, your transport. Let's begin!
          </p>
        </motion.div>

        {/* Get Started Button - Fixed size, single fade-in, no looping animations */}
        <motion.button
          onClick={onComplete}
          className="relative mt-6 flex h-14 w-52 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-lg font-bold text-white shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showButton ? 1 : 0, 
            y: showButton ? 0 : 20,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            // Fixed dimensions to prevent layout shift
            minWidth: "208px",
            minHeight: "56px",
            textRendering: "optimizeLegibility",
            transform: "translateZ(0)",
          }}
        >
          {/* Static glow - no animation */}
          <div
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400/30 via-teal-400/30 to-blue-400/30 blur-xl"
          />
          <span 
            className="relative z-10 flex items-center gap-3 text-xl"
            style={{ textRendering: "optimizeLegibility" }}
          >
            ابدأ الآن
            <svg 
              className="h-6 w-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </span>
        </motion.button>
      </div>

      {/* Footer - single fade-in */}
      <motion.div
        className="absolute bottom-8 z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{ textRendering: "optimizeLegibility" }}
      >
        <p className="text-sm text-white/50">ETUS Khenchela</p>
        <p className="mt-1 text-xs text-white/30">مؤسسة النقل الحضري</p>
      </motion.div>
    </div>
  )
}
