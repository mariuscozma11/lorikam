import FastDelivery from "@modules/common/icons/fast-delivery"
import Package from "@modules/common/icons/package"
import Refresh from "@modules/common/icons/refresh"

const FEATURES = [
  {
    icon: <FastDelivery size="28" />,
    title: "Livrare rapidă",
    desc: "Comenzile sunt expediate în 1-3 zile lucrătoare.",
  },
  {
    icon: <Package size="28" />,
    title: "Calitate garantată",
    desc: "Materiale premium și echipamente oficiale.",
  },
  {
    icon: <Refresh size="28" />,
    title: "Retur simplu",
    desc: "Returnezi produsele în 14 zile, fără bătăi de cap.",
  },
]

export default function FeatureHighlights() {
  return (
    <section className="border-b border-ui-border-base bg-ui-bg-subtle">
      <div className="content-container grid grid-cols-1 small:grid-cols-3 gap-8 py-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-4">
            <div className="text-ui-fg-base shrink-0">{f.icon}</div>
            <div>
              <h3 className="txt-medium-plus text-ui-fg-base">{f.title}</h3>
              <p className="txt-small text-ui-fg-subtle mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
