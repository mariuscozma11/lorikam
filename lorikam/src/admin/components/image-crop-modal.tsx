import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import { Button, Text, Heading } from "@medusajs/ui"

type Area = { x: number; y: number; width: number; height: number }

type Background = "transparent" | "white"

// Below 1 the image is smaller than the crop frame, which is how a wide
// product shot fits fully inside a square output.
const MIN_ZOOM = 0.2
const MAX_ZOOM = 4

type Props = {
  src: string
  aspect: number
  outputWidth: number
  outputHeight: number
  mime?: "image/jpeg" | "image/png"
  title?: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function cropToBlob(
  src: string,
  area: Area,
  outW: number,
  outH: number,
  mime: string,
  background: Background
): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingQuality = "high"

  // JPEG has no alpha — anything not covered by the image would come out
  // black, so paint the chosen background first.
  if (background === "white") {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, outW, outH)
  }

  // Zooming out below fit produces an area that is larger than the image and
  // can have negative x/y. Passing that as drawImage's *source* rect clamps
  // and stretches the result, so instead place the whole image inside the
  // output rect and let the uncovered part stay background.
  const scale = outW / area.width
  ctx.drawImage(
    img,
    -area.x * scale,
    -area.y * scale,
    img.naturalWidth * scale,
    img.naturalHeight * scale
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("crop failed"))),
      mime,
      0.92
    )
  })
}

export const ImageCropModal = ({
  src,
  aspect,
  outputWidth,
  outputHeight,
  mime = "image/jpeg",
  title = "Ajustează imaginea",
  onCancel,
  onConfirm,
}: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  // PNG sources are usually cut-outs with no background, so default to keeping
  // them transparent when the crop is padded out.
  const [background, setBackground] = useState<Background>(
    mime === "image/png" ? "transparent" : "white"
  )

  // Transparency needs PNG regardless of what the caller asked for.
  const outputMime = background === "transparent" ? "image/png" : mime

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setAreaPixels(areaPx)
  }, [])

  const handleConfirm = async () => {
    if (!areaPixels) return
    setBusy(true)
    try {
      const blob = await cropToBlob(
        src,
        areaPixels,
        outputWidth,
        outputHeight,
        outputMime,
        background
      )
      onConfirm(blob)
    } catch (e) {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-ui-bg-base rounded-lg shadow-elevation-modal w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Heading level="h2">{title}</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Trage pentru poziționare, zoom cu slider-ul. Micșorează sub 100%
            ca să încapă toată imaginea în cadru. Rezultat: {outputWidth}×
            {outputHeight}px.
          </Text>
        </div>

        <div className="relative w-full" style={{ height: "55vh" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            // Must be false: with position restricted the library clamps the
            // image to cover the frame, which makes zooming below 1 impossible.
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-6 py-3 border-t border-ui-border-base flex items-center gap-3">
          <Text size="small" className="text-ui-fg-muted">
            Zoom
          </Text>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setZoom(1)
              setCrop({ x: 0, y: 0 })
            }}
          >
            Resetează
          </Button>
        </div>

        <div className="px-6 py-3 border-t border-ui-border-base flex items-center gap-3">
          <Text size="small" className="text-ui-fg-muted">
            Fundal
          </Text>
          <Button
            variant={background === "transparent" ? "primary" : "secondary"}
            size="small"
            onClick={() => setBackground("transparent")}
          >
            Transparent (PNG)
          </Button>
          <Button
            variant={background === "white" ? "primary" : "secondary"}
            size="small"
            onClick={() => setBackground("white")}
          >
            Alb
          </Button>
          <Text size="xsmall" className="text-ui-fg-muted">
            Se aplică zonei rămase libere când micșorezi imaginea.
          </Text>
        </div>

        <div className="px-6 py-4 border-t border-ui-border-base flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Anulează
          </Button>
          <Button onClick={handleConfirm} isLoading={busy} disabled={!areaPixels}>
            Salvează imaginea
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropModal
