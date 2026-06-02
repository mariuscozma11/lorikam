import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CARDS = [
  {
    href: "/lorikam",
    image: "/lorikam-shop.jpeg",
    title: "Lorikam Shop",
    desc: "Colecția proprie de articole sportive.",
  },
  {
    href: "/fan-shop",
    image: "/fan-shop.jpeg",
    title: "Fan Shop",
    desc: "Echipamente oficiale ale echipelor partenere.",
  },
]

export default function PromoCards() {
  return (
    <section className="content-container py-12">
      <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
        {CARDS.map((card) => (
          <LocalizedClientLink
            key={card.href}
            href={card.href}
            className="group relative block aspect-[16/9] overflow-hidden rounded-lg"
          >
            <Image
              src={card.image}
              alt={card.title}
              fill
              quality={90}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-white text-2xl font-semibold">{card.title}</h3>
              <p className="text-white/85 mt-1 max-w-sm">{card.desc}</p>
              <span className="inline-block mt-3 text-white underline underline-offset-4">
                Vezi colecția →
              </span>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
