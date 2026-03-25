"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bus, Phone, User, ArrowLeft, Check, RefreshCcw, Loader2, ShieldCheck, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

// ─── Mock mode (real Firebase SMS disabled) ───────────────────────────────────
// To re-enable real SMS: uncomment the block below, remove MOCK_OTP, and
// replace sendSms() with the real implementation further down.
//
// import { auth } from "@/lib/firebase"
// import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth"
//
// function getFirebaseErrorMessage(code: string): string {
//   switch (code) {
//     case "auth/invalid-phone-number":   return "رقم الهاتف غير صالح. تأكد من الصيغة الصحيحة."
//     case "auth/too-many-requests":      return "طلبات كثيرة جداً. حاول مرة أخرى لاحقاً."
//     case "auth/invalid-verification-code": return "رمز التحقق غير صحيح. حاول مرة أخرى."
//     case "auth/code-expired":           return "انتهت صلاحية الرمز. اطلب رمزاً جديداً."
//     case "auth/quota-exceeded":         return "تم تجاوز الحد اليومي للرسائل. حاول غداً."
//     case "auth/captcha-check-failed":   return "فشل التحقق من reCAPTCHA. أعد تحميل الصفحة."
//     default:                            return "حدث خطأ. يرجى المحاولة مرة أخرى."
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_OTP = "1234"
const RESEND_SECONDS = 60
const CODE_LENGTH = 4

type Step = "form" | "verification" | "success"

function formatAlgerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("213")) return `+${digits}`
  if (digits.startsWith("0")) return `+213${digits.slice(1)}`
  return `+213${digits}`
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [codeError, setCodeError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // When real Firebase SMS is re-enabled, also add:
  // const confirmationRef = useRef<ConfirmationResult | null>(null)
  // const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Countdown timer for resend button
  useEffect(() => {
    if (step !== "verification" || canResend) return
    setResendTimer(RESEND_SECONDS)
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
  }, [step, canResend])

  // ── Mock sendSms ──────────────────────────────────────────────────────────
  // Simulates the delay of a real SMS request.
  // Replace this entire function with the real implementation when ready:
  //
  //   const sendSms = useCallback(async (phoneRaw: string) => {
  //     setIsSending(true)
  //     try {
  //       if (recaptchaVerifierRef.current) { recaptchaVerifierRef.current.clear() }
  //       recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" })
  //       const e164 = formatAlgerianPhone(phoneRaw)
  //       const result = await signInWithPhoneNumber(auth, e164, recaptchaVerifierRef.current)
  //       confirmationRef.current = result
  //       setStep("verification")
  //       setCanResend(false)
  //       setTimeout(() => inputRefs.current[0]?.focus(), 300)
  //     } catch (err: unknown) {
  //       const code = (err as { code?: string }).code ?? ""
  //       // show error using getFirebaseErrorMessage(code)
  //     } finally { setIsSending(false) }
  //   }, [])
  //
  const sendSms = useCallback(async (_phoneRaw: string) => {
    setIsSending(true)
    await new Promise(r => setTimeout(r, 800)) // simulate network delay
    setIsSending(false)
    setStep("verification")
    setCanResend(false)
    setTimeout(() => inputRefs.current[0]?.focus(), 300)
  }, [])
  // ─────────────────────────────────────────────────────────────────────────

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    sendSms(phone.trim())
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)
    setCodeError("")
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // ── Mock handleVerify ─────────────────────────────────────────────────────
  // Checks against MOCK_OTP instead of calling confirmationResult.confirm().
  // When real Firebase SMS is re-enabled, replace with:
  //   await confirmationRef.current.confirm(entered)
  //   login(name.trim(), phone.trim())
  //   setStep("success")
  //   setTimeout(() => router.replace("/"), 1200)
  //
  const handleVerify = useCallback(async () => {
    const entered = code.join("")
    if (entered.length < CODE_LENGTH) return
    setIsVerifying(true)
    setCodeError("")
    await new Promise(r => setTimeout(r, 700))

    if (entered === MOCK_OTP) {
      const trimmedName  = name.trim()
      const trimmedPhone = phone.trim()

      // ── Step 1: Write to Firestore BEFORE calling login() ──────────────────
      // login() sets isAuthenticated → triggers a redirect useEffect on this
      // page → the component unmounts → any in-flight setDoc gets abandoned.
      // Writing first ensures the document exists in Firestore before we leave.
      try {
        const userRef = doc(db, "users", trimmedPhone)
        const snap    = await getDoc(userRef)
        if (!snap.exists()) {
          // New user — create document with all required fields
          await setDoc(userRef, {
            fullName:  trimmedName,
            Phone:     trimmedPhone,
            email:     "",
            address:   "",
            balance:   0,
            role:      "passenger",
            createdAt: serverTimestamp(),
          })
          console.log("[Auth] New user document created in Firestore:", trimmedPhone)
        } else {
          // Returning user — keep balance/role, just refresh the name
          await setDoc(userRef, { fullName: trimmedName }, { merge: true })
          console.log("[Auth] Existing user document updated in Firestore:", trimmedPhone)
        }
      } catch (err) {
        // Log the real error so it shows up in the browser console for debugging
        console.error("[Auth] Firestore user write failed:", err)
      }

      // ── Step 2: Show success screen ────────────────────────────────────────
      setStep("success")
      setIsVerifying(false)

      // ── Step 3: Persist session + navigate ────────────────────────────────
      login(trimmedName, trimmedPhone)
      setTimeout(() => router.replace("/"), 1200)
    } else {
      setCodeError("رمز التحقق غير صحيح. حاول مرة أخرى.")
      setCode(Array(CODE_LENGTH).fill(""))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
      setIsVerifying(false)
    }
  }, [code, login, name, phone, router])
  // ─────────────────────────────────────────────────────────────────────────

  // Auto-verify when all digits are entered
  useEffect(() => {
    if (step === "verification" && code.every(d => d !== "") && !isVerifying) {
      handleVerify()
    }
  }, [code, step, isVerifying, handleVerify])

  const handleResend = () => {
    if (!canResend) return
    setCode(Array(CODE_LENGTH).fill(""))
    setCodeError("")
    setCanResend(false)
    sendSms(phone.trim())
  }

  const handleBackToForm = () => {
    setStep("form")
    setCode(Array(CODE_LENGTH).fill(""))
    setCodeError("")
    setCanResend(false)
  }

  if (isLoading) return <div className="fixed inset-0 bg-slate-900" />

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-900 px-4">
      {/* reCAPTCHA anchor — kept in DOM for when real SMS is re-enabled */}
      <div id="recaptcha-container" />

      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div
        className="mb-8 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 ring-2 ring-emerald-500/30">
          <Bus className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">تنقلي خنشلة</h1>
          <p className="text-sm text-white/50">Tanakoli Khenchela</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-slate-800/80 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AnimatePresence mode="wait">

          {/* ─── Step 1: Form ─── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6"
            >
              <div className="mb-6 text-right">
                <h2 className="text-xl font-bold text-white">تسجيل الدخول</h2>
                <p className="mt-1 text-sm text-white/50">أدخل بياناتك للمتابعة</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="block text-right text-sm text-white/70">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      type="text"
                      placeholder="أدخل اسمك"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      dir="rtl"
                      className="border-white/10 bg-slate-700/60 pr-10 text-white placeholder:text-white/25 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="block text-right text-sm text-white/70">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      dir="ltr"
                      className="border-white/10 bg-slate-700/60 pr-10 text-left text-white placeholder:text-white/25 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                  <p className="text-right text-xs text-white/30">مثال: 0775453629</p>
                </div>

                <Button
                  type="submit"
                  disabled={!name.trim() || !phone.trim() || isSending}
                  className="mt-2 w-full gap-2 bg-emerald-500 font-bold text-white hover:bg-emerald-600 disabled:opacity-40"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جارٍ الإرسال…</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال رمز التحقق</span>
                      <ArrowLeft className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ─── Step 2: Verification ─── */}
          {step === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6"
            >
              <button
                onClick={handleBackToForm}
                className="mb-4 flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
                رجوع
              </button>

              <div className="mb-6 text-right">
                <h2 className="text-xl font-bold text-white">رمز التحقق</h2>
                <p className="mt-1 text-sm text-white/50">
                  أدخل رمز التحقق المرسل إلى{" "}
                  <span className="font-medium text-emerald-400" dir="ltr">
                    {formatAlgerianPhone(phone)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-white/30">الرمز مكون من 4 أرقام</p>
              </div>

              {/* 4-digit code inputs */}
              <div className="mb-4 flex justify-center gap-2" dir="ltr">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className={`h-12 w-10 rounded-xl border-2 bg-slate-700/60 text-center text-xl font-bold text-white outline-none transition-all ${
                      codeError
                        ? "border-red-500 text-red-400"
                        : digit
                        ? "border-emerald-500"
                        : "border-white/10 focus:border-emerald-500/70"
                    }`}
                  />
                ))}
              </div>

              {codeError && (
                <motion.div
                  className="mb-3 flex items-start gap-2 rounded-xl bg-red-500/10 p-3"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-right text-sm text-red-400">{codeError}</p>
                </motion.div>
              )}

              <Button
                onClick={handleVerify}
                disabled={code.some(d => !d) || isVerifying}
                className="w-full gap-2 bg-emerald-500 font-bold text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>تحقق</span>
                )}
              </Button>

              <div className="mt-4 text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={isSending}
                    className="flex items-center justify-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    إعادة الإرسال
                  </button>
                ) : (
                  <p className="text-sm text-white/30">
                    إعادة الإرسال بعد{" "}
                    <span className="tabular-nums text-white/50">{resendTimer}</span>
                    {" "}ثانية
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Success ─── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <ShieldCheck className="h-10 w-10 text-emerald-400" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">تم تسجيل الدخول!</h2>
                <p className="mt-1 text-sm text-white/50">جاري التحويل…</p>
              </div>
              <motion.div
                className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">مرحباً {name}</span>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <motion.p
        className="mt-8 text-center text-xs text-white/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        ETUS Khenchela · مؤسسة النقل الحضري
      </motion.p>
    </div>
  )
}
