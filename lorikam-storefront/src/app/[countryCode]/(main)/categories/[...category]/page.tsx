import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
}

// No generateStaticParams here on purpose: the (main) layout reads cookies
// (customer + cart), so every route in this group renders dynamically anyway.
// Prerendering handles bought us nothing at serve time and only made the
// build fail whenever the backend was unreachable.

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name + " | Lorikam"

    const description = productCategory.description ?? `Categoria ${title}.`

    return {
      title: `${title} | Lorikam`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      countryCode={params.countryCode}
    />
  )
}
