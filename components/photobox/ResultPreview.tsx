"use client"

import * as React from "react"
import { ArrowLeft, CheckCircle2, Download, Loader2, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { drawPhotobox, downloadPhotobox } from "./canvas"
import { getLayout } from "./config"
import { usePhotobox } from "./PhotoboxProvider"
import { FilterSelector, FrameSelector, LayoutSelector } from "./Selectors"

export function ResultPreview() {
  const router = useRouter()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const { session, hasEnoughPhotos, requiredPhotoCount, resetSession } = usePhotobox()
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")
  const layout = getLayout(session.selectedLayout)

  React.useEffect(() => {
    let cancelled = false

    async function render() {
      await drawPhotobox(canvasRef.current, session)
      if (cancelled) return
    }

    render()

    return () => {
      cancelled = true
    }
  }, [session])

  const download = async (type: "image/png" | "image/jpeg") => {
    try {
      setExporting(true)
      setError("")
      setSuccess("")
      await downloadPhotobox(session, type)
      setSuccess(type === "image/png" ? "PNG downloaded as snapbox-result.png." : "JPG downloaded as snapbox-result.jpg.")
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed. Try again.")
    } finally {
      setExporting(false)
    }
  }

  React.useEffect(() => {
    if (!success) return

    const timer = window.setTimeout(() => setSuccess(""), 3600)
    return () => window.clearTimeout(timer)
  }, [success])

  if (!hasEnoughPhotos) {
    return (
      <section className="mx-auto max-w-xl rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-3xl font-black text-foreground">Photos are missing</h1>
        <p className="mt-2 text-muted-foreground">This layout needs {requiredPhotoCount} photo{requiredPhotoCount > 1 ? "s" : ""}. Add more photos before previewing the final result.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => router.push(session.inputMethod === "camera" ? "/camera" : "/upload")}>Back to photos</Button>
          <Button variant="outline" onClick={() => router.push("/create")}>Change layout</Button>
        </div>
      </section>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid min-h-[640px] place-items-center rounded-lg border bg-[linear-gradient(135deg,#EFF6FF,#FFFFFF,#FDF2F8)] p-4 shadow-sm dark:bg-[linear-gradient(135deg,#0F172A,#111827,#3B1230)]">
        <canvas
          ref={canvasRef}
          width={layout.width}
          height={layout.height}
          className="max-h-[78vh] max-w-full rounded-lg border bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
          style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
          aria-label="SnapBox final photobox preview"
        />
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-sky-700">Final Preview</p>
          <h1 className="text-2xl font-black text-foreground">Customize and download</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review your final look, adjust the style, then save it.</p>
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={() => router.push(session.inputMethod === "camera" ? "/camera" : "/upload")}
          >
            <ArrowLeft />
            Back to edit photos
          </Button>
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Layout</h2>
          <LayoutSelector />
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Frame</h2>
          <FrameSelector />
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Filter</h2>
          <FilterSelector />
        </section>

        <section className="sticky bottom-4 rounded-lg border bg-card p-4 shadow-lg">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => download("image/png")} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              PNG
            </Button>
            <Button variant="outline" onClick={() => download("image/jpeg")} disabled={exporting}>
              <Download />
              JPG
            </Button>
          </div>
          <Button className="mt-2 w-full" variant="outline" onClick={() => {
            resetSession()
            router.push("/")
          }}>
            <RefreshCcw />
            Reset
          </Button>
          {success ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200" role="status">
              <CheckCircle2 className="size-4" />
              {success}
            </p>
          ) : null}
          {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        </section>
      </aside>
    </div>
  )
}
