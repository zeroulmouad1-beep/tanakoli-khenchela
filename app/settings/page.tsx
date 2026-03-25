"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { Settings, Bell, Volume2, Globe, ChevronLeft, ChevronRight, Moon, Sun, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/lib/theme-context"
import { PageTransition } from "@/components/page-transition"

type Language = "ar" | "fr" | "en"

const languages = [
  { code: "ar" as Language, name: "العربية", nativeName: "العربية" },
  { code: "fr" as Language, name: "Français", nativeName: "Français" },
  { code: "en" as Language, name: "English", nativeName: "English" },
]

export default function SettingsPage() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()

  const [tripNotifications, setTripNotifications] = useState(true)
  const [alertSounds, setAlertSounds] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("ar")
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    try {
      const savedNotifications = localStorage.getItem("tripNotifications")
      const savedSounds = localStorage.getItem("alertSounds")
      const savedLanguage = localStorage.getItem("appLanguage") as Language

      if (savedNotifications !== null) setTripNotifications(savedNotifications === "true")
      if (savedSounds !== null) setAlertSounds(savedSounds === "true")
      if (savedLanguage) setSelectedLanguage(savedLanguage)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const handleTripNotificationsChange = (value: boolean) => {
    setTripNotifications(value)
    try { localStorage.setItem("tripNotifications", String(value)) } catch { /* ignore */ }
  }

  const handleAlertSoundsChange = (value: boolean) => {
    setAlertSounds(value)
    try { localStorage.setItem("alertSounds", String(value)) } catch { /* ignore */ }
  }

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang)
    setShowLanguageSelector(false)
    try { localStorage.setItem("appLanguage", lang) } catch { /* ignore */ }
  }

  const currentLanguage = languages.find(l => l.code === selectedLanguage)

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
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
              <p className="text-sm text-muted-foreground">تخصيص تجربتك</p>
            </div>
          </motion.div>

          <div className="space-y-4">
            {/* Notifications Section */}
            <motion.div
              className="rounded-2xl bg-card p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Bell className="h-5 w-5 text-primary" />
                الإشعارات
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">إشعارات الرحلات</p>
                      <p className="text-sm text-muted-foreground">تنبيهات وصول الحافلة</p>
                    </div>
                  </div>
                  {hasMounted && (
                    <Switch
                      checked={tripNotifications}
                      onCheckedChange={handleTripNotificationsChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Volume2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">صوت التنبيهات</p>
                      <p className="text-sm text-muted-foreground">تشغيل الأصوات</p>
                    </div>
                  </div>
                  {hasMounted && (
                    <Switch
                      checked={alertSounds}
                      onCheckedChange={handleAlertSoundsChange}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Appearance Section */}
            <motion.div
              className="rounded-2xl bg-card p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                المظهر
              </h2>

              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">الوضع الليلي</p>
                    <p className="text-sm text-muted-foreground">{isDark ? "مفعّل" : "معطّل"}</p>
                  </div>
                </div>
                {hasMounted && (
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-primary"
                  />
                )}
              </div>
            </motion.div>

            {/* Language Section */}
            <motion.div
              className="rounded-2xl bg-card p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                اللغة
              </h2>

              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="flex w-full items-center justify-between rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">لغة التطبيق</p>
                    <p className="text-sm text-muted-foreground">{currentLanguage?.nativeName}</p>
                  </div>
                </div>
                <ChevronLeft className={`h-5 w-5 text-muted-foreground transition-transform ${showLanguageSelector ? "rotate-90" : ""}`} />
              </button>

              {showLanguageSelector && (
                <motion.div
                  className="mt-3 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`flex w-full items-center justify-between rounded-xl p-4 transition-colors ${
                        selectedLanguage === lang.code
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-foreground">{lang.nativeName}</span>
                        <span className="text-sm text-muted-foreground">({lang.name})</span>
                      </div>
                      {selectedLanguage === lang.code && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <BottomNav />
      </main>
    </PageTransition>
  )
}
