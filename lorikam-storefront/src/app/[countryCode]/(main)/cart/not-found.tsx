import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "A apărut o problemă",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Pagină negăsită</h1>
      <p className="text-small-regular text-ui-fg-base">
        Coșul pe care ai încercat să îl accesezi nu există. Șterge cookie-urile
        și încearcă din nou.
      </p>
      <InteractiveLink href="/">Mergi la pagina principală</InteractiveLink>
    </div>
  )
}
