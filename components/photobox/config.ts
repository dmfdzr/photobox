export type PhotoSource = "camera" | "upload"

export type PhotoItem = {
  id: string
  src: string
  source: PhotoSource
  position: number
  name: string
  x: number
  y: number
  scale: number
}

export type LayoutSlot = {
  x: number
  y: number
  width: number
  height: number
}

export type PhotoboxLayout = {
  id: string
  name: string
  description: string
  photoCount: number
  width: number
  height: number
  slots: LayoutSlot[]
}

export type PhotoboxFrame = {
  id: string
  name: string
  backgroundColor: string
  borderColor: string
  textColor: string
  accentColor: string
  borderRadius: number
}

export type PhotoboxFilter = {
  id: string
  name: string
  cssFilter: string
  canvasFilter: string
}

export type InputMethod = "camera" | "upload" | null

export type PhotoboxSession = {
  inputMethod: InputMethod
  photos: PhotoItem[]
  selectedLayout: string
  selectedFrame: string
  selectedFilter: string
  currentStep: "choose-method" | "choose-layout" | "camera" | "upload" | "preview"
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const LAYOUTS: PhotoboxLayout[] = [
  {
    id: "single",
    name: "Single Photo",
    description: "One large portrait frame.",
    photoCount: 1,
    width: 1080,
    height: 1350,
    slots: [{ x: 80, y: 80, width: 920, height: 1130 }],
  },
  {
    id: "classic-strip",
    name: "Classic Strip",
    description: "Four stacked photobox frames.",
    photoCount: 4,
    width: 600,
    height: 1800,
    slots: [
      { x: 50, y: 50, width: 500, height: 350 },
      { x: 50, y: 430, width: 500, height: 350 },
      { x: 50, y: 810, width: 500, height: 350 },
      { x: 50, y: 1190, width: 500, height: 350 },
    ],
  },
  {
    id: "grid-2x2",
    name: "Grid 2x2",
    description: "Four photos in a square grid.",
    photoCount: 4,
    width: 1080,
    height: 1080,
    slots: [
      { x: 60, y: 60, width: 460, height: 460 },
      { x: 560, y: 60, width: 460, height: 460 },
      { x: 60, y: 560, width: 460, height: 460 },
      { x: 560, y: 560, width: 460, height: 460 },
    ],
  },
  {
    id: "double-frame",
    name: "Double Frame",
    description: "Two vertical frames with a clean caption area.",
    photoCount: 2,
    width: 900,
    height: 1350,
    slots: [
      { x: 70, y: 80, width: 760, height: 500 },
      { x: 70, y: 630, width: 760, height: 500 },
    ],
  },
]

export const FRAMES: PhotoboxFrame[] = [
  {
    id: "minimal-white",
    name: "Minimal White",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    textColor: "#111827",
    accentColor: "#60A5FA",
    borderRadius: 24,
  },
  {
    id: "soft-cream",
    name: "Soft Cream",
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    textColor: "#7C2D12",
    accentColor: "#F97316",
    borderRadius: 28,
  },
  {
    id: "pastel-pink",
    name: "Pastel Pink",
    backgroundColor: "#FDF2F8",
    borderColor: "#F9A8D4",
    textColor: "#831843",
    accentColor: "#EC4899",
    borderRadius: 28,
  },
  {
    id: "sky-blue",
    name: "Sky Blue",
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
    textColor: "#1E3A8A",
    accentColor: "#3B82F6",
    borderRadius: 28,
  },
  {
    id: "dark-elegant",
    name: "Dark Elegant",
    backgroundColor: "#111827",
    borderColor: "#374151",
    textColor: "#F9FAFB",
    accentColor: "#F9A8D4",
    borderRadius: 24,
  },
  {
    id: "green-fresh",
    name: "Green Fresh",
    backgroundColor: "#ECFDF5",
    borderColor: "#86EFAC",
    textColor: "#14532D",
    accentColor: "#22C55E",
    borderRadius: 28,
  },
]

export const FILTERS: PhotoboxFilter[] = [
  { id: "normal", name: "Normal", cssFilter: "none", canvasFilter: "none" },
  { id: "black-white", name: "Black & White", cssFilter: "grayscale(100%)", canvasFilter: "grayscale(100%)" },
  { id: "warm", name: "Warm", cssFilter: "sepia(20%) saturate(120%)", canvasFilter: "sepia(20%) saturate(120%)" },
  { id: "cool", name: "Cool", cssFilter: "saturate(110%) hue-rotate(12deg) brightness(105%)", canvasFilter: "saturate(110%) hue-rotate(12deg) brightness(105%)" },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(40%) contrast(90%)", canvasFilter: "sepia(40%) contrast(90%)" },
  { id: "soft-contrast", name: "Soft Contrast", cssFilter: "contrast(110%) brightness(103%) saturate(95%)", canvasFilter: "contrast(110%) brightness(103%) saturate(95%)" },
]

export const DEFAULT_SESSION: PhotoboxSession = {
  inputMethod: null,
  photos: [],
  selectedLayout: "classic-strip",
  selectedFrame: "minimal-white",
  selectedFilter: "normal",
  currentStep: "choose-method",
}

export function getLayout(layoutId: string) {
  return LAYOUTS.find((layout) => layout.id === layoutId) || LAYOUTS[0]
}

export function getFrame(frameId: string) {
  return FRAMES.find((frame) => frame.id === frameId) || FRAMES[0]
}

export function getFilter(filterId: string) {
  return FILTERS.find((filter) => filter.id === filterId) || FILTERS[0]
}

