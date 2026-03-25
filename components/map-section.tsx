"use client"

import { useEffect, useState, useId, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { MapSkeleton } from "./skeleton-loader"
import { useTracking } from "@/lib/tracking-context"
import { useTheme } from "@/lib/theme-context"
import {
  Navigation, X, Eye, EyeOff, Check, SlidersHorizontal,
} from "lucide-react"
import { signalMapReady } from "./app-wrapper"

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false })

/* ── Route data ─────────────────────────────────────────────────────────── */
const URBAN_ROUTES = [
  { id: "01", name: "خط 01 - وسط المدينة",    color: "#00A651" },
  { id: "02", name: "خط 02 - عين البيضاء",   color: "#00A651" },
  { id: "03", name: "خط 03 - المدينة الجديدة", color: "#00A651" },
]

const INTERCITY_ROUTES = [
  { id: "K1", name: "K1 - خنشلة - قايس",    color: "#3B82F6" },
  { id: "K2", name: "K2 - خنشلة - الشريعة", color: "#3B82F6" },
  { id: "K3", name: "K3 - بوحمامة",          color: "#3B82F6" },
  { id: "K4", name: "K4 - ششار",             color: "#3B82F6" },
  { id: "K5", name: "K5 - عين الطويلة",       color: "#3B82F6" },
  { id: "K6", name: "K6 - المحمل",            color: "#3B82F6" },
  { id: "K7", name: "K7 - طامزة",            color: "#3B82F6" },
  { id: "H1", name: "H1 - حمام الصالحين",    color: "#3B82F6" },
  { id: "B1", name: "B1 - طريق باتنة",       color: "#3B82F6" },
]

const ALL_ROUTES = [...URBAN_ROUTES, ...INTERCITY_ROUTES]

const LEGEND_ITEMS = [
  { color: "#00A651", label: "داخل المدينة", labelEn: "Urban" },
  { color: "#3B82F6", label: "بين البلديات", labelEn: "Inter-city" },
  { color: "#F59E0B", label: "سريع / طلاب", labelEn: "Express" },
]

