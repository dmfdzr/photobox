"use client"

import * as React from "react"

import {
  DEFAULT_SESSION,
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  getLayout,
  type InputMethod,
  type PhotoItem,
  type PhotoSource,
  type PhotoboxSession,
} from "./config"
import { releaseLoadedImage } from "./canvas"

type PhotoboxContextValue = {
  session: PhotoboxSession
  settingsLoaded: boolean
  activeLayout: ReturnType<typeof getLayout>
  requiredPhotoCount: number
  hasEnoughPhotos: boolean
  setInputMethod: (method: InputMethod) => void
  setLayout: (layoutId: string) => void
  setFrame: (frameId: string) => void
  setFilter: (filterId: string) => void
  setStep: (step: PhotoboxSession["currentStep"]) => void
  addFiles: (files: File[], source: PhotoSource) => { added: number; error: string }
  removePhoto: (photoId: string) => void
  replacePhoto: (photoId: string, file: File, source: PhotoSource) => { added: number; error: string }
  updatePhoto: (photoId: string, patch: Partial<Pick<PhotoItem, "x" | "y" | "scale">>) => void
  resetSession: () => void
}

const STORAGE_KEY = "snapbox-session-v1"
const PhotoboxContext = React.createContext<PhotoboxContextValue | null>(null)

function revokePhoto(photo: PhotoItem) {
  releaseLoadedImage(photo.src)
  URL.revokeObjectURL(photo.src)
}

function createPhoto(file: File, source: PhotoSource, position: number): PhotoItem {
  return {
    id: crypto.randomUUID(),
    src: URL.createObjectURL(file),
    source,
    position,
    name: file.name || `${source}-photo-${position}.jpg`,
    x: 0.5,
    y: 0.5,
    scale: 1,
  }
}

function getStoredSession(): PhotoboxSession {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SESSION
    const parsed = JSON.parse(stored) as Partial<PhotoboxSession>

    return {
      ...DEFAULT_SESSION,
      inputMethod: parsed.inputMethod ?? DEFAULT_SESSION.inputMethod,
      selectedLayout: parsed.selectedLayout ?? DEFAULT_SESSION.selectedLayout,
      selectedFrame: parsed.selectedFrame ?? DEFAULT_SESSION.selectedFrame,
      selectedFilter: parsed.selectedFilter ?? DEFAULT_SESSION.selectedFilter,
      currentStep: parsed.currentStep ?? DEFAULT_SESSION.currentStep,
      photos: [],
    }
  } catch {
    return DEFAULT_SESSION
  }
}

