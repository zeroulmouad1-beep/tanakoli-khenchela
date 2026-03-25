"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { BusRoute, Station, RouteCategory, SubStation } from "@/lib/types/routes"

const ROUTES_CACHE_KEY = "tanoukli_routes_cache"
const STATIONS_CACHE_KEY = "tanoukli_stations_cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheData<T> {
  data: T
  timestamp: number
}

function getFromCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    const parsed: CacheData<T> = JSON.parse(cached)
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  try {
    const cacheData: CacheData<T> = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch {
    // Ignore cache errors
  }
}

// Urban routes within Khenchela city
const urbanRoutes: BusRoute[] = [
  {
    id: "route-01",
    name: "خط الجامعة",
    nameEn: "University Line",
    lineNumber: "01",
    color: "#00A651",
    price: 30,
    workingHours: { start: "06:00", end: "20:00" },
    frequency: 15,
    category: "urban",
    stops: [
      { id: "s1", name: "الجامعة", nameEn: "University", coords: [35.4420, 7.1380], order: 1 },
      { id: "s2", name: "حي 500 مسكن", nameEn: "500 Housing", coords: [35.4400, 7.1420], order: 2 },
      { id: "s3", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 3 },
      { id: "s4", name: "السوق المركزي", nameEn: "Central Market", coords: [35.4400, 7.1550], order: 4 },
      { id: "s5", name: "المستشفى", nameEn: "Hospital", coords: [35.4330, 7.1520], order: 5 },
      { id: "s6", name: "محطة القطار", nameEn: "Train Station", coords: [35.4350, 7.1350], order: 6 },
    ],
    sub_stations: [
      { id: "sub-01-1", name: "الجامعة", nameEn: "University", coords: [35.4420, 7.1380], order: 1 },
      { id: "sub-01-2", name: "حي الأمل", nameEn: "El Amel District", coords: [35.4410, 7.1400], order: 2 },
      { id: "sub-01-3", name: "حي 500 مسكن", nameEn: "500 Housing", coords: [35.4400, 7.1420], order: 3 },
      { id: "sub-01-4", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 4 },
    ]
  },
  {
    id: "route-02",
    name: "خط عين البيضاء",
    nameEn: "Ain El Beyda Line",
    lineNumber: "02",
    color: "#FF6B00",
    price: 40,
    workingHours: { start: "05:30", end: "21:00" },
    frequency: 20,
    category: "urban",
    stops: [
      { id: "s7", name: "محطة القطار", nameEn: "Train Station", coords: [35.4350, 7.1350], order: 1 },
      { id: "s8", name: "طريق عين البيضاء", nameEn: "Ain El Beyda Road", coords: [35.4450, 7.1320], order: 2 },
      { id: "s9", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 3 },
      { id: "s10", name: "المستشفى", nameEn: "Hospital", coords: [35.4330, 7.1520], order: 4 },
      { id: "s11", name: "ملعب أول نوفمبر", nameEn: "November 1st Stadium", coords: [35.4400, 7.1480], order: 5 },
    ],
    sub_stations: [
      { id: "sub-02-1", name: "محطة القطار", nameEn: "Train Station", coords: [35.4350, 7.1350], order: 1 },
      { id: "sub-02-2", name: "طريق عين البيضاء", nameEn: "Ain El Beyda Road", coords: [35.4450, 7.1320], order: 2 },
      { id: "sub-02-3", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 3 },
      { id: "sub-02-4", name: "المستشفى", nameEn: "Hospital", coords: [35.4330, 7.1520], order: 4 },
      { id: "sub-02-5", name: "ملعب أول نوفمبر", nameEn: "November 1st Stadium", coords: [35.4400, 7.1480], order: 5 },
    ]
  },
  {
    id: "route-03",
    name: "خط المدينة الجديدة",
    nameEn: "New City Line",
    lineNumber: "03",
    color: "#3B82F6",
    price: 30,
    workingHours: { start: "06:30", end: "19:30" },
    frequency: 25,
    category: "urban",
    stops: [
      { id: "s12", name: "المدينة الجديدة", nameEn: "New City", coords: [35.4290, 7.1400], order: 1 },
      { id: "s13", name: "حي الأمل", nameEn: "El Amel District", coords: [35.4310, 7.1430], order: 2 },
      { id: "s14", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 3 },
      { id: "s15", name: "السوق المركزي", nameEn: "Central Market", coords: [35.4400, 7.1550], order: 4 },
      { id: "s16", name: "ملعب أول نوفمبر", nameEn: "November 1st Stadium", coords: [35.4400, 7.1480], order: 5 },
      { id: "s17", name: "محطة القطار", nameEn: "Train Station", coords: [35.4350, 7.1350], order: 6 },
    ],
    sub_stations: [
      { id: "sub-03-1", name: "المدينة الجديدة", nameEn: "New City", coords: [35.4290, 7.1400], order: 1 },
      { id: "sub-03-2", name: "حي الأمل", nameEn: "El Amel District", coords: [35.4310, 7.1430], order: 2 },
      { id: "sub-03-3", name: "وسط المدينة", nameEn: "City Center", coords: [35.4377, 7.1458], order: 3 },
      { id: "sub-03-4", name: "السوق المركزي", nameEn: "Central Market", coords: [35.4400, 7.1550], order: 4 },
      { id: "sub-03-5", name: "ملعب أول نوفمبر", nameEn: "November 1st Stadium", coords: [35.4400, 7.1480], order: 5 },
      { id: "sub-03-6", name: "محطة القطار", nameEn: "Train Station", coords: [35.4350, 7.1350], order: 6 },
    ]
  },
]

