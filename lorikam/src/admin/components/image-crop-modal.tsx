import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import { Button, Text, Heading } from "@medusajs/ui"

type Area = { x: number; y: number; width: number; height: number }

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
  mime: string
): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outW,
    outH
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
        mime
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
            Trage pentru poziționare, zoom cu slider-ul. Rezultat:{" "}
            {outputWidth}×{outputHeight}px.
          </Text>
        </div>

        <div className="relative w-full" style={{ height: "55vh" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            restrictPosition
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
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
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
