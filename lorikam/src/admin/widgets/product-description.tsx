import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import MDEditor from "@uiw/react-md-editor"
import remarkBreaks from "remark-breaks"
import { sdk } from "../lib/sdk"

const ProductDescriptionWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState(product.description || "")
  const [hasChanges, setHasChanges] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    setDescription(product.description || "")
    setHasChanges(false)
  }, [product.id, product.description])

  const handleDescriptionChange = (value: string | undefined) => {
    const newValue = value || ""
    setDescription(newValue)
    setHasChanges(newValue !== (product.description || ""))
  }

  // Mutation to save description
  const saveMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      return sdk.admin.product.update(product.id, {
        description: newDescription,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product", product.id],
      })
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key.includes("product") || key.includes(product.id)
        },
      })
      setHasChanges(false)
      toast.success("Descrierea a fost salvata!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleSave = () => {
    saveMutation.mutate(description)
  }

  const handleReset = () => {
    setDescription(product.description || "")
    setHasChanges(false)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Descriere Produs</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Editeaza descrierea cu formatare Markdown
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleReset}
              disabled={saveMutation.isPending}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-4" data-color-mode="light">
        <MDEditor
          value={description}
          onChange={handleDescriptionChange}
          preview="live"
          height={350}
          previewOptions={{
            remarkPlugins: [remarkBreaks],
          }}
          textareaProps={{
            placeholder: "Scrie descrierea produsului...\n\nApasa Enter pentru linie noua\n\n- Element lista\n- Alt element\n\n**Bold** și *italic*",
          }}
        />
        <div className="mt-3">
          <Text size="xsmall" className="text-ui-fg-muted">
            Formatare: **bold**, *italic*, # titlu, - lista cu puncte, 1. lista numerotata
          </Text>
        </div>
        <style>{`
          .w-md-editor-preview ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .w-md-editor-preview ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .w-md-editor-preview li {
            margin-bottom: 0.25rem;
          }
          .w-md-editor-preview p {
            margin-bottom: 0.5rem;
          }
        `}</style>
      </div>

      {description && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted mb-3">
            Previzualizare:
          </Text>
          <div data-color-mode="light" className="product-description-preview">
            <MDEditor.Markdown
              source={description}
              remarkPlugins={[remarkBreaks]}
              style={{
                backgroundColor: "transparent",
                color: "inherit",
              }}
            />
            <style>{`
              .product-description-preview ul {
                list-style-type: disc;
                padding-left: 1.5rem;
                margin-bottom: 1rem;
              }
              .product-description-preview ol {
                list-style-type: decimal;
                padding-left: 1.5rem;
                margin-bottom: 1rem;
              }
              .product-description-preview li {
                margin-bottom: 0.25rem;
              }
              .product-description-preview p {
                margin-bottom: 0.75rem;
              }
            `}</style>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDescriptionWidget
