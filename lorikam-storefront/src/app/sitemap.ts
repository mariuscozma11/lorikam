import type { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getTeams } from "@lib/data/teams"

const REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ro"

// Dynamic sitemap — products, categories, collections, teams and content
// pages are pulled live, so new entries appear without code changes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseURL().replace(/\/$/, "")
  const prefix = `${base}/${REGION}`
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: prefix, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${prefix}/store`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${prefix}/lorikam`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${prefix}/fan-shop`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${prefix}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${prefix}/termeni-si-conditii`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${prefix}/politica-de-confidentialitate`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${prefix}/politica-cookie-uri`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${prefix}/retururi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  const dynamic: MetadataRoute.Sitemap = []

  try {
    const { response } = await listProducts({
      countryCode: REGION,
      queryParams: { limit: 100, fields: "handle,updated_at" },
    })
    for (const p of response.products) {
      if (!p.handle) continue
      dynamic.push({
        url: `${prefix}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  } catch {}

  try {
    const categories = await listCategories({ fields: "handle" })
    for (const c of categories || []) {
      if (!c.handle) continue
      dynamic.push({
        url: `${prefix}/categories/${c.handle}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  } catch {}

  try {
    const { collections } = await listCollections({ fields: "handle" })
    for (const c of collections || []) {
      if (!c.handle) continue
      dynamic.push({
        url: `${prefix}/collections/${c.handle}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  } catch {}

  try {
    const teams = await getTeams()
    for (const t of teams || []) {
      if (!t.handle) continue
      dynamic.push({
        url: `${prefix}/fan-shop/${t.handle}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  } catch {}

  return [...staticRoutes, ...dynamic]
}
