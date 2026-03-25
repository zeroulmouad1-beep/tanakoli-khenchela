"use client";

import dynamic from 'next/dynamic' // استيراد للمكونات الديناميكية
import { AppHeader } from "@/components/app-header"
import { SearchBar } from "@/components/search-bar"
import { StationsList } from "@/components/stations-list"
import { BottomNav } from "@/components/bottom-nav"
import { AppWrapper } from "@/components/app-wrapper"
import { PageTransition } from "@/components/page-transition"
import { DriverDashboard } from "@/components/driver-dashboard"
import { useDriverMode } from "@/lib/driver-mode-context"

// تحميل الخريطة بشكل ديناميكي لتعمل فقط في المتصفح وتجنب الشاشة البيضاء
const MapSection = dynamic(
  () => import('@/components/map-section').then((mod) => mod.MapSection),
  { 
    ssr: false, 
    loading: () => <div className="h-[300px] w-full bg-muted animate-pulse" /> 
  }
)

function HomeContent() {
  const { isDriverMode } = useDriverMode()

  if (isDriverMode) {
    return <DriverDashboard />
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-background pb-24">
        <AppHeader />

        <div className="pt-16">
          <MapSection />
        </div>

        <SearchBar />

        <StationsList />

        <BottomNav />
      </main>
    </PageTransition>
  )
}

export default function Home() {
  return (
    <AppWrapper>
      <HomeContent />
    </AppWrapper>
  )
}
