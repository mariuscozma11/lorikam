import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Envelope } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  Badge,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type TemplateField = {
  field: "subject" | "heading" | "intro" | "outro"
  key: string
  value: string
  default: string
}

type EmailTemplate = {
  id: string
  name: string
  description: string
  variables: string[]
  fields: TemplateField[]
}

const FIELD_LABELS: Record<TemplateField["field"], string> = {
  subject: "Subiect",
  heading: "Titlu în email",
  intro: "Text introductiv",
  outro: "Text suplimentar (opțional)",
}

const EmailTemplatesPage = () => {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [previewSubject, setPreviewSubject] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () =>
      sdk.client.fetch<{ templates: EmailTemplate[] }>(
        "/admin/email-templates",
        { method: "GET" }
      ),
  })

  const templates = data?.templates ?? []
  const active = useMemo(
    () => templates.find((t) => t.id === activeId) ?? templates[0],
    [templates, activeId]
  )

  // Seed the editable copy once the saved values arrive.
  useEffect(() => {
    if (!templates.length) return
    setValues(
      Object.fromEntries(
        templates.flatMap((t) => t.fields.map((f) => [f.key, f.value]))
      )
    )
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () =>
      sdk.client.fetch("/admin/email-templates", {
        method: "POST",
        body: { values },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Sabloanele de email au fost salvate!")
    },
    onError: (error) => toast.error("Eroare: " + (error as Error).message),
  })

  const previewMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const params = new URLSearchParams({
        template: templateId,
        // Preview what's on screen, including unsaved edits.
        overrides: JSON.stringify(values),
      })
      return sdk.client.fetch<{ subject: string; html: string }>(
        `/admin/email-templates/preview?${params.toString()}`,
        { method: "GET" }
      )
    },
    onSuccess: (result) => {
      setPreviewSubject(result.subject)
      setPreviewHtml(result.html)
    },
    onError: (error) => toast.error("Eroare: " + (error as Error).message),
  })

  const isDirty = templates.some((t) =>
    t.fields.some((f) => (values[f.key] ?? "") !== f.value)
  )

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-muted">Se incarca...</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Sabloane email</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Textele din emailurile trimise automat. Restul (produse, totaluri,
              adresa) se genereaza automat.
            </Text>
          </div>
          {isDirty && (
            <Button
              variant="primary"
              size="small"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-1 px-6 pt-2 border-b border-ui-border-base">
          {templates.map((t) => {
            const isActive = active?.id === t.id
            const edited = t.fields.some((f) => (values[f.key] ?? "") !== "")

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveId(t.id)
                  setPreviewHtml("")
                }}
                className={
                  "px-3 py-2 -mb-px text-sm border-b-2 transition-colors " +
                  (isActive
                    ? "border-ui-fg-base text-ui-fg-base font-medium"
                    : "border-transparent text-ui-fg-muted hover:text-ui-fg-base")
                }
              >
                {t.name}
                {edited && <span className="ml-1 text-ui-fg-interactive">•</span>}
              </button>
            )
          })}
        </div>

        {active && (
          <div className="px-6 py-4 space-y-5">
            <div>
              <Text size="small" className="text-ui-fg-muted">
                {active.description}
              </Text>
              <div className="flex items-center gap-2 mt-2">
                <Text size="xsmall" className="text-ui-fg-muted">
                  Variabile disponibile:
                </Text>
                {active.variables.map((v) => (
                  <Badge key={v} size="xsmall">{`{{${v}}}`}</Badge>
                ))}
              </div>
            </div>

            {active.fields.map((f) => {
              const isLong = f.field === "intro" || f.field === "outro"
              const current = values[f.key] ?? ""

              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor={f.key}>{FIELD_LABELS[f.field]}</Label>
                    {current !== "" && (
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() =>
                          setValues((prev) => ({ ...prev, [f.key]: "" }))
                        }
                      >
                        Reseteaza la implicit
                      </Button>
                    )}
                  </div>
                  {isLong ? (
                    <Textarea
                      id={f.key}
                      rows={3}
                      value={current}
                      placeholder={f.default || "(gol)"}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      id={f.key}
                      value={current}
                      placeholder={f.default}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                  {current === "" && (
                    <Text size="xsmall" className="text-ui-fg-muted mt-1">
                      Gol = se foloseste textul implicit de mai sus.
                    </Text>
                  )}
                </div>
              )
            })}

            <Button
              variant="secondary"
              size="small"
              disabled={previewMutation.isPending}
              onClick={() => previewMutation.mutate(active.id)}
            >
              {previewMutation.isPending
                ? "Se genereaza..."
                : "Previzualizeaza"}
            </Button>
          </div>
        )}
      </Container>

      {previewHtml && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Previzualizare</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Subiect: <strong>{previewSubject}</strong>
            </Text>
          </div>
          <div className="p-6">
            <iframe
              title="Previzualizare email"
              // srcDoc keeps the email's own styles from leaking into admin.
              srcDoc={previewHtml}
              sandbox=""
              className="w-full h-[640px] border border-ui-border-base rounded-lg bg-white"
            />
          </div>
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Emailuri",
  icon: Envelope,
})

export default EmailTemplatesPage
