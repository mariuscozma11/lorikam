import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
  Select,
  Switch,
  IconButton,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"
import { XMark, Plus } from "@medusajs/icons"

type CustomizationField = {
  key: string
  label: string
  type: "text" | "number"
  required: boolean
  maxLength?: number
  min?: number
  max?: number
}

type PredefinedField = {
  label: string
  config: Omit<CustomizationField, "key">
}

// Predefined field suggestions for quick-add
const PREDEFINED_FIELDS: PredefinedField[] = [
  {
    label: "Nume jucator",
    config: {
      label: "Nume jucator",
      type: "text",
      required: true,
      maxLength: 20,
    },
  },
  {
    label: "Numar tricou",
    config: {
      label: "Numar tricou",
      type: "number",
      required: true,
      min: 1,
      max: 99,
    },
  },
  {
    label: "Mesaj dedicatie",
    config: {
      label: "Mesaj dedicatie",
      type: "text",
      required: false,
      maxLength: 50,
    },
  },
]

const generateKey = (label: string): string => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const ProductCustomizationWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [fields, setFields] = useState<CustomizationField[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "number">("text")

  // Initialize fields from product metadata
  useEffect(() => {
    const customizationFields = product.metadata?.customization_fields as CustomizationField[] | undefined
    if (customizationFields && Array.isArray(customizationFields)) {
      setFields(customizationFields)
    } else {
      setFields([])
    }
  }, [product.metadata])

  // Mutation to save customization fields to product metadata
  const saveFieldsMutation = useMutation({
    mutationFn: async (customizationFields: CustomizationField[]) => {
      return sdk.admin.product.update(product.id, {
        metadata: {
          ...product.metadata,
          customization_fields: customizationFields.length > 0 ? customizationFields : null,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product", product.id],
      })
      setHasChanges(false)
      toast.success("Campurile de personalizare au fost salvate!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleAddPredefinedField = (predefined: PredefinedField) => {
    const key = generateKey(predefined.config.label)
    // Check if field with same key already exists
    if (fields.some(f => f.key === key)) {
      toast.error("Acest camp exista deja!")
      return
    }
    setFields((prev) => [...prev, { key, ...predefined.config }])
    setHasChanges(true)
  }

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) {
      toast.error("Introdu un nume pentru camp!")
      return
    }
    const key = generateKey(newFieldLabel)
    if (fields.some(f => f.key === key)) {
      toast.error("Acest camp exista deja!")
      return
    }
    const newField: CustomizationField = {
      key,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: true,
      ...(newFieldType === "text" ? { maxLength: 30 } : { min: 1, max: 99 }),
    }
    setFields((prev) => [...prev, newField])
    setNewFieldLabel("")
    setNewFieldType("text")
    setShowAddField(false)
    setHasChanges(true)
  }

  const handleRemoveField = (key: string) => {
    setFields((prev) => prev.filter((f) => f.key !== key))
    setHasChanges(true)
  }

  const handleUpdateField = (key: string, updates: Partial<CustomizationField>) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updates } : f))
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    saveFieldsMutation.mutate(fields)
  }

  const handleReset = () => {
    const customizationFields = product.metadata?.customization_fields as CustomizationField[] | undefined
    if (customizationFields && Array.isArray(customizationFields)) {
      setFields(customizationFields)
    } else {
      setFields([])
    }
    setHasChanges(false)
  }

  // Get predefined fields that haven't been added yet
  const availablePredefined = PREDEFINED_FIELDS.filter(
    (pf) => !fields.some((f) => f.key === generateKey(pf.config.label))
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Personalizare Produs</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Configureaza campurile pe care clientii le pot completa
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleReset}
              disabled={saveFieldsMutation.isPending}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={saveFieldsMutation.isPending}
            >
              {saveFieldsMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          </div>
        )}
      </div>

      {/* Current Fields */}
      {fields.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" className="mb-3">
            Campuri active ({fields.length}):
          </Text>
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex items-start gap-3 p-3 bg-ui-bg-subtle rounded-lg"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label size="xsmall" className="text-ui-fg-muted">
                        Eticheta
                      </Label>
                      <Input
                        size="small"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateField(field.key, { label: e.target.value })
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Label size="xsmall" className="text-ui-fg-muted">
                        Tip
                      </Label>
                      <Select
                        size="small"
                        value={field.type}
                        onValueChange={(value) =>
                          handleUpdateField(field.key, {
                            type: value as "text" | "number",
                            ...(value === "text"
                              ? { maxLength: 30, min: undefined, max: undefined }
                              : { min: 1, max: 99, maxLength: undefined }),
                          })
                        }
                      >
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="text">Text</Select.Item>
                          <Select.Item value="number">Numar</Select.Item>
                        </Select.Content>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="small"
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          handleUpdateField(field.key, { required: checked })
                        }
                      />
                      <Text size="small">Obligatoriu</Text>
                    </div>

                    {field.type === "text" && (
                      <div className="flex items-center gap-2">
                        <Text size="small" className="text-ui-fg-muted">
                          Max caractere:
                        </Text>
                        <Input
                          size="small"
                          type="number"
                          className="w-16"
                          value={field.maxLength || ""}
                          onChange={(e) =>
                            handleUpdateField(field.key, {
                              maxLength: parseInt(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    )}

                    {field.type === "number" && (
                      <>
                        <div className="flex items-center gap-2">
                          <Text size="small" className="text-ui-fg-muted">
                            Min:
                          </Text>
                          <Input
                            size="small"
                            type="number"
                            className="w-16"
                            value={field.min ?? ""}
                            onChange={(e) =>
                              handleUpdateField(field.key, {
                                min: parseInt(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Text size="small" className="text-ui-fg-muted">
                            Max:
                          </Text>
                          <Input
                            size="small"
                            type="number"
                            className="w-16"
                            value={field.max ?? ""}
                            onChange={(e) =>
                              handleUpdateField(field.key, {
                                max: parseInt(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <IconButton
                  size="small"
                  variant="transparent"
                  onClick={() => handleRemoveField(field.key)}
                >
                  <XMark />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Fields Section */}
      <div className="px-6 py-4">
        <Text size="small" weight="plus" className="mb-3">
          Adauga campuri:
        </Text>

        {/* Predefined Quick-Add Buttons */}
        {availablePredefined.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {availablePredefined.map((pf) => (
              <Button
                key={pf.label}
                variant="secondary"
                size="small"
                onClick={() => handleAddPredefinedField(pf)}
              >
                <Plus className="mr-1" />
                {pf.label}
              </Button>
            ))}
          </div>
        )}

        {/* Custom Field Input */}
        {showAddField ? (
          <div className="p-3 bg-ui-bg-subtle rounded-lg space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label size="xsmall">Nume camp</Label>
                <Input
                  size="small"
                  placeholder="ex: Initiala"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="w-24">
                <Label size="xsmall">Tip</Label>
                <Select
                  size="small"
                  value={newFieldType}
                  onValueChange={(v) => setNewFieldType(v as "text" | "number")}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="text">Text</Select.Item>
                    <Select.Item value="number">Numar</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="small" onClick={handleAddCustomField}>
                Adauga
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowAddField(false)
                  setNewFieldLabel("")
                }}
              >
                Anuleaza
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowAddField(true)}
          >
            <Plus className="mr-1" />
            Camp personalizat
          </Button>
        )}
      </div>

      {/* Info */}
      {fields.length === 0 && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Acest produs nu are campuri de personalizare configurate. Adauga campuri
            pentru a permite clientilor sa introduca date personalizate (nume, numar, etc).
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductCustomizationWidget
