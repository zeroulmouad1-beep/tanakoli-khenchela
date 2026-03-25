"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"

// Route coordinates for simulation - these define the paths buses follow
const urbanRoutePolylines = [
  {
    id: "01",
    name: "خط 01 - وسط المدينة",
    coords: [
      [35.4420, 7.1380], [35.4400, 7.1420], [35.4377, 7.1458],
      [35.4400, 7.1550], [35.4330, 7.1520], [35.4350, 7.1350],
    ] as [number, number][]
  },
  {
    id: "02",
    name: "خط 02 - عين البيضاء",
    coords: [
      [35.4350, 7.1350], [35.4450, 7.1320], [35.4377, 7.1458],
      [35.4330, 7.1520], [35.4400, 7.1480],
    ] as [number, number][]
  },
  {
    id: "03",
    name: "خط 03 - المدينة الجديدة",
    coords: [
      [35.4290, 7.1400], [35.4310, 7.1430], [35.4377, 7.1458],
      [35.4400, 7.1550], [35.4400, 7.1480], [35.4350, 7.1350],
    ] as [number, number][]
  }
]

const intercityRoutePolylines = [
  {
    id: "K1",
    name: "K1 - خنشلة - قايس",
    coords: [
      [35.4350, 7.1350], [35.4100, 7.1200], [35.3800, 7.0800], [35.3650, 7.0650],
    ] as [number, number][]
  },
  {
    id: "K2",
    name: "K2 - خنشلة - الشريعة",
    coords: [
      [35.4350, 7.1350], [35.3900, 7.2000], [35.2700, 7.7500], [35.2640, 7.7600],
    ] as [number, number][]
  },
  {
    id: "H1",
    name: "H1 - خنشلة - حمام الصالحين",
    coords: [
      [35.4350, 7.1350], [35.4370, 7.1000], [35.4385, 7.0700], [35.4400, 7.0500],
    ] as [number, number][]
  },
  {
    id: "B1",
    name: "B1 - طريق باتنة",
    coords: [
      [35.4350, 7.1350], [35.4600, 7.1100], [35.4950, 7.0750], [35.5350, 7.0200],
    ] as [number, number][]
  },
]

// All routes combined for easy lookup
const allRoutes = [...urbanRoutePolylines, ...intercityRoutePolylines]

// Station positions for proximity detection (200m radius)
const allStations = [
  { position: [35.4420, 7.1380] as [number, number], name: "الجامعة", nameEn: "University" },
  { position: [35.4377, 7.1458] as [number, number], name: "وسط المدينة", nameEn: "City Center" },
  { position: [35.4350, 7.1350] as [number, number], name: "محطة خنشلة البرية", nameEn: "Bus Station" },
  { position: [35.4330, 7.1520] as [number, number], name: "المستشفى", nameEn: "Hospital" },
  { position: [35.4400, 7.1550] as [number, number], name: "السوق المركزي", nameEn: "Central Market" },
  { position: [35.4400, 7.1480] as [number, number], name: "ملعب أول نوفمبر", nameEn: "Stadium" },
  { position: [35.4450, 7.1320] as [number, number], name: "طريق عين البيضاء", nameEn: "Ain El Beyda Road" },
  { position: [35.4290, 7.1400] as [number, number], name: "المدينة الجديدة", nameEn: "New City" },
  { position: [35.3650, 7.0650] as [number, number], name: "وسط قايس", nameEn: "Kais Center" },
  { position: [35.2640, 7.7600] as [number, number], name: "وسط الشريعة", nameEn: "Cheria Center" },
  { position: [35.4400, 7.0500] as [number, number], name: "حمام الصالحين", nameEn: "Hammam Salihine" },
  { position: [35.5350, 7.0200] as [number, number], name: "طريق باتنة", nameEn: "Batna Road" },
]

export interface SimulatedBus {
  id: string
  name: string
  lineId: string
  lineName: string
  category: "urban" | "intercity"
  latitude: number
  longitude: number
  targetLatitude: number
  targetLongitude: number
  routeProgress: number
  direction: 1 | -1
  speed: number
  status: "moving" | "at_station"
  nearestStation: string | null
  nearestStationEn: string | null
  arrivalMinutes: number
  isLive: true
}

// Calculate distance between two coordinates in meters using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Linear interpolation between two coordinate points
function interpolatePosition(
  current: [number, number],
  target: [number, number],
  factor: number
): [number, number] {
  return [
    current[0] + (target[0] - current[0]) * factor,
    current[1] + (target[1] - current[1]) * factor,
  ]
}

