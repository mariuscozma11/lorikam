import { getBaseURL } from "@lib/util/env"
import { getSiteImage } from "@lib/data/site-settings"
import { Metadata } from "next"
import "styles/globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getSiteImage("og_image", "/lorikam-shop.jpeg")
  return {
    metadataBase: new URL(getBaseURL()),
    openGraph: {
      images: [{ url: ogImage }],
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
