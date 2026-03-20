import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
  Switch,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../../lib/sdk"
import { CurrencyDollar } from "@medusajs/icons"

type ShippingSettings = {
  id?: string
  free_shipping_threshold: number
  is_free_shipping_enabled: boolean
}

const ShippingSettingsPage = () => {
  const queryClient = useQueryClient()
  const [threshold, setThreshold] = useState<number>(0)
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch current settings
  const { data, isLoading } = useQuery({
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        shipping_settings: ShippingSettings
      }>("/admin/shipping-settings", {
        method: "GET",
      })
      return response
    },
    queryKey: ["shipping-settings"],
  })

  // Initialize form from fetched data
  useEffect(() => {
    if (data?.shipping_settings) {
      setThreshold(data.shipping_settings.free_shipping_threshold || 0)
      setIsEnabled(data.shipping_settings.is_free_shipping_enabled || false)
    }
  }, [data])

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      return sdk.client.fetch<{ shipping_settings: ShippingSettings }>(
        "/admin/shipping-settings",
        {
          method: "POST",
          body: {
            free_shipping_threshold: threshold,
            is_free_shipping_enabled: isEnabled,
          },
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-settings"] })
      setHasChanges(false)
      toast.success("Setarile de livrare au fost salvate!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleThresholdChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setThreshold(numValue)
    setHasChanges(true)
  }

  const handleEnabledChange = (checked: boolean) => {
    setIsEnabled(checked)
    setHasChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate()
  }

  const handleReset = () => {
    if (data?.shipping_settings) {
      setThreshold(data.shipping_settings.free_shipping_threshold || 0)
      setIsEnabled(data.shipping_settings.is_free_shipping_enabled || false)
    }
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Setari Livrare Gratuita</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Configureaza pragul pentru livrare gratuita
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

      <div className="px-6 py-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg">
          <div className="flex-1">
            <Label htmlFor="free-shipping-enabled" className="font-medium">
              Activeaza Livrare Gratuita
            </Label>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Cand este activat, comenzile peste pragul setat vor avea livrare
              gratuita
            </Text>
          </div>
          <Switch
            id="free-shipping-enabled"
            checked={isEnabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Label htmlFor="threshold" className="font-medium">
            Prag Livrare Gratuita (RON)
          </Label>
          <Text size="small" className="text-ui-fg-muted mt-1 mb-3">
            Comenzile cu valoare mai mare sau egala cu acest prag vor avea
            livrare gratuita
          </Text>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              id="threshold"
              type="number"
              min={0}
              step={1}
              value={threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              placeholder="100"
              disabled={!isEnabled}
            />
            <Text className="text-ui-fg-muted">RON</Text>
          </div>
        </div>

        {isEnabled && threshold > 0 && (
          <div className="p-4 bg-ui-bg-highlight rounded-lg border border-ui-border-base">
            <Text size="small" className="text-ui-fg-base">
              <strong>Previzualizare:</strong> Comenzile de{" "}
              <strong>{threshold} RON</strong> sau mai mult vor avea livrare
              gratuita.
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Livrare Gratuita",
  icon: CurrencyDollar,
})

export default ShippingSettingsPage