// Get position along route based on progress (0.0 to 1.0)
function getPositionOnRoute(
  coords: [number, number][],
  progress: number
): [number, number] {
  if (!coords || coords.length === 0) return [35.4377, 7.1458]
  if (coords.length === 1) return coords[0]

  const clampedProgress = Math.max(0, Math.min(1, progress))

  let totalLength = 0
  const segmentLengths: number[] = []

  for (let i = 0; i < coords.length - 1; i++) {
    const length = calculateDistance(
      coords[i][0], coords[i][1],
      coords[i + 1][0], coords[i + 1][1]
    )
    segmentLengths.push(length)
    totalLength += length
  }

  if (totalLength === 0) return coords[0]

  const targetDistance = clampedProgress * totalLength
  let accumulatedDistance = 0

  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulatedDistance + segmentLengths[i] >= targetDistance) {
      const segmentProgress = segmentLengths[i] > 0
        ? (targetDistance - accumulatedDistance) / segmentLengths[i]
        : 0
      return interpolatePosition(coords[i], coords[i + 1], segmentProgress)
    }
    accumulatedDistance += segmentLengths[i]
  }

  return coords[coords.length - 1]
}

// Calculate route length for a given route
function getRouteLength(coords: [number, number][]): number {
  let length = 0
  for (let i = 0; i < coords.length - 1; i++) {
    length += calculateDistance(
      coords[i][0], coords[i][1],
      coords[i + 1][0], coords[i + 1][1]
    )
  }
  return length
}

// Find nearest station within 200m radius
function findNearestStation(
  lat: number,
  lon: number
): { name: string; nameEn: string; distance: number } | null {
  if (!isValidCoordinate(lat, lon)) return null

  let nearest: { name: string; nameEn: string; distance: number } | null = null

  for (const station of allStations) {
    const distance = calculateDistance(lat, lon, station.position[0], station.position[1])
    if (distance <= 200 && (!nearest || distance < nearest.distance)) {
      nearest = { name: station.name, nameEn: station.nameEn, distance }
    }
  }

  return nearest
}

// Calculate estimated arrival time in minutes
function calculateArrivalTime(progress: number, speed: number, routeLength: number): number {
  if (speed <= 0 || routeLength <= 0) return 0
  const remainingDistance = (1 - progress) * routeLength
  const speedMps = (speed * 1000) / 3600
  const seconds = remainingDistance / speedMps
  return Math.max(1, Math.ceil(seconds / 60))
}

// Validate coordinates are within Khenchela region
function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= 35.0 && lat <= 36.0 &&
    lon >= 6.5 && lon <= 8.0
  )
}

// 20 active buses — 5 per route, naturally scattered along paths with varied speeds
// Progress values are intentionally non-uniform so buses don't line up visually when zoomed out
const BUS_CONFIG = [
  // Route K1 - Khenchela to Kais (5 buses) — staggered scatter
  { id: "sim-k1-01", name: "حافلة K1-01", lineId: "K1", lineName: "K1 - خنشلة - قايس", category: "intercity" as const, speed: 53, initialProgress: 0.05 },
  { id: "sim-k1-02", name: "حافلة K1-02", lineId: "K1", lineName: "K1 - خنشلة - قايس", category: "intercity" as const, speed: 43, initialProgress: 0.22 },
  { id: "sim-k1-03", name: "حافلة K1-03", lineId: "K1", lineName: "K1 - خنشلة - قايس", category: "intercity" as const, speed: 58, initialProgress: 0.47 },
  { id: "sim-k1-04", name: "حافلة K1-04", lineId: "K1", lineName: "K1 - خنشلة - قايس", category: "intercity" as const, speed: 45, initialProgress: 0.67 },
  { id: "sim-k1-05", name: "حافلة K1-05", lineId: "K1", lineName: "K1 - خنشلة - قايس", category: "intercity" as const, speed: 61, initialProgress: 0.87 },

  // Route 01 - City Center (5 buses) — staggered scatter
  { id: "sim-01-01", name: "حافلة 101", lineId: "01", lineName: "خط 01 - وسط المدينة", category: "urban" as const, speed: 27, initialProgress: 0.13 },
  { id: "sim-01-02", name: "حافلة 102", lineId: "01", lineName: "خط 01 - وسط المدينة", category: "urban" as const, speed: 20, initialProgress: 0.34 },
  { id: "sim-01-03", name: "حافلة 103", lineId: "01", lineName: "خط 01 - وسط المدينة", category: "urban" as const, speed: 30, initialProgress: 0.55 },
  { id: "sim-01-04", name: "حافلة 104", lineId: "01", lineName: "خط 01 - وسط المدينة", category: "urban" as const, speed: 22, initialProgress: 0.74 },
  { id: "sim-01-05", name: "حافلة 105", lineId: "01", lineName: "خط 01 - وسط المدينة", category: "urban" as const, speed: 29, initialProgress: 0.93 },

  // Route H1 - Hamma (Hammam Salihine) (5 buses) — staggered scatter
  { id: "sim-h1-01", name: "حافلة H1-01", lineId: "H1", lineName: "H1 - خنشلة - حمام الصالحين", category: "intercity" as const, speed: 48, initialProgress: 0.08 },
  { id: "sim-h1-02", name: "حافلة H1-02", lineId: "H1", lineName: "H1 - خنشلة - حمام الصالحين", category: "intercity" as const, speed: 38, initialProgress: 0.27 },
  { id: "sim-h1-03", name: "حافلة H1-03", lineId: "H1", lineName: "H1 - خنشلة - حمام الصالحين", category: "intercity" as const, speed: 54, initialProgress: 0.49 },
  { id: "sim-h1-04", name: "حافلة H1-04", lineId: "H1", lineName: "H1 - خنشلة - حمام الصالحين", category: "intercity" as const, speed: 40, initialProgress: 0.71 },
  { id: "sim-h1-05", name: "حافلة H1-05", lineId: "H1", lineName: "H1 - خنشلة - حمام الصالحين", category: "intercity" as const, speed: 51, initialProgress: 0.91 },

  // Route B1 - Batna Road (5 buses) — staggered scatter
  { id: "sim-b1-01", name: "حافلة B1-01", lineId: "B1", lineName: "B1 - طريق باتنة", category: "intercity" as const, speed: 63, initialProgress: 0.17 },
  { id: "sim-b1-02", name: "حافلة B1-02", lineId: "B1", lineName: "B1 - طريق باتنة", category: "intercity" as const, speed: 52, initialProgress: 0.39 },
  { id: "sim-b1-03", name: "حافلة B1-03", lineId: "B1", lineName: "B1 - طريق باتنة", category: "intercity" as const, speed: 68, initialProgress: 0.58 },
  { id: "sim-b1-04", name: "حافلة B1-04", lineId: "B1", lineName: "B1 - طريق باتنة", category: "intercity" as const, speed: 57, initialProgress: 0.78 },
  { id: "sim-b1-05", name: "حافلة B1-05", lineId: "B1", lineName: "B1 - طريق باتنة", category: "intercity" as const, speed: 71, initialProgress: 0.96 },
]

// Create initial buses with proper positions calculated from their routes
function createInitialBuses(): SimulatedBus[] {
  return BUS_CONFIG.map(config => {
    const route = allRoutes.find(r => r.id === config.lineId)
    if (!route) {
      return createBusAtPosition(config, [35.4377, 7.1458])
    }

    const initialPos = getPositionOnRoute(route.coords, config.initialProgress)
    const routeLength = getRouteLength(route.coords)
    const arrivalMinutes = calculateArrivalTime(config.initialProgress, config.speed, routeLength)
    const nearStation = findNearestStation(initialPos[0], initialPos[1])

    return {
      id: config.id,
      name: config.name,
      lineId: config.lineId,
      lineName: config.lineName,
      category: config.category,
      latitude: initialPos[0],
      longitude: initialPos[1],
      targetLatitude: initialPos[0],
      targetLongitude: initialPos[1],
      routeProgress: config.initialProgress,
      direction: 1 as const,
      speed: config.speed,
      status: nearStation ? "at_station" as const : "moving" as const,
      nearestStation: nearStation?.name || null,
      nearestStationEn: nearStation?.nameEn || null,
      arrivalMinutes,
      isLive: true as const,
    }
  })
}

// Helper to create a bus at a specific position (fallback)
function createBusAtPosition(config: typeof BUS_CONFIG[0], pos: [number, number]): SimulatedBus {
  return {
    id: config.id,
    name: config.name,
    lineId: config.lineId,
    lineName: config.lineName,
    category: config.category,
    latitude: pos[0],
    longitude: pos[1],
    targetLatitude: pos[0],
    targetLongitude: pos[1],
    routeProgress: config.initialProgress,
    direction: 1 as const,
    speed: config.speed,
    status: "moving" as const,
    nearestStation: null,
    nearestStationEn: null,
    arrivalMinutes: 5,
    isLive: true as const,
  }
}