// Inter-city routes connecting municipalities
const intercityRoutes: BusRoute[] = [
  {
    id: "intercity-01",
    name: "خنشلة - قايس",
    nameEn: "Khenchela - Kais",
    lineNumber: "K1",
    color: "#8B5CF6",
    price: 100,
    workingHours: { start: "06:00", end: "18:00" },
    frequency: 60,
    category: "intercity",
    municipalities: ["خنشلة", "قايس"],
    distance: 25,
    duration: 35,
    stops: [
      { id: "ic1-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic1-2", name: "مفترق الشريعة", nameEn: "Cheria Junction", coords: [35.4100, 7.1200], order: 2, municipality: "خنشلة" },
      { id: "ic1-3", name: "مدخل قايس", nameEn: "Kais Entrance", coords: [35.3800, 7.0800], order: 3, municipality: "قايس" },
      { id: "ic1-4", name: "وسط قايس", nameEn: "Kais Center", coords: [35.3650, 7.0650], order: 4, municipality: "قايس" },
    ]
  },
  {
    id: "intercity-02",
    name: "خنشلة - الشريعة",
    nameEn: "Khenchela - Cheria",
    lineNumber: "K2",
    color: "#EC4899",
    price: 150,
    workingHours: { start: "05:30", end: "19:00" },
    frequency: 45,
    category: "intercity",
    municipalities: ["خنشلة", "الشريعة"],
    distance: 45,
    duration: 55,
    stops: [
      { id: "ic2-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic2-2", name: "ريمونة", nameEn: "Remmoune", coords: [35.3900, 7.2000], order: 2, municipality: "خنشلة" },
      { id: "ic2-3", name: "مدخل الشريعة", nameEn: "Cheria Entrance", coords: [35.2700, 7.7500], order: 3, municipality: "الشريعة" },
      { id: "ic2-4", name: "وسط الشريعة", nameEn: "Cheria Center", coords: [35.2640, 7.7600], order: 4, municipality: "الشريعة" },
    ]
  },
  {
    id: "intercity-03",
    name: "خنشلة - بوحمامة",
    nameEn: "Khenchela - Bouhmama",
    lineNumber: "K3",
    color: "#F59E0B",
    price: 80,
    workingHours: { start: "06:00", end: "18:00" },
    frequency: 50,
    category: "intercity",
    municipalities: ["خنشلة", "بوحمامة"],
    distance: 18,
    duration: 25,
    stops: [
      { id: "ic3-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic3-2", name: "مفترق بوحمامة", nameEn: "Bouhmama Junction", coords: [35.4500, 7.1600], order: 2, municipality: "خنشلة" },
      { id: "ic3-3", name: "وسط بوحمامة", nameEn: "Bouhmama Center", coords: [35.3300, 6.9900], order: 3, municipality: "بوحمامة" },
    ]
  },
  {
    id: "intercity-04",
    name: "خنشلة - ششار",
    nameEn: "Khenchela - Chechar",
    lineNumber: "K4",
    color: "#06B6D4",
    price: 120,
    workingHours: { start: "07:00", end: "17:00" },
    frequency: 90,
    category: "intercity",
    municipalities: ["خنشلة", "ششار"],
    distance: 35,
    duration: 45,
    stops: [
      { id: "ic4-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic4-2", name: "طريق ششار", nameEn: "Chechar Road", coords: [35.4200, 7.1200], order: 2, municipality: "خنشلة" },
      { id: "ic4-3", name: "قرية ششار", nameEn: "Chechar Village", coords: [35.3900, 7.0900], order: 3, municipality: "ششار" },
      { id: "ic4-4", name: "وسط ششار", nameEn: "Chechar Center", coords: [35.3850, 7.0850], order: 4, municipality: "ششار" },
    ]
  },
  {
    id: "intercity-05",
    name: "خنشلة - عين الطويلة",
    nameEn: "Khenchela - Ain Touila",
    lineNumber: "K5",
    color: "#10B981",
    price: 90,
    workingHours: { start: "06:30", end: "18:30" },
    frequency: 70,
    category: "intercity",
    municipalities: ["خنشلة", "عين الطويلة"],
    distance: 22,
    duration: 30,
    stops: [
      { id: "ic5-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic5-2", name: "المطار القديم", nameEn: "Old Airport", coords: [35.4500, 7.1100], order: 2, municipality: "خنشلة" },
      { id: "ic5-3", name: "مدخل عين الطويلة", nameEn: "Ain Touila Entrance", coords: [35.4900, 7.0500], order: 3, municipality: "عين الطويلة" },
      { id: "ic5-4", name: "وسط عين الطويلة", nameEn: "Ain Touila Center", coords: [35.5000, 7.0400], order: 4, municipality: "عين الطويلة" },
    ]
  },
  {
    id: "intercity-06",
    name: "خنشلة - المحمل",
    nameEn: "Khenchela - El Mahmel",
    lineNumber: "K6",
    color: "#EF4444",
    price: 70,
    workingHours: { start: "06:00", end: "19:00" },
    frequency: 55,
    category: "intercity",
    municipalities: ["خنشلة", "المحمل"],
    distance: 15,
    duration: 20,
    stops: [
      { id: "ic6-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic6-2", name: "طريق المحمل", nameEn: "El Mahmel Road", coords: [35.4600, 7.1500], order: 2, municipality: "خنشلة" },
      { id: "ic6-3", name: "وسط المحمل", nameEn: "El Mahmel Center", coords: [35.5200, 7.2000], order: 3, municipality: "المحمل" },
    ]
  },
  {
    id: "intercity-07",
    name: "خنشلة - طامزة",
    nameEn: "Khenchela - Tamza",
    lineNumber: "K7",
    color: "#6366F1",
    price: 60,
    workingHours: { start: "06:30", end: "18:00" },
    frequency: 60,
    category: "intercity",
    municipalities: ["خنشلة", "طامزة"],
    distance: 12,
    duration: 18,
    stops: [
      { id: "ic7-1", name: "محطة خنشلة البرية", nameEn: "Khenchela Bus Station", coords: [35.4350, 7.1350], order: 1, municipality: "خنشلة" },
      { id: "ic7-2", name: "مدخل طامزة", nameEn: "Tamza Entrance", coords: [35.4200, 7.0700], order: 2, municipality: "طامزة" },
      { id: "ic7-3", name: "وسط طامزة", nameEn: "Tamza Center", coords: [35.4100, 7.0500], order: 3, municipality: "طامزة" },
    ]
  },
]

