"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, onSnapshot, Timestamp } from "firebase/firestore"

export interface PassengerTransaction {
  id: string
  type: "fare_deduction" | "balance_recharge"
  amount: number
  previousBalance: number
  newBalance: number
  passengerName: string
  driverTimestamp: Timestamp
  status: string
}

const CACHE_KEY = "tanoukli_transactions_cache"
const TRANSACTIONS_LIMIT = 20

// Get cached transactions instantly
function getCachedTransactions(): PassengerTransaction[] {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      // Cache valid for 2 minutes
      if (Date.now() - timestamp < 2 * 60 * 1000) {
        return data as PassengerTransaction[]
      }
    }
  } catch {
    // Ignore cache errors
  }
  return []
}

// Save transactions to cache
function setCachedTransactions(transactions: PassengerTransaction[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: transactions,
      timestamp: Date.now()
    }))
  } catch {
    // Ignore cache errors
  }
}

export function usePassengerTransactions(userId: string) {
  // Initialize with cached data for instant display
  const cachedData = getCachedTransactions()
  const [transactions, setTransactions] = useState<PassengerTransaction[]>(cachedData)
  const [isLoading, setIsLoading] = useState(cachedData.length === 0)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const transactionsRef = collection(db, "transactions")
    // Query transactions for this user - simplified to avoid index requirement
    // We filter by userId only and sort client-side
    const transactionsQuery = query(
      transactionsRef,
      where("userId", "==", userId),
      limit(TRANSACTIONS_LIMIT * 2) // Fetch more to allow for client-side sorting
    )

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsData: PassengerTransaction[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: doc.data().type,
          amount: doc.data().amount,
          previousBalance: doc.data().previousBalance,
          newBalance: doc.data().newBalance,
          passengerName: doc.data().passengerName,
          driverTimestamp: doc.data().driverTimestamp,
          status: doc.data().status
        }))
        
        // Sort client-side by timestamp (descending) and limit
        const sortedTransactions = transactionsData
          .sort((a, b) => {
            const timeA = a.driverTimestamp?.seconds || 0
            const timeB = b.driverTimestamp?.seconds || 0
            return timeB - timeA
          })
          .slice(0, TRANSACTIONS_LIMIT)
        
        setTransactions(sortedTransactions)
        setCachedTransactions(sortedTransactions)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching passenger transactions:", error)
        // Keep showing cached data on error
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  return {
    transactions,
    isLoading
  }
}
