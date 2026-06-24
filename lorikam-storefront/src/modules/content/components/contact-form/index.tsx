"use client"

import { useState } from "react"
import { submitContactMessage } from "@lib/data/contact"

const inputCls =
  "w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm outline-none focus:border-ui-border-interactive transition-colors"

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  )
  const [error, setError] = useState("")

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    }
    if (!data.name || !data.email || !data.message) {
      setError("Completează numele, emailul și mesajul.")
      setStatus("error")
      return
    }
    setStatus("sending")
    setError("")
    const res = await submitContactMessage(data)
    if (res.success) {
      setStatus("sent")
      ;(e.target as HTMLFormElement).reset()
    } else {
      setError(res.error || "Eroare la trimitere.")
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-6 text-center">
        <p className="text-base font-medium">Mesaj trimis! ✅</p>
        <p className="text-ui-fg-subtle text-sm mt-1">
          Mulțumim, revenim cât mai repede.
        </p>
        <button
          className="mt-4 text-sm underline hover:text-ui-fg-base"
          onClick={() => setStatus("idle")}
        >
          Trimite alt mesaj
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
        <div>
          <label className="text-sm mb-1 block">Nume *</label>
          <input name="name" required className={inputCls} placeholder="Numele tău" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Email *</label>
          <input
            name="email"
            type="email"
            required
            className={inputCls}
            placeholder="email@exemplu.ro"
          />
        </div>
      </div>
      <div>
        <label className="text-sm mb-1 block">Telefon</label>
        <input name="phone" className={inputCls} placeholder="+40 7xx xxx xxx" />
      </div>
      <div>
        <label className="text-sm mb-1 block">Mesaj *</label>
        <textarea
          name="message"
          required
          rows={5}
          className={inputCls}
          placeholder="Cum te putem ajuta?"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-ui-fg-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-md bg-ui-button-inverted text-ui-fg-on-inverted px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {status === "sending" ? "Se trimite..." : "Trimite mesajul"}
      </button>
    </form>
  )
}
