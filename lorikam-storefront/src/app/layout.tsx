import { getBaseURL } from "@lib/util/env"
import { getSeoDefaults } from "@lib/util/seo"
import { Metadata } from "next"
import "styles/globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoDefaults()
  return {
    metadataBase: new URL(getBaseURL()),
    title: { default: seo.title, template: `%s | ${seo.siteName}` },
    description: seo.description,
    applicationName: seo.siteName,
    openGraph: {
      type: "website",
      siteName: seo.siteName,
      title: seo.title,
      description: seo.description,
      images: [{ url: seo.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImage],
    },
  }
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ro" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
