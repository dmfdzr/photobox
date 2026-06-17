"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { StepIndicator } from "@/components/photobox/StepIndicator"
import { UploadPhotoManager } from "@/components/photobox/UploadPhotoManager"
import { usePhotobox } from "@/components/photobox/PhotoboxProvider"

export default function UploadPage() {
  const router = useRouter()
  const { session, settingsLoaded, setInputMethod } = usePhotobox()

  React.useEffect(() => {
    if (!settingsLoaded) return
    if (!session.inputMethod) setInputMethod("upload")
  }, [session.inputMethod, setInputMethod, settingsLoaded])

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark size="sm" />
            <h1 className="text-3xl font-black text-foreground">Upload photos</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => router.push("/create")}>Change setup</Button>
          </div>
        </header>
        <StepIndicator activeIndex={2} />
        <UploadPhotoManager />
      </div>
    </main>
  )
}
