"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  QrCode, 
  LogOut, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  Bus,
  Wallet,
  ScanLine,
  Loader2,
  RotateCcw,
  PlusCircle,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  History
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, runTransaction, updateDoc, addDoc, serverTimestamp, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore"
import { useDriverMode } from "@/lib/driver-mode-context"
import { useAuth } from "@/lib/auth-context"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"

const FARE_OPTIONS = [
  { amount: 20, label: "20 د.ج", description: "داخل المدينة" },
  { amount: 30, label: "30 د.ج", description: "ضواحي" },
  { amount: 50, label: "50 د.ج", description: "بين المدن" },
]

interface ScanResult {
  success: boolean
  passengerName?: string
  newBalance?: number
  amount?: number
  message?: string
  isRecharge?: boolean
}

type ScanMode = "deduction" | "recharge"

// Preset recharge amounts
const RECHARGE_PRESETS = [100, 200, 500, 1000]

// Transaction interface for history
interface Transaction {
  id: string
  type: "fare_deduction" | "balance_recharge"
  amount: number
  passengerName: string
  driverTimestamp: Timestamp
  newBalance: number
}

interface DailyStats {
  total: number
  trips: number
  date: string
}

const STORAGE_KEY = "driver_daily_stats"

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Load stats from localStorage, reset if it's a new day
function loadDailyStats(): DailyStats {
  if (typeof window === 'undefined') {
    return { total: 0, trips: 0, date: getTodayDate() }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const stats: DailyStats = JSON.parse(stored)
      // Check if it's still today
      if (stats.date === getTodayDate()) {
        return stats
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  // Return fresh stats for new day
  return { total: 0, trips: 0, date: getTodayDate() }
}

// Save stats to localStorage
function saveDailyStats(stats: DailyStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Ignore storage errors
  }
}

export function DriverDashboard() {
  const { exitDriverMode } = useDriverMode()
  const { session } = useAuth()
  const [selectedFare, setSelectedFare] = useState(30)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dailyStats, setDailyStats] = useState<DailyStats>({ total: 0, trips: 0, date: getTodayDate() })
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  // Recharge mode state
  const [scanMode, setScanMode] = useState<ScanMode>("deduction")
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState<string>("")
  const [isAuthorizedDriver, setIsAuthorizedDriver] = useState(true) // TODO: Check from Firebase auth
  
  // Transaction history state
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const gpsWatchIdRef = useRef<number | null>(null)

  // Stop scanner helper (defined early for cleanup)
  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Load stats on mount
  useEffect(() => {
    const stats = loadDailyStats()
    setDailyStats(stats)
  }, [])

  // High-frequency real-time GPS tracking
  useEffect(() => {
    if (!navigator.geolocation || !session?.phone) return

    const busDocRef = doc(db, "Buses", session.phone)

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          await updateDoc(busDocRef, {
            latitude,
            longitude,
            lastUpdated: serverTimestamp(),
          })
        } catch (error) {
          console.error("GPS Firestore update error:", error)
        }
      },
      (error) => {
        console.error("GPS watch error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    )

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current)
        gpsWatchIdRef.current = null
      }
    }
  }, [session?.phone])

  // Real-time transaction history listener
  useEffect(() => {
    const transactionsRef = collection(db, "transactions")
    const q = query(
      transactionsRef,
      orderBy("driverTimestamp", "desc"),
      limit(10)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: doc.data().type,
        amount: doc.data().amount,
        passengerName: doc.data().passengerName,
        driverTimestamp: doc.data().driverTimestamp,
        newBalance: doc.data().newBalance
      }))
      setRecentTransactions(transactions)
    }, (error) => {
      console.error("Error fetching transactions:", error)
    })

    return () => unsubscribe()
  }, [])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  // Update stats helper
  const updateStats = useCallback((amount: number) => {
    setDailyStats(prev => {
      const newStats = {
        total: prev.total + amount,
        trips: prev.trips + 1,
        date: getTodayDate()
      }
      saveDailyStats(newStats)
      return newStats
    })
  }, [])

  // Reset daily stats
  const handleResetStats = useCallback(() => {
    const freshStats = { total: 0, trips: 0, date: getTodayDate() }
    setDailyStats(freshStats)
    saveDailyStats(freshStats)
    setShowResetConfirm(false)
  }, [])

  // Handle recharge button click
  const handleRechargeClick = () => {
    setShowRechargeModal(true)
    setRechargeAmount("")
  }

  // Start recharge scan after entering amount
  const handleStartRechargeScan = () => {
    const amount = parseInt(rechargeAmount)
    if (!amount || amount <= 0) return
    
    setShowRechargeModal(false)
    setScanMode("recharge")
    startScanner()
  }

  // Handle preset amount selection
  const handlePresetClick = (amount: number) => {
    setRechargeAmount(amount.toString())
  }

  const startScanner = async (mode?: ScanMode) => {
    if (mode) setScanMode(mode)
    setIsScanning(true)
    setScanResult(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Start continuous scanning
      const scanLoop = async () => {
        if (!videoRef.current || !isScanning) return

        try {
          const result = await reader.decodeFromVideoElement(videoRef.current)
          if (result) {
            // Found a QR code
            await processQRCode(result.getText())
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error("Scan error:", error)
          }
          // Continue scanning if still active
          if (isScanning && streamRef.current) {
            requestAnimationFrame(scanLoop)
          }
        }
      }

      // Start the scan loop
      setTimeout(scanLoop, 500)

    } catch (error) {
      console.error("Camera error:", error)
      setScanResult({
        success: false,
        message: "تعذر الوصول إلى الكاميرا"
      })
      stopScanner()
    }
  }

  const processQRCode = async (qrData: string) => {
    stopScanner()
    setIsProcessing(true)

    try {
      // ── 1. Parse QR payload ────────────────────────────────────────────────
      let data: { userId?: string; phone?: string; name?: string; token?: string }
      try {
        data = JSON.parse(qrData)
      } catch {
        setScanResult({ success: false, message: "رمز QR غير صالح — تعذّر قراءة البيانات" })
        setIsProcessing(false)
        return
      }

      const qrIdentifier = data.userId || data.phone || ""
      const qrName = data.name || "راكب"

      if (!qrIdentifier) {
        setScanResult({ success: false, message: "رمز QR لا يحتوي على معرّف مستخدم" })
        setIsProcessing(false)
        return
      }

      // ── 2. Resolve Firestore document ID (outside transaction — queries not allowed inside) ──
      // New accounts have phone as doc ID; older ones may need a Phone-field query.
      let userDocId = qrIdentifier
      const usersRef = collection(db, "users")

      const directSnap = await getDocs(
        query(usersRef, where("__name__", "==", qrIdentifier))
      )
      if (directSnap.empty) {
        // Fallback: search by Phone field
        const phoneQs = await getDocs(query(usersRef, where("Phone", "==", qrIdentifier)))
        if (phoneQs.empty) {
          setScanResult({ success: false, message: "المستخدم غير موجود في قاعدة البيانات" })
          setIsProcessing(false)
          return
        }
        userDocId = phoneQs.docs[0].id
      }

      const userDocRef = doc(db, "users", userDocId)

      // ── 3. Atomic Firestore transaction ────────────────────────────────────
      let passengerName = qrName
      let newBalance = 0
      let previousBalance = 0

      if (scanMode === "recharge") {
        // ── RECHARGE ──────────────────────────────────────────────────────
        const rechargeAmountNum = parseInt(rechargeAmount, 10)
        if (!rechargeAmountNum || rechargeAmountNum <= 0) {
          setScanResult({ success: false, message: "مبلغ الشحن غير صالح" })
          setIsProcessing(false)
          return
        }

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userDocRef)
          const d = snap.data() ?? {}
          passengerName = d.fullName || qrName
          previousBalance = d.balance ?? 0
          newBalance = previousBalance + rechargeAmountNum
          tx.update(userDocRef, { balance: newBalance })
        })

        // Log transaction (non-fatal)
        try {
          await addDoc(collection(db, "transactions"), {
            userId: userDocId,
            type: "balance_recharge",
            amount: rechargeAmountNum,
            previousBalance,
            newBalance,
            driverTimestamp: serverTimestamp(),
            passengerPhone: userDocId,
            passengerName,
            status: "completed",
          })
        } catch { /* logging is best-effort */ }

        setScanResult({
          success: true,
          passengerName,
          newBalance,
          amount: rechargeAmountNum,
          message: "تم الشحن بنجاح",
          isRecharge: true,
        })
        setRechargeAmount("")
        setScanMode("deduction")

      } else {
        // ── FARE DEDUCTION ────────────────────────────────────────────────
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userDocRef)
          const d = snap.data() ?? {}
          passengerName = d.fullName || qrName
          previousBalance = d.balance ?? 0

          if (previousBalance < selectedFare) {
            throw new Error(`INSUFFICIENT_BALANCE:${previousBalance}`)
          }

          newBalance = previousBalance - selectedFare
          tx.update(userDocRef, { balance: newBalance })
        })

        // Log transaction (non-fatal if it fails)
        try {
          await addDoc(collection(db, "transactions"), {
            userId: userDocId,
            type: "fare_deduction",
            amount: selectedFare,
            previousBalance,
            newBalance,
            driverTimestamp: serverTimestamp(),
            passengerPhone: userDocId,
            passengerName,
            status: "completed",
          })
        } catch { /* logging is best-effort */ }

        setScanResult({
          success: true,
          passengerName,
          newBalance,
          amount: selectedFare,
          message: "تم الخصم بنجاح",
          isRecharge: false,
        })
        updateStats(selectedFare)
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : ""
      if (msg === "USER_NOT_FOUND") {
        setScanResult({ success: false, message: "المستخدم غير موجود في قاعدة البيانات" })
      } else if (msg.startsWith("INSUFFICIENT_BALANCE:")) {
        const bal = msg.split(":")[1]
        setScanResult({ success: false, message: `رصيد غير كافٍ — الرصيد الحالي: ${bal} د.ج` })
      } else {
        console.error("processQRCode error:", error)
        setScanResult({ success: false, message: "خطأ في معالجة الدفع — حاول مرة أخرى" })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseResult = () => {
    setScanResult(null)
  }

  // DEV TEST: send a slightly randomised position to Firestore to verify GPS→Firestore path
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const handleTestGpsUpdate = useCallback(async () => {
    if (!session?.phone) { setTestStatus("لا يوجد جلسة"); return }
    const lat = 35.4200 + (Math.random() - 0.5) * 0.002
    const lng = 7.1350  + (Math.random() - 0.5) * 0.002
    try {
      setTestStatus("جاري الإرسال…")
      await updateDoc(doc(db, "Buses", session.phone), {
        latitude: lat,
        longitude: lng,
        lastUpdated: serverTimestamp(),
      })
      setTestStatus(`✓ تم: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch (e) {
      setTestStatus(`✗ خطأ: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [session?.phone])

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Bus className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">وضع السائق</h1>
              <p className="text-xs text-slate-400">Driver Mode</p>
            </div>
          </div>
          <button
            onClick={exitDriverMode}
            className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            <LogOut className="h-4 w-4" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <main className="px-4 pt-20 pb-8">
        {/* Stats Card */}
        <motion.div
          className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary-foreground" />
              <span className="font-medium text-primary-foreground/90">إحصائيات اليوم</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 rounded-lg bg-primary-foreground/10 px-2 py-1 text-xs text-primary-foreground/80 transition-colors hover:bg-primary-foreground/20"
            >
              <RotateCcw className="h-3 w-3" />
              <span>إعادة تعيين</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <p className="text-sm text-primary-foreground/80">المبلغ الكلي</p>
              <p className="text-2xl font-bold text-primary-foreground" dir="ltr">
                {dailyStats.total.toLocaleString("ar-DZ")} <span className="text-sm">د.ج</span>
              </p>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4">
              <p className="text-sm text-primary-foreground/80">عدد الرحلات</p>
              <p className="text-2xl font-bold text-primary-foreground">
                {dailyStats.trips}
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-primary-foreground/60">
            يتم إعادة التعيين تلقائياً كل يوم في منتصف الليل
          </p>
        </motion.div>

        {/* Fare Selector */}
        <motion.div
          className="mb-6 rounded-2xl bg-slate-800 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Wallet className="h-5 w-5 text-primary" />
            سعر الرحلة
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {FARE_OPTIONS.map((fare) => (
              <button
                key={fare.amount}
                onClick={() => setSelectedFare(fare.amount)}
                className={`rounded-xl p-4 text-center transition-all ${
                  selectedFare === fare.amount
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-slate-800"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                <p className="text-xl font-bold">{fare.amount}</p>
                <p className="text-xs opacity-80">د.ج</p>
                <p className="mt-1 text-[10px] opacity-60">{fare.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* QR Scanner Button */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => startScanner("deduction")}
            disabled={isScanning || isProcessing}
            className="flex w-full items-center justify-center gap-4 rounded-2xl bg-primary py-6 font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
              <QrCode className="h-8 w-8" />
            </div>
            <div className="text-right">
              <p className="text-xl">مسح رمز الدفع</p>
              <p className="text-sm opacity-80">Scan QR Code</p>
            </div>
          </button>
        </motion.div>

        {/* Recharge Button - Only visible to authorized drivers */}
        {isAuthorizedDriver && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <button
              onClick={handleRechargeClick}
              disabled={isScanning || isProcessing}
              className="flex w-full items-center justify-center gap-4 rounded-2xl bg-blue-600 py-5 font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <PlusCircle className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-lg">شحن رصيد للمسافر</p>
                <p className="text-xs opacity-80">Mobile Recharge</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Recent Transactions Section */}
        <motion.div
          className="mb-6 rounded-2xl bg-slate-800 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">سجل العمليات الأخير</h2>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <History className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">لا توجد عمليات بعد</p>
            </div>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              {recentTransactions.map((transaction, index) => {
                const isRecharge = transaction.type === "balance_recharge"
                const timestamp = transaction.driverTimestamp?.toDate?.()
                const timeString = timestamp 
                  ? timestamp.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })
                  : "--:--"
                
                return (
                  <motion.div
                    key={transaction.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-700/50 p-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Icon */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isRecharge ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      {isRecharge ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-white">
                        {transaction.passengerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isRecharge ? "شحن رصيد" : "خصم أجرة"} • {timeString}
                      </p>
                    </div>
                    
                    {/* Amount */}
                    <div className={`text-left font-bold ${
                      isRecharge ? "text-green-400" : "text-red-400"
                    }`}>
                      {isRecharge ? "+" : "-"}{transaction.amount} د.ج
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="rounded-2xl bg-slate-800/50 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="mb-3 font-bold text-white">كيفية الاستخدام</h3>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
              <span>اختر سعر الرحلة المناسب</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
              <span>اضغط على زر المسح</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
              <span>امسح رمز QR الخاص بالراكب</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">4</span>
              <span>سيتم خصم المبلغ تلقائياً</span>
            </li>
          </ol>
        </motion.div>

        {/* DEV: GPS connection test — remove after verifying Firestore writes */}
        <div className="mt-6 flex flex-col items-center gap-1">
          <button
            onClick={handleTestGpsUpdate}
            className="text-xs text-slate-600 underline underline-offset-2 hover:text-slate-400"
          >
            اختبار GPS → Firestore
          </button>
          {testStatus && (
            <p className="text-[10px] text-slate-500" dir="ltr">{testStatus}</p>
          )}
        </div>
      </main>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close button */}
            <button
              onClick={stopScanner}
              className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Camera View */}
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scan Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  {/* Corner markers */}
                  <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-primary" />
                  <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-primary" />
                  <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-primary" />
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-primary" />
                  
                  {/* Scan line animation */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_20px_4px_rgba(0,166,81,0.6)]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <div className="mx-auto flex items-center justify-center gap-2 rounded-full bg-black/60 px-6 py-3 backdrop-blur-sm">
                  <ScanLine className="h-5 w-5 text-primary" />
                  <span className="text-white">وجّه الكاميرا نحو رمز QR</span>
                </div>
              </div>

              {/* Selected amount badge */}
              <div className="absolute bottom-36 left-0 right-0 flex justify-center">
                <div className={`rounded-full px-6 py-2 ${scanMode === "recharge" ? "bg-blue-500" : "bg-primary"}`}>
                  <span className="font-bold text-white">
                    {scanMode === "recharge" 
                      ? `شحن: ${rechargeAmount} د.ج` 
                      : `خصم: ${selectedFare} د.ج`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-white">جاري معالجة الدفع...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseResult}
          >
            <motion.div
              className={`mx-4 w-full max-w-sm rounded-3xl p-8 ${
                scanResult.success 
                  ? scanResult.isRecharge 
                    ? "bg-blue-500" 
                    : "bg-green-500" 
                  : "bg-red-500"
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center text-white">
                {/* Icon */}
                <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                  scanResult.success ? "bg-white/20" : "bg-white/20"
                }`}>
                  {scanResult.success ? (
                    <Check className="h-10 w-10" />
                  ) : (
                    <AlertCircle className="h-10 w-10" />
                  )}
                </div>

                {/* Message */}
                <h2 className="mb-2 text-2xl font-bold">
                  {scanResult.success 
                    ? scanResult.isRecharge 
                      ? "تم الشحن بنجاح" 
                      : "تم الخصم بنجاح" 
                    : "فشل العملية"}
                </h2>
                
                {scanResult.success ? (
                  <>
                    <p className="mb-4 text-lg opacity-90">{scanResult.passengerName}</p>
                    <div className="mb-3 rounded-2xl bg-white/20 px-8 py-4">
                      <p className="text-sm opacity-80">
                        {scanResult.isRecharge ? "المبلغ المشحون" : "المبلغ المخصوم"}
                      </p>
                      <p className="text-3xl font-bold">{scanResult.amount} د.ج</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-6 py-2">
                      <p className="text-sm opacity-70">الرصيد الجديد للراكب</p>
                      <p className="text-xl font-bold">{scanResult.newBalance?.toLocaleString("ar-DZ")} د.ج</p>
                    </div>
                  </>
                ) : (
                  <p className="text-lg opacity-90">{scanResult.message}</p>
                )}

                {/* Close button */}
                <button
                  onClick={handleCloseResult}
                  className="mt-6 rounded-xl bg-white/20 px-8 py-3 font-medium transition-colors hover:bg-white/30"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recharge Amount Modal */}
      <AnimatePresence>
        {showRechargeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRechargeModal(false)}
          >
            <motion.div
              className="mx-4 w-full max-w-sm rounded-2xl bg-slate-800 p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                  <Banknote className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <h3 className="mb-2 text-center text-lg font-bold text-white">
                شحن رصيد للمسافر
              </h3>
              <p className="mb-4 text-center text-sm text-slate-400">
                أدخل المبلغ النقدي المستلم
              </p>

              {/* Amount Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl bg-slate-700 px-4 py-4 text-center text-2xl font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">د.ج</span>
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="mb-6 grid grid-cols-4 gap-2">
                {RECHARGE_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetClick(amount)}
                    className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                      rechargeAmount === amount.toString()
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 rounded-xl bg-slate-700 py-3 font-medium text-white transition-colors hover:bg-slate-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleStartRechargeScan}
                  disabled={!rechargeAmount || parseInt(rechargeAmount) <= 0}
                  className="flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  مسح QR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              className="mx-4 w-full max-w-sm rounded-2xl bg-slate-800 p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                  <RotateCcw className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              
              <h3 className="mb-2 text-center text-lg font-bold text-white">
                إعادة تعيين الإحصائيات؟
              </h3>
              <p className="mb-6 text-center text-sm text-slate-400">
                سيتم حذف جميع إحصائيات اليوم بشكل نهائي
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl bg-slate-700 py-3 font-medium text-white transition-colors hover:bg-slate-600"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleResetStats}
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-medium text-white transition-colors hover:bg-amber-600"
                >
                  إعادة تعيين
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