// Combined fallback routes
const fallbackRoutes: BusRoute[] = [...urbanRoutes, ...intercityRoutes]

const fallbackStations: Station[] = [
  { id: "station-university", name: "الجامعة", nameEn: "University", address: "جامعة عباس لغرور - خنشلة", coords: [35.4420, 7.1380], lines: ["01"], facilities: ["wifi", "shelter", "bench"], isMainStation: true },
  { id: "station-city-center", name: "وسط المدينة", nameEn: "City Center", address: "شارع أول نوفمبر - وسط المدينة", coords: [35.4377, 7.1458], lines: ["01", "02", "03"], facilities: ["shelter", "bench", "kiosk"], isMainStation: true },
  { id: "station-train", name: "محطة القطار", nameEn: "Train Station", address: "المحطة البرية والسككية", coords: [35.4350, 7.1350], lines: ["01", "02", "03", "K1", "K2", "K3", "K4", "K5", "K6", "K7"], facilities: ["wifi", "shelter", "bench", "toilet", "kiosk"], isMainStation: true },
  { id: "station-hospital", name: "المستشفى", nameEn: "Hospital", address: "المستشفى العمومي - خنشلة", coords: [35.4330, 7.1520], lines: ["01", "02"], facilities: ["shelter", "bench"], isMainStation: true },
  { id: "station-market", name: "السوق المركزي", nameEn: "Central Market", address: "السوق المركزي - خنشلة", coords: [35.4400, 7.1550], lines: ["01", "03"], facilities: ["shelter", "kiosk"], isMainStation: true },
  { id: "station-kais", name: "وسط قايس", nameEn: "Kais Center", address: "مركز بلدية قايس", coords: [35.3650, 7.0650], lines: ["K1"], facilities: ["shelter", "bench"], isMainStation: true },
  { id: "station-cheria", name: "وسط الشريعة", nameEn: "Cheria Center", address: "مركز بلدية الشريعة", coords: [35.2640, 7.7600], lines: ["K2"], facilities: ["shelter", "bench", "kiosk"], isMainStation: true },
  { id: "station-bouhmama", name: "وسط بوحمامة", nameEn: "Bouhmama Center", address: "مركز بلدية بوحمامة", coords: [35.3300, 6.9900], lines: ["K3"], facilities: ["shelter"], isMainStation: true },
]

