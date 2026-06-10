import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"

// Basic product details (name + status) — the part not covered by a widget.
export default function ProductDetailsEditor({
  productId,
  initialTitle,
  initialStatus,
}: {
  productId: string
  initialTitle: string
  initialStatus: string
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initialTitle)
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    setTitle(initialTitle)
    setStatus(initialStatus)
  }, [initialTitle, initialStatus])

  const dirty = title !== initialTitle || status !== initialStatus

  const saveMutation = useMutation({
    mutationFn: () =>
      sdk.admin.product.update(productId, {
        title: title.trim(),
        status: status as any,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      queryClient.invalidateQueries({ queryKey: ["hub-products"] })
      toast.success("Detaliile au fost salvate!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Detalii produs</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Nume și status
          </Text>
        </div>
        {dirty && (
          <Button
            variant="primary"
            size="small"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim()}
          >
            {saveMutation.isPending ? "Se salvează..." : "Salvează"}
          </Button>
        )}
      </div>
      <div className="px-6 py-4 grid grid-cols-1 small:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pe-title" className="font-medium">
            Nume produs
          </Label>
          <Input
            id="pe-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="pe-status" className="font-medium">
            Status
          </Label>
          <select
            id="pe-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm"
          >
            <option value="draft">Ciornă</option>
            <option value="published">Publicat</option>
          </select>
        </div>
      </div>
    </Container>
  )
}
