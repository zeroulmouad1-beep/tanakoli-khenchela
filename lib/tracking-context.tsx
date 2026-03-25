"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface TrackingState {
  isTracking: boolean
  busLineId: string | null
  busLineName: string | null
}

interface TrackingContextType {
  trackingState: TrackingState
  startTracking: (lineId: string, lineName: string) => void
  stopTracking: () => void
}

const TrackingContext = createContext<TrackingContextType | null>(null)

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    busLineId: null,
    busLineName: null,
  })

  const startTracking = useCallback((lineId: string, lineName: string) => {
    setTrackingState({
      isTracking: true,
      busLineId: lineId,
      busLineName: lineName,
    })
    // Store in sessionStorage for persistence across page navigations
    if (typeof window !== "undefined") {
      sessionStorage.setItem("trackingState", JSON.stringify({
        isTracking: true,
        busLineId: lineId,
        busLineName: lineName,
      }))
    }
  }, [])

  const stopTracking = useCallback(() => {
    setTrackingState({
      isTracking: false,
      busLineId: null,
      busLineName: null,
    })
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("trackingState")
    }
  }, [])

  return (
    <TrackingContext.Provider value={{ trackingState, startTracking, stopTracking }}>
      {children}
    </TrackingContext.Provider>
  )
}

export function useTracking() {
  const context = useContext(TrackingContext)
  if (!context) {
    throw new Error("useTracking must be used within a TrackingProvider")
  }
  return context
}
