"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

// NOTE: Firebase Auth imports are kept here for when real SMS is re-enabled.
// import { onAuthStateChanged, signOut } from "firebase/auth"
// import { auth } from "@/lib/firebase"

const SESSION_KEY = "tanoukli_session"

interface Session {
  name: string
  phone: string
  loggedInAt: number
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  session: Session | null
  login: (name: string, phone: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function readSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount.
  // When real Firebase SMS auth is re-enabled, replace this block with
  // onAuthStateChanged(auth, ...) and use Firebase user state instead.
  useEffect(() => {
    setSession(readSession())
    setIsLoading(false)
  }, [])

  const login = useCallback((name: string, phone: string) => {
    const s: Session = { name, phone, loggedInAt: Date.now() }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)) } catch { /* ignore */ }
    setSession(s)
  }, [])

  const logout = useCallback(() => {
    try {
      // When real Firebase SMS auth is re-enabled, also call: await signOut(auth)
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem("tanoukli_user_cache")
      localStorage.removeItem("tanoukli_driver_mode")
      sessionStorage.removeItem("splashShown")
    } catch { /* ignore */ }
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!session, isLoading, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
