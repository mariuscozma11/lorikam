import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function LatestProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProductsWithSort({
    page: 1,
    countryCode,
    sortBy: "created_at",
    queryParams: { limit: 8 },
  })

  if (!products.length) {
    return null
  }

  return (
    <section className="content-container py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl-semi">Cele mai noi produse</h2>
          <p className="text-ui-fg-subtle mt-2">
            Descoperă cele mai recente articole adăugate în magazin.
          </p>
        </div>
        <LocalizedClientLink
          href="/store"
          className="hidden small:inline-block text-ui-fg-interactive hover:text-ui-fg-interactive-hover txt-medium"
        >
          Vezi toate →
        </LocalizedClientLink>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>

      <div className="flex justify-center mt-10 small:hidden">
        <LocalizedClientLink
          href="/store"
          className="px-8 py-3 rounded-full border border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
        >
          Vezi toate produsele
        </LocalizedClientLink>
      </div>
    </section>
  )
}