export function useRoutes() {
  const [routes, setRoutes] = useState<BusRoute[]>(() => {
    const cached = getFromCache<BusRoute[]>(ROUTES_CACHE_KEY)
    return cached || fallbackRoutes
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const routesRef = collection(db, "routes")
    
    const unsubscribe = onSnapshot(
      routesRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const routesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as BusRoute[]
          // If Firestore doesn't have intercity routes, supplement with local data
          const hasIntercity = routesData.some(r => r.category === "intercity")
          const finalRoutes = hasIntercity ? routesData : [...routesData, ...intercityRoutes]
          setRoutes(finalRoutes)
          setCache(ROUTES_CACHE_KEY, finalRoutes)
        }
        setIsLoading(false)
      },
      () => {
        // On error, use fallback/cached data
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { routes, isLoading }
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>(() => {
    const cached = getFromCache<Station[]>(STATIONS_CACHE_KEY)
    return cached || fallbackStations
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stationsRef = collection(db, "stations")
    
    const unsubscribe = onSnapshot(
      stationsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const stationsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Station[]
          setStations(stationsData)
          setCache(STATIONS_CACHE_KEY, stationsData)
        }
        setIsLoading(false)
      },
      () => {
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { stations, isLoading }
}

// Hook to search routes and stations with category filter
export function useRouteSearch(searchQuery: string, category?: RouteCategory) {
  const { routes, isLoading: routesLoading } = useRoutes()
  const { stations, isLoading: stationsLoading } = useStations()
  
  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    // First filter by category if specified
    let categoryFilteredRoutes = routes
    if (category) {
      categoryFilteredRoutes = routes.filter(route => route.category === category)
    }
    
    if (!query) {
      return { 
        routes, 
        stations, 
        matchedRoutes: categoryFilteredRoutes, 
        matchedStations: stations 
      }
    }
    
    // Search in routes - including municipalities for intercity
    const matchedRoutes = categoryFilteredRoutes.filter((route) => 
      route.name.includes(searchQuery) ||
      route.nameEn.toLowerCase().includes(query) ||
      route.lineNumber.toLowerCase().includes(query) ||
      // Search in municipalities
      route.municipalities?.some(m => 
        m.includes(searchQuery) || 
        m.toLowerCase().includes(query)
      ) ||
      // Search in stops
      route.stops.some(stop => 
        stop.name.includes(searchQuery) || 
        stop.nameEn.toLowerCase().includes(query) ||
        stop.municipality?.includes(searchQuery) ||
        stop.municipality?.toLowerCase().includes(query)
      )
    )
    
    const matchedStations = stations.filter((station) =>
      station.name.includes(searchQuery) ||
      station.nameEn.toLowerCase().includes(query) ||
      station.address.includes(searchQuery)
    )
    
    return { routes, stations, matchedRoutes, matchedStations }
  }, [routes, stations, searchQuery, category])
  
  return {
    ...filteredResults,
    isLoading: routesLoading || stationsLoading
  }
}

// Get routes by category
export function useRoutesByCategory(category: RouteCategory) {
  const { routes, isLoading } = useRoutes()
  
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => route.category === category)
  }, [routes, category])
  
  return { routes: filteredRoutes, isLoading }
}

