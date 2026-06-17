"use client"

import { useRouter } from "next/navigation"
import { Camera, Download, ImagePlus, LayoutTemplate } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function PhotoboxApp() {
  const router = useRouter()

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-3xl rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <h1 className="mt-2 text-4xl font-black text-foreground">Create your photobox moment instantly.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Take or upload your photo, customize the layout, and save a polished result in minutes.
        </p>
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={() => router.push("/create")}>Start Creating</Button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {[
            { icon: Camera, label: "Take photo" },
            { icon: ImagePlus, label: "Upload" },
            { icon: LayoutTemplate, label: "Customize" },
            { icon: Download, label: "Download" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-background p-3 text-sm font-semibold text-foreground">
              <item.icon className="mx-auto mb-2 size-5 text-sky-600" />
              {item.label}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
