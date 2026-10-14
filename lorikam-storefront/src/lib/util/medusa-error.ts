// Pulls the human readable message out of an SDK error and logs the request
// details to the server log. Split out of `medusaError` so that Server Actions
// can RETURN the message instead of throwing it: Next.js redacts the message of
// an error thrown inside a Server Action in production and sends the client one
// generic English sentence, while returned values reach the client untouched.
export function medusaErrorMessage(error: any): string {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    // Extracting the error message from the response data
    const message = error.response.data.message || error.response.data

    // Medusa sometimes answers with a payload instead of a plain string, and
    // calling charAt on it would throw from inside the error handler itself.
    return typeof message === "string"
      ? message.charAt(0).toUpperCase() + message.slice(1) + "."
      : String(message)
  } else if (error.request) {
    // The request was made but no response was received
    return "No response received: " + error.request
  } else {
    // Something happened in setting up the request that triggered an Error
    return "Error setting up the request: " + error.message
  }
}

export default function medusaError(error: any): never {
  throw new Error(medusaErrorMessage(error))
}