// Get all unique stations from routes
export function useAllStationsFromRoutes() {
  const { routes } = useRoutes()
  
  return useMemo(() => {
    const stationMap = new Map<string, { name: string; nameEn: string; coords: [number, number]; lines: string[]; municipality?: string }>()
    
    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        const existing = stationMap.get(stop.name)
        if (existing) {
          if (!existing.lines.includes(route.lineNumber)) {
            existing.lines.push(route.lineNumber)
          }
        } else {
          stationMap.set(stop.name, {
            name: stop.name,
            nameEn: stop.nameEn,
            coords: stop.coords,
            lines: [route.lineNumber],
            municipality: stop.municipality
          })
        }
      })
    })
    
    return Array.from(stationMap.values())
  }, [routes])
}

// Get all municipalities served
export function useMunicipalities() {
  const { routes } = useRoutes()
  
  return useMemo(() => {
  const municipalities = new Set<string>()
  municipalities.add("خنشلة") // Always include main city
  
  routes.forEach((route) => {
  route.municipalities?.forEach(m => municipalities.add(m))
  })
  
  return Array.from(municipalities)
  }, [routes])
}

// Get a single route by ID with sub_stations
export function useRouteById(routeId: string | null) {
  const { routes, isLoading } = useRoutes()
  
  const route = useMemo(() => {
    if (!routeId) return null
    return routes.find(r => r.id === routeId || r.lineNumber === routeId) || null
  }, [routes, routeId])
  
  return { route, isLoading }
}

// Get sub_stations for a specific route
export function useRouteSubStations(routeId: string | null) {
  const { route, isLoading } = useRouteById(routeId)
  
  const subStations = useMemo(() => {
    if (!route) return []
    // Return sub_stations if available, otherwise derive from stops
    return route.sub_stations || route.stops.map(stop => ({
      id: stop.id,
      name: stop.name,
      nameEn: stop.nameEn,
      coords: stop.coords,
      order: stop.order,
    }))
  }, [route])
  
  return { subStations, route, isLoading }
}
