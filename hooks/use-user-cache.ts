"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"

interface UserData {
  fullName: string
  email: string
  address: string
  Phone: string
  balance: number
  role?: "driver" | "passenger" | string
}

const SESSION_KEY = "tanoukli_session"

// Read the current user's phone from the auth session (source of truth)
function getSessionPhone(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.phone ?? null
  } catch {
    return null
  }
}

// Per-user cache key prevents data bleed between different accounts
function makeCacheKey(phone: string) {
  return `tanoukli_user_cache_${phone}`
}

function getCachedUserData(phone: string): UserData | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(makeCacheKey(phone))
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 5 * 60 * 1000) return data as UserData
    }
  } catch {}
  return null
}

function setCachedUserData(phone: string, data: UserData) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(makeCacheKey(phone), JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

// Called on logout — clears the current user's cache
export function clearUserCache() {
  if (typeof window === "undefined") return
  try {
    const phone = getSessionPhone()
    if (phone) localStorage.removeItem(makeCacheKey(phone))
    localStorage.removeItem("tanoukli_user_cache") // remove legacy key if present
  } catch {}
}

export function useUserCache() {
  const [phone, setPhone] = useState<string | null>(() => getSessionPhone())
  const [userData, setUserData] = useState<UserData | null>(() => {
    const p = getSessionPhone()
    return p ? getCachedUserData(p) : null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSessionPhone())

  // Re-check session when storage changes (login/logout in another tab)
  useEffect(() => {
    const onStorage = () => {
      const p = getSessionPhone()
      setPhone(p)
      setIsLoggedIn(!!p)
      if (!p) {
        setUserData(null)
        setIsLoading(false)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Subscribe to the correct Firestore document for the logged-in user's phone
  useEffect(() => {
    if (!phone) {
      setUserData(null)
      setIsLoading(false)
      setIsLoggedIn(false)
      return
    }

    setIsLoggedIn(true)

    // Show cached data immediately while Firestore loads
    const cached = getCachedUserData(phone)
    if (cached) {
      setUserData(cached)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    const userDocRef = doc(db, "users", phone)
    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserData
          setUserData(data)
          setCachedUserData(phone, data)
        }
        // If no Firestore doc exists yet for this phone, that's fine —
        // session name/phone from auth-context will still display correctly
        setIsLoading(false)
      },
      (err) => {
        console.error("Error fetching user data:", err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [phone])

  const refreshCache = useCallback(() => {
    if (phone && userData) setCachedUserData(phone, userData)
  }, [phone, userData])

  return { userData, isLoading, isLoggedIn, refreshCache, clearCache: clearUserCache }
}
