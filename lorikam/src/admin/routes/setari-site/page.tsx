import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Input, Textarea, Switch, toast } from "@medusajs/ui"
import { CogSixToothSolid } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type Setting = { id: string; key: string; value: string | null }

type Field = {
  key: string
  label: string
  hint?: string
  type?: "text" | "textarea" | "switch"
  placeholder?: string
}

type Group = { title: string; description?: string; fields: Field[] }

const GROUPS: Group[] = [
  {
    title: "Rețele sociale",
    description: "Linkurile apar în footer. Lasă gol ca să ascunzi pictograma.",
    fields: [
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/..." },
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/..." },
    ],
  },
  {
    title: "Date firmă",
    description: "Apar în footer și în paginile legale. Obligatorii pentru ANPC/GDPR.",
    fields: [
      { key: "company_name", label: "Denumire firmă", placeholder: "Lorikam SRL" },
      { key: "company_cui", label: "CUI", placeholder: "RO12345678" },
      { key: "company_reg", label: "Nr. Reg. Comerțului", placeholder: "J12/345/2020" },
      { key: "company_address", label: "Adresă sediu", type: "textarea", placeholder: "Str. ..., Oraș, Județ" },
      { key: "company_email", label: "Email contact", placeholder: "contact@lorikam.ro" },
      { key: "company_phone", label: "Telefon", placeholder: "+40 7xx xxx xxx" },
    ],
  },
  {
    title: "SEO & Analytics",
    description:
      "Titlul/descrierea implicite pentru SEO și ID-urile de analytics. Analytics se încarcă doar după ce vizitatorul acceptă cookie-urile.",
    fields: [
      { key: "seo_title", label: "Titlu SEO implicit", placeholder: "Lorikam — Articole sportive și echipamente" },
      {
        key: "seo_description",
        label: "Descriere SEO implicită",
        type: "textarea",
        placeholder: "Magazin online Lorikam: echipamente sportive personalizate și fan shop pentru echipe.",
      },
      { key: "ga4_id", label: "Google Analytics 4 (Measurement ID)", placeholder: "G-XXXXXXXXXX" },
      { key: "meta_pixel_id", label: "Meta Pixel ID", placeholder: "1234567890" },
    ],
  },
  {
    title: "Banner cookie-uri (GDPR)",
    description: "Mesajul de consimțământ afișat la prima vizită.",
    fields: [
      { key: "cookie_banner_enabled", label: "Afișează bannerul", type: "switch" },
      {
        key: "cookie_banner_text",
        label: "Text banner",
        type: "textarea",
        placeholder:
          "Folosim cookie-uri pentru a îmbunătăți experiența pe site. Citește Politica de cookie-uri.",
      },
    ],
  },
]

const ALL_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f.key))

const SetariSitePage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery<{ site_settings: Setting[] }>({
    queryFn: () => sdk.client.fetch("/admin/site-settings"),
    queryKey: ["site-settings"],
  })

  useEffect(() => {
    if (!data) return
    const byKey: Record<string, string> = {}
    for (const s of data.site_settings || []) {
      if (ALL_KEYS.includes(s.key)) byKey[s.key] = s.value ?? ""
    }
    setForm(byKey)
  }, [data])

  const upsert = useMutation({
    mutationFn: (body: { key: string; value: string | null }) =>
      sdk.client.fetch("/admin/site-settings", { method: "POST", body }),
  })

  const save = async () => {
    try {
      await Promise.all(
        ALL_KEYS.map((key) =>
          upsert.mutateAsync({ key, value: form[key]?.trim() ? form[key].trim() : null })
        )
      )
      queryClient.invalidateQueries({ queryKey: ["site-settings"] })
      toast.success("Setările au fost salvate!")
    } catch (e) {
      toast.error("Eroare: " + (e as Error).message)
    }
  }

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <Heading level="h1">Setări site</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Date firmă, rețele sociale și bannerul de cookie-uri.
          </Text>
        </div>
        <Button onClick={save} isLoading={upsert.isPending} disabled={isLoading}>
          Salvează
        </Button>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="px-6 py-5">
          <Text weight="plus">{group.title}</Text>
          {group.description && (
            <Text size="xsmall" className="text-ui-fg-muted mb-4">
              {group.description}
            </Text>
          )}
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-4 mt-2">
            {group.fields.map((field) => {
              const isWide = field.type === "textarea"
              return (
                <div key={field.key} className={isWide ? "medium:col-span-2" : ""}>
                  <Text size="small" className="mb-1">
                    {field.label}
                  </Text>
                  {field.type === "switch" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={form[field.key] !== "0"}
                        onCheckedChange={(checked) =>
                          set(field.key, checked ? "1" : "0")
                        }
                      />
                      <Text size="small" className="text-ui-fg-subtle">
                        {form[field.key] !== "0" ? "Activat" : "Dezactivat"}
                      </Text>
                    </div>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      value={form[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={form[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.key, e.target.value)}
                    />
                  )}
                  {field.hint && (
                    <Text size="xsmall" className="text-ui-fg-muted mt-1">
                      {field.hint}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Setări site",
  icon: CogSixToothSolid,
})

export default SetariSitePage
