"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Clock, Bus, ArrowLeft, Ticket, Calendar, History, MapPin, QrCode, Navigation, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { TripCardSkeleton } from "@/components/skeleton-loader"
import { useTripsCache, type Trip } from "@/hooks/use-trips-cache"
import { usePassengerTransactions } from "@/hooks/use-passenger-transactions"
import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { useTracking } from "@/lib/tracking-context"
import { useRoutesByCategory } from "@/hooks/use-routes"

// Helper function to generate schedule based on working hours and frequency
function generateSchedule(workingHours: { start: string; end: string }, frequency: number) {
  const schedule: { time: string; status: "departed" | "current" | "upcoming" }[] = []
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  const [startHour] = workingHours.start.split(":").map(Number)
  const [endHour] = workingHours.end.split(":").map(Number)
  
  let foundCurrent = false
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += frequency) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      
      let status: "departed" | "current" | "upcoming"
      if (hour < currentHour || (hour === currentHour && minute < currentMinute)) {
        status = "departed"
      } else if (!foundCurrent) {
        status = "current"
        foundCurrent = true
      } else {
        status = "upcoming"
      }
      
      schedule.push({ time: timeString, status })
      
      // Limit to 5 visible times
      if (schedule.length >= 5) break
    }
    if (schedule.length >= 5) break
  }
  
  return schedule
}

// Helper to calculate next arrival
function calculateNextArrival(workingHours: { start: string; end: string }, frequency: number): string {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const [startHour, startMin] = workingHours.start.split(":").map(Number)
  const startMinutes = startHour * 60 + startMin
  
  if (currentMinutes < startMinutes) {
    return `${startMinutes - currentMinutes} دقيقة`
  }
  
  const minutesSinceStart = currentMinutes - startMinutes
  const nextBusIn = frequency - (minutesSinceStart % frequency)
  
  return `${nextBusIn} دقائق`
}

// Animation variants for tab content
const tabContentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: {
      duration: 0.15,
    }
  },
}

// Staggered list animation
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }
  },
}

