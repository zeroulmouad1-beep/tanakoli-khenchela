"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { HelpCircle, Phone, MessageCircle, ChevronRight, ChevronDown, CreditCard, Navigation, Mail, ExternalLink } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

interface FAQItem {
  id: string
  question: string
  answer: string
  icon: typeof CreditCard
}

const faqItems: FAQItem[] = [
  {
    id: "payment",
    question: "كيفية الدفع؟",
    answer: "يمكنك الدفع بعدة طرق: 1) شحن رصيدك عبر رمز الشحن من نقاط البيع المعتمدة، 2) الدفع مباشرة للسائق نقداً، 3) استخدام رمز QR في محفظتك للدفع الإلكتروني. تذكرة الرحلة الواحدة بـ 30 د.ج.",
    icon: CreditCard,
  },
  {
    id: "tracking",
    question: "كيف أتتبع الحافلة؟",
    answer: "من الشاشة الرئيسية، اختر خط الحافلة الذي تريده واضغط على زر 'تتبع'. ستظهر لك الخريطة مع موقع الحافلة في الوقت الفعلي ووقت الوصول المتوقع إلى محطتك.",
    icon: Navigation,
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const handlePhoneCall = () => {
    window.location.href = "tel:+213555123456"
  }

  const handleWhatsApp = () => {
    window.open("https://wa.me/213555123456?text=مرحباً، أحتاج مساعدة بخصوص تطبيق تنقلي خنشلة", "_blank")
  }

  const handleEmail = () => {
    window.location.href = "mailto:support@tanakoli-khenchela.dz?subject=طلب دعم - تنقلي خنشلة"
  }

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
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">المساعدة</h1>
              <p className="text-sm text-muted-foreground">مركز الدعم والأسئلة</p>
            </div>
          </motion.div>

          {/* Contact Us Section */}
          <motion.div
            className="mb-6 rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <Phone className="h-5 w-5 text-primary" />
              اتصل بنا
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Phone Call */}
              <button
                onClick={handlePhoneCall}
                className="flex items-center gap-4 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-600 p-4 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold">اتصل بنا</p>
                  <p className="text-sm text-white/80">خط الدعم المباشر</p>
                </div>
                <ExternalLink className="h-5 w-5 text-white/60" />
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-4 rounded-xl bg-gradient-to-l from-green-500 to-green-600 p-4 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold">واتساب الدعم</p>
                  <p className="text-sm text-white/80">رد سريع عبر الرسائل</p>
                </div>
                <ExternalLink className="h-5 w-5 text-white/60" />
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="flex items-center gap-4 rounded-xl bg-gradient-to-l from-blue-500 to-blue-600 p-4 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold">البريد الإلكتروني</p>
                  <p className="text-sm text-white/80">support@tanakoli-khenchela.dz</p>
                </div>
                <ExternalLink className="h-5 w-5 text-white/60" />
              </button>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            className="rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <HelpCircle className="h-5 w-5 text-primary" />
              الأسئلة الشائعة
            </h2>
            
            <div className="space-y-3">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-muted/30"
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="flex w-full items-center gap-3 p-4 text-right transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                        expandedFAQ === item.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {expandedFAQ === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border bg-muted/20 p-4">
                          <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Support Hours */}
          <motion.div
            className="mt-6 rounded-xl bg-muted/50 p-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">
              ساعات العمل: <span className="font-medium text-foreground">08:00 - 20:00</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              من السبت إلى الخميس
            </p>
          </motion.div>
        </div>

        <BottomNav />
      </main>
    </PageTransition>
  )
}
