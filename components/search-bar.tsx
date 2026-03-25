"use client"

import { Search } from "lucide-react"

export function SearchBar() {
  return (
    <div className="relative px-4">
      <div className="relative -mt-6 flex items-center">
        <div className="relative w-full">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن خط حافلة أو محطة..."
            suppressHydrationWarning
            className="flex h-14 w-full rounded-2xl border border-input bg-card px-4 pr-12 text-right text-base shadow-lg transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
