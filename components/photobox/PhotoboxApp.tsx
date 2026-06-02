"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import type * as React from "react"
import type { Dispatch, RefObject, SetStateAction } from "react"
import {
  Camera,
  Check,
  Download,
  ImagePlus,
  Loader2,
  RefreshCcw,
  Share2,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { canvasToBlob, drawPhotobox, releaseLoadedImage } from "./canvas"
import type { PhotoItem, PhotoboxState } from "./canvas"
import type { PhotoboxLayout } from "./config"
import {
  EXPORT_PRESETS,
  FILTERS,
  LAYOUTS,
  MAX_FILE_SIZE,
  MAX_PHOTOS,
  STICKER_POSITIONS,
  STICKERS,
  THEMES,
} from "./config"

type PhotoSlots = Array<PhotoItem | null>

type AppState = Omit<PhotoboxState, "photos">

type LayoutThumbProps = {
  layout: PhotoboxLayout
  active: boolean
  onClick: () => void
}

type PhotoInputProps = {
  photos: PhotoSlots
  selectedSlot: number
  onFiles: (files: File[], startSlot?: number) => void
  onSelectSlot: (slot: number) => void
  onRemove: (slot: number) => void
  onUpdatePhoto: (slot: number, patch: Partial<PhotoItem>) => void
  error: string
  setError: (message: string) => void
}

type StylePanelProps = {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
}

type PhotoboxPreviewProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  state: AppState
  photosFilled: number
  targetHeight: number | null
}

type ExportPanelProps = {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
  onExport: () => Promise<void>
  onShare: () => Promise<void>
  exporting: boolean
  exportError: string
  canShare: boolean
}

function emptyPhotos(): PhotoSlots {
  return Array.from({ length: MAX_PHOTOS }, () => null)
}

function todayLabel() {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date())
}

function createPhoto(file: File): PhotoItem {
  return {
    id: crypto.randomUUID(),
    url: URL.createObjectURL(file),
    name: file.name || "camera-capture.jpg",
    x: 0.5,
    y: 0.5,
    scale: 1,
  }
}

function revokePhoto(photo: PhotoItem | null) {
  if (photo?.url) {
    releaseLoadedImage(photo.url)
    URL.revokeObjectURL(photo.url)
  }
}

function subscribeToShareCapability() {
  return () => {}
}

function getClientShareCapability() {
  return "share" in navigator
}

function LayoutThumb({ layout, active, onClick }: LayoutThumbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-24 rounded-lg border p-3 text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/60"
      )}
    >
      <div
        className="relative mx-auto mb-3 h-24 overflow-hidden rounded-md border bg-background shadow-inner"
        style={{ aspectRatio: layout.ratio }}
      >
        <span className="absolute inset-1 rounded-sm" style={{ background: layout.thumbBackground }} />
        {layout.rects.map((rect, index) => (
          <span
            key={index}
            className="absolute rounded-[3px] border border-background/80 bg-[linear-gradient(135deg,var(--primary),var(--chart-2))] shadow-sm"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          />
        ))}
        <span className="absolute bottom-1 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-foreground/20" />
      </div>
      <div className="text-sm font-semibold">{layout.name}</div>
      <div className="text-xs text-muted-foreground">{layout.hint}</div>
    </button>
  )
}

