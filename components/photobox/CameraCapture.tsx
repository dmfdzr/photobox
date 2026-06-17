"use client"

import * as React from "react"
import { Camera, Loader2, RefreshCcw, RotateCcw, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { usePhotobox } from "./PhotoboxProvider"

export function CameraCapture() {
  const router = useRouter()
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const { session, activeLayout, requiredPhotoCount, hasEnoughPhotos, addFiles, removePhoto, setStep, updatePhoto } = usePhotobox()
  const [cameraError, setCameraError] = React.useState("")
  const [cameraReady, setCameraReady] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [countdown, setCountdown] = React.useState<number | null>(null)
  const [flash, setFlash] = React.useState(false)
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("user")

  const remaining = Math.max(requiredPhotoCount - session.photos.length, 0)
  const sessionComplete = remaining <= 0
  const remainingRef = React.useRef(remaining)

  React.useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  const startCamera = React.useCallback(async () => {
    setCameraError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available on this device. Use upload instead.")
      return
    }

    if (remainingRef.current <= 0) {
      stopCamera()
      return
    }

    try {
      setBusy(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setCameraError("Camera access is unavailable. You can still upload a photo instead.")
    } finally {
      setBusy(false)
    }
  }, [facingMode, stopCamera])

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      startCamera()
    })

    return () => {
      window.cancelAnimationFrame(frame)
      stopCamera()
    }
  }, [startCamera, stopCamera])

  React.useEffect(() => {
    if (remaining > 0) return

    const frame = window.requestAnimationFrame(() => {
      stopCamera()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [remaining, stopCamera])

  const captureFrame = React.useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      setCameraError("Camera is still getting ready. Try again in a moment.")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setCameraError("Capture failed. Use upload as fallback.")
      return
    }

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Capture failed. Use upload as fallback.")
        return
      }

      const file = new File([blob], `snapbox-capture-${Date.now()}.jpg`, { type: "image/jpeg" })
      const result = addFiles([file], "camera")
      setCameraError(result.error)
      setFlash(true)
      window.setTimeout(() => setFlash(false), 180)
      if (session.photos.length + result.added >= requiredPhotoCount) {
        stopCamera()
      }
    }, "image/jpeg", 0.92)
  }, [addFiles, requiredPhotoCount, session.photos.length, stopCamera])

  const startCountdown = () => {
    if (!cameraReady || busy || remaining <= 0) return
    setCountdown(3)
  }

  const switchCamera = () => {
    setCountdown(null)
    stopCamera()
    setFacingMode((current) => (current === "user" ? "environment" : "user"))
  }

  React.useEffect(() => {
    if (countdown === null) return

    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null)
        captureFrame()
        return
      }

      setCountdown(countdown - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [captureFrame, countdown])

  const goPreview = () => {
    setStep("preview")
    stopCamera()
    router.push("/preview")
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="relative overflow-hidden rounded-lg border bg-slate-950 shadow-sm">
        {sessionComplete ? (
          <div className="grid aspect-video place-items-center bg-slate-950 p-6 text-center text-white">
            <div>
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                <Camera className="size-6" />
              </div>
              <h2 className="text-2xl font-black">Photo session complete</h2>
              <p className="mt-2 max-w-md text-sm text-slate-300">
                Camera is off. Review your shots below or continue to the final preview.
              </p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => setCameraReady(true)}
            className="aspect-video w-full scale-x-[-1] object-cover"
          />
        )}
        {!sessionComplete && !cameraReady ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Loader2 className="size-4 animate-spin" />
              Preparing camera
            </div>
          </div>
        ) : null}
        {!sessionComplete && countdown !== null ? (
          <div className="absolute inset-0 grid place-items-center bg-black/20 text-8xl font-black text-white">
            {countdown || ""}
          </div>
        ) : null}
        {!sessionComplete && flash ? <div className="absolute inset-0 bg-white/80" /> : null}
      </section>

      <aside className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-sky-700">Camera Capture</p>
          <h1 className="text-2xl font-black text-foreground">{session.photos.length} / {requiredPhotoCount} photos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{activeLayout.name} needs {requiredPhotoCount} photo{requiredPhotoCount > 1 ? "s" : ""}.</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {Array.from({ length: requiredPhotoCount }).map((_, index) => {
            const photo = session.photos[index]
            return (
              <div key={photo?.id || index} className="rounded-lg border bg-background p-2">
                <div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.src}
                      alt={`Captured photo ${index + 1}`}
                      className="absolute left-1/2 top-1/2 max-w-none object-cover"
                      style={{
                        width: `${photo.scale * 100}%`,
                        height: `${photo.scale * 100}%`,
                        transform: `translate(calc(-50% + ${(0.5 - photo.x) * 50}%), calc(-50% + ${(0.5 - photo.y) * 50}%))`,
                      }}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-xs font-semibold text-muted-foreground">Slot {index + 1}</span>
                  )}
                  {photo ? (
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-2 top-2 rounded-full bg-card/90 p-1 text-foreground shadow"
                      aria-label={`Retake photo ${index + 1}`}
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                {photo ? (
                  <details className="mt-2 rounded-md border bg-card p-2 text-xs">
                    <summary className="cursor-pointer font-semibold text-muted-foreground">Crop</summary>
                    <div className="mt-2 grid gap-2">
                      <label className="font-semibold text-muted-foreground">
                        Horizontal
                        <input
                          className="mt-1 w-full accent-sky-500"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={photo.x}
                          onChange={(event) => updatePhoto(photo.id, { x: Number(event.target.value) })}
                        />
                      </label>
                      <label className="font-semibold text-muted-foreground">
                        Vertical
                        <input
                          className="mt-1 w-full accent-sky-500"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={photo.y}
                          onChange={(event) => updatePhoto(photo.id, { y: Number(event.target.value) })}
                        />
                      </label>
                      <label className="font-semibold text-muted-foreground">
                        Zoom
                        <input
                          className="mt-1 w-full accent-sky-500"
                          type="range"
                          min="1"
                          max="2.2"
                          step="0.02"
                          value={photo.scale}
                          onChange={(event) => updatePhoto(photo.id, { scale: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </details>
                ) : null}
              </div>
            )
          })}
        </div>

        {cameraError ? <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{cameraError}</p> : null}

        <div className="grid gap-2">
          <Button size="lg" onClick={startCountdown} disabled={!cameraReady || busy || sessionComplete}>
            <Camera />
            {sessionComplete ? "All photos captured" : "Capture with 3s countdown"}
          </Button>
          <Button variant="outline" onClick={captureFrame} disabled={!cameraReady || busy || sessionComplete}>
            <Camera />
            Capture now
          </Button>
          <Button variant="outline" onClick={switchCamera} disabled={busy || sessionComplete}>
            <RefreshCcw />
            {facingMode === "user" ? "Use back camera" : "Use front camera"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/upload")}>
            <Upload />
            Use upload instead
          </Button>
          <Button onClick={goPreview} disabled={!hasEnoughPhotos}>
            Continue to preview
          </Button>
        </div>
      </aside>
    </div>
  )
}
