import { getFilter, getFrame, getLayout, type PhotoItem, type PhotoboxSession } from "./config"

const loadedImages = new Map<string, Promise<HTMLImageElement>>()

export function releaseLoadedImage(src?: string) {
  if (src) loadedImages.delete(src)
}

function loadImage(photo: PhotoItem): Promise<HTMLImageElement> {
  const cached = loadedImages.get(photo.src)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = photo.src
  })

  loadedImages.set(photo.src, promise)
  return promise
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, photo: PhotoItem, x: number, y: number, width: number, height: number) {
  const imageRatio = image.width / image.height
  const slotRatio = width / height
  let sourceWidth = image.width
  let sourceHeight = image.height

  if (imageRatio > slotRatio) {
    sourceWidth = image.height * slotRatio
  } else {
    sourceHeight = image.width / slotRatio
  }

  sourceWidth = Math.max(1, sourceWidth / photo.scale)
  sourceHeight = Math.max(1, sourceHeight / photo.scale)

  const sourceX = Math.min(Math.max((image.width - sourceWidth) * photo.x, 0), image.width - sourceWidth)
  const sourceY = Math.min(Math.max((image.height - sourceHeight) * photo.y, 0), image.height - sourceHeight)

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

export async function drawPhotobox(canvas: HTMLCanvasElement | null, session: PhotoboxSession) {
  if (!canvas) return

  const layout = getLayout(session.selectedLayout)
  const frame = getFrame(session.selectedFrame)
  const filter = getFilter(session.selectedFilter)
  const ctx = canvas.getContext("2d")

  if (!ctx) return

  canvas.width = layout.width
  canvas.height = layout.height

  ctx.clearRect(0, 0, layout.width, layout.height)
  ctx.fillStyle = frame.backgroundColor
  ctx.fillRect(0, 0, layout.width, layout.height)

  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.strokeStyle = frame.accentColor
  ctx.lineWidth = Math.max(2, layout.width * 0.004)
  for (let x = -layout.width; x < layout.width * 1.5; x += layout.width * 0.12) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + layout.width * 0.4, layout.height)
    ctx.stroke()
  }
  ctx.restore()

  ctx.strokeStyle = frame.borderColor
  ctx.lineWidth = Math.max(6, layout.width * 0.012)
  roundedRect(ctx, 22, 22, layout.width - 44, layout.height - 44, frame.borderRadius)
  ctx.stroke()

  const images = await Promise.all(session.photos.slice(0, layout.photoCount).map((photo) => loadImage(photo).catch(() => null)))

  layout.slots.forEach((slot, index) => {
    const photo = session.photos[index]
    const image = images[index]

    ctx.save()
    ctx.shadowColor = "rgba(15, 23, 42, 0.18)"
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 8
    roundedRect(ctx, slot.x, slot.y, slot.width, slot.height, Math.min(frame.borderRadius, 26))
    ctx.fillStyle = "#FFFFFF"
    ctx.fill()
    ctx.restore()

    const pad = Math.max(8, layout.width * 0.01)
    const x = slot.x + pad
    const y = slot.y + pad
    const width = slot.width - pad * 2
    const height = slot.height - pad * 2

    ctx.save()
    roundedRect(ctx, x, y, width, height, Math.min(frame.borderRadius, 22))
    ctx.clip()

    if (photo && image) {
      ctx.filter = filter.canvasFilter
      drawCover(ctx, image, photo, x, y, width, height)
      ctx.filter = "none"
    } else {
      ctx.fillStyle = frame.id === "dark-elegant" ? "rgba(255,255,255,0.08)" : "#F8FAFC"
      ctx.fillRect(x, y, width, height)
      ctx.strokeStyle = frame.borderColor
      ctx.setLineDash([14, 12])
      ctx.lineWidth = 3
      ctx.strokeRect(x + 8, y + 8, width - 16, height - 16)
      ctx.setLineDash([])
      ctx.fillStyle = frame.textColor
      ctx.globalAlpha = 0.55
      ctx.font = `700 ${Math.max(22, width * 0.07)}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(`Photo ${index + 1}`, x + width / 2, y + height / 2)
    }

    ctx.restore()
  })

  const labelY = layout.height - Math.max(70, layout.height * 0.06)
  ctx.fillStyle = frame.textColor
  ctx.textAlign = "center"
  ctx.font = `800 ${Math.max(24, layout.width * 0.045)}px sans-serif`
  ctx.fillText("SnapBox", layout.width / 2, labelY)
  ctx.globalAlpha = 0.68
  ctx.font = `600 ${Math.max(14, layout.width * 0.022)}px sans-serif`
  ctx.fillText(new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date()), layout.width / 2, labelY + 34)
  ctx.globalAlpha = 1
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg" = "image/png", quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Export failed. Try a smaller image."))
    }, type, quality)
  })
}

export async function downloadPhotobox(session: PhotoboxSession, type: "image/png" | "image/jpeg" = "image/png") {
  const canvas = document.createElement("canvas")
  await drawPhotobox(canvas, session)
  const blob = await canvasToBlob(canvas, type)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = type === "image/png" ? "snapbox-result.png" : "snapbox-result.jpg"
  link.click()
  URL.revokeObjectURL(url)
}
