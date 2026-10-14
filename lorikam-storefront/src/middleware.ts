import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ro"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

/**
 * Loads the country-code -> region map, and NEVER throws.
 *
 * This runs on every request that matches the matcher below, which is every
 * HTML route plus /robots.txt and /sitemap.xml. An exception escaping here
 * leaves middleware() rejecting, which Vercel reports as
 * MIDDLEWARE_INVOCATION_FAILED - a 500 on the entire site, with no error page
 * reachable because middleware runs before rendering. A backend cold start, a
 * 502, a DNS blip or a wrong publishable key (the backend answers 400) would
 * each take the whole storefront down.
 *
 * So every failure is swallowed and the cache is returned as-is. A stale map
 * always beats an error: regions change rarely, and serving yesterday's map is
 * invisible to shoppers, while a 500 is not. The map is only empty on the very
 * first request after a cold start, and middleware() handles that case too.
 */
async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    console.error(
      "Middleware: MEDUSA_BACKEND_URL is not set. Set it in the Vercel project (build AND runtime). Falling back to the default region."
    )
    return regionMap
  }

  const isStale = regionMapUpdated < Date.now() - 3600 * 1000

  if (!regionMap.keys().next().value || isStale) {
    try {
      // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: {
          "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        },
        next: {
          revalidate: 3600,
          tags: [`regions-${cacheId}`],
        },
        cache: "force-cache",
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(
          `${response.status} ${json?.message ?? "unknown error"}`
        )
      }

      const regions: HttpTypes.StoreRegion[] = json.regions

      if (!regions?.length) {
        throw new Error(
          "No regions found. Please set up regions in your Medusa Admin."
        )
      }

      // Rebuild rather than merge, so a region whose countries changed does not
      // leave stale country codes mapped to it.
      const next = new Map<string, HttpTypes.StoreRegion>()
      regions.forEach((region) => {
        region.countries?.forEach((c) => {
          next.set(c.iso_2 ?? "", region)
        })
      })

      regionMapCache.regionMap = next
      regionMapCache.regionMapUpdated = Date.now()
    } catch (error) {
      // Logged unconditionally - this needs to be visible in Vercel's
      // production logs, which is exactly where it matters.
      console.error(
        `Middleware: could not refresh the region map from ${BACKEND_URL}:`,
        error instanceof Error ? error.message : error
      )
      // Deliberately not rethrown, and the previous map is kept.
    }
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")

  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  // Falls back to DEFAULT_REGION when the map is empty, which happens only if
  // the backend was unreachable on a cold start. Routing optimistically to /ro
  // keeps the URL structure intact and lets individual pages degrade on their
  // own; the alternative is failing the request outright for every visitor.
  const countryCode =
    (regionMap && (await getCountryCode(request, regionMap))) || DEFAULT_REGION

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // if one of the country codes is in the url and the cache id is set, return next
  if (urlHasCountryCode && cacheIdCookie) {
    return NextResponse.next()
  }

  // if one of the country codes is in the url and the cache id is not set, set the cache id and redirect
  if (urlHasCountryCode && !cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })

    return response
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we redirect to the relevant region.
  // countryCode is always truthy now (it falls back to DEFAULT_REGION above),
  // so the old "no valid regions" 500 branch is gone on purpose: a misconfigured
  // or briefly unreachable backend must not blank the storefront.
  if (!urlHasCountryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
