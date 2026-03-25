"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const PUBLIC_PATHS = ["/login"]

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Wait for client-side hydration before making any redirect decisions.
  // Without this, a static-export page can briefly see isLoading=false with
  // isAuthenticated=false (before localStorage is read) and wrongly redirect.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => { setHasMounted(true) }, [])

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (!hasMounted || isLoading) return
    if (!isAuthenticated && !isPublic) {
      router.replace("/login")
    }
    if (isAuthenticated && isPublic) {
      router.replace("/")
    }
  }, [hasMounted, isAuthenticated, isLoading, isPublic, router])

  // Show blank screen until client has mounted and auth state is resolved
  if (!hasMounted || isLoading) {
    return <div className="fixed inset-0 bg-background" />
  }

  // Unauthenticated on a protected route — redirect in progress
  if (!isAuthenticated && !isPublic) return null

  // Authenticated hitting the login page — redirect in progress
  if (isAuthenticated && isPublic) return null

  return <>{children}</>
}