/* ── Animated Eye icon (blink on toggle) ─────────────────────────────────── */
function AnimatedEye({ open }: { open: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {open ? (
        <motion.span
          key="eye"
          initial={{ opacity: 0, scaleY: 0.2 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0.2 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex" }}
        >
          <Eye className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      ) : (
        <motion.span
          key="eye-off"
          initial={{ opacity: 0, scaleY: 0.2 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0.2 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex" }}
        >
          <EyeOff className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ── Route Filter Bottom Sheet ───────────────────────────────────────────── */
interface SheetProps {
  isOpen: boolean
  selectedRoute: string | null
  showLegend: boolean
  onSelect: (id: string | null) => void
  onLegendToggle: () => void
  onClose: () => void
}

function RouteFilterSheet({
  isOpen, selectedRoute, showLegend, onSelect, onLegendToggle, onClose,
}: SheetProps) {
  const [justSelected, setJustSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const pick = (id: string | null) => {
    setJustSelected(id)
    onSelect(id)
    setTimeout(() => setJustSelected(null), 600)
    onClose()
  }

  const fontStack = "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[2000]"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #0F1923 0%, #0D1117 100%)",
              borderRadius: "28px 28px 0 0",
              maxHeight: "82vh",
              fontFamily: fontStack,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6), 0 -2px 0 rgba(255,255,255,0.04) inset",
            }}
            dir="rtl"
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3.5 pb-1">
              <motion.div
                className="rounded-full"
                style={{ width: 36, height: 4, background: "rgba(255,255,255,0.18)" }}
                whileHover={{ width: 48 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.25)" }}
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={2} style={{ color: "#00A651" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">الخطوط والفلترة</h3>
                  <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Routes & Filters
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <X className="h-4 w-4" strokeWidth={2} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* Legend toggle row */}
            <div className="mx-5 mb-3 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={onLegendToggle}
                className="flex w-full items-center justify-between px-4 py-3 transition-colors"
                style={{ background: showLegend ? "rgba(0,166,81,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{
                      background: showLegend ? "rgba(0,166,81,0.2)" : "rgba(255,255,255,0.07)",
                      color: showLegend ? "#00A651" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    <AnimatedEye open={showLegend} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: showLegend ? "#00A651" : "rgba(255,255,255,0.75)" }}>
                    دليل الألوان
                  </span>
                </div>

                {/* Animated legend dots */}
                <div className="flex items-center gap-2">
                  {LEGEND_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.labelEn}
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                      animate={showLegend
                        ? { scale: [1, 1.3, 1], opacity: 1 }
                        : { scale: 1, opacity: 0.35 }}
                      transition={{ delay: i * 0.07, duration: 0.35 }}
                    />
                  ))}
                </div>
              </button>

              {/* Inline legend (expands within sheet) */}
              <AnimatePresence>
                {showLegend && (
                  <motion.div
                    key="legend"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-around px-4 py-3"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      {LEGEND_ITEMS.map(item => (
                        <div key={item.labelEn} className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-5 rounded-full"
                            style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                              {item.label}
                            </span>
                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                              {item.labelEn}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable route list */}
            <div className="overflow-y-auto pb-10 px-5" style={{ overscrollBehavior: "contain" }}>
              {/* All routes */}
              <RouteRow
                id={null}
                name="كل الخطوط"
                color="conic"
                isSelected={selectedRoute === null}
                justSelected={justSelected === null}
                onClick={() => pick(null)}
              />

              <SectionLabel label="داخل المدينة" accent="#00A651" />
              {URBAN_ROUTES.map(r => (
                <RouteRow
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  color={r.color}
                  isSelected={selectedRoute === r.id}
                  justSelected={justSelected === r.id}
                  onClick={() => pick(r.id)}
                />
              ))}

              <SectionLabel label="بين البلديات" accent="#3B82F6" />
              {INTERCITY_ROUTES.map(r => (
                <RouteRow
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  color={r.color}
                  isSelected={selectedRoute === r.id}
                  justSelected={justSelected === r.id}
                  onClick={() => pick(r.id)}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SectionLabel({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-1 pt-4">
      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${accent}50)` }} />
      <span className="text-[11px] font-bold tracking-widest" style={{ color: accent }}>
        {label}
      </span>
      <div className="h-px w-4" style={{ background: `${accent}50` }} />
    </div>
  )
}

interface RouteRowProps {
  id: string | null
  name: string
  color: string
  isSelected: boolean
  justSelected: boolean
  onClick: () => void
}

function RouteRow({ id, name, color, isSelected, justSelected, onClick }: RouteRowProps) {
  const accentColor = isSelected ? (color === "conic" ? "#00A651" : color) : "rgba(255,255,255,0.85)"
  const rowBg = isSelected
    ? color === "conic" ? "rgba(0,166,81,0.12)" : `${color}18`
    : "transparent"

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="flex w-full items-center justify-between rounded-xl px-3 py-3"
      animate={{ background: rowBg }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        {/* Color dot with pulse on select */}
        <motion.div
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            background: color === "conic"
              ? "conic-gradient(#00A651 33%, #3B82F6 33% 66%, #F59E0B 66%)"
              : color,
          }}
          animate={justSelected
            ? {
                scale: [1, 1.6, 1],
                boxShadow: [
                  `0 0 0 0px ${color === "conic" ? "#00A651" : color}60`,
                  `0 0 0 8px ${color === "conic" ? "#00A651" : color}00`,
                ],
              }
            : { scale: 1, boxShadow: isSelected ? `0 0 0 2px ${color === "conic" ? "#00A651" : color}40` : "0 0 0 0px transparent" }
          }
          transition={{ duration: 0.5 }}
        />
        <span
          className="text-sm"
          style={{ color: accentColor, fontWeight: isSelected ? 600 : 400 }}
        >
          {name}
        </span>
      </div>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.18 }}
          >
            <Check
              className="h-3.5 w-3.5 flex-shrink-0"
              strokeWidth={2.5}
              style={{ color: color === "conic" ? "#00A651" : color }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ── Controls Bar (sits above StationsList, below map) ───────────────────── */
interface ControlsBarProps {
  activeRoute: typeof ALL_ROUTES[number] | null
  isDark: boolean
  showLegend: boolean
  onLegendToggle: () => void
  onOpenSheet: () => void
}

function ControlsBar({ activeRoute, isDark, showLegend, onLegendToggle, onOpenSheet }: ControlsBarProps) {
  const bg     = isDark ? "rgba(15,23,42,0.82)"    : "rgba(255,255,255,0.82)"
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"
  const text   = isDark ? "rgba(255,255,255,0.88)" : "#0F172A"
  const muted  = isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)"
  const fontStack = "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex items-center gap-2 rounded-2xl px-2 py-2"
      style={{
        background: bg,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${border}`,
        fontFamily: fontStack,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}
      dir="rtl"
    >
      {/* Routes & Filters button (flex-1, takes remaining space) */}
      <button
        onClick={onOpenSheet}
        className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 transition-colors active:scale-[0.98]"
        style={{ background: "transparent" }}
      >
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: activeRoute ? `${activeRoute.color}22` : "rgba(0,166,81,0.12)",
            border: `1px solid ${activeRoute ? `${activeRoute.color}40` : "rgba(0,166,81,0.25)"}`,
          }}
        >
          <SlidersHorizontal
            className="h-3.5 w-3.5"
            strokeWidth={2}
            style={{ color: activeRoute ? activeRoute.color : "#00A651" }}
          />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold" style={{ color: text }}>
            الخطوط والفلترة
          </span>
          {activeRoute ? (
            <span className="text-[10px]" style={{ color: activeRoute.color }}>
              {activeRoute.name.split(" - ")[0]} نشط
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: muted }}>
              Routes & Filters
            </span>
          )}
        </div>
        <div className="mr-auto flex items-center gap-1 pl-1">
          {[{ c: "#00A651" }, { c: "#3B82F6" }, { c: "#F59E0B" }].map(({ c }) => (
            <div
              key={c}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: c,
                opacity: activeRoute ? (activeRoute.color === c ? 1 : 0.28) : 0.65,
              }}
            />
          ))}
        </div>
      </button>

      {/* Divider */}
      <div className="h-8 w-px flex-shrink-0" style={{ background: border }} />

      {/* Legend / Eye toggle */}
      <button
        onClick={onLegendToggle}
        className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-colors active:scale-[0.98]"
        style={{
          background: showLegend ? "rgba(0,166,81,0.11)" : "transparent",
        }}
      >
        <div style={{ color: showLegend ? "#00A651" : muted }}>
          <AnimatedEye open={showLegend} />
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: showLegend ? "#00A651" : muted }}
        >
          الدليل
        </span>
      </button>
    </motion.div>
  )
}

/* ── MapSection (main export) ────────────────────────────────────────────── */
export function MapSection() {
  const [isMounted,   setIsMounted]   = useState(false)
  const [isMapReady,  setIsMapReady]  = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [showLegend,  setShowLegend]  = useState(false)
  const [showSheet,   setShowSheet]   = useState(false)
  const mapId = useId()
  const { trackingState, stopTracking } = useTracking()
  const { isDark } = useTheme()

  useEffect(() => {
    setIsMounted(true)
    const t = setTimeout(() => { setIsMapReady(true); signalMapReady() }, 500)
    return () => clearTimeout(t)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-4">
        <MapSkeleton />
      </div>
    )
  }

  const activeRoute = ALL_ROUTES.find(r => r.id === selectedRoute) ?? null

  return (
    <div className="flex flex-col gap-4 px-4 pb-2">

      {/* ── Map card ──────────────────────────────────────────────────────── */}
      <motion.div
        className="relative h-[280px] w-full overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Map canvas */}
        <motion.div
          className="h-full w-full"
          animate={{ opacity: isMapReady ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <LeafletMap
            key={mapId}
            trackingLineId={trackingState.busLineId}
            controlledRoute={selectedRoute}
          />
        </motion.div>

        {/* Loading spinner */}
        {!isMapReady && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: isDark ? "#0F172A" : "#F1F5F9" }}
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="h-8 w-8 rounded-full border-2"
                style={{ borderColor: "rgba(0,166,81,0.2)", borderTopColor: "#00A651" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                جاري تحميل الخريطة…
              </span>
            </div>
          </div>
        )}

        {/* Active route pill inside map */}
        <AnimatePresence>
          {activeRoute && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white"
              style={{
                background: `${activeRoute.color}dd`,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: `0 2px 12px ${activeRoute.color}60`,
                fontFamily: "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif",
              }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-white"
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[11px] font-semibold">{activeRoute.name.split(" - ")[0]}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live tracking badge */}
        <AnimatePresence>
          {trackingState.isTracking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-[1000] flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{
                top: activeRoute ? 40 : 12,
                right: 12,
                background: "#00A651",
                fontFamily: "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-white"
              />
              <Navigation className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              <span className="text-xs font-semibold text-white">{trackingState.busLineName}</span>
              <button
                onClick={stopTracking}
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.22)" }}
                aria-label="إيقاف التتبع"
              >
                <X className="h-3 w-3 text-white" strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* City label badge */}
        <motion.div
          className="absolute bottom-2 left-2 z-[1000] rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: isDark ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
            color: isDark ? "rgba(255,255,255,0.88)" : "#0F172A",
            fontFamily: "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif",
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          خنشلة، الجزائر
        </motion.div>
      </motion.div>

      {/* ── Controls Bar ──────────────────────────────────────────────────── */}
      <ControlsBar
        activeRoute={activeRoute}
        isDark={isDark}
        showLegend={showLegend}
        onLegendToggle={() => setShowLegend(v => !v)}
        onOpenSheet={() => setShowSheet(true)}
      />

      {/* ── Inline legend (expands below controls bar) ─────────────────────── */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            key="inline-legend"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center justify-around rounded-2xl px-4 py-3"
              style={{
                background: isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
                fontFamily: "var(--font-arabic), 'Noto Sans Arabic', system-ui, sans-serif",
              }}
            >
              {LEGEND_ITEMS.map(item => (
                <div key={item.labelEn} className="flex items-center gap-2">
                  <div
                    className="h-2 w-6 rounded-full"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                  />
                  <div className="flex flex-col" dir="rtl">
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: isDark ? "rgba(255,255,255,0.88)" : "#0F172A" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)" }}
                    >
                      {item.labelEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Route filter bottom sheet ──────────────────────────────────────── */}
      <RouteFilterSheet
        isOpen={showSheet}
        selectedRoute={selectedRoute}
        showLegend={showLegend}
        onSelect={setSelectedRoute}
        onLegendToggle={() => setShowLegend(v => !v)}
        onClose={() => setShowSheet(false)}
      />
    </div>
  )
}
