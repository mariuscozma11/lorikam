"use client"

import { HttpTypes } from "@medusajs/types"
import { useMemo, useState, useEffect, useCallback, ReactNode } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductInfo from "@modules/products/templates/product-info"
import { useSearchParams } from "next/navigation"

type ProductDisplayProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  children?: ReactNode // For server components like ProductOnboardingCta
}

export default function ProductDisplay({ product, region, children }: ProductDisplayProps) {
  const searchParams = useSearchParams()
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | undefined>>({})

  // Find the color option ID
  const colorOptionId = useMemo(() => {
    const colorOption = product.options?.find(
      (opt) => opt.title?.toLowerCase() === "culoare"
    )
    return colorOption?.id
  }, [product.options])

  // Get the selected color value
  const selectedColor = colorOptionId ? selectedOptions[colorOptionId] : undefined

  // Filter images based on selected color (partial selection)
  const filteredImages = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return []
    }

    // If no color is selected, show all images
    if (!selectedColor || !colorOptionId) {
      return product.images
    }

    // Find all variants that have the selected color
    const variantsWithColor = product.variants?.filter((variant) => {
      return variant.options?.some(
        (opt) => opt.option_id === colorOptionId && opt.value === selectedColor
      )
    }) || []

    // If no variants match, show all images
    if (variantsWithColor.length === 0) {
      return product.images
    }

    // Get all image IDs from matching variants
    const variantImageIds = new Set<string>()
    variantsWithColor.forEach((variant) => {
      variant.images?.forEach((img) => {
        variantImageIds.add(img.id)
      })
    })

    // If variants don't have images assigned, show all images
    if (variantImageIds.size === 0) {
      return product.images
    }

    // Filter product images to only show those in the variant
    const filtered = product.images.filter((img) => variantImageIds.has(img.id))

    // If filtering results in no images, show all
    return filtered.length > 0 ? filtered : product.images
  }, [product.images, product.variants, selectedColor, colorOptionId])

  // Sync with URL params for full variant selection
  useEffect(() => {
    const variantId = searchParams.get("v_id")
    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId)
      if (variant) {
        const newOptions: Record<string, string> = {}
        variant.options?.forEach((opt) => {
          newOptions[opt.option_id] = opt.value
        })
        setSelectedOptions(newOptions)
      }
    }
  }, [searchParams, product.variants])

  const handleOptionsChange = useCallback((options: Record<string, string | undefined>) => {
    setSelectedOptions(options)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Image Carousel */}
      <div className="w-full">
        <ImageGallery images={filteredImages} />
      </div>

      {/* Right Column - Product Info & Actions */}
      <div className="flex flex-col gap-y-6">
        <ProductInfo product={product} />

        {children}

        <ProductActions
          product={product}
          region={region}
          onOptionsChange={handleOptionsChange}
        />
      </div>
    </div>
  )
}
