"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Home, MapPin, Clock, User, QrCode, X, Wallet, ScanLine } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useUserCache } from "@/hooks/use-user-cache"
import { useAuth } from "@/lib/auth-context"

// Dynamic import with SSR disabled for QR code
const QRCodeDisplay = dynamic(
  () => import("@/components/qr-code-display").then(mod => ({ default: mod.QRCodeDisplay })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex h-[180px] w-[180px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
        </div>
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
)

// All nav items in order (RTL: right to left visually)
const navItems = [
  { icon: Home, label: "الرئيسية", href: "/", type: "link" as const },
  { icon: MapPin, label: "المحطات", href: "/stations", type: "link" as const },
  { icon: QrCode, label: "ادفع", href: "", type: "button" as const },
  { icon: Clock, label: "الرحلات", href: "/trips", type: "link" as const },
  { icon: User, label: "ملفي", href: "/profile", type: "link" as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleOpenModal = () => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 300)
    setShowModal(true)
  }

  return (
    <>
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-30"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      >
        {/* Solid nav bar with glass effect and top border */}
        <div className="border-t border-border/50 bg-card/95 pb-safe backdrop-blur-xl">
          {/* Subtle top shadow for depth */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          
          {/* Nav content - 5 equal slots */}
          <div className="flex h-16 items-stretch">
            {navItems.map((item, index) => {
              const isActive = item.type === "link" && pathname === item.href
              const isCenter = index === 2

              // Center QR button
              if (isCenter) {
                return (
                  <div key={item.label} className="flex flex-1 items-center justify-center">
                    {hasMounted && (
                      <motion.button
                        onClick={handleOpenModal}
                        className="flex flex-col items-center gap-1"
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        aria-label="دفع سريع"
                      >
                        {/* Circular green container with neon glow */}
                        <motion.div
                          className={`qr-button-glow flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ${isPulsing ? 'button-pulse' : ''}`}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <QrCode className="h-5 w-5" strokeWidth={2} />
                        </motion.div>
                        <span className="text-[10px] font-medium text-primary">{item.label}</span>
                      </motion.button>
                    )}
                  </div>
                )
              }

              // Regular nav items
              return (
                <Link key={item.label} href={item.href} className="flex flex-1 items-center justify-center">
                  <motion.div
                    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    <motion.div
                      className="relative z-10"
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>
                    
                    <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </motion.nav>

      {/* QR Modal Portal */}
      {hasMounted && showModal && createPortal(
        <PaymentQRModal isOpen={showModal} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  )
}

interface PaymentQRModalProps {
  isOpen: boolean
  onClose: () => void
}

function PaymentQRModal({ isOpen, onClose }: PaymentQRModalProps) {
  const { userData, isLoading } = useUserCache()
  const { session } = useAuth()

  // Identity always comes from the auth session; Firestore fills in extras (balance)
  const userId   = session?.phone ?? ""
  const userName = session?.name  ?? userData?.fullName ?? "مستخدم"
  const userPhone = session?.phone ?? userData?.Phone ?? ""

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handlePopState = () => {
      onClose()
    }

    window.history.pushState({ modal: "qr-payment" }, "")
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("popstate", handlePopState)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("popstate", handlePopState)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-card/90 text-foreground shadow-xl backdrop-blur-sm transition-colors hover:bg-card"
            style={{ zIndex: 10000 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1 }}
            aria-label="إغلاق"
          >
            <X className="h-6 w-6" />
          </motion.button>
          
          {/* Modal Content */}
          <motion.div
            className="relative mx-4 w-full max-w-sm"
            style={{ zIndex: 9999 }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-3xl bg-card shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">محفظتي</span>
                  </div>
                  <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium">
                    نشط
                  </span>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm opacity-80">الرصيد الحالي</p>
                  <div className="text-3xl font-bold" dir="ltr">
                    {isLoading ? "..." : (userData?.balance ?? 0).toLocaleString("ar-DZ")} <span className="text-lg">د.ج</span>
                  </div>
                </div>

                <p className="text-sm font-medium">
                  {isLoading ? "جاري التحميل..." : userName}
                </p>
              </div>

              {/* QR Code Section */}
              <div className="p-6">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold text-foreground">رمز الدفع السريع</h3>
                  <p className="text-sm text-muted-foreground">أظهر هذا الكود للسائق للدفع</p>
                </div>

                <QRCodeDisplay
                  userId={userId}
                  userName={userName}
                  userPhone={userPhone}
                />

                {/* Scan Instruction */}
                <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <ScanLine className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">امسح وانطلق</p>
                    <p className="text-sm text-muted-foreground">Scan & Go</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
