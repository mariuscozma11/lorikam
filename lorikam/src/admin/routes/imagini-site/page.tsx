import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { Photo } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import ImageCropModal from "../../components/image-crop-modal"

type Setting = { id: string; key: string; value: string | null }

type Slot = {
  key: string
  label: string
  hint: string
  aspect: string // CSS aspect-ratio for the preview box
  crop: {
    aspect: number
    outputWidth: number
    outputHeight: number
    mime: "image/jpeg" | "image/png"
  }
}

const SLOTS: Slot[] = [
  { key: "logo", label: "Logo", hint: "PNG transparent · 446×104", aspect: "446/104", crop: { aspect: 446 / 104, outputWidth: 892, outputHeight: 208, mime: "image/png" } },
  { key: "hero_image", label: "Hero — pagina principală", hint: "1920×1080 (16:9)", aspect: "16/9", crop: { aspect: 16 / 9, outputWidth: 1920, outputHeight: 1080, mime: "image/jpeg" } },
  { key: "lorikam_banner", label: "Banner — Lorikam Shop", hint: "1600×731", aspect: "1600/731", crop: { aspect: 1600 / 731, outputWidth: 1600, outputHeight: 731, mime: "image/jpeg" } },
  { key: "fan_shop_banner", label: "Banner — Fan Shop", hint: "1600×731", aspect: "1600/731", crop: { aspect: 1600 / 731, outputWidth: 1600, outputHeight: 731, mime: "image/jpeg" } },
  { key: "about_hero", label: "Despre — imagine hero", hint: "1920×1080 (16:9)", aspect: "16/9", crop: { aspect: 16 / 9, outputWidth: 1920, outputHeight: 1080, mime: "image/jpeg" } },
  { key: "about_story", label: "Despre — imagine poveste", hint: "4:3 · 1200×900", aspect: "4/3", crop: { aspect: 4 / 3, outputWidth: 1200, outputHeight: 900, mime: "image/jpeg" } },
  { key: "og_image", label: "Imagine SEO (share social)", hint: "1200×630", aspect: "1200/630", crop: { aspect: 1200 / 630, outputWidth: 1200, outputHeight: 630, mime: "image/jpeg" } },
]

const ImaginiSitePage = () => {
  const queryClient = useQueryClient()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [cropState, setCropState] = useState<{ slot: Slot; src: string } | null>(
    null
  )

  const { data } = useQuery<{ site_settings: Setting[] }>({
    queryFn: () => sdk.client.fetch("/admin/site-settings"),
    queryKey: ["site-settings"],
  })
  const byKey: Record<string, string | null> = {}
  for (const s of data?.site_settings || []) byKey[s.key] = s.value

  const upsert = useMutation({
    mutationFn: (body: { key: string; value: string | null }) =>
      sdk.client.fetch("/admin/site-settings", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] })
      toast.success("Imaginea a fost salvată!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const uploadFile = async (key: string, file: File) => {
    setUploadingKey(key)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Încărcare eșuată")
      }
      const out = (await res.json()) as { files: { url: string }[] }
      upsert.mutate({ key, value: out.files[0].url })
    } catch (e) {
      toast.error("Eroare la încărcare: " + (e as Error).message)
    } finally {
      setUploadingKey(null)
    }
  }

  // Open the crop editor for the selected file (SVG uploaded as-is).
  const handleSelect = (slot: Slot, files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.type === "image/svg+xml") {
      uploadFile(slot.key, file)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCropState({ slot, src: reader.result as string })
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = (blob: Blob) => {
    if (!cropState) return
    const { slot } = cropState
    const ext = slot.crop.mime === "image/png" ? "png" : "jpg"
    const file = new File([blob], `${slot.key}-${Date.now()}.${ext}`, {
      type: slot.crop.mime,
    })
    setCropState(null)
    uploadFile(slot.key, file)
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Imagini site</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Încarcă grafica site-ului. La încărcare poți ajusta (crop + zoom) la
          dimensiunea optimă. Dacă un câmp e gol, se folosește imaginea
          implicită.
        </Text>
      </div>

      <div className="px-6 py-4 grid grid-cols-1 medium:grid-cols-2 gap-6">
        {SLOTS.map((slot) => {
          const url = byKey[slot.key]
          return (
            <div
              key={slot.key}
              className="rounded-lg border border-ui-border-base p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Text weight="plus">{slot.label}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {slot.hint}
                  </Text>
                </div>
                {url && (
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => upsert.mutate({ key: slot.key, value: null })}
                  >
                    Resetează
                  </Button>
                )}
              </div>

              <div
                className="w-full bg-ui-bg-subtle rounded-md overflow-hidden border border-ui-border-base flex items-center justify-center"
                style={{ aspectRatio: slot.aspect }}
              >
                {url ? (
                  <img
                    src={url}
                    alt={slot.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Text size="small" className="text-ui-fg-muted">
                    Imagine implicită
                  </Text>
                )}
              </div>

              <label className="mt-3 inline-flex">
                <Button
                  variant="secondary"
                  size="small"
                  asChild
                  disabled={uploadingKey === slot.key}
                >
                  <span>
                    {uploadingKey === slot.key
                      ? "Se încarcă..."
                      : url
                      ? "Schimbă imaginea"
                      : "Încarcă imagine"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSelect(slot, e.target.files)}
                />
              </label>
            </div>
          )
        })}
      </div>

      {cropState && (
        <ImageCropModal
          src={cropState.src}
          aspect={cropState.slot.crop.aspect}
          outputWidth={cropState.slot.crop.outputWidth}
          outputHeight={cropState.slot.crop.outputHeight}
          mime={cropState.slot.crop.mime}
          title={`Ajustează: ${cropState.slot.label}`}
          onCancel={() => setCropState(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Imagini site",
  icon: Photo,
})

export default ImaginiSitePage