// Mock active trip data
const mockActiveTrip = {
  id: "active-1",
  lineName: "خط الجامعة",
  lineNumber: "01",
  from: "الجامعة",
  to: "وسط المدينة",
  remainingMinutes: 5,
  progress: 75,
}

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "history">("schedule")
  const [hasActiveTrip, setHasActiveTrip] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const router = useRouter()
  const { startTracking } = useTracking()
  
  const { trips, isLoading: loading } = useTripsCache()
  const { transactions, isLoading: transactionsLoading } = usePassengerTransactions("0775453629")
  const { routes: urbanRoutes, isLoading: routesLoading } = useRoutesByCategory("urban")
  
  const handleTrackBus = (lineId: string, lineName: string) => {
    startTracking(lineId, lineName)
    router.push("/")
  }
  
  useEffect(() => {
    setHasMounted(true)
    const storedActiveTrip = typeof window !== 'undefined' && localStorage.getItem('activeTrip')
    setHasActiveTrip(!!storedActiveTrip)
  }, [])

  const formatDate = (trip: Trip) => {
    if (trip.timestamp) {
      const date = new Date(trip.timestamp.seconds * 1000)
      return date.toLocaleDateString("ar-DZ", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
    if (trip.createdAt) {
      const date = new Date(trip.createdAt)
      return date.toLocaleDateString("ar-DZ", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
    return "غير معروف"
  }

  const formatTime = (trip: Trip) => {
    if (trip.timestamp) {
      const date = new Date(trip.timestamp.seconds * 1000)
      return date.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })
    }
    if (trip.createdAt) {
      const date = new Date(trip.createdAt)
      return date.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })
    }
    return "--:--"
  }

  return (
    <ErrorBoundary>
      <PageTransition>
        <main className="min-h-screen bg-background pb-40">
          <AppHeader />
        
          <div className="px-4 pt-20">
            {/* Page Header */}
            <motion.div
              className="mb-4 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">الرحلات</h1>
                <p className="text-sm text-muted-foreground">مواعيد وسجل الرحلات</p>
              </div>
            </motion.div>

            {/* Active Trip Section */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">الرحلة النشطة</span>
              </div>
              
              {hasMounted && hasActiveTrip ? (
                <motion.div
                  className="overflow-hidden rounded-2xl bg-primary shadow-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-1 animate-pulse rounded-full bg-primary-foreground/20" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground">
                        <Bus className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary-foreground">{mockActiveTrip.lineName}</span>
                        <span className="rounded-md bg-primary-foreground/20 px-1.5 py-0.5 text-xs text-primary-foreground">
                          خط {mockActiveTrip.lineNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary-foreground/80">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{mockActiveTrip.from}</span>
                        <ArrowLeft className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{mockActiveTrip.to}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-center">
                        <div className="flex items-baseline gap-0.5 text-primary-foreground">
                          <span className="text-xl font-bold">{mockActiveTrip.remainingMinutes}</span>
                          <span className="text-xs">د</span>
                        </div>
                        <span className="text-xs text-primary-foreground/70">متبقية</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 gap-1 rounded-full bg-primary-foreground px-3 text-xs text-primary hover:bg-primary-foreground/90"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        تتبع
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-1 w-full bg-primary-foreground/20">
                    <motion.div 
                      className="h-full bg-primary-foreground"
                      initial={{ width: 0 }}
                      animate={{ width: `${mockActiveTrip.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <QrCode className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">لا توجد رحلة نشطة</p>
                    <p className="text-sm text-muted-foreground">
                      امسح رمزك مع السائق لبدء الرحلة
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Tab Switcher */}
            <motion.div
              className="mb-4 flex gap-2 rounded-xl bg-muted p-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.button
                onClick={() => setActiveTab("schedule")}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  activeTab === "schedule"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === "schedule" && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-card shadow-sm"
                    layoutId="activeTabBg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>المواعيد</span>
                </div>
              </motion.button>
              <motion.button
                onClick={() => setActiveTab("history")}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === "history" && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-card shadow-sm"
                    layoutId="activeTabBg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <History className="h-4 w-4" />
                  <span>السجل</span>
                  {transactions.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                      {transactions.length}
                    </span>
                  )}
                </div>
              </motion.button>
            </motion.div>

            {/* Tab Content with AnimatePresence */}
            <AnimatePresence mode="wait">
              {/* Schedule Tab */}
              {activeTab === "schedule" && (
                <motion.div
                  key="schedule"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="space-y-4"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {routesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse rounded-2xl bg-card p-4">
                            <div className="h-16 bg-muted rounded-xl" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      urbanRoutes.map((route) => {
                        const subStations = route.sub_stations || route.stops.map(s => ({ id: s.id, name: s.name }))
                        const firstStop = subStations[0]?.name || route.stops[0]?.name || ""
                        const lastStop = subStations[subStations.length - 1]?.name || route.stops[route.stops.length - 1]?.name || ""
                        const schedule = generateSchedule(route.workingHours, route.frequency)
                        const nextArrival = calculateNextArrival(route.workingHours, route.frequency)
                        
                        return (
                          <motion.div
                            key={route.id}
                            className="overflow-hidden rounded-2xl bg-card shadow-sm"
                            variants={itemVariants}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="border-b border-border bg-primary/5 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: route.color }}
                                  >
                                    <Bus className="h-5 w-5 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-foreground">{route.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <span>{firstStop}</span>
                                      <ArrowLeft className="h-3 w-3" />
                                      <span>{lastStop}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-left">
                                    <div className="text-lg font-bold text-primary">{nextArrival}</div>
                                    <div className="text-xs text-muted-foreground">القادمة</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTrackBus(route.lineNumber, route.name)
                                    }}
                                    className="h-9 gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
                                  >
                                    <Navigation className="h-3.5 w-3.5" />
                                    تتبع
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>كل {route.frequency} دقيقة</span>
                                <span className="text-xs">({route.workingHours.start} - {route.workingHours.end})</span>
                              </div>
                              
                              <div className="mb-3">
                                <div className="mb-2 text-xs font-medium text-muted-foreground">المحطات الفرعية:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {subStations.map((station, index) => (
                                    <div key={station.id} className="flex items-center">
                                      <span 
                                        className="rounded-md px-2 py-1 text-xs text-foreground"
                                        style={{ 
                                          backgroundColor: index === 0 || index === subStations.length - 1 
                                            ? `${route.color}20` 
                                            : 'hsl(var(--muted))',
                                          border: index === 0 || index === subStations.length - 1 
                                            ? `1px solid ${route.color}` 
                                            : 'none'
                                        }}
                                      >
                                        {station.name}
                                      </span>
                                      {index < subStations.length - 1 && (
                                        <ArrowLeft className="mx-1 h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="mb-2 text-xs font-medium text-muted-foreground">أوقات اليوم:</div>
                                <div className="flex flex-wrap gap-2">
                                  {schedule.map((slot, index) => (
                                    <motion.span
                                      key={index}
                                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                        slot.status === "departed"
                                          ? "bg-muted text-muted-foreground line-through"
                                          : slot.status === "current"
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-primary/10 text-primary"
                                      }`}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {slot.time}
                                    </motion.span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <motion.div
                  key="history"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="space-y-3">
                    {transactionsLoading ? (
                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[1, 2, 3].map((i) => (
                          <TripCardSkeleton key={i} />
                        ))}
                      </motion.div>
                    ) : transactions.length === 0 ? (
                      <motion.div
                        className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-12 shadow-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="relative mb-6">
                          <motion.div
                            className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-primary/5"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-primary/10"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          />
                          <motion.div 
                            className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Wallet className="h-12 w-12 text-primary" />
                            <motion.div
                              className="absolute -bottom-3 left-1/2 h-6 w-0.5 -translate-x-1/2 rounded-full bg-primary/30"
                              animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 0.2, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                              className="absolute -bottom-5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/40"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            />
                          </motion.div>
                        </div>
                        
                        <h3 className="mb-2 text-xl font-bold text-foreground">سجلك فارغ</h3>
                        <p className="mb-4 max-w-[250px] text-center text-sm leading-relaxed text-muted-foreground">
                          ابدأ رحلتك الأولى بمسح رمزك للسائق!
                        </p>
                        
                        <motion.div 
                          className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Ticket className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            اضغط على زر الدفع لعرض رمزك
                          </p>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="space-y-3"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {transactions.map((transaction) => {
                          const isRecharge = transaction.type === "balance_recharge"
                          const timestamp = transaction.driverTimestamp?.toDate?.()
                          const dateString = timestamp 
                            ? timestamp.toLocaleDateString("ar-DZ", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "غير معروف"
                          const timeString = timestamp 
                            ? timestamp.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })
                            : "--:--"
                          
                          return (
                            <motion.div
                              key={transaction.id}
                              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
                              variants={itemVariants}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                isRecharge ? "bg-green-500/10" : "bg-red-500/10"
                              }`}>
                                {isRecharge ? (
                                  <ArrowUpCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                  <ArrowDownCircle className="h-6 w-6 text-red-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">
                                    {isRecharge ? "شحن رصيد" : "أجرة حافلة"}
                                  </span>
                                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                    isRecharge 
                                      ? "bg-green-500/10 text-green-600" 
                                      : "bg-red-500/10 text-red-600"
                                  }`}>
                                    {isRecharge ? "Recharge" : "Deduction"}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{dateString}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{timeString}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className={`text-lg font-bold ${
                                  isRecharge ? "text-green-500" : "text-destructive"
                                }`} dir="ltr">
                                  {isRecharge ? "+" : "-"}{transaction.amount} د.ج
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  الرصيد: {transaction.newBalance} د.ج
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <BottomNav />
        </main>
      </PageTransition>
    </ErrorBoundary>
  )
}
