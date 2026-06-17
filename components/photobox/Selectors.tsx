"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { FILTERS, FRAMES, LAYOUTS, type PhotoboxLayout } from "./config"
import { usePhotobox } from "./PhotoboxProvider"

function LayoutSketch({ layout }: { layout: PhotoboxLayout }) {
  return (
    <div className="relative mx-auto mb-3 h-28 max-w-32 rounded-md border bg-background shadow-inner" style={{ aspectRatio: layout.width / layout.height }}>
      {layout.slots.map((slot, index) => (
        <span
          key={index}
          className="absolute rounded-[4px] border border-white bg-[linear-gradient(135deg,#60A5FA,#F9A8D4)] shadow-sm"
          style={{
            left: `${(slot.x / layout.width) * 100}%`,
            top: `${(slot.y / layout.height) * 100}%`,
            width: `${(slot.width / layout.width) * 100}%`,
            height: `${(slot.height / layout.height) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export function LayoutSelector() {
  const { session, setLayout } = usePhotobox()

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {LAYOUTS.map((layout) => {
        const active = session.selectedLayout === layout.id

        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => setLayout(layout.id)}
            aria-pressed={active}
            className={cn(
              "rounded-lg border bg-background p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-sky-200",
              active && "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
            )}
          >
            <LayoutSketch layout={layout} />
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-foreground">{layout.name}</p>
                <p className="text-sm text-muted-foreground">{layout.photoCount} photo{layout.photoCount > 1 ? "s" : ""}</p>
              </div>
              {active ? <Check className="size-5 text-sky-600" /> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{layout.description}</p>
          </button>
        )
      })}
    </div>
  )
}

export function FrameSelector() {
  const { session, setFrame } = usePhotobox()

  return (
    <div className="grid grid-cols-2 gap-2">
      {FRAMES.map((frame) => (
        <button
          key={frame.id}
          type="button"
          onClick={() => setFrame(frame.id)}
          className={cn(
            "min-h-20 rounded-lg border p-3 text-left transition hover:-translate-y-0.5",
            session.selectedFrame === frame.id ? "border-sky-400 ring-2 ring-sky-100 dark:ring-sky-900/60" : "border-border"
          )}
          style={{ background: frame.backgroundColor, color: frame.textColor }}
        >
          <span className="mb-2 block h-6 rounded-md border" style={{ borderColor: frame.borderColor, background: frame.accentColor }} />
          <span className="text-sm font-bold">{frame.name}</span>
        </button>
      ))}
    </div>
  )
}

export function FilterSelector() {
  const { session, setFilter } = usePhotobox()

  return (
    <div className="grid grid-cols-2 gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => setFilter(filter.id)}
          className={cn(
            "rounded-lg border bg-background p-3 text-left transition hover:-translate-y-0.5",
            session.selectedFilter === filter.id ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-border"
          )}
        >
          <span className="mb-2 block h-9 rounded-md bg-[linear-gradient(135deg,#60A5FA,#F9A8D4,#22C55E)]" style={{ filter: filter.cssFilter }} />
          <span className="text-sm font-bold text-foreground">{filter.name}</span>
        </button>
      ))}
    </div>
  )
}
