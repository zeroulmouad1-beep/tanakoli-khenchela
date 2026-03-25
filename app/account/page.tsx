"use client"

import { useState, useEffect, useCallback } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { User, Phone, Heart, LogIn, Check, Wallet, QrCode, Plus, X, Shield, ArrowRight, Loader2, Mail, MapPin, Pencil, Save, CreditCard, LogOut, Settings, LifeBuoy, Info, ChevronLeft, Bell, Globe, Moon, MessageCircle, HelpCircle, ExternalLink, Bus, ScanLine } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDriverMode } from "@/lib/driver-mode-context"
import { db } from "@/lib/firebase"
import { doc, runTransaction } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { useUserCache } from "@/hooks/use-user-cache"
import { useAuth } from "@/lib/auth-context"
import { useApp } from "@/components/app-wrapper"
import { BalanceCardSkeleton, ProfileInfoSkeleton } from "@/components/skeleton-loader"
import { PageTransition } from "@/components/page-transition"

type LoginStep = "form" | "verification" | "success"

interface UserData {
  fullName: string
  email: string
  address: string
  Phone: string
  balance: number
}

export default function AccountPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loginStep, setLoginStep] = useState<LoginStep>("form")
  const [verificationCode, setVerificationCode] = useState(["", "", "", ""])
  const [codeError, setCodeError] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  // Auth session — name & phone entered at login, always reflects current user
  const { session } = useAuth()
  const sessionPhone = session?.phone ?? ""
  const sessionName  = session?.name  ?? ""

  // Use cached user data for instant loading
  const { userData, isLoading: userDataLoading, isLoggedIn, clearCache } = useUserCache()
  
  // Prevent hydration mismatch by waiting for client mount
  useEffect(() => {
    setHasMounted(true)
  }, [])
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editFullName, setEditFullName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  // Top-up modal states
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpMethod, setTopUpMethod] = useState<"code" | "driver">("code")
  const [topUpCode, setTopUpCode] = useState("")
  const [topUpLoading, setTopUpLoading] = useState(false)
  const [topUpError, setTopUpError] = useState("")
  
  const { toast } = useToast()
  const { logout: appLogout } = useApp()
  const router = useRouter()
  const { enterDriverMode } = useDriverMode()
  
  // Logout confirmation dialog state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const VALID_TOPUP_CODE = "KHENCHELA2026"
  const TOPUP_AMOUNT = 500

  // Initialize edit fields when userData changes
  useEffect(() => {
    if (userData) {
      setEditFullName(userData.fullName || "")
      setEditEmail(userData.email || "")
      setEditAddress(userData.address || "")
    }
  }, [userData])

  // Start countdown when entering verification step
  useEffect(() => {
    if (loginStep === "verification") {
      setResendTimer(60)
      setCanResend(false)
    }
  }, [loginStep])

  // Countdown timer effect
  useEffect(() => {
    if (loginStep !== "verification" || canResend) return

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loginStep, canResend])

  const handleResendCode = useCallback(() => {
    if (!canResend) return
    setResendTimer(60)
    setCanResend(false)
  }, [canResend])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && phone) {
      setLoginStep("verification")
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    setCodeError(false)

    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyCode = () => {
    const code = verificationCode.join("")
    if (code === "1234") {
      setLoginStep("success")
      setTimeout(() => {
        setLoginStep("form")
        setVerificationCode(["", "", "", ""])
      }, 1500)
    } else {
      setCodeError(true)
    }
  }

  const handleBackToForm = () => {
    setLoginStep("form")
    setVerificationCode(["", "", "", ""])
    setCodeError(false)
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }
  
  const handleLogoutConfirm = () => {
    setIsLoggingOut(true)
    // Clear all user data and cache
    clearCache()
    setName("")
    setPhone("")
    // Small delay for visual feedback
    setTimeout(() => {
      setShowLogoutConfirm(false)
      setIsLoggingOut(false)
      // Navigate to splash screen
      appLogout()
    }, 500)
  }
  
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false)
  }

  const handleStartEdit = () => {
    if (userData) {
      setEditFullName(userData.fullName || "")
      setEditEmail(userData.email || "")
      setEditAddress(userData.address || "")
    }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (userData) {
      setEditFullName(userData.fullName || "")
      setEditEmail(userData.email || "")
      setEditAddress(userData.address || "")
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const userDocRef = doc(db, "users", sessionPhone)
      await runTransaction(db, async (tx) => {
        tx.update(userDocRef, {
          fullName: editFullName,
          email: editEmail,
          address: editAddress,
        })
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTopUp = async () => {
    setTopUpError("")
    
    if (topUpCode.trim().toUpperCase() !== VALID_TOPUP_CODE) {
      setTopUpError("رمز الشحن غير صحيح")
      return
    }
    
    setTopUpLoading(true)
    try {
      const userDocRef = doc(db, "users", sessionPhone)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userDocRef)
        const currentBal = snap.exists() ? (snap.data()?.balance ?? 0) : 0
        tx.set(userDocRef, { balance: currentBal + TOPUP_AMOUNT }, { merge: true })
      })
      
      // Show success toast
      toast({
        title: "تم شحن رصيدك بنجاح",
        description: `تمت إضافة ${TOPUP_AMOUNT} د.ج إلى رصيدك`,
        duration: 5000,
      })
      
      // Close modal and reset
      setShowTopUp(false)
      setTopUpCode("")
    } catch (error) {
      console.error("Error topping up:", error)
      setTopUpError("حدث خطأ أثناء الشحن. حاول مرة أخرى")
    } finally {
      setTopUpLoading(false)
    }
  }

  const handleCloseTopUp = () => {
    setShowTopUp(false)
    setTopUpCode("")
    setTopUpError("")
    setTopUpMethod("code")
  }

  const favoriteRoutes = [
    { id: 1, from: "الجامعة", to: "وسط المدينة", line: "01" },
    { id: 2, from: "المستش��ى", to: "السوق المركزي", line: "02" },
  ]

  // Generate QR code data for payments — uses session identity (always correct)
  const qrCodeData = JSON.stringify({
    userId: sessionPhone,
    name: sessionName,
    phone: sessionPhone,
    timestamp: Date.now(),
  })

  if (userDataLoading && !userData) {
    return (
      <PageTransition>
        <main className="min-h-screen bg-background pb-40">
          <AppHeader />
          <div className="px-4 pt-20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">حسابي</h1>
                <p className="text-sm text-muted-foreground">جاري التحميل...</p>
              </div>
            </div>
            <div className="space-y-4">
              <BalanceCardSkeleton />
              <ProfileInfoSkeleton />
            </div>
          </div>
          <BottomNav />
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-background pb-40">
        <AppHeader />
      
      <div className="px-4 pt-20">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">حسابي</h1>
            <p className="text-sm text-muted-foreground">
              {!hasMounted ? "جاري التحميل..." : (isLoggedIn && userData ? `مرحباً، ${sessionName || userData.fullName}` : "تسجيل الدخول أو إنشاء حساب")}
            </p>
          </div>
        </div>

        {!isLoggedIn || !userData ? (
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <LogIn className="h-10 w-10 text-primary" />
              </div>
            </div>

            <h2 className="mb-2 text-center text-lg font-bold text-foreground">
              أهلاً بك في تنقلي خنشلة
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              سجل دخولك لحفظ مساراتك المفضلة
            </p>

            {loginStep === "success" ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <Check className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">تم التحقق بنجاح!</p>
              </div>
            ) : loginStep === "verification" ? (
              <div className="space-y-6">
                <button
                  onClick={handleBackToForm}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>رجوع</span>
                </button>

                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground">التحقق من رقم الهاتف</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    تم إرسال رمز التحقق إلى رقمك
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary" dir="ltr">{phone}</p>
                </div>

                <div className="flex justify-center gap-3" dir="ltr">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && index > 0) {
                          const prevInput = document.getElementById(`code-${index - 1}`)
                          prevInput?.focus()
                        }
                      }}
                      className={`h-14 w-14 rounded-xl border-2 bg-input text-center text-xl font-bold text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        codeError ? "border-destructive" : "border-border"
                      }`}
                    />
                  ))}
                </div>

                {codeError && (
                  <p className="text-center text-sm text-destructive">
                    رمز التحقق غير صحيح. جرب: 1234
                  </p>
                )}

                <button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.some((d) => !d)}
                  className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد الرمز
                </button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    لم تستلم الرمز؟
                  </p>
                  <button
                    onClick={handleResendCode}
                    disabled={!canResend}
                    className={`font-medium text-sm transition-colors ${
                      canResend
                        ? "text-primary hover:underline cursor-pointer"
                        : "text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {canResend ? (
                      "إعادة الإرسال"
                    ) : (
                      <span>
                        إعادة الإرسال بعد{" "}
                        <span className="inline-block w-8 text-center font-bold tabular-nums">
                          {resendTimer}
                        </span>{" "}
                        ثانية
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك"
                      className="w-full rounded-xl border border-border bg-input py-3 pr-10 pl-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full rounded-xl border border-border bg-input py-3 pr-10 pl-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  تسجيل الدخول
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance Card at Top */}
            <div className="rounded-2xl bg-gradient-to-l from-primary to-primary/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                  <h3 className="font-bold text-primary-foreground">محفظتي</h3>
                </div>
                <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
                  نشط
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-primary-foreground/80">الرصيد الحالي</p>
                <div className="text-3xl font-bold text-primary-foreground" dir="ltr">
                  {(userData.balance ?? 0).toLocaleString("ar-DZ")} <span className="text-lg">د.ج</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRCode(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-foreground py-3 font-medium text-primary transition-colors hover:bg-primary-foreground/90"
                >
                  <QrCode className="h-5 w-5" />
                  <span>رمز الدفع</span>
                </button>
                <button 
                  onClick={() => setShowTopUp(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-foreground/20 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/30"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>شحن الرصيد</span>
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">المعلومات الشخصية</h3>
                    <p className="text-sm text-muted-foreground">بيانات حسابك</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>تعديل</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>حفظ</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">الاسم الكامل</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{sessionName || userData.fullName || "—"}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        dir="ltr"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground" dir="ltr">{userData.email || "—"}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{userData.address || "—"}</p>
                    )}
                  </div>
                </div>

                {/* Phone (Read-only) */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="text-sm font-medium text-foreground" dir="ltr">{sessionPhone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-foreground">النشاط الأخير</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">شحن الرصيد</p>
                      <p className="text-xs text-muted-foreground">اليوم، 10:30 صباحاً</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary" dir="ltr">+500 د.ج</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <QrCode className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">دفع تذكرة - خط 01</p>
                      <p className="text-xs text-muted-foreground">أمس، 08:15 صباحاً</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-destructive" dir="ltr">-30 د.ج</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <QrCode className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">دفع تذكرة - خط 02</p>
                      <p className="text-xs text-muted-foreground">قبل يومين، 05:45 مساءً</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-destructive" dir="ltr">-30 د.ج</span>
                </div>
              </div>
            </div>

            {/* QR Code Modal */}
            {showQRCode && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
                <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">رمز الدفع</h3>
                    <button
                      onClick={() => setShowQRCode(false)}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-2xl bg-white p-4 shadow-inner">
                      <QRCodeSVG
                        value={qrCodeData}
                        size={180}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4 text-center">
                    <p className="text-sm text-muted-foreground">قم بمسح الرمز للدفع</p>
                    <p className="mt-1 text-lg font-bold text-primary">30.00 د.ج</p>
                    <p className="text-xs text-muted-foreground">سعر التذكرة الواحدة</p>
                  </div>
                  
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      صالح لمدة 5 دقائق | المستخدم: {sessionName || userData.fullName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top-up Modal */}
            {showTopUp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
                <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">شحن الرصيد</h3>
                    <button
                      onClick={handleCloseTopUp}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Tab Buttons */}
                  <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1">
                    <button
                      onClick={() => setTopUpMethod("code")}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                        topUpMethod === "code"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      شحن برمز
                    </button>
                    <button
                      onClick={() => setTopUpMethod("driver")}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                        topUpMethod === "driver"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      شحن عبر السائق
                    </button>
                  </div>
                  
                  {topUpMethod === "code" ? (
                    <>
                      {/* Code Recharge Content */}
                      <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="mb-4 text-center">
                        <p className="text-sm text-muted-foreground">أدخل رمز الشحن للحصول على</p>
                        <p className="mt-1 text-2xl font-bold text-primary">500 د.ج</p>
                      </div>
                      
                      <div className="mb-4">
                        <input
                          type="text"
                          value={topUpCode}
                          onChange={(e) => {
                            setTopUpCode(e.target.value.toUpperCase())
                            setTopUpError("")
                          }}
                          placeholder="أدخل رمز الشحن"
                          className="w-full rounded-xl border border-border bg-input py-3 px-4 text-center text-lg font-bold tracking-widest text-foreground placeholder:text-muted-foreground placeholder:font-normal placeholder:tracking-normal focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          dir="ltr"
                        />
                        {topUpError && (
                          <p className="mt-2 text-center text-sm text-destructive">{topUpError}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={handleTopUp}
                        disabled={!topUpCode.trim() || topUpLoading}
                        className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {topUpLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>جاري الشحن...</span>
                          </div>
                        ) : (
                          "تأكيد الشحن"
                        )}
                      </button>
                      
                      <p className="mt-4 text-center text-xs text-muted-foreground">
                        للتجربة، استخدم الرمز: KHENCHELA2026
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Driver Recharge Content */}
                      <div className="mb-4 text-center">
                        <p className="text-sm text-muted-foreground">أظهر هذا الكود للسائق لشحن رصيدك</p>
                      </div>
                      
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <QRCodeSVG
                            value={JSON.stringify({
                              type: "TOPUP_REQUEST",
                              userId: sessionPhone,
                              phone: sessionPhone,
                              name: sessionName,
                              timestamp: new Date().toISOString(),
                            })}
                            size={180}
                            level="H"
                            includeMargin={false}
                            fgColor="#16a34a"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4 rounded-xl bg-primary/5 p-4">
                        <div className="mb-2 flex items-center justify-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">{sessionName || userData.fullName}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground" dir="ltr">{sessionPhone}</span>
                        </div>
                      </div>
                      
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <h4 className="mb-2 text-center text-sm font-medium text-foreground">كيف يعمل؟</h4>
                        <ol className="space-y-2 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                            <span>أظهر هذا الكود للسائق</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                            <span>ادفع المبلغ نقداً للسائق</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                            <span>سيقوم السائق بمسح الكود وشحن رصيدك فوراً</span>
                          </li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">المسارات المفضلة</h3>
              </div>
              
              <div className="space-y-2">
                {favoriteRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        خط {route.line}
                      </span>
                      <span className="text-sm text-foreground">
                        {route.from} ← {route.to}
                      </span>
                    </div>
                    <Heart className="h-4 w-4 fill-primary text-primary" />
                  </div>
                ))}
              </div>

              <button className="mt-3 w-full rounded-xl border border-primary bg-transparent py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
                إضافة مسار جديد
              </button>
            </div>

            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3 font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
            
            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <LogOut className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                  
                  <h3 className="mb-2 text-center text-lg font-bold text-foreground">
                    هل أنت متأكد من تسجيل الخروج؟
                  </h3>
                  <p className="mb-6 text-center text-sm text-muted-foreground">
                    Are you sure you want to logout?
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleLogoutCancel}
                      disabled={isLoggingOut}
                      className="flex-1 rounded-xl border border-border bg-muted py-3 font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleLogoutConfirm}
                      disabled={isLoggingOut}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" />
                          <span>خروج</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      </main>
    </PageTransition>
  )
}
