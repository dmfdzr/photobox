export type LayoutRect = {
  x: number
  y: number
  w: number
  h: number
}

export type PhotoboxLayout = {
  id: string
  name: string
  hint: string
  slots: number
  ratio: number
  thumbBackground: string
  rects: LayoutRect[]
}

export type PhotoboxTheme = {
  id: string
  name: string
  background: string
  foreground: string
  border: string
  accent: string
  mat: string
  photoBorder: string
  footer: string
  grain: string
}

export type PhotoboxFilter = {
  id: string
  name: string
  css: string
}

export type StickerOption = {
  id: string
  name: string
}

export type StickerPosition = StickerOption & {
  x: number
  y: number
}

export type ExportPreset = {
  id: string
  name: string
  width: number
  height: number
  description: string
}

export const MAX_PHOTOS = 4
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export const LAYOUTS: PhotoboxLayout[] = [
  {
    id: "duo-strip",
    name: "Duo strip",
    hint: "2 portrait photos",
    slots: 2,
    ratio: 0.62,
    thumbBackground: "#fff1f2",
    rects: [
      { x: 0.045, y: 0.07, w: 0.91, h: 0.37 },
      { x: 0.045, y: 0.465, w: 0.91, h: 0.37 },
    ],
  },
  {
    id: "triple-stack",
    name: "Triple stack",
    hint: "3 close crops",
    slots: 3,
    ratio: 0.62,
    thumbBackground: "#ecfeff",
    rects: [
      { x: 0.045, y: 0.055, w: 0.91, h: 0.265 },
      { x: 0.045, y: 0.34, w: 0.91, h: 0.265 },
      { x: 0.045, y: 0.625, w: 0.91, h: 0.265 },
    ],
  },
  {
    id: "quad-grid",
    name: "Quad grid",
    hint: "4 square-ish photos",
    slots: 4,
    ratio: 1,
    thumbBackground: "#fef3c7",
    rects: [
      { x: 0.07, y: 0.07, w: 0.43, h: 0.43 },
      { x: 0.52, y: 0.07, w: 0.41, h: 0.43 },
      { x: 0.07, y: 0.52, w: 0.41, h: 0.41 },
      { x: 0.5, y: 0.52, w: 0.43, h: 0.41 },
    ],
  },
  {
    id: "classic-strip",
    name: "Classic strip",
    hint: "4 narrow frames",
    slots: 4,
    ratio: 0.52,
    thumbBackground: "#f8fafc",
    rects: [
      { x: 0.05, y: 0.035, w: 0.9, h: 0.195 },
      { x: 0.05, y: 0.245, w: 0.9, h: 0.195 },
      { x: 0.05, y: 0.455, w: 0.9, h: 0.195 },
      { x: 0.05, y: 0.665, w: 0.9, h: 0.195 },
    ],
  },
]

export const THEMES: PhotoboxTheme[] = [
  {
    id: "soft-pop",
    name: "Soft Pop",
    background: "#fff7ed",
    foreground: "#25160f",
    border: "#fb7185",
    accent: "#22d3ee",
    mat: "#ffffff",
    photoBorder: "#ffe4e6",
    footer: "#fff1f2",
    grain: "rgba(251, 113, 133, 0.14)",
  },
  {
    id: "midnight-flash",
    name: "Midnight Flash",
    background: "#10131f",
    foreground: "#f8fafc",
    border: "#38bdf8",
    accent: "#fbbf24",
    mat: "#171927",
    photoBorder: "#273449",
    footer: "#0f172a",
    grain: "rgba(56, 189, 248, 0.12)",
  },
  {
    id: "paper-strip",
    name: "Paper Strip",
    background: "#f7f0df",
    foreground: "#2f2a1f",
    border: "#a16207",
    accent: "#0f766e",
    mat: "#fffaf0",
    photoBorder: "#ead7ae",
    footer: "#f3e6c7",
    grain: "rgba(47, 42, 31, 0.1)",
  },
]

export const FILTERS: PhotoboxFilter[] = [
  { id: "clean", name: "Clean", css: "none" },
  { id: "warm", name: "Warm", css: "sepia(0.18) saturate(1.08) contrast(1.03)" },
  { id: "flash", name: "Flash", css: "brightness(1.08) contrast(1.16) saturate(0.9)" },
  { id: "mono", name: "Mono", css: "grayscale(1) contrast(1.12)" },
]

export const STICKERS: StickerOption[] = [
  { id: "none", name: "None" },
  { id: "spark", name: "Spark" },
  { id: "heart", name: "Heart" },
  { id: "tape", name: "Tape" },
  { id: "label", name: "Label" },
]

export const STICKER_POSITIONS: StickerPosition[] = [
  { id: "top-left", name: "Top left", x: 0.16, y: 0.13 },
  { id: "top-right", name: "Top right", x: 0.82, y: 0.13 },
  { id: "bottom-left", name: "Bottom left", x: 0.17, y: 0.83 },
  { id: "bottom-right", name: "Bottom right", x: 0.8, y: 0.83 },
]

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: "story", name: "Story", width: 1080, height: 1920, description: "1080 x 1920" },
  { id: "classic", name: "Classic strip", width: 1200, height: 1800, description: "1200 x 1800" },
]
