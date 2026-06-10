import { Metadata } from "next"
import { getContentPage } from "@lib/data/content"
import ContentPageTemplate from "@modules/content/templates/content-page-template"

const SLUG = "politica-de-confidentialitate"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage(SLUG)
  return { title: page?.title || "Politica de confidențialitate" }
}

export default function Page() {
  return <ContentPageTemplate slug={SLUG} />
}
