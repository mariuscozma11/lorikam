import {
  Container,
  Heading,
  Text,
  toast,
  Button,
} from "@medusajs/ui"
import { Plus, XMark } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"
import VariantImageAssigner from "./variant-image-assigner"

type Img = { id?: string; url: string }

// Upload / list / remove product images, then assign them to color variants.
export default function ProductImagesPanel({ productId }: { productId: string }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery<{ product: { images: Img[] } }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${productId}`, {
        query: { fields: "images.id,images.url" },
      }),
    queryKey: ["product-images", productId],
  })
  const images: Img[] = data?.product?.images || []

  const saveImages = useMutation({
    mutationFn: (urls: string[]) =>
      sdk.admin.product.update(productId, {
        images: urls.map((url) => ({ url })),
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] })
      queryClient.invalidateQueries({
        queryKey: ["product-variants-images", productId],
      })
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append("files", f))
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
      const next = [...images.map((i) => i.url), ...out.files.map((f) => f.url)]
      saveImages.mutate(next)
    } catch (e) {
      toast.error("Eroare la încărcare: " + (e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) =>
    saveImages.mutate(images.map((i) => i.url).filter((u) => u !== url))

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Imagini</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Încarcă imagini, apoi asociază-le pe culori mai jos.
        </Text>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-muted">Se încarcă...</Text>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.url} className="relative w-24 h-24">
                <img
                  src={img.url}
                  alt=""
                  className="w-24 h-24 object-cover rounded border border-ui-border-base"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.url)}
                  className="absolute -top-2 -right-2 bg-ui-bg-base border border-ui-border-base rounded-full p-0.5"
                >
                  <XMark className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 flex flex-col items-center justify-center gap-1 rounded border border-dashed border-ui-border-strong cursor-pointer hover:bg-ui-bg-subtle text-ui-fg-muted text-xs">
              <Plus />
              {uploading || saveImages.isPending ? "..." : "Adaugă"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>
        )}
      </div>

      <VariantImageAssigner productId={productId} bare />
    </Container>
  )
}
