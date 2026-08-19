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

type SettingField = {
  key: string
  label: string
  hint: string
  placeholder: string
  value: string
}

type Connection = {
  configured: boolean
  key_preview: string | null
  domains: { name: string; status: string; sending: boolean }[]
  error: string | null
}

type EmailConfig = {
  connection: Connection
  effective_sender: string
  sender_verified: boolean
  sender_is_default: boolean
  sender_fallback: string | null
  settings: SettingField[]
  templates: EmailTemplate[]
}

/**
 * The SDK throws a FetchError whose `message` is the server's `message` field,
 * falling back to statusText — which is empty for some responses, leaving the
 * toast reading just "Eroare: ". Always end up with something actionable.
 */
const errorMessage = (error: unknown) => {
  const e = error as
    | { message?: string; status?: number; statusText?: string }
    | undefined
  const message = e?.message?.trim()

  if (message) {
    return message
  }

  if (e?.status) {
    return `Serverul a raspuns ${e.status}${
      e.statusText ? ` ${e.statusText}` : ""
    }. Vezi consola serverului pentru detalii.`
  }

  return "Eroare necunoscuta. Vezi consola serverului pentru detalii."
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

  const [testTo, setTestTo] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () =>
      sdk.client.fetch<EmailConfig>("/admin/email-templates", {
        method: "GET",
      }),
  })

  const templates = data?.templates ?? []
  const settings = data?.settings ?? []
  const connection = data?.connection
  const active = useMemo(
    () => templates.find((t) => t.id === activeId) ?? templates[0],
    [templates, activeId]
  )

  // Seed the editable copy once the saved values arrive.
  useEffect(() => {
    if (!templates.length) return
    setValues({
      ...Object.fromEntries(settings.map((s) => [s.key, s.value])),
      ...Object.fromEntries(
        templates.flatMap((t) => t.fields.map((f) => [f.key, f.value]))
      ),
    })
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
    onError: (error) => toast.error("Eroare: " + errorMessage(error)),
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
    onError: (error) => toast.error("Eroare: " + errorMessage(error)),
  })

  const testMutation = useMutation({
    mutationFn: async () =>
      sdk.client.fetch<{ to: string }>("/admin/email-templates/send-test", {
        method: "POST",
        body: { to: testTo, template: active?.id ?? "order-placed" },
      }),
    onSuccess: (result) =>
      toast.success(`Email de test trimis catre ${result.to}.`),
    onError: (error) => toast.error("Eroare: " + errorMessage(error)),
  })

  const isDirty =
    templates.some((t) =>
      t.fields.some((f) => (values[f.key] ?? "") !== f.value)
    ) || settings.some((s) => (values[s.key] ?? "") !== s.value)

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-muted">Se incarca...</Text>
      </Container>
    )
  }

  const verifiedDomains =
    connection?.domains.filter((d) => d.status === "verified" && d.sending) ??
    []

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Emailuri</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Tot ce tine de emailurile trimise de magazin: conexiune, expeditor
            si textele sabloanelor.
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
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Conexiune Resend</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Serviciul prin care pleaca emailurile. Cheia API se seteaza pe
            server (variabila RESEND_API_KEY), restul se configureaza aici.
          </Text>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 gap-y-3">
          <div className="flex items-center gap-x-2">
            <span
              className={
                "inline-block w-2 h-2 rounded-full " +
                (connection?.configured && !connection.error
                  ? "bg-ui-tag-green-icon"
                  : "bg-ui-tag-red-icon")
              }
            />
            <Text size="small" weight="plus">
              {!connection?.configured
                ? "Neconfigurat — emailurile nu pleaca"
                : connection.error
                ? "Problema de conexiune"
                : "Conectat"}
            </Text>
            {connection?.key_preview && (
              <Badge size="xsmall" className="font-mono">
                {connection.key_preview}
              </Badge>
            )}
          </div>

          {connection?.error && (
            <Text size="small" className="text-ui-fg-error">
              {connection.error}
            </Text>
          )}

          {!connection?.configured && (
            <Text size="small" className="text-ui-fg-muted">
              Pana atunci, emailurile sunt doar afisate in consola serverului.
            </Text>
          )}

          {connection?.configured && !connection.error && (
            <div className="flex items-center gap-x-2 flex-wrap">
              <Text size="small" className="text-ui-fg-muted">
                Domenii:
              </Text>
              {connection.domains.length ? (
                connection.domains.map((d) => (
                  <Badge
                    key={d.name}
                    size="xsmall"
                    color={
                      d.status === "verified" && d.sending ? "green" : "orange"
                    }
                  >
                    {d.name} · {d.status}
                  </Badge>
                ))
              ) : (
                <Text size="small" className="text-ui-fg-error">
                  niciunul — verifica un domeniu pe resend.com/domains
                </Text>
              )}
            </div>
          )}

          {connection?.configured && !connection.error && (
            <div
              className={
                "rounded-lg px-3 py-2 " +
                (data?.sender_verified
                  ? "bg-ui-bg-subtle"
                  : "bg-ui-tag-red-bg border border-ui-tag-red-border")
              }
            >
              <Text size="small">
                Emailurile pleaca de la{" "}
                <strong className="font-mono">{data?.effective_sender}</strong>
              </Text>
              {!data?.sender_verified && (
                <Text size="small" className="text-ui-fg-error mt-1">
                  Domeniul acestei adrese nu este verificat in Resend, deci
                  Resend accepta doar trimiterea catre adresa contului tau.
                  {data?.sender_is_default
                    ? " Completeaza „Adresa expeditor” mai jos cu o adresa pe un domeniu verificat."
                    : ""}
                </Text>
              )}
            </div>
          )}

          <div className="flex items-center gap-x-2 pt-1">
            <Input
              placeholder="adresa@exemplu.ro"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              size="small"
              disabled={
                !testTo || testMutation.isPending || !connection?.configured
              }
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending
                ? "Se trimite..."
                : "Trimite email de test"}
            </Button>
          </div>
          <Text size="xsmall" className="text-ui-fg-muted">
            Trimite sablonul selectat mai jos, cu date de exemplu, folosind
            setarile curente. Salveaza intai daca ai facut modificari.
          </Text>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Expeditor</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Cum apare Lorikam in inbox-ul clientului si unde ajung raspunsurile.
          </Text>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 gap-y-4">
          {settings.map((s) => (
            <div key={s.key}>
              <Label htmlFor={s.key}>{s.label}</Label>
              <Input
                id={s.key}
                value={values[s.key] ?? ""}
                placeholder={s.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                }
                className="mt-1"
              />
              <Text size="xsmall" className="text-ui-fg-muted mt-1">
                {s.hint}
                {s.key === "email_from_address" && verifiedDomains.length
                  ? ` Verificate: ${verifiedDomains
                      .map((d) => d.name)
                      .join(", ")}.`
                  : ""}
              </Text>
            </div>
          ))}
          {data?.sender_fallback && !values["email_from_address"] && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Necompletat = se foloseste valoarea de pe server:{" "}
              <strong>{data.sender_fallback}</strong>
            </Text>
          )}
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Sabloane email</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Textele din emailurile trimise automat. Restul (produse, totaluri,
              adresa) se genereaza automat.
            </Text>
          </div>
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
