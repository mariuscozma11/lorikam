"use server"

import { sdk } from "@lib/config"

export type ContentPage = {
  id: string
  slug: string
  title: string
  content: string | null
  is_published: boolean
}

export async function getContentPage(
  slug: string
): Promise<ContentPage | null> {
  try {
    const response = await sdk.client.fetch<{ content_page: ContentPage }>(
      `/store/content-pages/${slug}`,
      { next: { revalidate: 60, tags: [`content-${slug}`] } }
    )
    return response?.content_page || null
  } catch (error: any) {
    // Page not found / not published / backend unavailable
    return null
  }
}
