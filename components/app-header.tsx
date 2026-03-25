"use client"

import { useState } from "react"
import { Bell, Menu, Bus, Moon, Sun, MapPin, Clock, Settings, HelpCircle, Info, ChevronLeft, ScanLine, Loader2, AlertCircle, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/lib/theme-context"
import { useDriverMode } from "@/lib/driver-mode-context"

const menuItems = [
  { icon: MapPin, label: "المحطات القريبة", href: "/stations" },
  { icon: Clock, label: "سجل الرحلات", href: "/trips" },
  { icon: Settings, label: "الإعدادات", href: "/settings" },
  { icon: HelpCircle, label: "المساعدة", href: "/help" },
  { icon: Info, label: "حول التطبيق", href: "/about" },
]

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme, isDark } = useTheme()
  const { enterDriverMode, isCheckingRole, roleError, clearRoleError } = useDriverMode()
  const router = useRouter()

  const handleEnterDriverMode = async () => {
    const success = await enterDriverMode()
    if (success) {
      setIsOpen(false)
      // Redirect to home where DriverDashboard renders when isDriverMode is true
      router.push("/")
    }
    // If not successful, keep sidebar open to show error
  }

  return (
    <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full bg-card/80 backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-[300px] max-h-dvh flex-col border-l-0 bg-card/95 p-0 backdrop-blur-xl" style={{ zIndex: 9999 }}>
          <SheetHeader className="shrink-0 border-b border-border bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Bus className="h-6 w-6" />
              </div>
              <div className="text-right">
                <SheetTitle className="text-lg font-bold text-primary-foreground">تنقلي خنشلة</SheetTitle>
                <p className="text-sm text-primary-foreground/80">النقل الحضري</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto pb-10" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Dark Mode Toggle */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={isDark ? "moon" : "sun"}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isDark ? (
                          <Moon className="h-5 w-5 text-primary" />
                        ) : (
                          <Sun className="h-5 w-5 text-primary" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">الوضع الليلي</p>
                    <p className="text-xs text-muted-foreground">
                      {isDark ? "مفعّل" : "معطّل"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-2">
              {menuItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    className="flex items-center gap-3 rounded-xl p-3 text-foreground transition-colors hover:bg-muted"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Driver Mode Switch */}
            <div className="mt-auto border-t border-border p-4">
              {/* Error Message */}
              <AnimatePresence>
                {roleError && (
                  <motion.div
                    className="mb-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p className="flex-1 text-sm text-destructive">{roleError}</p>
                    <button 
                      onClick={clearRoleError}
                      className="shrink-0 text-destructive/60 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleEnterDriverMode}
                disabled={isCheckingRole}
                className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 p-4 text-white transition-all hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  {isCheckingRole ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ScanLine className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold">
                    {isCheckingRole ? "جارٍ التحقق..." : "التبديل إلى وضع السائق"}
                  </p>
                  <p className="text-xs opacity-80">Driver Mode</p>
                </div>
                {!isCheckingRole && <ChevronLeft className="h-5 w-5" />}
              </button>
            </div>

            {/* Version info */}
            <div className="border-t border-border p-4">
              <p className="text-center text-xs text-muted-foreground">
                الإصدار 1.0.0 - تنقلي خنشلة
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <h1 className="text-lg font-bold text-foreground">تنقلي خنشلة</h1>
          <span className="text-xs text-muted-foreground">النقل الحضري</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Bus className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      <Button variant="ghost" size="icon" className="relative rounded-full bg-card/80 backdrop-blur-sm">
        <Bell className="h-5 w-5" />
        <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          3
        </span>
      </Button>
    </header>
  )
}
