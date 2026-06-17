"use client"

import Link from "next/link"
import { Camera, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { FilterSelector, FrameSelector, LayoutSelector } from "@/components/photobox/Selectors"
import { StepIndicator } from "@/components/photobox/StepIndicator"
import { usePhotobox } from "@/components/photobox/PhotoboxProvider"
import { cn } from "@/lib/utils"

export default function CreatePage() {
  const router = useRouter()
  const { session, setInputMethod, setStep } = usePhotobox()

  const continueFlow = () => {
    const target = session.inputMethod === "camera" ? "/camera" : "/upload"
    setStep(session.inputMethod === "camera" ? "camera" : "upload")
    router.push(target)
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandMark size="sm" />
            <h1 className="text-3xl font-black text-foreground">Create your photobox</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </header>

        <StepIndicator activeIndex={session.inputMethod ? 1 : 0} />

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-black text-foreground">Choose input method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { id: "camera" as const, title: "Take Photo", text: "Capture from your device camera.", icon: Camera },
              { id: "upload" as const, title: "Upload Photo", text: "Use images from your gallery or files.", icon: Upload },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setInputMethod(method.id)}
                className={cn(
                  "rounded-lg border bg-background p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  session.inputMethod === method.id && "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                )}
              >
                <method.icon className="mb-5 size-8 text-sky-600" />
                <h3 className="text-lg font-black text-foreground">{method.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{method.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-black text-foreground">Choose layout</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick this before adding photos so SnappBox knows how many photos to collect.</p>
          <div className="mt-4">
            <LayoutSelector />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-foreground">Start frame</h2>
            <FrameSelector />
          </section>
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-foreground">Start filter</h2>
            <FilterSelector />
          </section>
        </div>

        <div className="sticky bottom-4 flex justify-end rounded-lg border bg-card/90 p-3 shadow-lg backdrop-blur">
          <Button size="lg" onClick={continueFlow} disabled={!session.inputMethod}>
            Continue
          </Button>
        </div>
      </div>
    </main>
  )
}
