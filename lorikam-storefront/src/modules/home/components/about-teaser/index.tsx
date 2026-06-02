import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function AboutTeaser() {
  return (
    <section className="bg-ui-bg-subtle border-y border-ui-border-base">
      <div className="content-container grid grid-cols-1 medium:grid-cols-2 gap-10 items-center py-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          <Image
            src="/lorikam-shop.jpeg"
            alt="Despre Lorikam"
            fill
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <span className="txt-small-plus uppercase tracking-wide text-ui-fg-muted">
            Despre noi
          </span>
          <h2 className="text-2xl small:text-3xl font-semibold text-ui-fg-base">
            Pasiune pentru sport, calitate în fiecare detaliu
          </h2>
          <p className="text-ui-fg-subtle">
            Lorikam produce articole sportive și echipamente oficiale pentru
            echipele partenere. Combinăm materiale premium cu un design dedicat
            performanței, ca tu să porți cu mândrie culorile echipei tale.
          </p>
          <div>
            <LocalizedClientLink
              href="/about"
              className="inline-block mt-2 px-8 py-3 rounded-full bg-ui-fg-base text-white font-medium hover:bg-ui-fg-base/90 transition-colors"
            >
              Află mai multe
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
