"use server"

import { sdk } from "@lib/config"
import translateAuthError, {
  MIN_PASSWORD_LENGTH,
  RESET_LINK_INVALID,
  type PasswordResetRequestState,
  type PasswordResetState,
} from "@lib/util/auth-error"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Step 1 of "am uitat parola": ask the backend for a reset token, which the
 * `auth.password_reset` subscriber turns into an email.
 *
 * The result is intentionally the same whether or not the address has an
 * account. Medusa's reset-password route already answers 201 for an unknown
 * identifier so it does not leak, and the few error shapes that *could* leak
 * ("not found") are folded into success here so the storefront cannot become
 * an oracle for which email addresses are registered.
 */
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const email = ((formData.get("email") as string) ?? "").trim()

  if (!email) {
    return {
      success: false,
      error: "Introdu adresa de email a contului tău.",
    }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch (error: any) {
    // 404/401 here would mean "no such customer", which is precisely what we
    // must not reveal. Everything else is a real failure worth reporting.
    if (error?.status === 404 || error?.status === 401) {
      return { success: true, error: null }
    }

    console.error("requestPasswordReset failed:", error?.message ?? error)

    return {
      success: false,
      error: translateAuthError(error, "reset-request"),
    }
  }

  return { success: true, error: null }
}

/**
 * Step 2 of "am uitat parola": set the new password using the token from the
 * email. The token is a short-lived JWT that the backend accepts once, and it
 * travels as a Bearer header rather than in the body — `sdk.auth.updateProvider`
 * takes it as its fourth argument and does that for us.
 *
 * No session is created on success: the customer is sent to the login form and
 * signs in with the new password, which also proves it is the one they meant.
 */
export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<PasswordResetState> {
  const token = ((formData.get("token") as string) ?? "").trim()
  const password = (formData.get("password") as string) ?? ""
  const confirmPassword = (formData.get("confirm_password") as string) ?? ""

  if (!token) {
    return { success: false, error: RESET_LINK_INVALID, invalidToken: true }
  }

  // Re-checked here and not only in the browser: the form posts to a Server
  // Action, so client-side validation is a convenience, not a guarantee.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`,
      invalidToken: false,
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Cele două parole nu coincid.",
      invalidToken: false,
    }
  }

  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
  } catch (error: any) {
    console.error("resetPassword failed:", error?.message ?? error)

    const message = translateAuthError(error, "reset-update")

    return {
      success: false,
      error: message,
      invalidToken: message === RESET_LINK_INVALID,
    }
  }

  return { success: true, error: null, invalidToken: false }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export type CustomerDiscount = {
  discount_percentage: number
  is_active: boolean
}

export type CustomerDiscountResponse = {
  customer_discount: CustomerDiscount | null
  promotion_code: string | null
  is_collaborator: boolean
}

export const getCustomerDiscount =
  async (): Promise<CustomerDiscountResponse | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    return await sdk.client
      .fetch<CustomerDiscountResponse>(`/store/customer-discount`, {
        method: "GET",
        headers,
      })
      .then((response) => response)
      .catch(() => null)
  }
