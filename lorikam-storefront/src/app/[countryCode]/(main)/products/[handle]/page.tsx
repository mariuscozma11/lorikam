import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import ProductJsonLd from "@modules/products/components/product-jsonld"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

// No generateStaticParams here on purpose: the (main) layout reads cookies
// (customer + cart), so every route in this group renders dynamically anyway.
// Prerendering handles bought us nothing at serve time and only made the
// build fail whenever the backend was unreachable.

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const description =
    product.description || product.subtitle || `${product.title} — Lorikam`

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  return (
    <>
      <ProductJsonLd
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}
