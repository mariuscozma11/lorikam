import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  siteName?: string
}

// Schema.org Product structured data for rich results in search engines.
export default function ProductJsonLd({
  product,
  region,
  countryCode,
  siteName = "Lorikam",
}: Props) {
  const base = getBaseURL().replace(/\/$/, "")
  const url = `${base}/${countryCode}/products/${product.handle}`

  const prices = (product.variants || [])
    .map((v) => (v as any).calculated_price?.calculated_amount)
    .filter((p): p is number => typeof p === "number")

  const inStock = (product.variants || []).some(
    (v) =>
      !v.manage_inventory ||
      v.allow_backorder ||
      (typeof v.inventory_quantity === "number" && v.inventory_quantity > 0)
  )

  const images = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...((product.images || []).map((i) => i.url).filter(Boolean) as string[]),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"

  let offers: Record<string, any> | undefined
  if (prices.length > 1 && Math.min(...prices) !== Math.max(...prices)) {
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: region.currency_code?.toUpperCase(),
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability,
      url,
    }
  } else if (prices.length > 0) {
    offers = {
      "@type": "Offer",
      priceCurrency: region.currency_code?.toUpperCase(),
      price: prices[0],
      availability,
      url,
    }
  }

  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description || product.subtitle || product.title || "",
    image: images.length ? images : undefined,
    sku: product.variants?.[0]?.sku || undefined,
    brand: { "@type": "Brand", name: siteName },
    ...(offers ? { offers } : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
