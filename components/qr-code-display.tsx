"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { QRCodeSVG } from "qrcode.react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore"

const QR_REFRESH_INTERVAL = 60 // seconds

interface QRCodeDisplayProps {
  userId: string
  userName: string
  userPhone: string
}

interface DeductionNotification {
  amount: number
  newBalance: number
  timestamp: number
}

// Memoized QR code to prevent unnecessary re-renders
const MemoizedQRCode = memo(function MemoizedQRCode({ data }: { data: string }) {
  return (
    <QRCodeSVG
      value={data}
      size={180}
      level="H"
      includeMargin={false}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  )
})

export function QRCodeDisplay({ userId, userName, userPhone }: QRCodeDisplayProps) {
  const [qrToken, setQrToken] = useState<string>("")
  const [timeRemaining, setTimeRemaining] = useState(QR_REFRESH_INTERVAL)
  const [isReady, setIsReady] = useState(false)
  const [notification, setNotification] = useState<DeductionNotification | null>(null)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTransactionRef = useRef<string | null>(null)

  // Generate a new QR code token
  const generateToken = useCallback(() => {
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 10)
    return `TNK-${timestamp}-${randomPart}`
  }, [])

  // Initialize on mount (client-side only)
  useEffect(() => {
    // Generate initial token
    const initialToken = generateToken()
    setQrToken(initialToken)
    startTimeRef.current = Date.now()
    setTimeRemaining(QR_REFRESH_INTERVAL)
    setIsReady(true)

    // Set up stable interval timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = QR_REFRESH_INTERVAL - elapsed

      if (remaining <= 0) {
        // Silently refresh QR code in background
        setQrToken(generateToken())
        startTimeRef.current = Date.now()
        setTimeRemaining(QR_REFRESH_INTERVAL)
      } else {
        setTimeRemaining(remaining)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [generateToken])

  // Listen for real-time fare deductions
  useEffect(() => {
    if (!userId) return

    // Query for recent transactions for this user
    const transactionsRef = collection(db, "transactions")
    const q = query(
      transactionsRef,
      where("userId", "==", userId),
      where("type", "==", "fare_deduction"),
      orderBy("driverTimestamp", "desc"),
      limit(1)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data()
          const docId = change.doc.id
          
          // Skip if we've already seen this transaction
          if (lastTransactionRef.current === docId) return
          
          // Check if this is a recent transaction (within last 30 seconds)
          const driverTimestamp = data.driverTimestamp as Timestamp
          if (driverTimestamp) {
            const transactionTime = driverTimestamp.toDate().getTime()
            const now = Date.now()
            const isRecent = now - transactionTime < 30000 // 30 seconds
            
            if (isRecent && lastTransactionRef.current !== null) {
              // Show notification
              setNotification({
                amount: data.amount,
                newBalance: data.newBalance,
                timestamp: transactionTime
              })
              
              // Auto-hide after 5 seconds
              setTimeout(() => {
                setNotification(null)
              }, 5000)
            }
          }
          
          lastTransactionRef.current = docId
        }
      })
    }, (error) => {
      console.error("Error listening for transactions:", error)
    })

    return () => unsubscribe()
  }, [userId])

  // Stable QR code data
  const qrCodeData = qrToken ? JSON.stringify({
    userId,
    name: userName,
    phone: userPhone,
    token: qrToken,
  }) : ""

  const progressPercentage = (timeRemaining / QR_REFRESH_INTERVAL) * 100

  // Show loading state until ready
  if (!isReady || !qrToken) {
    return (
      <div className="flex flex-col items-center">
        {/* QR Placeholder */}
        <div className="relative mb-4">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex h-[180px] w-[180px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
        </div>
        {/* Timer Placeholder */}
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">صلاحية الرمز</span>
            <span className="font-bold tabular-nums text-primary">-- ثانية</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-primary/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center">
        {/* QR Code with Pulse Effect */}
        <div className="relative mb-4">
          {/* Pulse animation */}
          <div className="absolute -inset-2 animate-pulse rounded-2xl bg-primary/10" />
          
          {/* QR Code Container */}
          <div className="relative rounded-2xl bg-white p-4 shadow-lg">
            <MemoizedQRCode data={qrCodeData} />
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">صلاحية الرمز</span>
            <span className={`font-bold tabular-nums ${timeRemaining <= 10 ? "text-destructive" : "text-primary"}`}>
              {timeRemaining} ثانية
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${timeRemaining <= 10 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Deduction Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-green-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center p-8 text-center text-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Success Icon */}
              <motion.div
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <Check className="h-12 w-12" strokeWidth={3} />
              </motion.div>
              
              <motion.h2
                className="mb-2 text-3xl font-bold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                تم الخصم بنجاح
              </motion.h2>
              
              <motion.div
                className="mb-6 rounded-2xl bg-white/20 px-10 py-5"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="mb-1 text-sm opacity-80">المبلغ المخصوم</p>
                <p className="text-4xl font-bold">{notification.amount} د.ج</p>
              </motion.div>
              
              <motion.div
                className="rounded-xl bg-white/10 px-8 py-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm opacity-70">رصيدك الجديد</p>
                <p className="text-2xl font-bold">{notification.newBalance.toLocaleString("ar-DZ")} د.ج</p>
              </motion.div>
              
              <motion.button
                onClick={() => setNotification(null)}
                className="mt-8 rounded-xl bg-white/20 px-8 py-3 font-medium transition-colors hover:bg-white/30"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                إغلاق
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
