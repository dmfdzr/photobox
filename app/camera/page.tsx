"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CameraCapture } from "@/components/photobox/CameraCapture"
import { StepIndicator } from "@/components/photobox/StepIndicator"
import { usePhotobox } from "@/components/photobox/PhotoboxProvider"

export default function CameraPage() {
  const router = useRouter()
  const { session, settingsLoaded } = usePhotobox()

  React.useEffect(() => {
    if (!settingsLoaded) return
    if (!session.inputMethod) router.replace("/create")
  }, [router, session.inputMethod, settingsLoaded])

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark size="sm" />
            <h1 className="text-3xl font-black text-foreground">Take photos</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/create">Change setup</Link>
            </Button>
          </div>
        </header>
        <StepIndicator activeIndex={2} />
        <CameraCapture />
      </div>
    </main>
  )
}
