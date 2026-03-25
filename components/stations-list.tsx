"use client"

import { MapPin, Navigation, Building2, GraduationCap, Hospital, ShoppingBag } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Station {
  id: string
  name: string
  distance: string
  lines: string[]
  icon: React.ReactNode
}

const stations: Station[] = [
  {
    id: "1",
    name: "الجامعة",
    distance: "150 م",
    lines: ["خط 1", "خط 3"],
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: "2",
    name: "وسط المدينة",
    distance: "300 م",
    lines: ["خط 2", "خط 4", "خط 5"],
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "3",
    name: "المستشفى",
    distance: "450 م",
    lines: ["خط 1", "خط 6"],
    icon: <Hospital className="h-5 w-5" />,
  },
  {
    id: "4",
    name: "السوق المركزي",
    distance: "600 م",
    lines: ["خط 2", "خط 3"],
    icon: <ShoppingBag className="h-5 w-5" />,
  },
]

export function StationsList() {
  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <button className="flex items-center gap-1 text-sm text-primary">
          <Navigation className="h-4 w-4" />
          <span>ترتيب حسب المسافة</span>
        </button>
        <h2 className="text-lg font-semibold text-foreground">المحطات القريبة</h2>
      </div>

      <div className="flex flex-col gap-3">
        {stations.map((station) => (
          <Card
            key={station.id}
            className="flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex flex-1 flex-col items-end gap-1">
              <h3 className="font-semibold text-card-foreground">{station.name}</h3>
              <div className="flex flex-wrap justify-end gap-1">
                {station.lines.map((line) => (
                  <span
                    key={line}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{station.distance}</span>
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {station.icon}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
