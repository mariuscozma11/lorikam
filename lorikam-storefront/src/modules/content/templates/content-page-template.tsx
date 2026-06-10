import { Heading } from "@medusajs/ui"

import { getContentPage } from "@lib/data/content"
import MarkdownContent from "@modules/content/components/markdown-content"

export default async function ContentPageTemplate({ slug }: { slug: string }) {
  const page = await getContentPage(slug)

  if (!page) {
    return (
      <div className="content-container py-16 max-w-3xl">
        <Heading level="h1" className="text-2xl font-semibold">
          Conținut indisponibil
        </Heading>
        <p className="text-ui-fg-subtle mt-3">
          Această pagină nu a fost încă publicată.
        </p>
      </div>
    )
  }

  return (
    <div className="content-container py-12 max-w-3xl">
      <Heading level="h1" className="text-3xl font-semibold mb-6">
        {page.title}
      </Heading>
      <MarkdownContent content={page.content || ""} />
    </div>
  )
}
