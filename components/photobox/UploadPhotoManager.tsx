"use client"

import * as React from "react"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { usePhotobox } from "./PhotoboxProvider"

export function UploadPhotoManager() {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null)
  const { session, requiredPhotoCount, hasEnoughPhotos, addFiles, removePhoto, replacePhoto, setStep, updatePhoto } = usePhotobox()
  const [error, setError] = React.useState("")
  const [replaceTarget, setReplaceTarget] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)

  const handleFiles = (files: File[]) => {
    const result = addFiles(files, "upload")
    setError(result.error)
  }

  const continuePreview = () => {
    setStep("preview")
    router.push("/preview")
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click()
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(Array.from(event.dataTransfer.files))
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        className={`grid min-h-80 cursor-pointer place-items-center rounded-lg border border-dashed bg-card p-8 text-center shadow-sm transition ${dragging ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-border"}`}
      >
        <div>
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-sky-100 text-sky-700">
            <ImagePlus className="size-7" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Upload your photos</h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">Drop JPG, PNG, or WebP files here. SnapBox only needs {requiredPhotoCount} photo{requiredPhotoCount > 1 ? "s" : ""} for this layout.</p>
          <Button className="mt-5" size="lg" type="button">
            <Upload />
            Browse files
          </Button>
        </div>
      </section>

      <aside className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-sky-700">Upload Progress</p>
          <h2 className="text-2xl font-black text-foreground">{session.photos.length} / {requiredPhotoCount}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Continue unlocks when the selected layout is full.</p>
        </div>

        <div className="grid gap-3">
          {Array.from({ length: requiredPhotoCount }).map((_, index) => {
            const photo = session.photos[index]
            return (
              <div key={photo?.id || index} className="rounded-lg border bg-background p-2">
                <div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.src}
                      alt={`Uploaded photo ${index + 1}`}
                      className="absolute left-1/2 top-1/2 max-w-none object-cover"
                      style={{
                        width: `${photo.scale * 100}%`,
                        height: `${photo.scale * 100}%`,
                        transform: `translate(calc(-50% + ${(0.5 - photo.x) * 50}%), calc(-50% + ${(0.5 - photo.y) * 50}%))`,
                      }}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-sm font-semibold text-muted-foreground">Slot {index + 1}</span>
                  )}
                </div>
                {photo ? (
                  <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceTarget(photo.id)
                        replaceInputRef.current?.click()
                      }}
                      className="rounded-md border bg-card px-2 py-1 text-xs font-semibold text-foreground"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="rounded-md bg-rose-50 px-2 py-1 text-rose-700"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : null}
                {photo ? (
                  <div className="mt-3 grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Horizontal crop
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
                    <label className="text-xs font-semibold text-muted-foreground">
                      Vertical crop
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
                    <label className="text-xs font-semibold text-muted-foreground">
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
                ) : null}
              </div>
            )
          })}
        </div>

        {error ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}

        <Button className="mt-4 w-full" size="lg" onClick={continuePreview} disabled={!hasEnoughPhotos}>
          Continue to preview
        </Button>
      </aside>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(event) => {
        handleFiles(Array.from(event.target.files ?? []))
        event.target.value = ""
      }} />
      <input ref={replaceInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
        const file = event.target.files?.[0]
        if (file && replaceTarget) {
          const result = replacePhoto(replaceTarget, file, "upload")
          setError(result.error)
        }
        event.target.value = ""
        setReplaceTarget(null)
      }} />
    </div>
  )
}
