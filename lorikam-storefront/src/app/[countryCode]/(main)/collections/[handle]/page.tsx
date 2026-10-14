import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle } from "@lib/data/collections"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

// No generateStaticParams here on purpose: the (main) layout reads cookies
// (customer + cart), so every route in this group renders dynamically anyway.
// Prerendering handles bought us nothing at serve time and only made the
// build fail whenever the backend was unreachable.

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: `${collection.title} | Lorikam`,
    description: `Colecția ${collection.title}`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const params = await props.params

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      countryCode={params.countryCode}
    />
  )
}