export function PhotoboxProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<PhotoboxSession>(DEFAULT_SESSION)
  const [settingsLoaded, setSettingsLoaded] = React.useState(false)
  const photosRef = React.useRef<PhotoItem[]>([])

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSession(getStoredSession())
      setSettingsLoaded(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  React.useEffect(() => {
    photosRef.current = session.photos
  }, [session.photos])

  React.useEffect(() => {
    if (!settingsLoaded) return

    const settings = {
      inputMethod: session.inputMethod,
      selectedLayout: session.selectedLayout,
      selectedFrame: session.selectedFrame,
      selectedFilter: session.selectedFilter,
      currentStep: session.currentStep,
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [session, settingsLoaded])

  React.useEffect(() => {
    return () => {
      photosRef.current.forEach(revokePhoto)
    }
  }, [])

  React.useEffect(() => {
    if (!session.photos.length) return

    const warnBeforeRefresh = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", warnBeforeRefresh)

    return () => {
      window.removeEventListener("beforeunload", warnBeforeRefresh)
    }
  }, [session.photos.length])

  const activeLayout = React.useMemo(() => getLayout(session.selectedLayout), [session.selectedLayout])
  const requiredPhotoCount = activeLayout.photoCount
  const hasEnoughPhotos = session.photos.length >= requiredPhotoCount

  const setInputMethod = React.useCallback((method: InputMethod) => {
    setSession((current) => ({ ...current, inputMethod: method, currentStep: "choose-layout" }))
  }, [])

  const setLayout = React.useCallback((layoutId: string) => {
    setSession((current) => {
      const layout = getLayout(layoutId)
      const removed = current.photos.slice(layout.photoCount)
      removed.forEach(revokePhoto)
      return { ...current, selectedLayout: layoutId, photos: current.photos.slice(0, layout.photoCount) }
    })
  }, [])

  const setFrame = React.useCallback((frameId: string) => {
    setSession((current) => ({ ...current, selectedFrame: frameId }))
  }, [])

  const setFilter = React.useCallback((filterId: string) => {
    setSession((current) => ({ ...current, selectedFilter: filterId }))
  }, [])

  const setStep = React.useCallback((step: PhotoboxSession["currentStep"]) => {
    setSession((current) => ({ ...current, currentStep: step }))
  }, [])

  const addFiles = React.useCallback((files: File[], source: PhotoSource) => {
    const imageFiles = files.filter((file) => SUPPORTED_IMAGE_TYPES.includes(file.type))

    if (files.length && !imageFiles.length) {
      return { added: 0, error: "Unsupported file type. Use JPG, PNG, or WebP." }
    }

    if (imageFiles.some((file) => file.size > MAX_FILE_SIZE)) {
      return { added: 0, error: "One image is larger than 10 MB. Use a smaller file." }
    }

    const layout = getLayout(session.selectedLayout)
    const capacity = Math.max(layout.photoCount - session.photos.length, 0)
    const accepted = imageFiles.slice(0, capacity)

    setSession((current) => {
      return {
        ...current,
        photos: [
          ...current.photos,
          ...accepted.map((file, index) => createPhoto(file, source, current.photos.length + index + 1)),
        ],
      }
    })

    return {
      added: accepted.length,
      error: imageFiles.length > accepted.length ? `Only ${accepted.length} photo${accepted.length === 1 ? "" : "s"} added. This layout needs ${requiredPhotoCount}.` : "",
    }
  }, [requiredPhotoCount, session.photos.length, session.selectedLayout])

  const removePhoto = React.useCallback((photoId: string) => {
    setSession((current) => {
      const removed = current.photos.find((photo) => photo.id === photoId)
      if (removed) revokePhoto(removed)
      return {
        ...current,
        photos: current.photos.filter((photo) => photo.id !== photoId).map((photo, index) => ({ ...photo, position: index + 1 })),
      }
    })
  }, [])

  const replacePhoto = React.useCallback((photoId: string, file: File, source: PhotoSource) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return { added: 0, error: "Unsupported file type. Use JPG, PNG, or WebP." }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { added: 0, error: "This image is larger than 10 MB. Use a smaller file." }
    }

    setSession((current) => ({
      ...current,
      photos: current.photos.map((photo) => {
        if (photo.id !== photoId) return photo
        revokePhoto(photo)
        return createPhoto(file, source, photo.position)
      }),
    }))

    return { added: 1, error: "" }
  }, [])

  const updatePhoto = React.useCallback((photoId: string, patch: Partial<Pick<PhotoItem, "x" | "y" | "scale">>) => {
    setSession((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.id === photoId ? { ...photo, ...patch } : photo)),
    }))
  }, [])

  const resetSession = React.useCallback(() => {
    setSession((current) => {
      current.photos.forEach(revokePhoto)
      return DEFAULT_SESSION
    })
    window.sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = React.useMemo<PhotoboxContextValue>(() => ({
    session,
    settingsLoaded,
    activeLayout,
    requiredPhotoCount,
    hasEnoughPhotos,
    setInputMethod,
    setLayout,
    setFrame,
    setFilter,
    setStep,
    addFiles,
    removePhoto,
    replacePhoto,
    updatePhoto,
    resetSession,
  }), [
    session,
    settingsLoaded,
    activeLayout,
    requiredPhotoCount,
    hasEnoughPhotos,
    setInputMethod,
    setLayout,
    setFrame,
    setFilter,
    setStep,
    addFiles,
    removePhoto,
    replacePhoto,
    updatePhoto,
    resetSession,
  ])

  return <PhotoboxContext.Provider value={value}>{children}</PhotoboxContext.Provider>
}

export function usePhotobox() {
  const context = React.useContext(PhotoboxContext)
  if (!context) {
    throw new Error("usePhotobox must be used inside PhotoboxProvider.")
  }
  return context
}
