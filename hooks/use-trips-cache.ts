"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, onSnapshot } from "firebase/firestore"

export interface Trip {
  id: string
  ticketId: string
  amount: number
  timestamp: { seconds: number; nanoseconds: number } | null
  createdAt: string
  userId: string
}

const CACHE_KEY = "tanoukli_trips_cache"
const USER_ID = "0775453629"
const TRIPS_LIMIT = 20 // Limit queries for performance

// Get cached trips instantly
function getCachedTrips(): Trip[] {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      // Cache valid for 2 minutes
      if (Date.now() - timestamp < 2 * 60 * 1000) {
        return data as Trip[]
      }
    }
  } catch {
    // Ignore cache errors
  }
  return []
}

// Save trips to cache
function setCachedTrips(trips: Trip[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: trips,
      timestamp: Date.now()
    }))
  } catch {
    // Ignore cache errors
  }
}

export function useTripsCache() {
  // Initialize with cached data for instant display
  const cachedData = getCachedTrips()
  const [trips, setTrips] = useState<Trip[]>(cachedData)
  const [isLoading, setIsLoading] = useState(cachedData.length === 0)

  useEffect(() => {
    const tripsCollectionRef = collection(db, "trips")
    // Simplified query to avoid composite index requirement
    // We filter by userId only and sort client-side
    const tripsQuery = query(
      tripsCollectionRef,
      where("userId", "==", USER_ID),
      limit(TRIPS_LIMIT * 2) // Fetch more to allow for client-side sorting
    )

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const tripsData: Trip[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ticketId: doc.data().ticketId,
          amount: doc.data().amount,
          timestamp: doc.data().timestamp,
          createdAt: doc.data().createdAt,
          userId: doc.data().userId,
        }))
        
        // Sort client-side by timestamp (descending) and limit
        const sortedTrips = tripsData
          .sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0
            const timeB = b.timestamp?.seconds || 0
            return timeB - timeA
          })
          .slice(0, TRIPS_LIMIT)
        
        setTrips(sortedTrips)
        setCachedTrips(sortedTrips)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching trips:", error)
        // Keep showing cached data on error
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return {
    trips,
    isLoading
  }
}
