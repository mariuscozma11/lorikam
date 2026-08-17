// Everything about outgoing email that the client can change without touching
// the server: who the mail comes from, where replies land, and who receives
// the contact form. Stored in site_setting under `email_*` / `company_email`,
// which is exactly what loadEmailOverrides() already picks up, so these reach
// the Resend provider on every send with no extra plumbing.
export const SETTINGS_META = [
  {
    key: "email_from_name",
    label: "Nume expeditor",
    hint: "Apare ca nume în inbox-ul clientului.",
    placeholder: "Lorikam",
  },
  {
    key: "email_from_address",
    label: "Adresă expeditor",
    hint: "Trebuie să fie pe un domeniu verificat în Resend.",
    placeholder: "comenzi@lorikam.com",
    email: true,
    mustBeVerifiedDomain: true,
  },
  {
    key: "email_reply_to",
    label: "Adresă de răspuns",
    hint: "Unde ajunge mailul dacă un client dă Reply. Adresa de expeditor nu primește mesaje.",
    placeholder: "contact@lorikam.com",
    email: true,
  },
  {
    key: "company_email",
    label: "Email contact",
    hint: "Primește mesajele trimise din formularul de contact al site-ului.",
    placeholder: "contact@lorikam.com",
    email: true,
  },
] as const

export const SETTING_KEYS = SETTINGS_META.map((s) => s.key) as string[]

// Deliberately loose: the authority on whether an address works is Resend, not
// a regex. This only catches typos like a missing @.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ResendStatus = {
  configured: boolean
  key_preview: string | null
  domains: { name: string; status: string; sending: boolean }[]
  error: string | null
}

export async function resendStatus(): Promise<ResendStatus> {
  const key = process.env.RESEND_API_KEY

  if (!key) {
    return { configured: false, key_preview: null, domains: [], error: null }
  }

  const key_preview = `${key.slice(0, 7)}…${key.slice(-4)}`

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      return {
        configured: true,
        key_preview,
        domains: [],
        error:
          res.status === 401
            ? "Cheia API este respinsă de Resend (401). Verifică RESEND_API_KEY."
            : `Resend a răspuns cu ${res.status}.`,
      }
    }

    const body = (await res.json()) as any

    return {
      configured: true,
      key_preview,
      domains: (body?.data ?? []).map((d: any) => ({
        name: d.name,
        status: d.status,
        sending: d?.capabilities?.sending === "enabled",
      })),
      error: null,
    }
  } catch (e: any) {
    return {
      configured: true,
      key_preview,
      domains: [],
      error: e?.message ?? "Nu am putut contacta Resend.",
    }
  }
}

/**
 * Rejects addresses that would make Resend refuse every future email — a
 * sender on an unverified domain returns 403 at send time, long after the
 * client has left this screen.
 */
export async function validateSettings(
  values: Record<string, string>
): Promise<string[]> {
  const errors: string[] = []

  for (const meta of SETTINGS_META) {
    const value = values[meta.key]?.trim()

    if (!value) {
      continue
    }

    if ("email" in meta && meta.email && !EMAIL_RE.test(value)) {
      errors.push(`${meta.label}: „${value}” nu pare o adresă de email.`)
      continue
    }

    if ("mustBeVerifiedDomain" in meta && meta.mustBeVerifiedDomain) {
      const status = await resendStatus()

      if (!status.configured || status.error) {
        continue
      }

      const domain = value.split("@")[1]?.toLowerCase()
      const verified = status.domains.filter(
        (d) => d.status === "verified" && d.sending
      )

      if (!verified.some((d) => d.name.toLowerCase() === domain)) {
        errors.push(
          `${meta.label}: domeniul „${domain}” nu este verificat în Resend. ` +
            (verified.length
              ? `Disponibile: ${verified.map((d) => d.name).join(", ")}.`
              : "Niciun domeniu verificat momentan.")
        )
      }
    }
  }

  return errors
}
