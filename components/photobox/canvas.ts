import { FILTERS, LAYOUTS, STICKER_POSITIONS, STICKERS, THEMES } from "./config"
import type { LayoutRect, PhotoboxTheme } from "./config"

export type PhotoItem = {
  id: string
  url: string
  name: string
  x: number
  y: number
  scale: number
}

export type PhotoboxState = {
  layoutId: string
  themeId: string
  filterId: string
  caption: string
  captionX: number
  captionY: number
  showDate: boolean
  dateText: string
  sticker: string
  stickerPosition: string
  exportPreset: string
  exportType: "image/png" | "image/jpeg"
  photos: Array<PhotoItem | null>
}

const loadedImages = new Map<string, Promise<HTMLImageElement>>()

export function releaseLoadedImage(url?: string) {
  if (url) loadedImages.delete(url)
}

function getImage(photo: PhotoItem | null): Promise<HTMLImageElement | null> {
  if (!photo?.url) return Promise.resolve(null)
  const cachedImage = loadedImages.get(photo.url)
  if (cachedImage) return cachedImage

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = photo.url
  })

  loadedImages.set(photo.url, promise)
  return promise
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: LayoutRect, photo: PhotoItem | null) {
  const scale = photo?.scale || 1
  const positionX = photo?.x ?? 0.5
  const positionY = photo?.y ?? 0.5
  const imageRatio = image.width / image.height
  const rectRatio = rect.w / rect.h
  let sourceW = image.width
  let sourceH = image.height

  if (imageRatio > rectRatio) {
    sourceW = image.height * rectRatio
  } else {
    sourceH = image.width / rectRatio
  }

  sourceW = Math.max(1, sourceW / scale)
  sourceH = Math.max(1, sourceH / scale)

  const sourceX = Math.min(Math.max((image.width - sourceW) * positionX, 0), image.width - sourceW)
  const sourceY = Math.min(Math.max((image.height - sourceH) * positionY, 0), image.height - sourceH)

  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, rect.x, rect.y, rect.w, rect.h)
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawBackdrop(ctx: CanvasRenderingContext2D, theme: PhotoboxTheme, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, theme.background)
  gradient.addColorStop(0.58, theme.background)
  gradient.addColorStop(1, theme.accent)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = theme.id === "midnight-flash" ? 0.16 : 0.22
  ctx.strokeStyle = theme.foreground
  ctx.lineWidth = Math.max(1, width * 0.002)
  const gap = Math.max(42, width * 0.065)
  for (let x = -width; x < width * 2; x += gap) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + width * 0.45, height)
    ctx.stroke()
  }
  ctx.restore()
}

