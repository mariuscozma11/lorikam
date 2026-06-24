"use server"

import { sdk } from "@lib/config"

export type ContactPayload = {
  name: string
  email: string
  phone?: string
  message: string
}

// Server action: forwards the contact form to the backend (correct backend
// URL + publishable key are only available server-side).
export async function submitContactMessage(
  data: ContactPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await sdk.client.fetch("/store/contact", {
      method: "POST",
      body: data,
    })
    return { success: true }
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || "A apărut o eroare. Încearcă din nou.",
    }
  }
}
