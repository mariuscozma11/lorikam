import { Metadata } from "next"

import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Magazin",
  description: "Descoperă toate produsele noastre.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params

  return <StoreTemplate countryCode={params.countryCode} />
}