interface BusSimulationContextType {
  simulatedBuses: SimulatedBus[]
  isSimulationRunning: boolean
  startSimulation: () => void
  stopSimulation: () => void
}

const BusSimulationContext = createContext<BusSimulationContextType | null>(null)

// Pre-calculate route lengths (constant, no need to recalculate)
const routeLengths = new Map<string, number>()
allRoutes.forEach(route => {
  routeLengths.set(route.id, getRouteLength(route.coords))
})

export function BusSimulationProvider({ children }: { children: ReactNode }) {
  const [simulatedBuses, setSimulatedBuses] = useState<SimulatedBus[]>(() => createInitialBuses())
  const [isSimulationRunning, setIsSimulationRunning] = useState(true)

  const smoothIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Smooth interpolation effect - runs every 100ms for fluid movement
  useEffect(() => {
    if (!isSimulationRunning) {
      if (smoothIntervalRef.current) {
        clearInterval(smoothIntervalRef.current)
        smoothIntervalRef.current = null
      }
      return
    }

    smoothIntervalRef.current = setInterval(() => {
      setSimulatedBuses(prevBuses =>
        prevBuses.map(bus => {
          const latDiff = Math.abs(bus.targetLatitude - bus.latitude)
          const lonDiff = Math.abs(bus.targetLongitude - bus.longitude)
          if (latDiff < 0.00001 && lonDiff < 0.00001) {
            return bus
          }

          const factor = 0.15
          const newLat = bus.latitude + (bus.targetLatitude - bus.latitude) * factor
          const newLon = bus.longitude + (bus.targetLongitude - bus.longitude) * factor

          return {
            ...bus,
            latitude: newLat,
            longitude: newLon,
          }
        })
      )
    }, 100)

    return () => {
      if (smoothIntervalRef.current) {
        clearInterval(smoothIntervalRef.current)
        smoothIntervalRef.current = null
      }
    }
  }, [isSimulationRunning])

  // Target position update effect - runs every 3 seconds
  useEffect(() => {
    if (!isSimulationRunning) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
      return
    }

    const updateTargets = () => {
      setSimulatedBuses(prevBuses =>
        prevBuses.map(bus => {
          const route = allRoutes.find(r => r.id === bus.lineId)
          if (!route) return bus

          const routeLength = routeLengths.get(bus.lineId) || 1000

          const speedMps = (bus.speed * 1000) / 3600
          const distancePerUpdate = speedMps * 3
          const progressIncrement = distancePerUpdate / routeLength

          let newProgress = bus.routeProgress + (progressIncrement * bus.direction)
          let newDirection = bus.direction

          if (newProgress >= 1) {
            newProgress = 1 - (newProgress - 1)
            newDirection = -1
          } else if (newProgress <= 0) {
            newProgress = Math.abs(newProgress)
            newDirection = 1
          }

          const targetPos = getPositionOnRoute(route.coords, newProgress)

          if (!isValidCoordinate(targetPos[0], targetPos[1])) {
            return bus
          }

          const nearStation = findNearestStation(targetPos[0], targetPos[1])
          const status: "moving" | "at_station" = nearStation ? "at_station" : "moving"
          const arrivalMinutes = calculateArrivalTime(newProgress, bus.speed, routeLength)

          return {
            ...bus,
            targetLatitude: targetPos[0],
            targetLongitude: targetPos[1],
            routeProgress: newProgress,
            direction: newDirection,
            status,
            nearestStation: nearStation?.name || null,
            nearestStationEn: nearStation?.nameEn || null,
            arrivalMinutes,
          }
        })
      )
    }

    updateTargets()
    updateIntervalRef.current = setInterval(updateTargets, 3000)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [isSimulationRunning])

  const startSimulation = useCallback(() => {
    setIsSimulationRunning(true)
  }, [])

  const stopSimulation = useCallback(() => {
    setIsSimulationRunning(false)
  }, [])

  return (
    <BusSimulationContext.Provider value={{
      simulatedBuses,
      isSimulationRunning,
      startSimulation,
      stopSimulation
    }}>
      {children}
    </BusSimulationContext.Provider>
  )
}

export function useBusSimulation() {
  const context = useContext(BusSimulationContext)
  if (!context) {
    throw new Error("useBusSimulation must be used within a BusSimulationProvider")
  }
  return context
}
