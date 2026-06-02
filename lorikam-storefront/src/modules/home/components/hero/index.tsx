import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative w-full h-[70vh] min-h-[420px] border-b border-ui-border-base overflow-hidden">
      <Image
        src="/lorikam-shop.jpeg"
        alt="Lorikam"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-4 gap-6">
        <h1 className="text-white text-4xl small:text-6xl font-semibold max-w-3xl leading-tight">
          Echipamentul care îți ridică performanța
        </h1>
        <p className="text-white/90 text-base small:text-xl max-w-2xl">
          Articole sportive de calitate și echipamente oficiale ale echipelor
          partenere.
        </p>
        <div className="flex flex-col xsmall:flex-row gap-4 mt-2">
          <LocalizedClientLink
            href="/lorikam"
            className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
          >
            Lorikam Shop
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/fan-shop"
            className="px-8 py-3 rounded-full border border-white text-white font-medium hover:bg-white/10 transition-colors"
          >
            Fan Shop
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default Hero
