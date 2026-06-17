"use client"

import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResultPreview } from "@/components/photobox/ResultPreview"
import { StepIndicator } from "@/components/photobox/StepIndicator"

export default function PreviewPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark size="sm" />
            <h1 className="text-3xl font-black text-foreground">Preview result</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/create">Edit setup</Link>
            </Button>
          </div>
        </header>
        <StepIndicator activeIndex={4} />
        <ResultPreview />
      </div>
    </main>
  )
}
