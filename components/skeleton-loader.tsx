"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

// Base skeleton with improved shimmer effect
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/70",
        className
      )}
    >
      {/* Smooth shimmer overlay */}
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
    </div>
  )
}

// Station card skeleton
export function StationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
          </div>
        </div>
        <Skeleton className="h-16 w-[72px] rounded-xl" />
      </div>
      <Skeleton className="mt-3 h-10 w-full rounded-xl" />
    </div>
  )
}

// Trip history card skeleton
export function TripCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

// Bus line schedule card skeleton
export function BusLineCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="border-b border-border bg-primary/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Account balance card skeleton
export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-l from-primary/50 to-primary/30 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

// Profile info skeleton
export function ProfileInfoSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Map section skeleton
export function MapSkeleton() {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-b-3xl bg-muted">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {/* Fake map grid lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  )
}

// Generic list skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <StationCardSkeleton key={i} />
      ))}
    </div>
  )
}
