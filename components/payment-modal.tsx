"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertCircle, Bus, Calendar, Clock, Ticket } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore"

const USER_ID = "0775453629"

// Success sound effect - plays a short beep
const playSuccessSound = () => {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  
  // Create oscillator for the beep
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // Configure sound - a pleasant "ding" sound
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
  oscillator.type = "sine"
  
  // Fade out effect
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
  
  // Play a second higher note for a pleasant "ding-ding" effect
  setTimeout(() => {
    const osc2 = audioContext.createOscillator()
    const gain2 = audioContext.createGain()
    osc2.connect(gain2)
    gain2.connect(audioContext.destination)
    osc2.frequency.setValueAtTime(1318.5, audioContext.currentTime) // E6 note
    osc2.type = "sine"
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
    osc2.start(audioContext.currentTime)
    osc2.stop(audioContext.currentTime + 0.4)
  }, 150)
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

const TICKET_PRICE = 50

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    }
  },
}

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.2,
    }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [ticketData, setTicketData] = useState<{
    ticketId: string
    timestamp: string
    time: string
    date: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
      setTicketData(null)
    }
  }, [isOpen])

  const handlePayment = async () => {
    setStatus("processing")
    
    try {
      const userDocRef = doc(db, "users", USER_ID)
      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`
      const now = new Date()
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef)
        
        if (!userDoc.exists()) {
          throw new Error("المستخدم غير موجود")
        }
        
        const currentBalance = userDoc.data().balance || 0
        
        if (currentBalance < TICKET_PRICE) {
          throw new Error("الرصيد غير كافي")
        }
        
        const newBalance = currentBalance - TICKET_PRICE
        transaction.update(userDocRef, { balance: newBalance })
      })

      // Save trip record to Firebase
      const tripsCollectionRef = collection(db, "trips")
      await addDoc(tripsCollectionRef, {
        ticketId,
        amount: TICKET_PRICE,
        timestamp: serverTimestamp(),
        userId: USER_ID,
        createdAt: now.toISOString(),
      })

      // Generate ticket data for display
      setTicketData({
        ticketId,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
        date: now.toLocaleDateString("ar-DZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      })
      
      // Play success sound
      playSuccessSound()
      
      setStatus("success")
    } catch (error) {
      setStatus("error")
      if (error instanceof Error) {
        setErrorMessage(error.message === "الرصيد غير كافي" ? error.message : "حدث خطأ أثناء الدفع")
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="glass-strong relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-muted/80 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5" />
            </motion.button>

            <AnimatePresence mode="wait">
              {/* Idle State - Confirm Payment */}
              {status === "idle" && (
                <motion.div
                  key="idle"
                  className="p-6"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-6 flex flex-col items-center">
                    <motion.div
                      className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    >
                      <Ticket className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground">شراء تذكرة</h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      سيتم خصم قيمة التذكرة من رصيدك
                    </p>
                  </div>

                  <div className="mb-6 rounded-2xl bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">سعر التذكرة</span>
                      <span className="text-2xl font-bold text-foreground" dir="ltr">
                        {TICKET_PRICE} د.ج
                      </span>
                    </div>
                  </div>

                  <motion.button
                    onClick={handlePayment}
                    className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    whileTap={{ scale: 0.97 }}
                  >
                    تأكيد الدفع
                  </motion.button>
                </motion.div>
              )}

              {/* Processing State */}
              {status === "processing" && (
                <motion.div
                  key="processing"
                  className="flex flex-col items-center justify-center p-12"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="relative mb-6">
                    <motion.div
                      className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <p className="text-lg font-medium text-foreground">جاري معالجة الدفع...</p>
                </motion.div>
              )}

              {/* Success State - Virtual Ticket */}
              {status === "success" && ticketData && (
                <motion.div
                  key="success"
                  className="p-6"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Success animation */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-4">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0] }}
                        transition={{ duration: 0.6, times: [0, 0.5, 1] }}
                      />
                      <motion.div
                        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                        </motion.div>
                      </motion.div>
                    </div>
                    <motion.h2
                      className="text-xl font-bold text-primary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      تم الدفع بنجاح!
                    </motion.h2>
                  </div>

                  {/* Virtual Ticket */}
                  <motion.div
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {/* Decorative circles for ticket look */}
                    <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
                    <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
                    
                    {/* Dashed line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-primary-foreground/30" />

                    <div className="relative">
                      <div className="mb-8 flex items-start justify-between">
                        <div>
                          <p className="text-xs text-primary-foreground/70">تناكلي خنشلة</p>
                          <p className="text-lg font-bold">تذكرة حافلة</p>
                        </div>
                        <Bus className="h-8 w-8" />
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary-foreground/70" />
                          <div>
                            <p className="text-xs text-primary-foreground/70">التاريخ</p>
                            <p className="text-sm font-medium">{ticketData.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary-foreground/70" />
                          <div>
                            <p className="text-xs text-primary-foreground/70">الوقت</p>
                            <p className="text-sm font-medium">{ticketData.time}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-primary-foreground/20 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-primary-foreground/70">رقم التذكرة</p>
                          <p className="font-mono text-sm font-bold">{ticketData.ticketId}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.button
                    onClick={onClose}
                    className="mt-6 w-full rounded-2xl bg-muted py-4 font-bold text-foreground transition-all hover:bg-muted/80"
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    إغلاق
                  </motion.button>
                </motion.div>
              )}

              {/* Error State */}
              {status === "error" && (
                <motion.div
                  key="error"
                  className="p-6"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-6 flex flex-col items-center">
                    <motion.div
                      className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <AlertCircle className="h-10 w-10 text-destructive" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-destructive">فشل الدفع</h2>
                    <p className="mt-2 text-center text-muted-foreground">{errorMessage}</p>
                  </div>

                  {errorMessage === "الرصيد غير كافي" && (
                    <motion.div
                      className="mb-6 rounded-2xl bg-destructive/10 p-4 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-sm text-destructive">
                        رصيدك الحالي غير كافٍ لشراء تذكرة بقيمة {TICKET_PRICE} د.ج
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        يرجى شحن رصيدك والمحاولة مرة أخرى
                      </p>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <motion.button
                      onClick={onClose}
                      className="flex-1 rounded-2xl bg-muted py-4 font-bold text-foreground transition-all hover:bg-muted/80"
                      whileTap={{ scale: 0.97 }}
                    >
                      إغلاق
                    </motion.button>
                    <motion.button
                      onClick={() => setStatus("idle")}
                      className="flex-1 rounded-2xl bg-primary py-4 font-bold text-primary-foreground transition-all hover:bg-primary/90"
                      whileTap={{ scale: 0.97 }}
                    >
                      إعادة المحاولة
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
