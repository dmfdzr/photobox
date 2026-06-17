import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = ["Method", "Layout", "Photo", "Customize", "Download"]

export function StepIndicator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {STEPS.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex

        return (
          <div
            key={step}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg border bg-card/80 px-3 text-sm shadow-sm",
              active && "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-950/35 dark:text-sky-200",
              done && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200"
            )}
          >
            <span className={cn("grid size-6 place-items-center rounded-full bg-muted text-xs font-bold", active && "bg-sky-500 text-white", done && "bg-emerald-500 text-white")}>
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="font-semibold">{step}</span>
          </div>
        )
      })}
    </div>
  )
}
