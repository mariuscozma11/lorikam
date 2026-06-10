import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { Photo } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Setting = { id: string; key: string; value: string | null }

const SLOTS: { key: string; label: string; hint: string; aspect: string }[] = [
  { key: "logo", label: "Logo", hint: "PNG transparent, ~446×104", aspect: "446/104" },
  { key: "hero_image", label: "Hero — pagina principală", hint: "1920×1080 (16:9)", aspect: "16/9" },
  { key: "lorikam_banner", label: "Banner — Lorikam Shop", hint: "1600×731", aspect: "1600/731" },
  { key: "fan_shop_banner", label: "Banner — Fan Shop", hint: "1600×731", aspect: "1600/731" },
  { key: "about_hero", label: "Despre — imagine hero", hint: "1920×1080 (16:9)", aspect: "16/9" },
  { key: "about_story", label: "Despre — imagine poveste", hint: "4:3", aspect: "4/3" },
  { key: "og_image", label: "Imagine SEO (share social)", hint: "1200×630", aspect: "1200/630" },
]

const ImaginiSitePage = () => {
  const queryClient = useQueryClient()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

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

  const handleUpload = async (key: string, files: FileList | null) => {
    if (!files?.length) return
    setUploadingKey(key)
    try {
      const fd = new FormData()
      fd.append("files", files[0])
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

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Imagini site</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Încarcă grafica site-ului. Dacă un câmp e gol, se folosește imaginea
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
                  onChange={(e) => handleUpload(slot.key, e.target.files)}
                />
              </label>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Imagini site",
  icon: Photo,
})

export default ImaginiSitePage
