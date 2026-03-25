"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SplashScreen } from "./splash-screen"
import { useAuth } from "@/lib/auth-context"

type AppState = "splash" | "transitioning" | "app"

// Context to allow logout from anywhere in the app
interface AppContextType {
  logout: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    return {
      logout: () => {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("tanoukli_session")
            localStorage.removeItem("tanoukli_user_cache")
            sessionStorage.removeItem("splashShown")
          } catch {
            // Ignore
          }
          window.location.href = "/login"
        }
      }
    }
  }
  return context
}

// Event to signal map is ready
const MAP_READY_EVENT = "mapReady"

export function signalMapReady() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MAP_READY_EVENT))
  }
}

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { logout: authLogout } = useAuth()
  const [appState, setAppState] = useState<AppState | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Check if splash was already shown in this session
    let splashShown = false
    
    try {
      splashShown = sessionStorage.getItem("splashShown") === "true"
    } catch {
      // Storage not available, proceed with defaults
    }
    
    if (splashShown) {
      // Already shown splash this session - go directly to app
      setAppState("app")
      setShowSplash(false)
      setIsMapReady(true)
    } else {
      // Show splash screen
      setAppState("splash")
    }
  }, [])

  // Listen for map ready signal
  useEffect(() => {
    const handleMapReady = () => {
      setIsMapReady(true)
    }

    window.addEventListener(MAP_READY_EVENT, handleMapReady)
    return () => window.removeEventListener(MAP_READY_EVENT, handleMapReady)
  }, [])

  // Handle splash complete - user clicked "Start"
  const handleSplashComplete = useCallback(() => {
    // Mark splash as shown
    try {
      sessionStorage.setItem("splashShown", "true")
    } catch {
      // Ignore storage errors
    }
    
    // Start transition - mount app in background
    setAppState("transitioning")
    
    // Set a fallback timer in case map ready event doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsMapReady(true)
    }, 2000)
    
    return () => clearTimeout(fallbackTimer)
  }, [])

  // When map is ready and we're transitioning, complete the transition
  useEffect(() => {
    if (appState === "transitioning" && isMapReady) {
      // Small delay to ensure map has fully rendered
      const timer = setTimeout(() => {
        setShowSplash(false)
        setAppState("app")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [appState, isMapReady])

  // Logout function - clears auth session and redirects to login
  const handleLogout = useCallback(() => {
    authLogout()
    // Reset splash so next login shows it again
    setIsMapReady(false)
    setShowSplash(true)
    setAppState("splash")
  }, [authLogout])

  // Show nothing while determining initial state (prevents flash)
  if (appState === null) {
    return (
      <div className="fixed inset-0 bg-slate-900" />
    )
  }

  return (
    <AppContext.Provider value={{ logout: handleLogout }}>
      {/* Main app - render when transitioning or in app state */}
      {(appState === "transitioning" || appState === "app") && (
        <motion.div
          key="app"
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: appState === "app" ? 1 : 0.01 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
      
      {/* Splash screen overlay - higher z-index, fades out */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SplashScreen onComplete={handleSplashComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppContext.Provider>
  )
}
