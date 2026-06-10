import { Metadata } from "next"
import { getContentPage } from "@lib/data/content"
import ContentPageTemplate from "@modules/content/templates/content-page-template"

const SLUG = "retururi"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage(SLUG)
  return { title: page?.title || "Retururi și rambursări" }
}

export default function Page() {
  return <ContentPageTemplate slug={SLUG} />
}
