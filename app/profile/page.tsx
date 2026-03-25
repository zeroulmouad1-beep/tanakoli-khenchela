"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  HelpCircle,
  Bus,
  Info,
  Shield,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { PageTransition } from "@/components/page-transition"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserCache } from "@/hooks/use-user-cache"
import { useAuth } from "@/lib/auth-context"

const quickLinks = [
  { icon: Clock, label: "سجل الرحلات", sub: "عرض رحلاتك السابقة", href: "/trips", color: "bg-blue-500/10 text-blue-500" },
  { icon: MapPin, label: "المحطات القريبة", sub: "ابحث عن محطة بالقرب منك", href: "/stations", color: "bg-amber-500/10 text-amber-500" },
  { icon: Settings, label: "الإعدادات", sub: "تخصيص التطبيق", href: "/settings", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: HelpCircle, label: "المساعدة", sub: "الأسئلة الشائعة والدعم", href: "/help", color: "bg-purple-500/10 text-purple-500" },
  { icon: Info, label: "حول التطبيق", sub: "معلومات الإصدار", href: "/about", color: "bg-sky-500/10 text-sky-500" },
]

export default function ProfilePage() {
  const router = useRouter()
  const { userData, isLoading } = useUserCache()
  const { session } = useAuth()

  // Session holds the name & phone the user entered at login — always current
  const displayName  = session?.name  || userData?.fullName || "مستخدم"
  const displayPhone = session?.phone || userData?.Phone    || "—"

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

          {/* Profile Hero Card */}
          <motion.div
            className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 p-6 text-primary-foreground shadow-lg"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Avatar + Name */}
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1 text-right">
                {isLoading ? (
                  <>
                    <Skeleton className="mb-2 h-5 w-36 bg-primary-foreground/20" />
                    <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold leading-tight">
                      {displayName}
                    </h1>
                    <p className="mt-0.5 text-sm text-primary-foreground/75">
                      {displayPhone}
                    </p>
                  </>
                )}
              </div>
            </div>

            <Separator className="mb-5 bg-primary-foreground/20" />

            {/* Balance */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-primary-foreground/70">الرصيد الحالي</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-6 w-28 bg-primary-foreground/20" />
                ) : (
                  <p className="text-2xl font-bold" dir="ltr">
                    {(userData?.balance ?? 0).toLocaleString("ar-DZ")}{" "}
                    <span className="text-base font-medium">د.ج</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Info Details Card */}
          <motion.div
            className="mb-4 rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              معلومات الحساب
            </h2>

            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-4 w-28" />
                  ) : (
                    <p className="font-medium text-foreground" dir="ltr">
                      {displayPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-4 w-40" />
                  ) : (
                    <p className="font-medium text-foreground">
                      {userData?.email || "—"}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">العنوان</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-4 w-32" />
                  ) : (
                    <p className="font-medium text-foreground">
                      {userData?.address || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Manage Account Link */}
            <Link
              href="/account"
              className="mt-4 flex w-full items-center justify-between rounded-xl bg-primary/10 p-3 transition-colors hover:bg-primary/20"
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-2 text-right">
                <span className="font-medium text-primary">إدارة الحساب</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="rounded-2xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
              <Bus className="h-4 w-4 text-primary" />
              روابط سريعة
            </h2>

            <div className="space-y-2">
              {quickLinks.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <BottomNav />
      </main>
    </PageTransition>
  )
}
