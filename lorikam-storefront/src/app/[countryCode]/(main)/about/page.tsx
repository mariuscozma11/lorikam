import { Metadata } from "next"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountUp from "@modules/content/components/count-up"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { getSiteSettings } from "@lib/data/site-settings"

export const metadata: Metadata = {
  title: "Despre noi",
  description:
    "Despre Lorikam — articole sportive de calitate și echipamente oficiale ale echipelor partenere.",
}

const VALUES = [
  {
    title: "Calitate premium",
    desc: "Materiale durabile și finisaje atent lucrate, pentru echipamente care rezistă la efort.",
    icon: (
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    ),
  },
  {
    title: "Echipe partenere",
    desc: "Producem echipamente oficiale pentru cluburile cu care colaborăm, în culorile lor.",
    icon: (
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    ),
  },
  {
    title: "Personalizare",
    desc: "Nume, număr sau mesaj — fiecare produs poate purta amprenta ta.",
    icon: (
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    ),
  },
]

const STATS = [
  { to: 12, suffix: "+", label: "Echipe partenere" },
  { to: 500, suffix: "+", label: "Produse livrate" },
  { to: 100, suffix: "%", label: "Calitate garantată" },
]

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const heroImage = settings.about_hero || "/lorikam-shop.jpeg"
  const storyImage = settings.about_story || "/fan-shop.jpeg"
  return (
    <div>
      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[340px] overflow-hidden">
        <Image
          src={heroImage}
          alt="Despre Lorikam"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-white/80 uppercase tracking-widest text-sm mb-3">
            Despre noi
          </span>
          <h1 className="text-white text-4xl small:text-6xl font-semibold max-w-3xl">
            Pasiune pentru sport, calitate în fiecare detaliu
          </h1>
        </div>
      </section>

      <Breadcrumbs
        items={[{ label: "Despre noi" }]}
        className="content-container pt-6"
      />

      {/* Story */}
      <section className="content-container grid grid-cols-1 medium:grid-cols-2 gap-12 items-center py-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={storyImage}
            alt="Povestea Lorikam"
            fill
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-ui-fg-base">
            Povestea noastră
          </h2>
          <p className="text-ui-fg-subtle leading-relaxed">
            [Spune pe scurt povestea Lorikam: cum a început, ce vă motivează și ce
            vă diferențiază. Acest text poate fi înlocuit oricând.]
          </p>
          <p className="text-ui-fg-subtle leading-relaxed">
            Lucrăm cot la cot cu echipele partenere pentru a livra echipamente
            oficiale care îmbină performanța cu mândria de a purta culorile
            clubului.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ui-bg-subtle border-y border-ui-border-base">
        <div className="content-container py-16">
          <h2 className="text-3xl font-semibold text-ui-fg-base text-center mb-12">
            Ce ne definește
          </h2>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group bg-ui-bg-base rounded-xl border border-ui-border-base p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-elevation-card-hover"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-ui-bg-subtle flex items-center justify-center mb-5 transition-colors group-hover:bg-ui-fg-base">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-ui-fg-base transition-colors group-hover:text-ui-bg-base"
                  >
                    {v.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ui-fg-base mb-2">
                  {v.title}
                </h3>
                <p className="text-ui-fg-subtle text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="content-container py-16">
        <div className="grid grid-cols-1 small:grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-semibold text-ui-fg-base">
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div className="text-ui-fg-subtle mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ui-fg-base">
        <div className="content-container py-16 flex flex-col items-center text-center gap-6">
          <h2 className="text-3xl small:text-4xl font-semibold text-ui-bg-base max-w-2xl">
            Descoperă echipamentele Lorikam
          </h2>
          <p className="text-ui-bg-base/70 max-w-xl">
            Articole sportive de calitate și echipamentele oficiale ale echipelor
            partenere, într-un singur loc.
          </p>
          <div className="flex flex-col xsmall:flex-row gap-4">
            <LocalizedClientLink
              href="/lorikam"
              className="px-8 py-3 rounded-full bg-ui-bg-base text-ui-fg-base font-medium hover:opacity-90 transition-opacity"
            >
              Lorikam Shop
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/fan-shop"
              className="px-8 py-3 rounded-full border border-ui-bg-base/40 text-ui-bg-base font-medium hover:bg-ui-bg-base/10 transition-colors"
            >
              Fan Shop
            </LocalizedClientLink>
          </div>
        </div>
      </section>
    </div>
  )
}
