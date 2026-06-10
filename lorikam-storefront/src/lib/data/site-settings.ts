"use server"

import { sdk } from "@lib/config"

export type SiteSettings = Record<string, string | null>

// Cached fetch of all site settings (marketing images, logo, OG image…).
// Multiple calls within one render are deduped by Next's fetch cache.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await sdk.client.fetch<{ settings: SiteSettings }>(
      "/store/site-settings",
      { next: { revalidate: 60, tags: ["site-settings"] } }
    )
    return res?.settings || {}
  } catch {
    return {}
  }
}

// Convenience: get a single setting with a fallback default.
export async function getSiteImage(
  key: string,
  fallback: string
): Promise<string> {
  const settings = await getSiteSettings()
  return settings[key] || fallback
}
