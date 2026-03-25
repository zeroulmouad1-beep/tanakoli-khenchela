// Route category type
export type RouteCategory = "urban" | "intercity"

// Sub-station type for intermediate stops
export interface SubStation {
  id: string
  name: string
  nameEn: string
  coords: [number, number]
  order: number
}

// Route stop type
export interface RouteStop {
  id: string
  name: string
  nameEn: string
  coords: [number, number]
  order: number
  municipality?: string // For inter-city stops
}

// Working hours type
export interface WorkingHours {
  start: string
  end: string
}

// Bus route type
export interface BusRoute {
  id: string
  name: string
  nameEn: string
  lineNumber: string
  color: string
  price: number
  workingHours: WorkingHours
  frequency: number // minutes between buses
  stops: RouteStop[]
  sub_stations?: SubStation[] // Intermediate sub-stations along the route
  category: RouteCategory // "urban" or "intercity"
  municipalities?: string[] // List of municipalities this route connects (for intercity)
  distance?: number // Distance in km (for intercity)
  duration?: number // Duration in minutes (for intercity)
}

// Station type
export interface Station {
  id: string
  name: string
  nameEn: string
  address: string
  coords: [number, number]
  lines: string[]
  facilities: string[]
  isMainStation: boolean
}

// Facility icon mapping
export const facilityLabels: Record<string, string> = {
  wifi: "واي فاي",
  shelter: "مظلة",
  bench: "مقاعد",
  toilet: "دورة مياه",
  kiosk: "كشك"
}