function drawPerforation(ctx: CanvasRenderingContext2D, stage: LayoutRect, theme: PhotoboxTheme) {
  ctx.save()
  ctx.fillStyle = theme.background
  ctx.globalAlpha = theme.id === "midnight-flash" ? 0.9 : 0.72
  const size = Math.max(3, stage.w * 0.01)
  const step = Math.max(28, stage.h * 0.042)
  for (let y = stage.y + step; y < stage.y + stage.h - step; y += step) {
    ctx.beginPath()
    ctx.arc(stage.x + stage.w * 0.022, y, size, 0, Math.PI * 2)
    ctx.arc(stage.x + stage.w * 0.978, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawPhotoFrame(ctx: CanvasRenderingContext2D, rect: LayoutRect, theme: PhotoboxTheme) {
  ctx.save()
  ctx.shadowColor = theme.id === "midnight-flash" ? "rgba(0,0,0,0.42)" : "rgba(46,31,20,0.2)"
  ctx.shadowBlur = Math.max(8, rect.w * 0.035)
  ctx.shadowOffsetY = Math.max(3, rect.h * 0.012)
  drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.w * 0.035)
  ctx.fillStyle = theme.photoBorder || theme.mat
  ctx.fill()
  ctx.restore()
}

function drawEmptySlot(ctx: CanvasRenderingContext2D, rect: LayoutRect, theme: PhotoboxTheme, index: number) {
  ctx.save()
  drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.w * 0.04)
  ctx.fillStyle = theme.id === "midnight-flash" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)"
  ctx.fill()
  ctx.strokeStyle = theme.border
  ctx.lineWidth = Math.max(2, rect.w * 0.014)
  ctx.setLineDash([12, 10])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = theme.foreground
  ctx.globalAlpha = 0.6
  ctx.font = `${Math.max(18, rect.w * 0.09)}px sans-serif`
  ctx.textAlign = "center"
  ctx.fillText(`Photo ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2)
  ctx.restore()
}

function drawCaptionText(
  ctx: CanvasRenderingContext2D,
  caption: string,
  dateText: string,
  x: number,
  y: number,
  maxWidth: number,
  theme: PhotoboxTheme,
  size: number,
  align: CanvasTextAlign = "center"
) {
  ctx.fillStyle = theme.foreground
  ctx.textAlign = align
  ctx.font = `800 ${size}px sans-serif`
  ctx.fillText(caption.slice(0, 38), x, y, maxWidth)

  if (dateText) {
    ctx.globalAlpha = 0.72
    ctx.font = `600 ${Math.max(12, size * 0.48)}px sans-serif`
    ctx.fillText(dateText.slice(0, 24), x, y + size * 0.74, maxWidth)
    ctx.globalAlpha = 1
  }
}

function drawCustomCaption(ctx: CanvasRenderingContext2D, theme: PhotoboxTheme, state: PhotoboxState) {
  const caption = state.caption?.trim()
  const dateText = state.showDate ? state.dateText?.trim() : ""
  if (!caption && !dateText) return

  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const fontSize = Math.max(24, Math.min(width, height) * 0.042)
  const boxW = Math.min(width * 0.78, Math.max(width * 0.38, fontSize * Math.max(caption.length * 0.62, 10)))
  const boxH = dateText ? fontSize * 2.25 : fontSize * 1.55
  const x = Math.min(Math.max(width * state.captionX, boxW / 2 + width * 0.03), width - boxW / 2 - width * 0.03)
  const y = Math.min(Math.max(height * state.captionY, boxH / 2 + height * 0.03), height - boxH / 2 - height * 0.03)

  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.2)"
  ctx.shadowBlur = Math.max(10, fontSize * 0.55)
  ctx.shadowOffsetY = Math.max(3, fontSize * 0.16)
  drawRoundedRect(ctx, x - boxW / 2, y - boxH / 2, boxW, boxH, Math.max(12, fontSize * 0.42))
  ctx.fillStyle = theme.footer || theme.mat
  ctx.fill()
  ctx.strokeStyle = theme.border
  ctx.lineWidth = Math.max(2, fontSize * 0.08)
  ctx.stroke()

  drawCaptionText(ctx, caption, dateText, x, y - (dateText ? fontSize * 0.18 : 0), boxW * 0.84, theme, fontSize)
  ctx.restore()
}

function drawSticker(ctx: CanvasRenderingContext2D, style: PhotoboxState & { theme: PhotoboxTheme }, width: number, height: number) {
  const sticker = STICKERS.find((item) => item.id === style.sticker)
  if (!sticker || sticker.id === "none") return

  const position = STICKER_POSITIONS.find((item) => item.id === style.stickerPosition) || STICKER_POSITIONS[0]
  const x = width * position.x
  const y = height * position.y
  const size = Math.min(width, height) * 0.13

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(position.id.includes("right") ? 0.18 : -0.16)

  if (sticker.id === "spark") {
    ctx.strokeStyle = style.theme.accent
    ctx.lineWidth = Math.max(4, size * 0.08)
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 4)
      ctx.beginPath()
      ctx.moveTo(0, -size * 0.65)
      ctx.lineTo(0, size * 0.65)
      ctx.stroke()
    }
  }

  if (sticker.id === "heart") {
    ctx.fillStyle = style.theme.border
    ctx.beginPath()
    ctx.moveTo(0, size * 0.42)
    ctx.bezierCurveTo(-size, -size * 0.18, -size * 0.44, -size * 0.92, 0, -size * 0.42)
    ctx.bezierCurveTo(size * 0.44, -size * 0.92, size, -size * 0.18, 0, size * 0.42)
    ctx.fill()
  }

  if (sticker.id === "tape") {
    ctx.fillStyle = "rgba(255,255,255,0.78)"
    ctx.strokeStyle = "rgba(0,0,0,0.12)"
    drawRoundedRect(ctx, -size * 0.7, -size * 0.22, size * 1.4, size * 0.44, size * 0.08)
    ctx.fill()
    ctx.stroke()
  }

  if (sticker.id === "label") {
    ctx.fillStyle = style.theme.accent
    ctx.strokeStyle = style.theme.foreground
    drawRoundedRect(ctx, -size * 0.75, -size * 0.38, size * 1.5, size * 0.76, size * 0.12)
    ctx.fill()
    ctx.globalAlpha = 0.8
    ctx.stroke()
  }

  ctx.restore()
}

function fitLayoutRect(layout: (typeof LAYOUTS)[number], width: number, height: number): LayoutRect {
  if (layout.id === "quad-grid") {
    const size = Math.min(width, height) * 0.82
    return {
      x: (width - size) / 2,
      y: (height - size) / 2,
      w: size,
      h: size,
    }
  }

  const horizontalMargin = width * 0.045
  const verticalMargin = height * 0.045

  return {
    x: horizontalMargin,
    y: verticalMargin,
    w: width - horizontalMargin * 2,
    h: height - verticalMargin * 2,
  }
}

export async function drawPhotobox(
  canvas: HTMLCanvasElement | null,
  state: PhotoboxState,
  options: { width?: number; height?: number } = {}
) {
  if (!canvas) return

  const layout = LAYOUTS.find((item) => item.id === state.layoutId) || LAYOUTS[0]
  const theme = THEMES.find((item) => item.id === state.themeId) || THEMES[0]
  const filter = FILTERS.find((item) => item.id === state.filterId) || FILTERS[0]
  const ctx = canvas.getContext("2d")
  const width = options.width || canvas.width
  const height = options.height || canvas.height

  if (!ctx) return

  canvas.width = width
  canvas.height = height

  ctx.clearRect(0, 0, width, height)
  drawBackdrop(ctx, { ...theme, id: state.themeId }, width, height)

  ctx.save()
  ctx.globalAlpha = 0.75
  ctx.fillStyle = theme.grain
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 53) % width
    const y = (i * 97) % height
    ctx.fillRect(x, y, Math.max(1, width * 0.008), Math.max(1, height * 0.002))
  }
  ctx.restore()

  const stage = fitLayoutRect(layout, width, height)
  ctx.save()
  ctx.translate(width * 0.0015, height * 0.0015)
  ctx.rotate(layout.id === "quad-grid" ? -0.006 : 0.002)
  ctx.shadowColor = state.themeId === "midnight-flash" ? "rgba(0,0,0,0.54)" : "rgba(45,33,20,0.28)"
  ctx.shadowBlur = width * 0.05
  ctx.shadowOffsetY = height * 0.018
  drawRoundedRect(ctx, stage.x, stage.y, stage.w, stage.h, Math.max(12, stage.w * 0.03))
  ctx.fillStyle = theme.mat
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = theme.border
  ctx.lineWidth = Math.max(5, stage.w * 0.016)
  drawRoundedRect(ctx, stage.x, stage.y, stage.w, stage.h, Math.max(10, stage.w * 0.025))
  ctx.stroke()

  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = theme.foreground
  ctx.fillRect(stage.x + stage.w * 0.08, stage.y + stage.h * 0.02, stage.w * 0.84, Math.max(2, stage.h * 0.004))
  ctx.restore()

  drawPerforation(ctx, stage, { ...theme, id: state.themeId })

  const images: Array<HTMLImageElement | null> = await Promise.all(state.photos.map((photo) => getImage(photo).catch(() => null)))

  layout.rects.forEach((rect, index) => {
    const absolute = {
      x: stage.x + rect.x * stage.w,
      y: stage.y + rect.y * stage.h,
      w: rect.w * stage.w,
      h: rect.h * stage.h,
    }

    const framePad = Math.max(5, stage.w * 0.012)
    drawPhotoFrame(ctx, absolute, { ...theme, id: state.themeId })

    const imageRect = {
      x: absolute.x + framePad,
      y: absolute.y + framePad,
      w: absolute.w - framePad * 2,
      h: absolute.h - framePad * 2,
    }

    ctx.save()
    drawRoundedRect(ctx, imageRect.x, imageRect.y, imageRect.w, imageRect.h, imageRect.w * 0.026)
    ctx.clip()

    const image = images[index]

    if (image) {
      ctx.filter = filter.css
      drawCoverImage(ctx, image, imageRect, state.photos[index] ?? null)
      ctx.filter = "none"
    } else {
      drawEmptySlot(ctx, imageRect, { ...theme, id: state.themeId }, index)
    }

    ctx.restore()
  })

  drawSticker(ctx, { ...state, theme }, width, height)
  drawCustomCaption(ctx, { ...theme, id: state.themeId }, state)
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg" = "image/png",
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Canvas export failed. Try a smaller preset or another browser."))
    }, type, quality)
  })
}