function PhotoInput({ photos, selectedSlot, onFiles, onSelectSlot, onRemove, onUpdatePhoto, error, setError }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraBusy, setCameraBusy] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  const selectedPhoto = photos[selectedSlot]

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!cameraOpen || !cameraStream || !video) return

    video.srcObject = cameraStream
    video.play().catch(() => {
      setError("Camera is active, but the preview could not autoplay. Tap capture or reopen the camera.")
    })
  }, [cameraOpen, cameraStream, setError])

  const openCamera = async () => {
    setError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser. Upload a photo instead.")
      return
    }

    try {
      setCameraBusy(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      streamRef.current = stream
      setCameraStream(stream)
      setCameraOpen(true)
    } catch {
      setError("Camera permission was denied or unavailable. You can still upload a local image.")
    } finally {
      setCameraBusy(false)
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraStream(null)
    setCameraReady(false)
    setCameraOpen(false)
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    if (video.readyState < 2) {
      setError("Camera preview is still loading. Wait a moment, then capture again.")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext("2d")
    if (!context) {
      setError("Camera capture failed. Try upload as fallback.")
      return
    }
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Camera capture failed. Try upload as fallback.")
        return
      }
      const file = new File([blob], `photobox-capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      onFiles([file], selectedSlot)
      closeCamera()
    }, "image/jpeg", 0.9)
  }

  return (
    <section className="rounded-lg border bg-card/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Photos</h2>
          <p className="text-xs text-muted-foreground">Local upload, drag-drop, or camera capture.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload />
          Upload
        </Button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click()
        }}
        onDrop={(event: React.DragEvent<HTMLDivElement>) => {
          event.preventDefault()
          onFiles(Array.from(event.dataTransfer.files), selectedSlot)
        }}
        onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
        className="mb-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-4 text-center transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ImagePlus className="mb-2 size-5 text-primary" />
        <span className="text-sm font-medium">Drop images here or browse files</span>
        <span className="text-xs text-muted-foreground">PNG, JPEG, WebP up to 10 MB each.</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onFiles(Array.from(event.target.files ?? []), selectedSlot)
          event.target.value = ""
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo?.id || index}
            type="button"
            aria-pressed={selectedSlot === index}
            onClick={() => onSelectSlot(index)}
            className={cn(
              "relative aspect-4/3 overflow-hidden rounded-lg border text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
              selectedSlot === index ? "border-primary ring-2 ring-primary/25" : "border-border"
            )}
          >
            {photo ? (
              // Object URLs cannot use next/image because they are local, ephemeral browser resources.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt={`Photo slot ${index + 1}`} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
                Slot {index + 1}
              </span>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium">
              {index + 1}
            </span>
          </button>
        ))}
      </div>

      {selectedPhoto ? (
        <div className="mt-4 space-y-3 rounded-lg bg-muted/45 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium">{selectedPhoto.name}</p>
            <Button size="icon-sm" variant="destructive" aria-label="Remove selected photo" onClick={() => onRemove(selectedSlot)}>
              <Trash2 />
            </Button>
          </div>
          <label className="block text-xs font-medium">
            Horizontal crop
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedPhoto.x}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdatePhoto(selectedSlot, { x: Number(event.target.value) })}
              className="mt-2 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-medium">
            Vertical crop
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedPhoto.y}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdatePhoto(selectedSlot, { y: Number(event.target.value) })}
              className="mt-2 w-full accent-primary"
            />
          </label>
          <label className="block text-xs font-medium">
            Zoom
            <input
              type="range"
              min="1"
              max="2.2"
              step="0.02"
              value={selectedPhoto.scale}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => onUpdatePhoto(selectedSlot, { scale: Number(event.target.value) })}
              className="mt-2 w-full accent-primary"
            />
          </label>
        </div>
      ) : null}

      <Button className="mt-4 w-full" variant="secondary" onClick={openCamera} disabled={cameraBusy}>
        {cameraBusy ? <Loader2 className="animate-spin" /> : <Camera />}
        Capture from camera
      </Button>

      {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-lg border bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Camera capture</h3>
                <p className="text-xs text-muted-foreground">Live preview from your local device.</p>
              </div>
              <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {cameraReady ? "Ready" : "Starting"}
              </span>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className="aspect-video w-full scale-x-[-1] rounded-md bg-black object-cover"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={closeCamera}>Cancel</Button>
              <Button onClick={capture} disabled={!cameraReady}>
                {cameraReady ? <Camera /> : <Loader2 className="animate-spin" />}
                {cameraReady ? "Capture" : "Preparing"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StylePanel({ state, setState }: StylePanelProps) {
  return (
    <section className="rounded-lg border bg-card/90 p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Style</h2>
        <p className="text-xs text-muted-foreground">Frame, filter, copy, date, and sticker controls.</p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium">Frame theme</div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                aria-pressed={state.themeId === theme.id}
                onClick={() => setState((current) => ({ ...current, themeId: theme.id }))}
                className={cn(
                  "min-h-20 rounded-lg border p-2 text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  state.themeId === theme.id ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <span className="mb-2 grid h-8 grid-cols-2 gap-1 rounded p-1" style={{ background: theme.background }}>
                  <span className="rounded-sm" style={{ background: theme.border }} />
                  <span className="rounded-sm" style={{ background: theme.accent }} />
                </span>
                <span className="block text-xs font-semibold">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium">Layout</div>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map((layout) => (
              <LayoutThumb
                key={layout.id}
                layout={layout}
                active={state.layoutId === layout.id}
                onClick={() => setState((current) => ({ ...current, layoutId: layout.id }))}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium">Filter</div>
          <div className="grid grid-cols-2 gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={state.filterId === filter.id}
                onClick={() => setState((current) => ({ ...current, filterId: filter.id }))}
                className={cn(
                  "rounded-lg border p-2 text-left text-sm transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  state.filterId === filter.id ? "border-primary bg-primary/10" : "border-border bg-background"
                )}
              >
                <span className="mb-2 block h-8 rounded bg-[linear-gradient(135deg,var(--chart-2),var(--primary),var(--chart-5))]" style={{ filter: filter.css }} />
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs font-medium">
          Caption
          <input
            value={state.caption}
            maxLength={42}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState((current) => ({ ...current, caption: event.target.value }))}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Long distance, same frame"
          />
        </label>

        <div className="rounded-lg border bg-muted/35 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium">Caption position</div>
              <p className="text-xs text-muted-foreground">Custom placement on the exported frame.</p>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setState((current) => ({ ...current, captionX: 0.5, captionY: 0.88 }))}
            >
              Reset
            </Button>
          </div>
          <label className="block text-xs font-medium">
            Horizontal
            <input
              type="range"
              min="0.08"
              max="0.92"
              step="0.01"
              value={state.captionX}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState((current) => ({ ...current, captionX: Number(event.target.value) }))}
              className="mt-2 w-full accent-primary"
            />
          </label>
          <label className="mt-3 block text-xs font-medium">
            Vertical
            <input
              type="range"
              min="0.08"
              max="0.94"
              step="0.01"
              value={state.captionY}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState((current) => ({ ...current, captionY: Number(event.target.value) }))}
              className="mt-2 w-full accent-primary"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={state.showDate}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState((current) => ({ ...current, showDate: event.target.checked }))}
              className="size-4 accent-primary"
            />
            Show date
          </label>
          <input
            value={state.dateText}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState((current) => ({ ...current, dateText: event.target.value }))}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Date text"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            Sticker
            <select
              value={state.sticker}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setState((current) => ({ ...current, sticker: event.target.value }))}
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {STICKERS.map((sticker) => (
                <option key={sticker.id} value={sticker.id}>{sticker.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Placement
            <select
              value={state.stickerPosition}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setState((current) => ({ ...current, stickerPosition: event.target.value }))}
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {STICKER_POSITIONS.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

function PhotoboxPreview({ canvasRef, state, photosFilled, targetHeight }: PhotoboxPreviewProps) {
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null)
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 })
  const layout = LAYOUTS.find((item) => item.id === state.layoutId) || LAYOUTS[0]
  const preset = EXPORT_PRESETS.find((item) => item.id === state.exportPreset) || EXPORT_PRESETS[0]
  const previewRatio = preset.width / preset.height
  const availableWidth = Math.max(surfaceSize.width - 32, 0)
  const availableHeight = Math.max(surfaceSize.height - 32, 0)
  const maxCanvasWidth = previewRatio < 1 ? Math.min(availableWidth, 360) : Math.min(availableWidth, 520)
  const displayWidth = availableWidth && availableHeight
    ? Math.min(maxCanvasWidth, availableHeight * previewRatio)
    : 0
  const displayHeight = displayWidth ? displayWidth / previewRatio : 0

  useEffect(() => {
    const surface = previewSurfaceRef.current
    if (!surface) return

    const updateSurfaceSize = () => {
      const rect = surface.getBoundingClientRect()
      setSurfaceSize({ width: rect.width, height: rect.height })
    }

    const frame = window.requestAnimationFrame(updateSurfaceSize)
    const observer = new ResizeObserver(updateSurfaceSize)
    observer.observe(surface)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <section
      className="relative isolate flex flex-col self-start overflow-hidden rounded-lg border bg-[linear-gradient(145deg,color-mix(in_oklch,var(--card),var(--primary)_8%),var(--card)_42%,color-mix(in_oklch,var(--card),var(--chart-2)_10%))] p-4 shadow-sm"
      style={targetHeight ? { height: `${targetHeight}px` } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.22),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(251,191,36,0.2),transparent_22%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.06))]" />
      <div
        ref={previewSurfaceRef}
        className="grid min-h-0 flex-1 place-items-center rounded-lg border border-white/40 bg-background/35 p-4 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          width={preset.width}
          height={preset.height}
          aria-label="Photobox composition preview"
          className="block rounded-lg border bg-background shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
          style={{
            width: displayWidth ? `${displayWidth}px` : "min(100%, 360px)",
            height: displayHeight ? `${displayHeight}px` : "auto",
          }}
        />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        <div>
          <h2 className="text-sm font-semibold">Preview</h2>
          <p className="text-xs text-muted-foreground">
            {photosFilled} of {layout.slots} visible slots filled. Photos stay local in this browser.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium">
            {preset.description}
          </span>
          <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium">
            Local-only canvas
          </span>
        </div>
      </div>
    </section>
  )
}

function ExportPanel({ state, setState, onExport, onShare, exporting, exportError, canShare }: ExportPanelProps) {
  return (
    <section className="rounded-lg border bg-card/90 p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Export</h2>
          <p className="text-xs text-muted-foreground">PNG or JPEG, generated client-side only.</p>
        </div>
        <Wand2 className="size-5 text-primary" />
      </div>

      <div className="mb-4 grid gap-2">
        {EXPORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={state.exportPreset === preset.id}
            onClick={() => setState((current) => ({ ...current, exportPreset: preset.id }))}
            className={cn(
              "flex min-h-11 items-center justify-between rounded-lg border px-3 text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
              state.exportPreset === preset.id ? "border-primary bg-primary/10" : "border-border bg-background"
            )}
          >
            <span>
              <span className="block text-sm font-medium">{preset.name}</span>
              <span className="block text-xs text-muted-foreground">{preset.description}</span>
            </span>
            {state.exportPreset === preset.id ? <Check className="size-4 text-primary" /> : null}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button
          variant={state.exportType === "image/png" ? "default" : "outline"}
          onClick={() => setState((current) => ({ ...current, exportType: "image/png" }))}
        >
          PNG
        </Button>
        <Button
          variant={state.exportType === "image/jpeg" ? "default" : "outline"}
          onClick={() => setState((current) => ({ ...current, exportType: "image/jpeg" }))}
        >
          JPEG
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          Download
        </Button>
        <Button variant="outline" onClick={onShare} disabled={exporting || !canShare}>
          <Share2 />
          Share
        </Button>
      </div>

      {!canShare ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Native sharing is unavailable here. Download is still supported.
        </p>
      ) : null}
      {exportError ? <p className="mt-3 text-sm text-destructive" role="alert">{exportError}</p> : null}
    </section>
  )
}

export function PhotoboxApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const leftColumnRef = useRef<HTMLDivElement | null>(null)
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [inputError, setInputError] = useState("")
  const [exportError, setExportError] = useState("")
  const [exporting, setExporting] = useState(false)
  const [previewTargetHeight, setPreviewTargetHeight] = useState<number | null>(null)
  const [photos, setPhotos] = useState(() => emptyPhotos())
  const photosRef = useRef<PhotoSlots>(photos)
  const [state, setState] = useState<AppState>({
    layoutId: "duo-strip",
    themeId: "soft-pop",
    filterId: "clean",
    caption: "Long distance, same frame",
    captionX: 0.5,
    captionY: 0.88,
    showDate: true,
    dateText: todayLabel(),
    sticker: "spark",
    stickerPosition: "top-right",
    exportPreset: "classic",
    exportType: "image/png",
  })

  const appState = useMemo(() => ({ ...state, photos }), [state, photos])
  const activeLayout = LAYOUTS.find((item) => item.id === state.layoutId) || LAYOUTS[0]
  const photosFilled = photos.slice(0, activeLayout.slots).filter(Boolean).length

  const canShare = useSyncExternalStore(subscribeToShareCapability, getClientShareCapability, () => false)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => photosRef.current.forEach(revokePhoto)
  }, [])

  useEffect(() => {
    const leftColumn = leftColumnRef.current
    if (!leftColumn) return

    const updatePreviewHeight = () => {
      setPreviewTargetHeight(leftColumn.getBoundingClientRect().height)
    }

    const frame = window.requestAnimationFrame(updatePreviewHeight)
    const observer = new ResizeObserver(updatePreviewHeight)
    observer.observe(leftColumn)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    const redraw = async () => {
      const preset = EXPORT_PRESETS.find((item) => item.id === state.exportPreset) || EXPORT_PRESETS[0]
      await drawPhotobox(canvas, appState, { width: preset.width, height: preset.height })
      if (cancelled) return
    }
    redraw()

    return () => {
      cancelled = true
    }
  }, [appState, state.exportPreset])

  const addFiles = useCallback((files: File[], startSlot = selectedSlot) => {
    setInputError("")
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    const rejectedBySize = imageFiles.find((file) => file.size > MAX_FILE_SIZE)

    if (files.length && !imageFiles.length) {
      setInputError("Unsupported file type. Use PNG, JPEG, or WebP.")
      return
    }

    if (rejectedBySize) {
      setInputError("One image is larger than 10 MB. Choose a smaller file for smoother export.")
      return
    }

    setPhotos((current) => {
      const next = [...current]
      let slot = startSlot

      imageFiles.slice(0, MAX_PHOTOS).forEach((file) => {
        while (slot < MAX_PHOTOS && next[slot]) slot += 1
        if (slot >= MAX_PHOTOS) slot = next.findIndex((item) => !item)
        if (slot < 0) return
        revokePhoto(next[slot])
        next[slot] = createPhoto(file)
        slot += 1
      })

      return next
    })
  }, [selectedSlot])

  const updatePhoto = (slot: number, patch: Partial<PhotoItem>) => {
    setPhotos((current) => current.map((photo, index) => (index === slot && photo ? { ...photo, ...patch } : photo)))
  }

  const removePhoto = (slot: number) => {
    setPhotos((current) => {
      const next = [...current]
      revokePhoto(next[slot])
      next[slot] = null
      return next
    })
  }

  const reset = () => {
    photos.forEach(revokePhoto)
    setPhotos(emptyPhotos())
    setSelectedSlot(0)
    setInputError("")
    setExportError("")
    setState((current) => ({
      ...current,
      layoutId: "duo-strip",
      themeId: "soft-pop",
      filterId: "clean",
      caption: "Long distance, same frame",
      captionX: 0.5,
      captionY: 0.88,
      showDate: true,
      dateText: todayLabel(),
      sticker: "spark",
      stickerPosition: "top-right",
    }))
  }

  const renderExportCanvas = async (): Promise<HTMLCanvasElement> => {
    const preset = EXPORT_PRESETS.find((item) => item.id === state.exportPreset) || EXPORT_PRESETS[0]
    const canvas = document.createElement("canvas")
    await drawPhotobox(canvas, appState, { width: preset.width, height: preset.height })
    return canvas
  }

  const download = async () => {
    try {
      setExporting(true)
      setExportError("")
      const canvas = await renderExportCanvas()
      const blob = await canvasToBlob(canvas, state.exportType)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `virtual-photobox.${state.exportType === "image/png" ? "png" : "jpg"}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed. Try another preset or browser.")
    } finally {
      setExporting(false)
    }
  }

  const share = async () => {
    try {
      setExporting(true)
      setExportError("")
      const canvas = await renderExportCanvas()
      const blob = await canvasToBlob(canvas, state.exportType)
      const file = new File([blob], "virtual-photobox.png", { type: state.exportType })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Virtual Photobox" })
      } else {
        setExportError("This browser cannot share image files directly. Download the image instead.")
      }
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "AbortError") {
        setExportError("Share failed. Download is still available.")
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_10%_0%,color-mix(in_oklch,var(--primary),transparent_76%),transparent_32%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background),var(--primary)_8%))] px-4 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-lg border bg-card/88 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-primary">Virtual Photobox</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Compose a shared photo strip locally.</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add photos from camera, upload, or chat. Nothing is stored server-side in this MVP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={reset}>
              <RefreshCcw />
              New
            </Button>
            <Button onClick={download} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              Export
            </Button>
          </div>
        </header>

        <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <div ref={leftColumnRef} className="space-y-4">
            <PhotoInput
              photos={photos}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onFiles={addFiles}
              onRemove={removePhoto}
              onUpdatePhoto={updatePhoto}
              error={inputError}
              setError={setInputError}
            />
            <ExportPanel
              state={state}
              setState={setState}
              onExport={download}
              onShare={share}
              exporting={exporting}
              exportError={exportError}
              canShare={canShare}
            />
          </div>

          <PhotoboxPreview
            canvasRef={canvasRef}
            state={state}
            photosFilled={photosFilled}
            targetHeight={previewTargetHeight}
          />

          <div className="space-y-4">
            <StylePanel state={state} setState={setState} />
          </div>
        </div>
      </div>
    </main>
  )
}
